require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const { Client } = require('pg')
const pg = new Client(process.env.DATABASE_URL)

pg.connect().catch((error) => {
  console.log(error)
})

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Welcome to the Unsplash Chatbot for Zoom!')
})

app.get('/authorize', (req, res) => {
  res.send('Thanks for installing the Unsplash Chatbot for Zoom!')
})

app.get('/support', (req, res) => {
  res.send('Contact tommy.gaessler@zoom.us for support.')
})

app.get('/privacy', (req, res) => {
  res.send('The Unsplash Chatbot for Zoom does not store any user data.')
})

app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})

app.post('/unsplash', (req, res) => {
  pg.query('SELECT * FROM chatbot_token', (error, results) => {
    if (error) {
      console.log(error)
      res.send('Error getting chatbot_token from database.')
    } else {
      if (results.rows[0].expires_on > (new Date().getTime() / 1000)) {
        getPhoto(results.rows[0].token)
      } else {
        getChatbotToken()
      }
    }
  })

  function getPhoto (chatbotToken) {
    request(`https://api.unsplash.com/photos/random?query=${req.body.payload.cmd}&orientation=landscape&client_id=${process.env.unsplash_client_id}`, (error, body) => {
      if (error) {
        console.log(error)
        res.send('Error getting photo from Unsplash.')
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
      url: 'https://api.zoom.us/v2/im/chat/messages',
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
      console.log(body)
      if (error) {
        console.log(error)
        res.send('Error sending chat.')
      } else {
        res.send('Successfully sent chat.')
      }
    })
  }

  function getChatbotToken () {
    request({
      url: `https://api.zoom.us/oauth/token?grant_type=client_credentials&client_id=${process.env.zoom_client_id}&client_secret=${process.env.zoom_client_secret}`,
      method: 'POST'
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
        res.send('Error getting chatbot_token from Zoom.')
      } else {
        body = JSON.parse(body)

        pg.query(`UPDATE chatbot_token SET token = '${body.access_token}', expires_on = ${(new Date().getTime() / 1000) + body.expires_in}`, (error, results) => {
          if (error) {
            console.log(error)
            res.send('Error setting chatbot_token in database.')
          } else {
            getPhoto(body.access_token)
          }
        })
      }
    })
  }
})

app.post('/deauthorize', (req, res) => {
  request({
    url: 'https://api.zoom.us/oauth/data/compliance',
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
      res.send('Error deauthorizing app from Zoom.')
    } else {
      res.send('Successfully deauthorized the Unsplash Chatbot for Zoom.')
    }
  })
})

app.listen(port, () => console.log(`Chatbot listening on port ${port}!`))
