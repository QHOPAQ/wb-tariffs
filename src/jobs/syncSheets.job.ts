import cron from 'node-cron';
import { db } from '../db';
import { config } from '../config';
import { logger } from '../utils/logger';
import { GoogleSheetsService } from '../services/google/sheets.service';

type Row = {
  warehouse_name: string;
  date: string;
  box_delivery_coef_expr: string | number | null;
  box_delivery_coef_base: string | number | null;
  box_storage_coef_expr: string | number | null;
  box_storage_coef_base: string | number | null;
};

function getDeliveryCoef(r: Row): number | null {
  const val = r.box_delivery_coef_expr ?? r.box_delivery_coef_base;
  if (val == null) return null;
  
  const num = typeof val === 'number' ? val : Number(val);
  return isFinite(num) ? num : null;
}

function looksLikeValidBase64ServiceAccount(b64: string): boolean {
  if (!b64?.trim()) return false;
  if (b64.trim() === 'BASE64_JSON') return false;

  try {
    const jsonStr = Buffer.from(b64.trim(), 'base64').toString('utf-8').trim();
    if (!jsonStr) return false;

    const data = JSON.parse(jsonStr);
    return !!(
      data &&
      typeof data === 'object' &&
      data.client_email &&
      data.private_key
    );
  } catch {
    return false;
  }
}

function googleIsConfigured(): boolean {
  if (!config.google.spreadsheetIds?.length) return false;

  const file = config.google.serviceAccountFile?.trim() ?? '';
  if (file) return true;

  return looksLikeValidBase64ServiceAccount(config.google.serviceAccountBase64 ?? '');
}

export function startGoogleSync() {
  if (!googleIsConfigured()) {
    logger.warn(
      `Google Sheets синхронизация отключена. ` +
      `spreadsheetIds: ${config.google.spreadsheetIds?.length ?? 0}, ` +
      `file: ${!!config.google.serviceAccountFile?.trim()}, ` +
      `base64 ok: ${looksLikeValidBase64ServiceAccount(config.google.serviceAccountBase64 ?? '')}`
    );
    return;
  }

  const service = new GoogleSheetsService();

  cron.schedule('0 */6 * * *', async () => {
    logger.info('Запуск синхронизации в Google Sheets');

    try {
      const latest = await db('wb_box_tariffs_daily')
        .whereRaw('date = (SELECT MAX(date) FROM wb_box_tariffs_daily)')
        .select('*') as Row[];

      if (!latest.length) {
        logger.warn('Нет актуальных данных по тарифам для выгрузки');
        return;
      }

      const withCoef = latest.map(row => ({
        ...row,
        deliveryCoef: getDeliveryCoef(row)
      }));

      withCoef.sort((a, b) => {
        if (a.deliveryCoef == null) return 1;
        if (b.deliveryCoef == null) return -1;
        return a.deliveryCoef - b.deliveryCoef;
      });

      const headers = ['Warehouse Name', 'Delivery Coef', 'Storage Coef', 'Date'];
      const rows = withCoef.map(r => [
        r.warehouse_name,
        r.deliveryCoef,
        r.box_storage_coef_expr ?? r.box_storage_coef_base ?? null,
        r.date
      ]);

      const dataToWrite = [headers, ...rows];

      for (const id of config.google.spreadsheetIds) {
        try {
          await service.clearSheet(id);
          await service.updateSheet(id, dataToWrite);
          logger.info({ spreadsheetId: id }, 'Лист обновлён');
        } catch (err) {
            logger.error({ err, spreadsheetId: id }, 'Не получилось обновить таблицу');
        }
      }

      logger.info(`Выгружено ${withCoef.length} строк`);
    } catch (err) {
      logger.error({ err }, 'Синхронизация Google Sheets упала');
    }
  });

  logger.info(`Google Sheets синхронизация включена (каждые 6 часов, ${config.google.spreadsheetIds.length} таблиц)`);
}