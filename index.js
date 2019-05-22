require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Zoom Unsplash Chat Bot!')
})

app.get('/authorize', (req, res) => {
  // try to open app? Or add text saying to open app
  res.send('Thanks for installing Unsplash!')
})

app.post('/unsplash', (req, res) => {
  console.log(req.body);

  // add postgress db to store access token

  // if(expired) {
  //   refreshToken()
  // } else {
    getPhoto()
  // }

  function getPhoto() {
    request(`https://api.unsplash.com/photos/random?query=${req.body.payload.cmd}&orientation=landscape&client_id=${process.env.unsplash_client_id}`, (error, body) => {
      if(error) {
        console.log(error);
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
          sendChat(errors)
        } else {
          var photo = [
            {
              "type": "section",
              "sidebar_color": "#000000",
              "sections": [
                {
                  "type": "attachments",
                  "img_url": body.urls.small,
                  "resource_url": body.links.html,
                  "ext": "png",
                  "information": {
                    "title": {
                      "text": body.user.name
                    },
                    "description": {
                      "text": "@" + body.user.username
                    }
                  }
                }
              ]
            }
          ]
          sendChat(photo);
        }
      }
    })
  }

  function sendChat(chatBody) {
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
          "text": "Unsplash"
        },
        "body": chatBody
      }
    },
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.zoom_access_token
    }}, (error, httpResponse, body) => {
      console.log(body);
      if (error) {
        console.log(error);
      } else {

      }
    });
  }

  function refreshToken() {
    request({
      url:`https://api.zoom.us/oauth/token?grant_type=client_credentials&client_id=${process.env.zoom_client_id}&client_secret=${process.env.zoom_client_secret}`,
      method: 'POST'
    }, (error, httpResponse, body) => {
      console.log(body);
      if (error) {
        console.log(error);
      } else {
        // update access_token and expires on
        getPhoto()
      }
    });
  }

  // check if access_token is expired

  // find photo
  // send photo

  res.send('Got a POST request')
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
