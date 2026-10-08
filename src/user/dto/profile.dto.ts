import { Expose, plainToInstance } from 'class-transformer';
import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { User } from '../entities/user.entity';

export class UserProfileDto {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    fullName: string;

    @Expose()
    photoUrl: string | null;

    @Expose()
    description: string | null;

    @Expose()
    role: ValidRoles;

    @Expose()
    verificationStatus: VerificationStatus;

    @Expose()
    isActive: boolean;

    @Expose()
    ratingAverage: number;

    @Expose()
    reviewsCount: number;

    @Expose()
    itemsReusedCount: number;

    @Expose()
    wasteAvoidedKg: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    static fromEntity(user: User): UserProfileDto {
        return plainToInstance(UserProfileDto, user, {
            excludeExtraneousValues: true,
        });
    }
}