import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});