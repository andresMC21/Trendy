import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Código HTTP de la respuesta.' })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'El cuerpo de la solicitud no es válido.' },
      {
        type: 'array',
        items: { type: 'string' },
        example: [
          'email must be an email',
          'password must be longer than 7 characters',
        ],
      },
    ],
    description:
      'Mensaje de error. La validación de DTO puede devolver una lista de mensajes; las demás excepciones devuelven normalmente una cadena.',
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'Bad Request',
    description:
      'Etiqueta HTTP incluida por NestJS en la mayoría de las excepciones. Puede faltar en algunos errores internos.',
  })
  error?: string;
}
