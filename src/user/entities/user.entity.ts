import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

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
    password: string;

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
    verificationStatuts: string;

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
        type: "text",
    })
    refreshTokenHash?: string;

    @Column({
        type: "boolean",
    })
    isActive: boolean;

    @Column({
        type: "date",
    })
    createdAt: Date;

    @Column({
        type: "date",
    })
    updatedAt: Date;
}
