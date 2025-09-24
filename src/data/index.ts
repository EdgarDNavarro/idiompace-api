import { exit } from 'node:process'
import db from '../config/db'

const clearDB = async () => {
    try {
        await db.sync({force: true})
        console.log("base de datos eliminada");
        exit()
    } catch (error) {
        console.log(error);
        exit(1)
    }
}
if(process.argv[2] === '--clear') {
    clearDB()
}