import type { Knex } from "knex";
import path from "path";
import { config } from "../config";

const knexConfig: Knex.Config = {
  client: "pg",
  connection: {
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.join(__dirname, "..", "migrations"),
  },
};

export default knexConfig;