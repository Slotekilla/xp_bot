# DREAMCATCHER XP, Bot Telegram
### Telegram bot allow to gain XP, Level and Rank in groups.
![Statistics](.github/sr_1.gif)

## Configuration:
 * `TELEGRAM_TOKEN` Your Telegram bot Token (get from BotFather)
 * `TELEGRAM_BOT_TOKEN` Same as TELEGRAM_TOKEN (for webhook compatibility)
 * `WEBHOOK_SECRET` Secret key for securing your webhook endpoint
 * `UPSTASH_REDIS_REST_URL` Redis URL for caching (optional)
 * `UPSTASH_REDIS_REST_TOKEN` Redis authentication token (optional)
 * `GROUP_WHITELIST` Enter the group id that can use the bot (see .env_example)
 * `POSTGRES_URL` skip this, user below
 * `POSTGRES_HOST` Postgresql Host
 * `POSTGRES_USER` Postgresql User
 * `POSTGRES_DATABASE` Postgresql Database name
 * `POSTGRES_PASSWORD` Postgresql Password
 * `POSTGRES_PORT` Postgresql port
 * `MODERATE_ON` set true/false so that some types of chat can only be sent if xp is more than min xp
 * `MIN_XP` if MODERATE_ON set true, set MIN_XP (default 500)
 * `LESS_BOT_SPAM` set true/false to automatically delete chats from bots based on time BOT_EXPIRATION
 * `BOT_EXPIRATION` (default 3)
 * Import db to your Postgresql database, if there is an error when importing, ignore the important thing the table is all there.
 
See .env_example change to .env and change the contents, or set Config Vars on your hosting platform.

## Commands

- `/help` Get help
- `/xp` Get current XP (or reply user to get current xp that user)
- `/level` Get current level (or reply user to get current level that user)
- `/topranks` Get top rank from 1-3
- `/ranks 10` Get list rank from 1-10 (change 10 to what you want)
- `/rank` Get info rank, /rank png (to export to image)

## Running the Bot

### Option 1: Run with Webhooks (Recommended for Production)

1. Set up a webhook URL with Telegram:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>/api/bot/<WEBHOOK_SECRET>
```

2. Start the server:

```bash
npm start
```

### Option 2: Run with Polling (Development)

For local development, you can use the original index.js which uses polling:

```bash
node index.js
```

## Built With

* NodeJS
* PostgreSQL for Database
* Redis (optional, for caching)
* Dependencies
  * grammy (Telegram Bot API)
  * express (for webhook server)
  * node-postgres
  * dotenv
  * @upstash/redis (optional)
  
If you want another xp telegram bot, you can see my reference for making this bot:<br>
https://github.com/terorie/xpbot-telegram