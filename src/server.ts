import "dotenv/config";
import express from "express";
import colors from "colors";
import cors, { CorsOptions } from 'cors'
import cookieParser from "cookie-parser";
import routerStories from "./routes/stories.js";
import routerFlashcard from "./routes/flashcards.js";
import routerDaily from "./routes/daily.js";
import routerVocabulary from "./routes/vocabularies.js";
import routerExercise from "./routes/exercises.js";
import routerStreak from "./routes/streaks.js";
import routerSpeech from "./routes/speech.js";
import routerUpload from "./routes/upload.js";

import morgan from "morgan";
import db from "./config/db.js";
import { initAssociations } from "./models/associations.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

export async function connectDB() {
    try {
        await db.authenticate()
        // Inicializar asociaciones DESPUÉS de que los modelos estén cargados
        await initAssociations();
        await db.sync()
        console.log(colors.magenta('BD conectada'))
    } catch (error) { 
        console.log(error);
        console.log(colors.red.bold("Hubo un error al conectarr con la BD"));
    }
}
connectDB()

const server = express()

const corsOptions: CorsOptions = {
    origin: function(origin, callbac) {
        if(origin === process.env.FRONTEND_URL || origin === process.env.FRONTEND_URL_ADMIN || origin === process.env.N8N_URL || !origin) {
            callbac(null, true)
        } else {
            console.log("origin:", origin);
            
            callbac(new Error('Denegado por Cors'))
        }
    }, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true,
}
server.set('trust proxy', 1)
server.use(cors(corsOptions))
server.use(morgan('dev'))
server.use(cookieParser())

// Rate limiter global - protección general
server.use(globalLimiter);

server.use(express.json())

server.use('/api/stories', routerStories)
server.use('/api/flashcards', routerFlashcard)
server.use('/api/exercises', routerExercise)
server.use('/api/vocabularies', routerVocabulary)
server.use('/api/daily', routerDaily)
server.use('/api/streaks', routerStreak)
server.use('/api/speech', routerSpeech)
server.use('/api/upload', routerUpload)

server.get('/api', (req, res) => {
    res.json({msg: "Desde api"})
})


export default server
