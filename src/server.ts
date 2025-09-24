import "dotenv/config";
import express from "express";
import colors from "colors";
import cors, { CorsOptions } from 'cors'
import routerStories from "./routes/stories";
import routerTests from "./routes/tests";
import routerFlashcard from "./routes/flashcards";
import morgan from "morgan";
import db from "./config/db";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

export async function connectDB() {
    try {
        await db.authenticate()
        db.sync()
        console.log(colors.magenta('BD conectada'))
    } catch (error) { 
        // console.log(error);
        console.log(colors.red.bold("Hubo un error al conectarr con la BD"));
    }
}
connectDB()

const server = express()

const corsOptions: CorsOptions = {
    origin: function(origin, callbac) {
        if(origin === process.env.FRONTEND_URL || origin === process.env.FRONTEND_URL_ADMIN) {
            callbac(null, true)
        } else {
            callbac(new Error('Denegado por Cors'))
        }
    }, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true,
}
server.use(cors(corsOptions))
server.use(morgan('dev'))
server.all("/api/auth/*", toNodeHandler(auth));

server.use(express.json())

server.use('/api/stories', routerStories)
server.use('/api/tests', routerTests)
server.use('/api/flashcards', routerFlashcard)

server.get('/api', (req, res) => {
    res.json({msg: "Desde api"})
})


export default server