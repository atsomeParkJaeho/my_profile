import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('community_table')
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  c_date: string;

  @Column({ type: 'text', nullable: true })
  c_time: string;

  @Column({ type: 'text', nullable: true })
  c_user_name: string;

  @Column({ type: 'text', nullable: true })
  e_date: string;

  @Column({ type: 'text', nullable: true })
  e_time: string;

  @Column({ type: 'text', nullable: true })
  e_user_name: string;
}
