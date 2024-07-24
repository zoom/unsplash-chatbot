# Unsplash for Zoom Team Chat sample

Use of this sample app is subject to our [Terms of Use](https://explore.zoom.us/en/legal/zoom-api-license-and-tou/).

This is a sample app that sends [Unsplash](https://unsplash.com/) photos to [Zoom Team Chat](https://www.zoom.com/en/products/team-chat/).

![Unsplash Team Chat App for Zoom](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*pT1T-m63ADVPo-VdZQYIqg.png)

If you would like to skip these steps and just deploy the finished code to Heroku, click the Deploy to Heroku button. (You will still need to configure a few simple things, so skip to [Deployment](#deployment).)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/zoom/unsplash-chatbot)

## Installation

In terminal, run the following command to clone the repo:

`$ git clone https://github.com/zoom/unsplash-chatbot.git`

## Setup

1. In terminal, cd into the cloned repo:

   `$ cd unsplash-chatbot`

1. Then install the dependencies:

   `$ npm install`

1. Create an environment file to store your credentials:

   `$ touch .env`

1. Download [PostgreSQL here](https://www.postgresql.org/download/) or if on a Mac install using [Homebrew](https://brew.sh/),

   `$ brew install postgresql`

1. Once PostgreSQL is installed, follow these commands if you haven’t set it up before,

   `$ brew services start postgresql`

   `$ psql postgres`

1. You should be inside the PostgreSQL terminal now and see a postgres=# preifx. Now let’s create a database user called "me" with a password of "password"

   `postgres=# CREATE ROLE me WITH LOGIN PASSWORD 'password';`

   `postgres=# ALTER ROLE me CREATEDB;`

   `postgres=# \q`

1. You have just added yourself as a user who has the create database permission. Now type this to connect to postgres as your user,

   `$ psql -d postgres -U me`

1. Now that PostgreSQL is configured, let’s create a database,

   `postgres=> CREATE DATABASE unsplash_for_zoom_team_chat;`

1. Back in the `.env` file, add the following code and insert your [Zoom Team Chat App credentials](https://developers.zoom.us/docs/team-chat-apps/create/#step-2-maintain-basic-information), your [Unsplash Access Key](https://unsplash.com/oauth/applications), and a [database encryption key](https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx):

   ```
   UNSPLASH_ACCESS_KEY=Required
   ZOOM_CLIENT_ID=Required
   ZOOM_CLIENT_SECRET=Required
   ZOOM_BOT_JID=Required
   ZOOM_WEBHOOK_SECRET_TOKEN=Required
   ZOOM_VERIFICATION_CODE=Required
   DATABASE_ENCRYPTION_KEY=Required
   DATABASE_ENCRYPTION_ALGO=aes256
   DATABASE_URL=postgres://me:password@localhost:5432/unsplash_for_zoom_team_chat
   ```

   > If you followed my instructions on setting up PostgreSQL, don't change the DATABASE_URL. If you have setup PostgreSQL before or set it up differently than me, use this convention for the DATABASE_URL postgres://DBUSERNAME:PASSWORD@SERVER:PORT/DATABASE.

1. Save and close `.env`.

1. Create the users table in your database and add the [pgcrypto encryption extension](https://www.postgresql.org/docs/current/pgcrypto.html) by running the seed file:

   `$ node seed.js`

1. Then start the server:

   `$ npm run start`

1. We need to expose the local server to the internet to accept post requests, we will use [Ngrok](https://ngrok.com/) (free) for this.

   Once installed, open a new terminal tab and run:

   `$ ngrok http 4000`

   > NOTE: [I've put ngrok in my PATH so I can call it globally.](https://stackoverflow.com/a/36759493/6592510)

1. Copy the ngrok https url and paste it in the Bot endpoint URL input on your Zoom App's Features section. Remember to include `/unsplash` path.

   Example: `https://abc123.ngrok.io/unsplash`

1. Click "Save".

## Usage

1. On your Zoom Team Chat App's Credentials section, go to the Local Test or Submit page depending on which envoirnment you are using (Development or Production), and click "Add". After authorizing, you should be taken to Zoom Team Chat and see a message from the Unsplash Team Chat App

   > Thanks for installing Unsplash for Zoom Team Chat!

1. Now that your Team Chat App is installed on your Zoom account, send a message using your slash command:

   `/unsplash mountains`

## Deployment

### Heroku (button)

1. After clicking the "Deploy to Heroku" button, enter a name for your app (or leave it blank to have a name generated for you), and insert your [Zoom Team Chat App credentials](https://developers.zoom.us/docs/team-chat-apps/create/#step-2-maintain-basic-information), your [Unsplash Access Key](https://unsplash.com/oauth/applications), and a [database encryption key](https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx):

   - `UNSPLASH_ACCESS_KEY` (Your Unsplash Access Key, it's the same for production and development, found on your Unsplash App Page)
   - `ZOOM_CLIENT_ID` (Your Zoom Production Client ID, found on your App's Credentials page)
   - `ZOOM_CLIENT_SECRET` (Your Zoom Production Client Secret, found on your App's Credentials page)
   - `ZOOM_BOT_JID` (Your Zoom Production Bot JID, found on your App's Features page)
   - `ZOOM_WEBHOOK_SECRET_TOKEN` (Your Zoom Webhook Secret Token, found on your App's Features page)
   - `ZOOM_VERIFICATION_CODE` (Your Zoom domain verification code, used to verify your domain name, found on your App's Submit page)
   - `DATABASE_ENCRYPTION_KEY` (An encryption key used to encrypt the data in your database. Treat this key secret, like a password)
   - `DATABASE_ENCRYPTION_ALGO` (An encryption algorithm used to encrypt your the data in your database)

   > The database will automatically be created, and the DATABASE_URL environment variable will automatically be set in Heroku.

1. Then click "Deploy App".

1. Copy the Heroku url and paste it in the Bot endpoint URL input on your Zoom App's Features section. Remember to include `/unsplash` path.

   Example: `https://abc123.herokuapp.com/unsplash`

### Heroku (CLI)

1. If you cloned this repo, you may use the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) to deploy your server. Remember to [provision Postgres](https://devcenter.heroku.com/articles/provisioning-heroku-postgres) and [set your config vars (envoirnment variables)](https://devcenter.heroku.com/articles/config-vars).

1. Copy the Heroku url and paste it in the Bot endpoint URL input on your Zoom App's Features section. Remember to include `/unsplash` path.

   Example: `https://abc123.herokuapp.com/unsplash`

### Other Server Hosting

1. For Other Server Hosting information, see [this tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/deployment#choosing_a_hosting_provider).

1.  Copy the deployed url and paste it in the Bot endpoint URL input on your Zoom App's Features section. Remember to include `/unsplash` path.

    Example: `https://abc123.compute-1.amazonaws.com/unsplash`

Now you are ready to [use the Unsplash Team Chat App for Zoom](#usage).

## Need help?

If you're looking for help, try [Developer Support](https://developers.zoom.us/support/) or our [Developer Forum](https://devforum.zoom.us). Priority support is also available with [Premier Developer Support](https://explore.zoom.us/en/support-plans/developer/) plans.
