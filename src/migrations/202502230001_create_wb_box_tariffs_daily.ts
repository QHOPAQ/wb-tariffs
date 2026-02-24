import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('wb_box_tariffs_daily', table => {
    table.increments('id').primary();

    table.date('date').notNullable();
    table.string('warehouse_name').notNullable();

    table.float('box_delivery_coef_expr');
    table.float('box_delivery_coef_base');
    table.float('box_storage_coef_expr');
    table.float('box_storage_coef_base');

    table.timestamps(true, true);

    table.unique(['date', 'warehouse_name'], 'unique_date_warehouse');
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTableIfExists('wb_box_tariffs_daily');
}