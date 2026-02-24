import cron from 'node-cron';
import { db } from '../db';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getTodayISODate } from '../utils/date';
import { WildberriesTariffsService } from '../services/wildberries/tariffs.service';

function cleanNumber(val: any): number | null {
  if (val == null) return null;
  
  if (typeof val === 'number') return val;
  
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '-' || s === '') return null;
    
    const n = Number(s);
    return isNaN(n) ? null : n;
  }
  
  return null;
}

async function fetchAndSaveTariffs(wbService: WildberriesTariffsService) {
  logger.info('Запускаем обновление тарифов WB');

  try {
    const warehouses = await wbService.fetchTariffs();
    if (!warehouses?.length) {
      logger.warn('WB вернул пустой список складов');
      return;
    }

    const today = getTodayISODate();

    await db.transaction(async (trx) => {
      for (const warehouse of warehouses) {
        await trx('wb_box_tariffs_daily')
          .insert({
            date: today,
            warehouse_name: warehouse.warehouseName,
            box_delivery_coef_expr: cleanNumber(warehouse.boxDeliveryCoefExpr),
            box_delivery_coef_base: cleanNumber(warehouse.boxDeliveryCoefBase),
            box_storage_coef_expr: cleanNumber(warehouse.boxStorageCoefExpr),
            box_storage_coef_base: cleanNumber(warehouse.boxStorageCoefBase),
          })
          .onConflict(['date', 'warehouse_name'])
          .merge({
            box_delivery_coef_expr: cleanNumber(warehouse.boxDeliveryCoefExpr),
            box_delivery_coef_base: cleanNumber(warehouse.boxDeliveryCoefBase),
            box_storage_coef_expr: cleanNumber(warehouse.boxStorageCoefExpr),
            box_storage_coef_base: cleanNumber(warehouse.boxStorageCoefBase),
            updated_at: trx.fn.now()
          });
      }
    });

    logger.info(`Успешно сохранено ${warehouses.length} складов`);
  } catch (err) {
    logger.error({ err }, 'Ошибка при обновлении тарифов WB');
  }
}

export function initWbTariffsCron() {
  if (!config.wb.token) {
    logger.warn('WB токен не задан → обновление тарифов отключено');
    return;
  }

  const service = new WildberriesTariffsService();

  // сразу при старте
  fetchAndSaveTariffs(service).catch(err => {
    logger.error({ err }, 'Ошибка при первом запуске WB tariffs');
  });

  // потом каждый час
  cron.schedule('0 * * * *', () => {
    fetchAndSaveTariffs(service);
  });

  logger.info('Cron для тарифов WB запущен (каждый час)');
}