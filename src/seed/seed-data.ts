import { ProductCondition } from '../product/enums/product-condition.enum';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { VerificationStatus } from '../user/enums/verification-status';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';

export const seedUsers = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@trendy.local',
    password: 'Admin1234',
    fullName: 'Admin Trendy',
    info: 'Cuenta administradora inicial',
    verificationStatus: VerificationStatus.VERIFIED,
    role: [ValidRoles.ADMIN],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'moderador@trendy.local',
    password: 'Mod12345',
    fullName: 'Moderador Trendy',
    info: 'Apoya la revision de perfiles y publicaciones',
    verificationStatus: VerificationStatus.VERIFIED,
    role: [ValidRoles.MODERATOR],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'ana@trendy.local',
    password: 'Ana12345',
    fullName: 'Ana Gomez',
    info: 'Vende productos de segunda mano en Granada',
    verificationStatus: VerificationStatus.VERIFIED,
    role: [ValidRoles.USER],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'carlos@trendy.local',
    password: 'Carlos12',
    fullName: 'Carlos Ruiz',
    info: 'Busca trueques y donaciones cerca de casa',
    verificationStatus: VerificationStatus.UNVERIFIED,
    role: [ValidRoles.USER],
  },
] as const;

export const seedProducts = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    sellerId: seedUsers[2].id,
    title: 'Bicicleta urbana restaurada',
    description: 'Marco liviano, frenos revisados y llantas en buen estado.',
    price: 380000,
    acceptsBarter: true,
    category: 'deportes',
    condition: ProductCondition.USED,
    status: ProductStatus.AVAILABLE,
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: 'granada',
    estimatedWeightKg: 12,
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    sellerId: seedUsers[2].id,
    title: 'Set de libros de programacion',
    description:
      'Coleccion introductoria de JavaScript, redes y bases de datos.',
    price: 0,
    acceptsBarter: true,
    category: 'libros',
    condition: ProductCondition.USED,
    status: ProductStatus.SOLD,
    location: { lat: 3.4567, lng: -76.5312 },
    neighborhoodId: 'granada',
    estimatedWeightKg: 5,
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    sellerId: seedUsers[3].id,
    title: 'Silla ergonomica',
    description: 'Silla de oficina con soporte lumbar y altura ajustable.',
    price: 220000,
    acceptsBarter: false,
    category: 'hogar',
    condition: ProductCondition.LIKE_NEW,
    status: ProductStatus.AVAILABLE,
    location: { lat: 3.4695, lng: -76.5225 },
    neighborhoodId: 'san-fernando',
    estimatedWeightKg: 9,
  },
] as const;

export const seedTransactions = [
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    productId: seedProducts[1].id,
    buyerId: seedUsers[3].id,
    sellerId: seedUsers[2].id,
    status: TransactionStatus.COMPLETED,
    safePointId: 'cai-granada',
    scheduledTime: '2026-10-15T20:00:00.000Z',
  },
] as const;

export const seedReviews = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    transactionId: seedTransactions[0].id,
    reviewerId: seedUsers[3].id,
    targetUserId: seedUsers[2].id,
    rating: 5,
    comment: 'Comunicacion clara y producto tal como estaba publicado.',
  },
] as const;
