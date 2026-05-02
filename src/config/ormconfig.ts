import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User.js';
import { Property } from '../entities/Property.js';

dotenv.config();

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST,
//   port: parseInt(process.env.DB_PORT || '5432'),
//   username: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
//   synchronize: true,
//   logging: process.env.NODE_ENV === 'development',
//   entities: [User, Property],
//   migrations: [],
//   subscribers: []
// });

const connectionOptions = process.env.DATABASE_PUBLIC_URL
  ? {
    url: process.env.DATABASE_PUBLIC_URL,
    ssl: { rejectUnauthorized: false },
  }
  : (() => {
    throw new Error("DATABASE_PUBLIC_URL is missing. Railway Postgres not configured.");
  })();

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  synchronize: true,
  entities: [User, Property],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    throw error;
  }
};
