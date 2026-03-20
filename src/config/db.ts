import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

// recrear __filename y __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Sequelize(process.env.DATABASE_URL!, {
    models: [path.join(__dirname, "../models/**/*.js")],
    logging: false
})

export default db