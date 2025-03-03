const pool = require("../../config/dbConfig");

const queryDB = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Failed to get connection from pool:", err);
        return reject(err);
      }
      connection.query(sql, params, (error, results) => {
        connection.release();
        if (error) {
          console.error("Query failed:", error);
          return reject(error);
        }
        resolve(results);
      });
    });
  });
};

module.exports = queryDB;
