import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity()
@Unique(['transactionId', 'reviewer'])   // una reseña por participante y transacción
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    transactionId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    reviewer: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    targetUser: User;

    @Column('int')
    rating: number;                                  // 1 a 5

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn()
    createdAt: Date;
}