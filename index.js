require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const crypto = require('crypto')

const { Client } = require('pg')
const pg = new Client({
  connectionString:  process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
  // ssl: process.env.NODE_ENV === 'production' ? true : false
  // sslmode: process.env.NODE_ENV === "production" ? "require" : "disable"
  ssl: process.env.NODE_ENV === 'production' ? {
    require: process.env.NODE_ENV === 'production' ? true : false,
    rejectUnauthorized: false
  } : false
})

pg.connect().catch((error) => {
  console.log('Error connecting to database', error)
})

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json())

// routes:

app.get('/', (req, res) => {
  res.send('Welcome to Unsplash for Zoom Team Chat!')
})

app.get('/authorize', (req, res) => {
  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.ZOOM_BOT_JID)
})

app.get('/support', (req, res) => {
  res.send('Reach out via devsupport.zoom.us or devforum.zoom.us for support.')
})

app.get('/privacy', (req, res) => {
  res.send('Unsplash for Zoom Team Chat stores the account_id, and access_token in an encrypted database for users who have installed the app. User data is deleted when the app is uninstalled by the user. User data is not shared, period.')
})

app.get('/terms', (req, res) => {
  res.send('Use of this sample app is subject to our [Terms of Use](https://explore.zoom.us/en/legal/zoom-api-license-and-tou/).')
})

app.get('/documentation', (req, res) => {
  res.send('Type "/unsplash island" to see a photo of an island, or anything else you have in mind!')
})

app.post('/unsplash', (req, res) => {

  var response

  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`

  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex')

  const signature = `v0=${hashForVerify}`

  if (req.headers['x-zm-signature'] === signature) {

    if(req.body.event === 'endpoint.url_validation') {

      const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex')

      response = {
        message: {
          plainToken: req.body.payload.plainToken,
          encryptedToken: hashForValidate
        },
        status: 200
      }

      console.log(response.message)

      res.status(response.status)
      res.json(response.message)
    } else {

      response = { message: 'Authorized request to Unsplash for Zoom Team Chat.', status: 200 }

      console.log(response.message)

      res.status(response.status)
      res.json(response)

      if(req.body.event === 'bot_notification') {
        console.log('Zoom Team Chat App message received.')
        getUser(req.body.payload)
      } else if(req.body.event === 'bot_installed') {
        console.log('Unsplash for Zoom Team Chat installed.')
      } else if(req.body.event === 'app_deauthorized') {
        console.log('Unsplash for Zoom Team Chat uninstalled.')
        deleteUser(req.body.payload)
      } else {
        console.log('Unsupported Zoom webhook event type: ', req.body.event)
        console.log(req.body)
      }
    }
  } else {
    response = { message: 'Unauthorized request to Unsplash for Zoom Team Chat.', status: 401 }

    console.log(response.message)

    res.status(response.status)
    res.json(response)
  }
})

// helper functions:

function getUser(payload) {
  console.log(payload)

  try {
    pg.query(`SELECT PGP_SYM_DECRYPT(access_token::bytea, '${process.env.DATABASE_ENCRYPTION_KEY}') as access_token, PGP_SYM_DECRYPT(expires_on::bytea, '${process.env.DATABASE_ENCRYPTION_KEY}') as expires_on FROM users WHERE PGP_SYM_DECRYPT(account_id::bytea, '${process.env.DATABASE_ENCRYPTION_KEY}') = '${payload.accountId}';`, (error, results) => {
      if (error) {
        console.log('Error selecting user from database.', error)
      } else {
        if(results.rows.length) {
  
          console.log('User exists.')
  
          if(results.rows[0].expires_on > (new Date().getTime() / 1000)) {
            console.log('User access token active.')
  
            getPhoto(results.rows[0].access_token, payload)
          } else {
            console.log('User access token expired.')
  
            getAccessToken(payload, true)
          }
        } else {
          console.log('User does not exist.')
  
          getAccessToken(payload, false)
        }
      }
    })
  } catch (error) {
    console.log(error)
  }

  
}

function deleteUser(payload) {
  pg.query(`DELETE FROM users WHERE PGP_SYM_DECRYPT(account_id::bytea,'${process.env.DATABASE_ENCRYPTION_KEY}') = '${payload.account_id}';`, (error, results) => {
    if (error) {
      console.log('Error removing user from database.', error)
    } else {
      console.log('Successfully removed user from database.')
    }
  })
}

function getPhoto (accessToken, payload) {
  axios.get(`https://api.unsplash.com/photos/random?query=${payload.cmd}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`).then((body) => {

    console.log('Successfully received photo from Unsplash.')

    var photoBody = [
      {
        'type': 'section',
        'sidebar_color': body.data.color,
        'sections': [
          {
            'type': 'attachments',
            'img_url': body.data.urls.small,
            'resource_url': body.data.links.html,
            'information': {
              'title': {
                'text': 'Photo by ' + body.data.user.name
              },
              'description': {
                'text': 'Click to view on Unsplash'
              }
            }
          }
        ]
      }
    ]
    sendChat(photoBody, accessToken, payload)

  }).catch((error) => {
    console.log('Error getting photo from Unsplash.', error.response.data.errors)
    
    var errorsBody = [
      {
        'type': 'section',
        'sidebar_color': '#D72638',
        'sections': error.response.data.errors.map((error) => {
          return { 'type': 'message', 'text': error }
        })
      }
    ]
    sendChat(errorsBody, accessToken, payload)
  })
}

function sendChat (messageBody, accessToken, payload) {

  axios.post('https://api.zoom.us/v2/im/chat/messages', {
    'robot_jid': process.env.ZOOM_BOT_JID,
    'to_jid': payload.toJid,
    'account_id': payload.accountId,
    'content': {
      'head': {
        'text': '/unsplash ' + payload.cmd,
        'sub_head': {
          'text': 'Sent by ' + payload.userName
        }
      },
      'body': messageBody
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    }
  }).then((body) => {
    console.log('Successfully sent Team Chat App message to Zoom.')
  }).catch((error) => {
    console.log('Error sending Team Chat App message to Zoom.', error)
  })
}

function getAccessToken (payload, accountExists) {

  axios.post('https://api.zoom.us/oauth/token?grant_type=client_credentials', {}, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64')
    }
  }).then((body) => {

    console.log('Successfully received Team Chat App token from Zoom.')

    if(accountExists) {
      pg.query(`UPDATE users SET (access_token, expires_on) = (PGP_SYM_ENCRYPT('${body.data.access_token}', '${process.env.DATABASE_ENCRYPTION_KEY}', 'cipher-algo=${process.env.DATABASE_ENCRYPTION_ALGO}'), PGP_SYM_ENCRYPT('${(new Date().getTime() / 1000) + body.data.expires_in}', '${process.env.DATABASE_ENCRYPTION_KEY}', 'cipher-algo=${process.env.DATABASE_ENCRYPTION_ALGO}')) WHERE PGP_SYM_DECRYPT(account_id::bytea, '${process.env.DATABASE_ENCRYPTION_KEY}') = '${payload.accountId}';`, (error, results) => {
        if (error) {
          console.log('Error updating user in database.', error)
        } else {
          console.log('Successfully updated user in database.')

          getPhoto(body.data.access_token, payload)
        }
      })
    } else {
      pg.query(`INSERT INTO users (account_id, access_token, expires_on) VALUES (PGP_SYM_ENCRYPT('${payload.accountId}', '${process.env.DATABASE_ENCRYPTION_KEY}', 'cipher-algo=${process.env.DATABASE_ENCRYPTION_ALGO}'), PGP_SYM_ENCRYPT('${body.data.access_token}', '${process.env.DATABASE_ENCRYPTION_KEY}', 'cipher-algo=${process.env.DATABASE_ENCRYPTION_ALGO}'), PGP_SYM_ENCRYPT('${(new Date().getTime() / 1000) + body.data.expires_in}', '${process.env.DATABASE_ENCRYPTION_KEY}', 'cipher-algo=${process.env.DATABASE_ENCRYPTION_ALGO}'));`, (error, results) => {
        if (error) {
          console.log('Error inserting user in database.', error)
        } else {
          console.log('Successfully inserted user in database.')

          getPhoto(body.data.access_token, payload)
        }
      })
    }
  }).catch((error) => {
    console.log('Error getting Team Chat App token from Zoom.', error)
  })
}

app.listen(port, () => console.log(`Unsplash for Zoom Team Chat listening on port ${port}!`))