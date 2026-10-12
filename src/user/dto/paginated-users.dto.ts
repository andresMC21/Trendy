import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './profile.dto';

export class PaginatedUsersDto {
  @ApiProperty({
    type: [UserProfileDto],
    description: 'Usuarios incluidos en la página actual.',
  })
  data: UserProfileDto[];

  @ApiProperty({
    type: Number,
    description: 'Cantidad total de usuarios coincidentes.',
  })
  total: number;

  @ApiProperty({
    type: Number,
    example: 20,
    description: 'Tamaño de página aplicado.',
  })
  limit: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Cantidad de usuarios omitidos.',
  })
  skip: number;
}
