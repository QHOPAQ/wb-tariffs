import { db } from '../db';

export interface TariffToday {
  warehouse_name: string;
  box_delivery_coef_expr: number | null;
  box_storage_coef_expr: number | null;
}

export async function getCurrentTariffs() {
  return db('wb_box_tariffs_daily')
    .select(
      'warehouse_name',
      'box_delivery_coef_expr',
      'box_storage_coef_expr'
    )
    .whereRaw('date = CURRENT_DATE')
    .orderBy('box_delivery_coef_expr', 'asc', 'nulls last');
}