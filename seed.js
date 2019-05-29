const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const client = new pg.Client(connectionString);

client.connect();
client.query('CREATE TABLE IF NOT EXISTS table_name (id uuid, url VARCHAR(2000), title TEXT, description TEXT, been_visited BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())', (err, res) => {
    if (err) {
      client.end();
      return console.error('error with PostgreSQL database', err);
    }
});

client.end();
// require('dotenv').config();
// const { Client } = require('pg');
// const pg = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV ? true : false,
// });
// pg.connect();
// pg.query(`CREATE TABLE access_token(access_token TEXT, expires_on NUMERIC); INSERT INTO access_token (access_token, expires_on) VALUES ('', '1');`, (error, results) => {
//   if(error) {
//     console.log(error);
//   } else {
//     console.log(results);
//   }
//   pg.end();
// })
