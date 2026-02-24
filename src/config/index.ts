import * as dotenv from 'dotenv';

dotenv.config();

function getReq(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Нет переменной ${key}`);
  return v;
}

function getOpt(key: string): string | undefined {
  const v = process.env[key];
  return v?.trim() || undefined;
}

function parseCsv(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(x => x);
}

export const config = {
  port: Number(process.env.PORT || 3000),

  db: {
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  wb: {
    token: getOpt('WB_API_TOKEN'),
  },

  google: {
    spreadsheetIds: parseCsv(process.env.GOOGLE_SPREADSHEET_IDS),

    serviceAccountBase64: getOpt('GOOGLE_SERVICE_ACCOUNT_BASE64'),
    serviceAccountFile: getOpt('GOOGLE_SERVICE_ACCOUNT_FILE'),

    sheetName: process.env.GOOGLE_SHEET_NAME || 'stocks_coefs',

    enabled: parseCsv(process.env.GOOGLE_SPREADSHEET_IDS).length > 0 &&
             (getOpt('GOOGLE_SERVICE_ACCOUNT_BASE64') || getOpt('GOOGLE_SERVICE_ACCOUNT_FILE')) !== undefined,
  },
};