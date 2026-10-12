import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
@Unique(['transactionId', 'reviewerId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  transactionId: string;

  @Column('uuid')
  reviewerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column('uuid')
  targetUserId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column('int')
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
