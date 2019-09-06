# Unsplash Chatbot for Zoom

This is a sample Chatbot app using Node.js, PostgreSQL, and the Unsplash API, deployed to Heroku.

![Unsplash Chatbot for Zoom](https://s3.amazonaws.com/user-content.stoplight.io/19808/1562179851787)

[To create this Chatbot from scratch, click here to follow the step by step tutorial on our docs.](https://marketplace.zoom.us/docs/guides/chatbots/build-a-chatbot)

To run the completed Chatbot code locally or deploy it to a live server, continue reading below.



## Local/Development Setup

To run the completed Chatbot locally, follow these steps,

1. In terminal:

   `$ git clone https://github.com/zoom/unsplash-chatbot.git`

   `$ cd unsplash-chatbot`

   `$ npm install`

   `$ touch .env`

   [Download PostgreSQL here](https://www.postgresql.org/download/) or if on a Mac install using [Homebrew](https://brew.sh/),

   `$ brew install postgresql`

   Once PostgreSQL is installed, follow these commands if you haven’t set it up before,

   `$ brew services start postgresql`

   `$ psql postgres`

   You should be inside the PostgreSQL terminal now and see a `postgres=#` preifx. Now let’s create a database user called "me" with a password of "password"

   `postgres=# CREATE ROLE me WITH LOGIN PASSWORD 'password';`

   `postgres=# ALTER ROLE me CREATEDB;`

   `postgres=# \q`

   You have just added yourself as a user who has the create database permission. Now type this to connect to postgres as your user,

   `$ psql -d postgres -U me`

   Now that PostgreSQL is configured, let’s create a database, connect to it, and create a table to store our access_token. We will also seed our database with a blank access_token and an expires_on date of 1. That way, the first time we call our Zoom Chatbot it will think the access_token is expired. Then it will generate a new one for us, and save it. Run these postgres commands,

   `postgres=> CREATE DATABASE zoom_chatbot;`

   `postgres=> \c zoom_chatbot`

   `zoom_chatbot=> CREATE TABLE chatbot_token (token TEXT,  expires_on NUMERIC);`

   `zoom_chatbot=> INSERT INTO chatbot_token (token, expires_on)  VALUES ('', '1');`

2. Add this code to your `.env` file, replacing the `Required` text with your respective [**Development** Zoom Chatbot API credentials](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-chatbot-app#register) and your [Unsplash Access Key](https://unsplash.com/oauth/applications).

   If you followed my instructions on setting up PostgreSQL, don't change the `DATABASE_URL`. If you have setup PostgreSQL before or set it up differently than me reference this `postgres://DBUSERNAME:PASSWORD@SERVER:PORT/DATABASE`.

   ```
   unsplash_access_key=Required
   zoom_client_id=Required
   zoom_client_secret=Required
   zoom_bot_jid=Required
   zoom_verification_token=Required
   DATABASE_URL=postgres://me:password@localhost:5432/zoom_chatbot
   ```


3. In terminal:

   `$ npm run start` or `$ nodemon` ([for live reload / file change detection](https://www.npmjs.com/package/nodemon))

   `$ ngrok http 4000` ([ngrok turns localhost into live server](https://ngrok.com/) so slash commands and user actions can be sent to your app)

5. Open your ngrok https url in a browser, you should see this,

   `Welcome to the Unsplash Chatbot for Zoom!`

6. On your App Marketplace Dashboard, add your ngrok https url to your Whitelist URLs (App Credentials Page), **Development** Redirect URL for OAuth (App Credentials Page), and **Development** Bot Endpoint URL (Features Page). Make sure to match the path after your ngrok https url with the express routes in index.js.

   > In order to click the **Save** button on the Features page when adding a Slash Command and Development Bot Endpoint URL, you have to provide a Production Bot Endpoint URL. Feel free to use https://zoom.us as a placeholder.

   After that, your app is ready to be installed!

7. On your App Marketplace Dashboard, go to the **Local Test** page and click **Install**. After you click the **Authorize** button, you should be taken to your redirect url and see this,

   `Thanks for installing the Unsplash Chatbot for Zoom!`


8. Now that your Chatbot is installed on your Zoom account, go to a Zoom Chat channel and type,

   `/unsplash mountains`


## Production Setup

To run the completed Chatbot on a live server, follow these steps,

1. Click the **Deploy to Heroku** Button,

   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

2. Fill in your [**Production** Zoom Chatbot API credentials](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-chatbot-app#register) and your [Unsplash Access Key](https://unsplash.com/oauth/applications) in the **Config Vars** section.

3. Click **Deploy app**.

4. On your App Marketplace Dashboard, add your Heroku url to your Whitelist URLs (App Credentials Page), **Production** Redirect URL for OAuth (App Credentials Page), and **Production** Bot Endpoint URL (Features Page). Make sure to match the path after your Heroku url with the express routes in index.js.

5. On your App Marketplace Dashboard, go to the **Submit** page and click **Add to Zoom**. After you click the **Authorize** button, you should be taken to your redirect url and see this,

   `Thanks for installing the Unsplash Chatbot for Zoom!`

6. Now that your Chatbot is installed on your Zoom account, go to a Zoom Chat channel and type,

   `/unsplash mountains`

## Need Support?
The first place to look for help is on our [Developer Forum](https://devforum.zoom.us/), where Zoom Marketplace Developers can ask questions for public answers.

If you can’t find the answer in the Developer Forum or your request requires sensitive information to be relayed, please email us at developersupport@zoom.us.



<!-- ![See the best photos on the internet right in Zoom Chat](https://s3.amazonaws.com/user-content.stoplight.io/19808/1562179347007)

![Works in Channels and Direct Messages](https://s3.amazonaws.com/user-content.stoplight.io/19808/1562179353089)

![Collaborate Right in Zoom Chat](https://s3.amazonaws.com/user-content.stoplight.io/19808/1562179359856)


![Click the photo to see the photo & photographer on Unsplash](https://s3.amazonaws.com/user-content.stoplight.io/19808/1562179364706) -->
