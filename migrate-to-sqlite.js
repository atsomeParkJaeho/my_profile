/**
 * TestDB_Horilla.sqlite3 → db.sqlite 마이그레이션 스크립트
 * 실행: node migrate-to-sqlite.js
 */
const Database = require('./server/node_modules/better-sqlite3');
const path = require('path');

const SRC  = path.join(__dirname, 'TestDB_Horilla.sqlite3');
const DEST = path.join(__dirname, 'server', 'db.sqlite');

console.log('=== SQLite 마이그레이션 시작 ===');
console.log('원본:', SRC);
console.log('대상:', DEST);
console.log('');

const src  = new Database(SRC,  { readonly: true });
const dest = new Database(DEST);

// 테이블 목록 조회 (sqlite_master 제외)
const tables = src.prepare(
  "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
).all();

console.log(`총 ${tables.length}개 테이블 마이그레이션`);
console.log('');

dest.pragma('journal_mode = WAL');
dest.pragma('foreign_keys = OFF');

let successCount = 0;
let skipCount    = 0;
let errorCount   = 0;

for (const table of tables) {
  const name = table.name;

  // 대상 DB에 이미 테이블이 있는지 확인
  const exists = dest.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(name);

  try {
    if (!exists) {
      // 테이블 생성
      dest.exec(table.sql);
    }

    // 데이터 개수 확인
    const { cnt } = src.prepare(`SELECT COUNT(*) as cnt FROM "${name}"`).get();

    if (cnt === 0) {
      process.stdout.write(`  [SKIP] ${name} (0행)\n`);
      skipCount++;
      continue;
    }

    // 기존 데이터 삭제 후 재삽입
    dest.prepare(`DELETE FROM "${name}"`).run();

    // 컬럼 목록
    const cols = src.prepare(`PRAGMA table_info("${name}")`).all();
    const colNames = cols.map(c => `"${c.name}"`).join(', ');
    const placeholders = cols.map(() => '?').join(', ');

    const insertStmt = dest.prepare(
      `INSERT OR IGNORE INTO "${name}" (${colNames}) VALUES (${placeholders})`
    );

    // 일괄 삽입 (트랜잭션)
    const rows = src.prepare(`SELECT * FROM "${name}"`).all();
    const insertMany = dest.transaction((rows) => {
      for (const row of rows) {
        insertStmt.run(Object.values(row));
      }
    });

    insertMany(rows);
    process.stdout.write(`  [OK]   ${name} (${cnt}행)\n`);
    successCount++;

  } catch (e) {
    process.stdout.write(`  [ERR]  ${name} → ${e.message}\n`);
    errorCount++;
  }
}

// 인덱스 복사
const indexes = src.prepare(
  "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"
).all();

console.log(`\n인덱스 ${indexes.length}개 적용 중...`);
for (const idx of indexes) {
  try {
    dest.exec(idx.sql);
  } catch (e) {
    // 이미 존재하는 인덱스는 무시
  }
}

dest.pragma('foreign_keys = ON');
src.close();
dest.close();

console.log('\n=== 완료 ===');
console.log(`성공: ${successCount}개`);
console.log(`스킵: ${skipCount}개 (데이터 없음)`);
console.log(`오류: ${errorCount}개`);
console.log(`\n대상 파일: ${DEST}`);
