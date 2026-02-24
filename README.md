# 📦 WB Tariffs Sync Service

Фоновый сервис для ежечасной синхронизации box-тарифов Wildberries.  
Сохраняет историю по дням в PostgreSQL и каждые 6 часов выгружает отсортированные данные в одну или несколько Google Sheets.

Сделан как надёжный production-бэкенд: разделение слоёв, idempotent-операции, безопасная работа с секретами и graceful-деградация.

---

## Что умеет

- Каждый час забирает тарифы по API Wildberries  
- Сохраняет историю по дням (новый день → новый срез данных)  
- В течение дня обновляет записи через UPSERT (без дублей)  
- Каждые 6 часов экспортирует данные в Google Sheets  
- Сортирует по коэффициенту доставки (asc)  
- Полный запуск одной командой через Docker

API:  
https://common-api.wildberries.ru/api/v1/tariffs/box

---

##  Архитектура

Четыре слоя:

**Integration** - клиент WB API + валидация ответа  
**Persistence** - PostgreSQL + Knex (миграции, upsert по `date + warehouse_name`)  
**Export** - Google Sheets API, поддержка нескольких spreadsheet  
**Scheduler** - node-cron с проверкой наличия токенов

---

## 📂 Структура

```
.
    ├── src/
    │   ├── config/                 # Конфигурация окружения
    │   ├── db/
    │   │   ├── knexfile.ts
    │   │   ├── index.ts
    │   │   └── migrations/         # Миграции БД
    │   │
    │   ├── jobs/                   # Cron задачи
    │   │   ├── fetchTariffs.job.ts
    │   │   └── syncSheets.job.ts
    │   │
    │   ├── services/
    │   │   ├── wildberries/        # Работа с WB API
    │   │   └── google/             # Работа с Google Sheets
    │   │
    │   ├── utils/                  # Утилиты
    │   └── index.ts                # Точка входа
    │
    ├── Dockerfile
    ├── docker-compose.yml
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

## ⚙️ Как работает

**Wildberries**  
• Запрос раз в час  
• UPSERT в течение дня по текущей дате  
• Новый день - новые записи

**Google Sheets**  
• Экспорт раз в 6 часов  
• Берём данные самого свежего дня  
• Сортировка по delivery coefficient  
• Перезапись листа `stocks_coefs` во всех указанных таблицах

---

## 🚀 Запуск

Рекомендуемый способ:

```bash
docker compose up --build
```

Автоматически:  
- стартует PostgreSQL  
- применяются миграции  
- запускается сервис + кроны

Проверка:  
```bash
curl http://localhost:3000/health
# Должно быть :

# → {"status":"ok"}
```

---

## 🛠 Конфиг (.env)

```env
# PostgreSQL
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

# Wildberries (если нет - fetch просто отключится)
WB_API_TOKEN=...

# Google Sheets
GOOGLE_SPREADSHEET_IDS=id1,id2,id3
GOOGLE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2...      # base64 json
# или GOOGLE_SERVICE_ACCOUNT_FILE=/app/credentials.json
```

⚠️ Дайте сервисному аккаунту права на редактирование таблиц.

---

## 🔐 Безопасность

- секреты только через переменные окружения  
- `.env` в `.gitignore`  
- нет токенов и ключей в репозитории  
- крона fetchTariffs не стартует без WB_API_TOKEN  
- логи (pino) без чувствительной информации

---

## Почему выбрано именно так

- **Knex** - миграции + upsert без копипасты сырого SQL  
- **отдельные job-файлы** - проще тестировать и расширять  
- **idempotency** - повторный запуск ничего не ломает  
- **graceful degradation** - сервис живой даже без токенов (удобно для dev/test/CI)

---

## Технологии

- Node.js / TypeScript  
- PostgreSQL + Knex.js  
- Google Sheets API  
- node-cron  
- Pino  
- Docker

---
