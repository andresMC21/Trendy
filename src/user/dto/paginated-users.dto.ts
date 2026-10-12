import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './profile.dto';

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserProfileDto] })
  data: UserProfileDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  skip: number;
}
