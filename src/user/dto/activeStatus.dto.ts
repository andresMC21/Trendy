import { IsBoolean } from 'class-validator';

export class SetActiveStatus {
    @IsBoolean()
    isActive: boolean;
}
