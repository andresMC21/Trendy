import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { VerificationStatus } from "../enums/verification-status";
import { ValidRoles } from "../enums/valid-roles.enum";

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
        type: "text"
    })
    photoUrl: string | null;

    @Column({
        type: "text",
    })
    info?: string;

    @Column({
        type: "text",
    })
    verificationStatuts: VerificationStatus.UNVERIFIED;

    @Column({
        type: "text",
    })
    identityDocumentUrl?: string;

    @Column({
        type: "float",
    })
    ratingAverage?: number;

    @Column({
        type: "integer",
    })
    reviewsCount: number;

    @Column({
        type: "boolean",
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
