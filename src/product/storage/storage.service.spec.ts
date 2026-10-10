import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { detectImageExtension, StorageService } from './storage.service';

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]);

describe('detectImageExtension', () => {
  it('reconoce JPG, PNG y WEBP por sus bytes', () => {
    // Arrange
    // Act
    // Assert
    expect(detectImageExtension(JPG)).toBe('jpg');
    expect(detectImageExtension(PNG)).toBe('png');
    expect(detectImageExtension(WEBP)).toBe('webp');
  });
  it('rechaza cualquier otra cosa', () => {
    // Arrange
    const textBuffer = Buffer.from('hola mundo');
    const emptyBuffer = Buffer.alloc(0);

    // Act
    const textResult = detectImageExtension(textBuffer);
    const emptyResult = detectImageExtension(emptyBuffer);

    // Assert
    expect(textResult).toBeNull();
    expect(emptyResult).toBeNull();
  });
});

describe('StorageService', () => {
  let dir: string;
  let service: StorageService;
  const origCwd = process.cwd();

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trendy-'));
    process.chdir(dir);
    const env: Record<string, string> = { UPLOADS_DIR: 'up', PUBLIC_BASE_URL: 'http://host/' };
    service = new StorageService({ get: (k: string) => env[k] } as ConfigService);
  });
  afterEach(() => {
    process.chdir(origCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  it('guarda el archivo y devuelve la URL pública', async () => {
    // Arrange
    const file = { buffer: PNG } as Express.Multer.File;

    // Act
    const url = await service.saveProductImage(file);

    // Assert
    expect(url).toMatch(/^http:\/\/host\/uploads\/products\/[0-9a-f-]+\.png$/);
    expect(existsSync(join(dir, 'up', 'products', basename(url)))).toBe(true);
  });

  it('rechaza contenido que no es imagen aunque el cliente diga lo contrario', async () => {
    // Arrange
    const fakeImage = { buffer: Buffer.from('<script>'), mimetype: 'image/jpeg' } as Express.Multer.File;
    const emptyFile = {} as Express.Multer.File;

    // Act
    const fakeImageResult = service.saveProductImage(fakeImage);
    const emptyFileResult = service.saveProductImage(emptyFile);

    // Assert
    await expect(fakeImageResult).rejects.toBeInstanceOf(BadRequestException);
    await expect(emptyFileResult).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delete borra el archivo, ignora URLs ajenas y no falla si ya no existe', async () => {
    // Arrange
    const url = await service.saveProductImage({ buffer: JPG } as Express.Multer.File);
    const path = join(dir, 'up', 'products', basename(url));

    // Act
    await service.delete(url);

    // Assert
    expect(existsSync(path)).toBe(false);
    await expect(service.delete(url)).resolves.toBeUndefined();
    await expect(service.delete('http://otro/sitio.jpg')).resolves.toBeUndefined();
  });

  it('usa rutas por defecto si no hay configuración', async () => {
    // Arrange
    const def = new StorageService({ get: () => undefined } as unknown as ConfigService);

    // Act
    const url = await def.saveProductImage({ buffer: JPG } as Express.Multer.File);

    // Assert
    expect(url.startsWith('/uploads/products/')).toBe(true);
  });
});
