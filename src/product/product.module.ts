import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    UserModule, // Passport/JWT para @Auth()
  ],
  controllers: [ProductController],
  providers: [ProductService],
  // TransactionModule importa ProductModule para usar ProductService
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}
