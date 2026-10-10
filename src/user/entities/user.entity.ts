import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { VerificationStatus } from '../enums/verification-status';
import { ValidRoles } from '../enums/valid-roles.enum';

@Entity()
export class User {

    @PrimaryColumn()
    id: string;

    @Column({
        type: "text",
        unique: true
    })
    email: string;

    @Column({
        type: "text"
    })
    password?: string;

    @Column({
        type: "text"
    })
    fullName: string;

    @Column({
        type: "text",
        nullable: true
    })
    photoUrl: string | null;

    @Column({
        type: "text",
        nullable: true
    })
    info?: string;

    @Column({
        type: "text",
        default: VerificationStatus.UNVERIFIED
    })
    verificationStatus: VerificationStatus;

    @Column({
        type: "text",
        nullable: true
    })
    identityDocumentUrl?: string;

    @Column({
        type: "float",
        default: 0
    })
    ratingAverage?: number;

    @Column({
        type: "integer",
        default: 0
    })
    reviewsCount: number;

    @Column({
        type: "boolean",
        default: true
    })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @CreateDateColumn()
    updatedAt: Date;

    @Column({
        type: 'text',
        array: true,
        default: ['USER']
    })
    role: ValidRoles[];

    @BeforeInsert()
    @BeforeUpdate()
    checkEmailBeforeChanges() {
        this.email = this.email.toLowerCase().trim();
    }
}
