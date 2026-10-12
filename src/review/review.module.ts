import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { Review } from './entities/review.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Transaction, User]), UserModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
