import knex from 'knex';
import config from './knexfile';
import { logger } from '../utils/logger';

export const db = knex(config);

export async function checkDb() {
  try {
    await db.raw('SELECT 1 + 1 AS res');
    logger.info('База подключилась нормально');
  } catch (err) {
    logger.error({ err }, 'Не удалось подключиться к базе');
    process.exit(1);
  }
}