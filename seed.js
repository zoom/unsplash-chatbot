require('dotenv').config()

const { Client } = require('pg')
const pg = new Client({
  connectionString:  process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: process.env.NODE_ENV === 'production' ? true : false,
    rejectUnauthorized: false
  } : false
})

pg.connect().catch((error) => {
  console.log('Error connecting to database', error)
})

pg.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE TABLE IF NOT EXISTS users(account_id TEXT PRIMARY KEY, access_token TEXT, expires_on TEXT);`, (error, results) => {
  if (error) {
    console.log(error)
  } else {
    console.log(results)
  }
  pg.end()
})
