/**
 * TestDB_Horilla.sqlite3 → MariaDB 마이그레이션 스크립트
 * 실행: node migrate-to-mariadb.js
 * 전제: docker compose -f docker-compose.db.yml up -d 로 MariaDB가 실행 중이어야 함
 */
const Database = require('./server/node_modules/better-sqlite3');
const mysql    = require('./server/node_modules/mysql2/promise');
const path     = require('path');

const SRC = path.join(__dirname, 'TestDB_Horilla.sqlite3');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'appuser',
  password: process.env.DB_PASS     || 'apppass',
  database: process.env.DB_NAME     || 'appdb',
  multipleStatements: true,
};

// SQLite 타입 → MySQL 타입 변환
function convertType(sqliteType) {
  if (!sqliteType) return 'TEXT';
  const t = sqliteType.toUpperCase().trim();
  if (t.includes('INT'))                       return 'BIGINT';
  if (t.includes('CHAR') || t.includes('CLOB') || t.includes('TEXT')) return 'LONGTEXT';
  if (t.includes('BLOB') || t === '')          return 'LONGBLOB';
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'DOUBLE';
  if (t.includes('NUMERIC') || t.includes('DECIMAL'))                  return 'DECIMAL(20,6)';
  if (t.includes('BOOL'))                      return 'TINYINT(1)';
  if (t.includes('DATE') || t.includes('TIME'))return 'DATETIME(6)';
  return 'LONGTEXT';
}

// SQLite CREATE TABLE → MySQL CREATE TABLE 변환
function convertCreateTable(name, cols) {
  const lines = cols.map(c => {
    const mysqlType = convertType(c.type);
    const notNull   = c.notnull ? ' NOT NULL' : '';
    const def       = c.dflt_value !== null
      ? ` DEFAULT ${c.dflt_value === "''" ? "''" : c.dflt_value}`
      : '';
    const pk = c.pk === 1 && cols.filter(x => x.pk).length === 1
      ? ' AUTO_INCREMENT PRIMARY KEY'
      : '';
    return `  \`${c.name}\` ${mysqlType}${notNull}${def}${pk}`;
  });

  // 복합 PK 처리
  const pks = cols.filter(c => c.pk > 0).sort((a, b) => a.pk - b.pk);
  if (pks.length > 1) {
    lines.push(`  PRIMARY KEY (${pks.map(c => `\`${c.name}\``).join(', ')})`);
  }

  return `CREATE TABLE IF NOT EXISTS \`${name}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

async function main() {
  console.log('=== MariaDB 마이그레이션 시작 ===');
  console.log('원본:', SRC);
  console.log('대상:', `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  console.log('');

  const src = new Database(SRC, { readonly: true });
  let conn;

  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('MariaDB 연결 성공\n');
  } catch (e) {
    console.error('MariaDB 연결 실패:', e.message);
    console.error('docker compose -f docker-compose.db.yml up -d 를 먼저 실행하세요.');
    src.close();
    process.exit(1);
  }

  await conn.execute('SET foreign_key_checks = 0');
  await conn.execute('SET NAMES utf8mb4');

  const tables = src.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();

  console.log(`총 ${tables.length}개 테이블 마이그레이션\n`);

  let successCount = 0;
  let skipCount    = 0;
  let errorCount   = 0;

  for (const { name } of tables) {
    try {
      const cols  = src.prepare(`PRAGMA table_info("${name}")`).all();
      const { cnt } = src.prepare(`SELECT COUNT(*) as cnt FROM "${name}"`).get();

      // 테이블 생성
      const createSQL = convertCreateTable(name, cols);
      await conn.execute(createSQL);

      if (cnt === 0) {
        process.stdout.write(`  [SKIP] ${name} (0행)\n`);
        skipCount++;
        continue;
      }

      // 기존 데이터 초기화
      await conn.execute(`DELETE FROM \`${name}\``);

      // 데이터 삽입 (배치 500행)
      const colNames    = cols.map(c => `\`${c.name}\``).join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      const insertSQL   = `INSERT IGNORE INTO \`${name}\` (${colNames}) VALUES (${placeholders})`;

      const rows = src.prepare(`SELECT * FROM "${name}"`).all();
      const BATCH = 500;

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        for (const row of batch) {
          const values = Object.values(row).map(v =>
            v instanceof Buffer ? v : (v === undefined ? null : v)
          );
          await conn.execute(insertSQL, values);
        }
      }

      process.stdout.write(`  [OK]   ${name} (${cnt}행)\n`);
      successCount++;

    } catch (e) {
      process.stdout.write(`  [ERR]  ${name} → ${e.message.split('\n')[0]}\n`);
      errorCount++;
    }
  }

  await conn.execute('SET foreign_key_checks = 1');
  await conn.end();
  src.close();

  console.log('\n=== 완료 ===');
  console.log(`성공: ${successCount}개`);
  console.log(`스킵: ${skipCount}개 (데이터 없음)`);
  console.log(`오류: ${errorCount}개`);
}

main().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});
