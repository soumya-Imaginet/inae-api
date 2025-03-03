const { createPool } = require("mysql");

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 1000,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
});

pool.getConnection((err, res) => {
  if (err) {
    console.log("Db connecting fails", err);
  } else {
    console.log("DataBase connected success.");
  }
});

module.exports = pool;
