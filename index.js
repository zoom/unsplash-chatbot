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
  pg.query('SELECT * FROM access_token', (error, results) => {
    if (error) {
      console.log(error)
      res.send('Error getting access_token from database.')
    } else {
      if (results.rows[0].expires_on > (new Date().getTime() / 1000)) {
        getPhoto(results.rows[0].access_token)
      } else {
        refreshToken()
      }
    }
  })

  function getPhoto (zoomAccessToken) {
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
          sendChat(errors, zoomAccessToken)
        } else {
          var photo = [
            {
              'type': 'section',
              'sidebar_color': body.color,
              'sections': [
                {
                  'type': 'attachments',
                  'img_url': body.urls.regular,
                  'resource_url': body.links.html,
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
          sendChat(photo, zoomAccessToken)
        }
      }
    })
  }

  function sendChat (chatBody, zoomAccessToken) {
    request({
      url: 'https://api.zoom.us/v2/im/chat/messages',
      method: 'POST',
      json: true,
      body: {
        'robot_jid': process.env.zoom_robot_jid,
        'to_jid': req.body.payload.toJid,
        'account_id': req.body.payload.accountId,
        'content': {
          'head': {
            'text': '/unsplash ' + req.body.payload.cmd
          },
          'body': chatBody
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + zoomAccessToken
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

  function refreshToken () {
    request({
      url: `https://api.zoom.us/oauth/token?grant_type=client_credentials&client_id=${process.env.zoom_client_id}&client_secret=${process.env.zoom_client_secret}`,
      method: 'POST'
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
        res.send('Error refreshing access_token from Zoom.')
      } else {
        body = JSON.parse(body)

        pg.query(`UPDATE access_token SET access_token = '${body.access_token}', expires_on = ${(new Date().getTime() / 1000) + body.expires_in}`, (error, results) => {
          if (error) {
            console.log(error)
            res.send('Error setting access_token in database.')
          } else {
            getPhoto(body.access_token)
          }
        })
      }
    })
  }
})

app.post('/deauthorize', (req, res) => {
  res.send('The Unsplash Chatbot for Zoom has been removed from your account.')
})

app.listen(port, () => console.log(`Chatbot listening on port ${port}!`))
