const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on('connect', () => {
  console.log('connected to the db');
});

const createTables = () => {
  const queryText =
    `CREATE TABLE IF NOT EXISTS
      reflections(
        id UUID PRIMARY KEY,
        success VARCHAR(128) NOT NULL,
        low_point VARCHAR(128) NOT NULL,
        take_away VARCHAR(128) NOT NULL,
        created_date TIMESTAMP,
        modified_date TIMESTAMP
      )`;

  pool.query(queryText)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
}

pool.on('remove', () => {
  console.log('client removed');
  process.exit(0);
});


// require('dotenv').config();
//
// const { Client } = require('pg');
//
// const pg = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV ? true : false,
// });
//
// pg.connect();
//
// pg.query(`CREATE TABLE access_token(access_token TEXT, expires_on NUMERIC)`).then((res) => {
//   console.log(res);
//   pg.end();
// }).catch((err) => {
//   console.log(err);
//   pg.end();
// });
