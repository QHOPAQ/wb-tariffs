import { auth, sheets } from '@googleapis/sheets';
import fs from 'fs';
import { config } from '../../config';
import { logger } from '../../utils/logger';

class GoogleSheetsService {
  private client;

  constructor() {
    const creds = this.loadCredentials();
    const googleAuth = new auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.client = sheets({ version: 'v4', auth: googleAuth });
  }

  private loadCredentials() {
    
    if (config.google.serviceAccountBase64) {
      try {
        const jsonStr = Buffer.from(config.google.serviceAccountBase64, 'base64').toString();
        return JSON.parse(jsonStr);
      } catch (e) {
        logger.error({ err: e }, 'Не удалось распарсить base64 credentials');
      }
    }

  
    if (config.google.serviceAccountFile) {
      try {
        const content = fs.readFileSync(config.google.serviceAccountFile, 'utf8');
        return JSON.parse(content);
      } catch (err) {
        logger.error({ err }, `Не смог прочитать файл ${config.google.serviceAccountFile}`);
      }
    }

    throw new Error('Нет валидных Google credentials — ни base64, ни файл');
  }

  async clearSheet(id: string) {
    try {
      await this.client.spreadsheets.values.clear({
        spreadsheetId: id,
        range: config.google.sheetName || 'stocks_coefs',
      });
    } catch (err) {
      logger.error({ err }, `Не удалось очистить лист в таблице ${id}`);
      throw err;
    }
  }

  async updateSheet(id: string, data: any[][]) {
    try {
      await this.client.spreadsheets.values.update({
        spreadsheetId: id,
        range: `${config.google.sheetName || 'stocks_coefs'}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: data },
      });
    } catch (err) {
      logger.error({ err }, `Ошибка при записи в таблицу ${id}`);
      throw err;
    }
  }
}

export { GoogleSheetsService };