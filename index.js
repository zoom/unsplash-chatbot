require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const { Client } = require('pg')
const pg = new Client(process.env.DATABASE_URL)

pg.connect().catch((error) => {
  console.log('Error connecting to database', error)
})

const app = express()
const port = process.env.PORT || 4000
const api_url = process.env.api_url || 'https://api.zoomgov.com'

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Welcome to the Unsplash Chatbot for Zoom!')
})

app.get('/authorize', (req, res) => {
  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.zoom_bot_jid)
})

app.get('/support', (req, res) => {
  res.send('Contact tommy.gaessler@zoom.us for support.')
})

app.get('/privacy', (req, res) => {
  res.send('The Unsplash Chatbot for Zoom does not store any user data.')
})

app.get('/terms', (req, res) => {
  res.send('By installing the Unsplash Chatbot for Zoom, you are accept and agree to these terms...')
})

app.get('/documentation', (req, res) => {
  res.send('Try typing "island" to see a photo of an island, or anything else you have in mind!')
})

app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})

app.post('/unsplash', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    res.status(200)
    res.send()
    pg.query('SELECT * FROM chatbot_token', (error, results) => {
      if (error) {
        console.log('Error getting chatbot_token from database.', error)
      } else {
        if (results.rows[0].expires_on > (new Date().getTime() / 1000)) {
          getPhoto(results.rows[0].token)
        } else {
          getChatbotToken()
        }
      }
    })
  } else {
    res.status(401)
    res.send('Unauthorized request to Unsplash Chatbot for Zoom.')
  }

  function getPhoto (chatbotToken) {
    request(`https://api.unsplash.com/photos/random?query=${req.body.payload.cmd}&orientation=landscape&client_id=${process.env.unsplash_access_key}`, (error, body) => {
      if (error) {
        console.log('Error getting photo from Unsplash.', error)
        var errors = [
          {
            'type': 'section',
            'sidebar_color': '#D72638',
            'sections': [{
              'type': 'message',
              'text': 'Error getting photo from Unsplash.'
            }]
          }
        ]
        sendChat(errors, chatbotToken)
      } else {
        body = JSON.parse(body.body)
        if (body.errors) {
          var errors = [
            {
              'type': 'section',
              'sidebar_color': '#D72638',
              'sections': body.errors.map((error) => {
                return { 'type': 'message', 'text': error }
              })
            }
          ]
          sendChat(errors, chatbotToken)
        } else {
          var photo = [
            {
              'type': 'section',
              'sidebar_color': body.color,
              'sections': [
                {
                  'type': 'attachments',
                  'img_url': body.urls.regular,
                  'resource_url': body.user.links.html,
                  'information': {
                    'title': {
                      'text': 'Photo by ' + body.user.name
                    },
                    'description': {
                      'text': 'Click to view on Unsplash'
                    }
                  }
                }
              ]
            }
          ]
          sendChat(photo, chatbotToken)
        }
      }
    })
  }

  function sendChat (chatBody, chatbotToken) {
    request({
      url: api_url + '/v2/im/chat/messages',
      method: 'POST',
      json: true,
      body: {
        'robot_jid': process.env.zoom_bot_jid,
        'to_jid': req.body.payload.toJid,
        'account_id': req.body.payload.accountId,
        'content': {
          'head': {
            'text': '/unsplash ' + req.body.payload.cmd,
            'sub_head': {
              'text': 'Sent by ' + req.body.payload.userName
            }
          },
          'body': chatBody
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + chatbotToken
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log('Error sending chat.', error)
      } else {
        console.log(body)
      }
    })
  }

  function getChatbotToken () {
    request({
      url: api_url + `/oauth/token?grant_type=client_credentials`,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64')
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log('Error getting chatbot_token from Zoom.', error)
      } else {
        body = JSON.parse(body)

        pg.query(`UPDATE chatbot_token SET token = '${body.access_token}', expires_on = ${(new Date().getTime() / 1000) + body.expires_in}`, (error, results) => {
          if (error) {
            console.log('Error setting chatbot_token in database.', error)
          } else {
            getPhoto(body.access_token)
          }
        })
      }
    })
  }
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    res.status(200)
    res.send()
    request({
      url: api_url + '/oauth/data/compliance',
      method: 'POST',
      json: true,
      body: {
        'client_id': req.body.payload.client_id,
        'user_id': req.body.payload.user_id,
        'account_id': req.body.payload.account_id,
        'deauthorization_event_received': req.body.payload,
        'compliance_completed': true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64'),
        'cache-control': 'no-cache'
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
      } else {
        console.log(body)
      }
    })
  } else {
    res.status(401)
    res.send('Unauthorized request to Unsplash Chatbot for Zoom.')
  }
})

app.listen(port, () => console.log(`Unsplash Chatbot for Zoom listening on port ${port}!`))
