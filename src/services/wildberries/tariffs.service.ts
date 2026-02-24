import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import type { WbBoxTariffsResponse, WbBoxTariffWarehouse } from '../../types/wbTariffs.types';

const API_BASE = 'https://common-api.wildberries.ru/api/v1/tariffs/box';

class WildberriesTariffsService {
  private api;

  constructor() {
    if (!config.wb.token) {
      throw new Error('Токен WB не задан в конфиге');
    }

    this.api = axios.create({
      baseURL: API_BASE,
      timeout: 15000, 
      headers: {
        Authorization: `Bearer ${config.wb.token}`,
      },
    });
  }

  async fetchTariffs(): Promise<WbBoxTariffWarehouse[]> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: resp } = await this.api.get<WbBoxTariffsResponse>('', {
        params: { date: today },
      });

      const warehouses = resp?.response?.data?.warehouseList;

      if (!Array.isArray(warehouses)) {
        throw new Error('WB API вернул странный формат — нет warehouseList');
      }

      logger.info(`Получено ${warehouses.length} складов за ${today}`);

      return warehouses;
    } catch (err: any) {
      if (err.response) {
        logger.error({
          status: err.response.status,
          data: err.response.data,
          message: err.message,
        }, 'Ошибка при запросе тарифов WB');
      } else {
        logger.error({ err }, 'Неизвестная ошибка при обращении к WB API');
      }

      throw err;
    }
  }
}

export { WildberriesTariffsService };