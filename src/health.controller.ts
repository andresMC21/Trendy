import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'trendy-api' })
  service: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Comprobar disponibilidad de la API',
    description:
      'Endpoint público de salud; no verifica conectividad con la base de datos.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  check() {
    return {
      status: 'ok',
      service: 'trendy-api',
      timestamp: new Date().toISOString(),
    };
  }
}
