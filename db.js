const mysql = require("mysql2");

const pool = mysql.createPool({
 host: process.env.DB_HOST || process.env.LOCAL_DB_HOST,
  user: process.env.DB_USER || process.env.LOCAL_DB_USER,
  password: process.env.DB_PASSWORD || process.env.LOCAL_DB_PASSWORD,
  database: process.env.DB_NAME || process.env.LOCAL_DB_NAME
});

module.exports = pool.promise();
