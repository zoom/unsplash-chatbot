require('dotenv').config()

const { Client } = require('pg')
const pg = new Client(process.env.DATABASE_URL)

pg.connect()

pg.query(`CREATE TABLE chatbot_token(token TEXT, expires_on NUMERIC); INSERT INTO chatbot_token (token, expires_on) VALUES ('', '1');`, (error, results) => {
  if (error) {
    console.log(error)
  } else {
    console.log(results)
  }
  pg.end()
})
