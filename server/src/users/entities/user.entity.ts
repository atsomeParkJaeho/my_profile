import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  // 조회 시 기본 제외, nullable: true → 기존 테이블에 컬럼 추가 시 NOT NULL 오류 방지
  @Column({ type: 'text', select: false, nullable: true })
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
