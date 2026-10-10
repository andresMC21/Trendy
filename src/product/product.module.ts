import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    UserModule, // Passport/JWT para @Auth()
  ],
  controllers: [ProductController],
  providers: [ProductService, StorageService],
  // TransactionModule importa ProductModule para usar ProductService
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}
