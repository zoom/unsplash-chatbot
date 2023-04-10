require('dotenv').config()

const { Client } = require('pg')
const pg = new Client(process.env.DATABASE_URL)

pg.connect()

pg.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE TABLE IF NOT EXISTS users(account_id TEXT PRIMARY KEY, access_token TEXT, expires_on TEXT);`, (error, results) => {
  if (error) {
    console.log(error)
  } else {
    console.log(results)
  }
  pg.end()
})
