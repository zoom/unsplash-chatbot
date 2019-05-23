require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const { Client } = require('pg');

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV ? true : false,
});

pg.connect();

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Zoom Unsplash Chat Bot!')
})

app.get('/authorize', (req, res) => {
  res.send('Thanks for installing Unsplash! Open Zoom Chat and type "/unsplash mountains" in a channel to see a photo of mountains!')
})

app.post('/unsplash', (req, res) => {

  pg.query('SELECT * FROM access_token', (error, results) => {
    if (error) {
      console.log(error);
      res.send('Error in access_token query')
    } else {
      if(results.rows[0].expires_on > (new Date().getTime() / 1000)) {
        getPhoto(results.rows[0].access_token)
      } else {
        refreshToken()
      }
    }
  })

  function getPhoto(zoom_access_token) {
    request(`https://api.unsplash.com/photos/random?query=${req.body.payload.cmd}&orientation=landscape&client_id=${process.env.unsplash_client_id}`, (error, body) => {
      if(error) {
        console.log(error);
        res.send('Error in getting photo')
      } else {
        body = JSON.parse(body.body)
        if(body.errors) {
          var errors = [
            {
              "type": "section",
              "sidebar_color": "#D72638",
              "sections": body.errors.map((error) => {
                return {"type": "message", "text": error}
              })
            }
          ]
          sendChat(errors, zoom_access_token)
        } else {
          var photo = [
            {
              "type": "section",
              "sidebar_color": "#000000",
              "sections": [
                {
                  "type": "attachments",
                  "img_url": body.urls.regular,
                  "resource_url": body.links.html,
                  "ext": "png",
                  "information": {
                    "title": {
                      "text": "Photo by " + body.user.name
                    },
                    "description": {
                      "text": "Tap to view on unsplash.com"
                    }
                  }
                }
              ]
            }
          ]
          sendChat(photo, zoom_access_token);
        }
      }
    })
  }

  function sendChat(chatBody, zoom_access_token) {

    request({
      url:'https://api.zoom.us/v2/im/chat/messages',
      method: 'POST',
      json: true,
      body: {
      "robot_jid": process.env.zoom_robot_jid,
      "to_jid": req.body.payload.toJid,
      "account_id": req.body.payload.accountId,
      "content": {
        "head": {
          "text": "/unsplash " + req.body.payload.cmd
        },
        "body": chatBody
      }
    },
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + zoom_access_token
    }}, (error, httpResponse, body) => {
      if (error) {
        res.send('Error sending chat')
        console.log(error);
      } else {
        res.send('Chat sent successfully')
      }
    });
  }

  function refreshToken() {
    request({
      url:`https://api.zoom.us/oauth/token?grant_type=client_credentials&client_id=${process.env.zoom_client_id}&client_secret=${process.env.zoom_client_secret}`,
      method: 'POST'
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error);
        res.send('Error refreshing token')
      } else {
        body = JSON.parse(body);

        pg.query(`UPDATE access_token SET access_token = '${body.access_token}', expires_on = ${(new Date().getTime() / 1000) + body.expires_in}`, (error, results) => {
          if (error) {
            console.log(error);
            res.send('Error setting access_token')
          } else {
            getPhoto(body.access_token)
          }
        })
      }
    });
  }
})

app.get('/support', (req, res) => {
  res.send('Contact tommy.gaessler@zoom.us for support.')
})

app.get('/privacy', (req, res) => {
  res.send('We do not store any of your user data.')
})

app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})

app.post('/deauthorize', (req, res) => {
  res.send('deauthorized')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
