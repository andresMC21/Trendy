import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({
    type: Number,
    example: 400,
    required: true,
    description: 'Código HTTP de la respuesta.',
  })
  statusCode: number;

  @ApiProperty({
    required: true,
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    description:
      'Mensaje del error. La validación de DTO devuelve una lista de mensajes; otras excepciones suelen devolver una cadena.',
  })
  message: string | string[];

  @ApiProperty({
    type: String,
    required: true,
    description: 'Etiqueta HTTP de la excepción.',
  })
  error: string;
}
