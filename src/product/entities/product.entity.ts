import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import type { GeoJsonPoint } from '../interfaces/geo.interface';
import { User } from '../../user/entities/user.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductImage } from './product-image.entity';

/** Postgres devuelve `numeric` como string; esto lo convierte a number. */
const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? null : parseFloat(value),
};

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  sellerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /** 0 si es donación o trueque */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  price: number;

  @Column({ type: 'boolean', default: false })
  acceptsBarter: boolean;

  @Index()
  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'text', default: ProductCondition.USED })
  condition: ProductCondition;

  @Index()
  @Column({ type: 'text', default: ProductStatus.AVAILABLE })
  status: ProductStatus;

  /** PostGIS geography(Point, 4326). GeoJSON: [lng, lat] */
  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: GeoJsonPoint;

  /**
   * Barrio del producto (filtro hiperlocal).
   * TODO: convertir en FK a Neighborhood cuando exista el módulo 3.
   */
  @Index()
  @Column({ type: 'text' })
  neighborhoodId: string;

  /** Para calcular impacto ambiental (módulo de transacciones) */
  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true, transformer: numericTransformer })
  estimatedWeightKg: number | null;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  /** Usuarios que marcaron el producto como favorito (N:M) */
  @ManyToMany(() => User)
  @JoinTable({
    name: 'product_favorites',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  favoritedBy: User[];

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
