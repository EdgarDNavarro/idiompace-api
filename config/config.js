// config/config.js
require("dotenv").config(); // carga .env automáticamente

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL not set in .env");
}

module.exports = {
  development: {
    url,
    dialect: "postgres",
    // si necesitás SSL en producción:
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false,
    //   },
    // },
  },
  test: {
    url,
    dialect: "postgres"
  },
  production: {
    url,
    dialect: "postgres"
  }
};
