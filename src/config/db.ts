import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Importar todos los modelos explícitamente
import Story from "../models/Story.Model.js";
import Exercise from "../models/Exercise.Model.js";
import Vocabulary from "../models/Vocabulary.Model.js";
import Decks from "../models/Decks.Model.js";
import Flashcards from "../models/Flashcards.Model.js";
import Daily from "../models/Daily.Model.js";
import Streak from "../models/Streak.Model.js";
import SubscriptionUsage from "../models/SubscriptionUsage.Model.js";

dotenv.config();

// recrear __filename y __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Sequelize(process.env.DATABASE_URL!, {
    logging: false
});

// Agregar modelos explícitamente
db.addModels([
    Story,
    Exercise,
    Vocabulary,
    Decks,
    Flashcards,
    Daily,
    Streak,
    SubscriptionUsage
]);

export default db