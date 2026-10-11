import dataSource from '../database/data-source';
import bcrypt from 'bcrypt';
import { Product } from '../product/entities/product.entity';
import { toGeoJson } from '../product/interfaces/geo.interface';
import { Review } from '../review/entities/review.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import {
  seedProducts,
  seedReviews,
  seedTransactions,
  seedUsers,
} from './seed-data';

const BCRYPT_ROUNDS = 10;

async function seed(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const productRepository = manager.getRepository(Product);
      const transactionRepository = manager.getRepository(Transaction);
      const reviewRepository = manager.getRepository(Review);

      for (const seedUser of seedUsers) {
        const existing = await userRepository.findOne({
          where: { id: seedUser.id },
          select: { id: true, password: true },
        });
        const password =
          existing?.password ??
          (await bcrypt.hash(seedUser.password, BCRYPT_ROUNDS));
        await userRepository.save(
          userRepository.create({
            ...seedUser,
            role: [...seedUser.role],
            password,
            isActive: true,
            ratingAverage: 0,
            reviewsCount: 0,
          }),
        );
      }

      for (const seedProduct of seedProducts) {
        const { location, ...product } = seedProduct;
        await productRepository.save(
          productRepository.create({
            ...product,
            location: toGeoJson(location),
            viewsCount: 0,
          }),
        );
      }

      for (const seedTransaction of seedTransactions) {
        await transactionRepository.save(
          transactionRepository.create({
            ...seedTransaction,
            scheduledTime: new Date(seedTransaction.scheduledTime),
          }),
        );
      }

      for (const seedReview of seedReviews) {
        const { reviewerId, targetUserId, ...review } = seedReview;
        await reviewRepository.save(
          reviewRepository.create({
            ...review,
            reviewer: { id: reviewerId } as User,
            targetUser: { id: targetUserId } as User,
          }),
        );
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed data loaded successfully');
  })
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exitCode = 1;
  });
