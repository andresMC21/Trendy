import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { basename, join } from 'path';

const PRODUCTS_SUBDIR = 'products';

/** Detecta el tipo real mirando los primeros bytes (no confía en el mimetype del cliente). */
export function detectImageExtension(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp';
  return null;
}

/**
 * Almacenamiento de imágenes en disco local.
 * Para producción conviene reemplazarlo por S3/Cloudinary manteniendo
 * la misma interfaz (saveProductImage / delete), ya que el disco de
 * Render free es efímero.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsDir: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.uploadsDir = join(process.cwd(), config.get<string>('UPLOADS_DIR') ?? 'uploads');
    this.publicBaseUrl = (config.get<string>('PUBLIC_BASE_URL') ?? '').replace(/\/$/, '');
  }

  async saveProductImage(file: Express.Multer.File): Promise<string> {
    const ext = file?.buffer ? detectImageExtension(file.buffer) : null;
    if (!ext) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP válidas');
    }
    const name = `${randomUUID()}.${ext}`;
    const dir = join(this.uploadsDir, PRODUCTS_SUBDIR);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, name), file.buffer);
    return `${this.publicBaseUrl}/uploads/${PRODUCTS_SUBDIR}/${name}`;
  }

  async delete(url: string): Promise<void> {
    const marker = `/uploads/${PRODUCTS_SUBDIR}/`;
    if (!url.includes(marker)) return;
    const name = basename(url.split(marker)[1]);
    try {
      await fs.unlink(join(this.uploadsDir, PRODUCTS_SUBDIR, name));
    } catch (error) {
      this.logger.warn(`No se pudo borrar ${name}: ${(error as Error).message}`);
    }
  }
}
