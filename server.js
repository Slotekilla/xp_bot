import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET is required');

// Initialize Redis if credentials are provided
let redis;
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('Redis initialized');
}

// Initialize bot
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Set up bot commands
bot.command('start', (ctx) => ctx.reply('Welcome to NeuralFrog XP Bot! Send /ping to test.'));
bot.command('ping', (ctx) => ctx.reply('pong 🐸'));
bot.command('help', (ctx) => ctx.reply('Available commands:\n/start - Start the bot\n/ping - Test if the bot is responding\n/help - Show this help message'));

// Handle other message types
bot.on('message', (ctx) => {
  console.log('Received message:', ctx.message);
  // You can add more message handling logic here
});

// Set up Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Webhook endpoint
app.post(`/api/webhook/${WEBHOOK_SECRET}`, webhookCallback(bot, 'express'));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Webhook URL: /api/webhook/${WEBHOOK_SECRET}`);
});

// Log that the bot is ready
console.log('Bot is ready!');