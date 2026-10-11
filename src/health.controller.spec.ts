import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('check devuelve estado, servicio y timestamp ISO', () => {
    // Arrange
    const controller = new HealthController();

    // Act
    const result = controller.check();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.service).toBe('trendy-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
