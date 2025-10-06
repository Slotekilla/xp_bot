// api/bot.js — WEBHOOK HANDLER
import { Bot } from "grammy";
import { Redis } from "@upstash/redis";

// Validate required environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.WEBHOOK_SECRET;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!webhookSecret) throw new Error("Missing WEBHOOK_SECRET");

// Initialize Redis if credentials are provided
let redis;
if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  console.log("Redis initialized");
}

// Initialize bot
const bot = new Bot(token);

// Set up bot commands
bot.command("start", (ctx) => ctx.reply("Welcome to NeuralFrog XP Bot! Send /ping to test."));
bot.command("ping", (ctx) => ctx.reply("pong 🐸"));
bot.command("help", (ctx) => ctx.reply("Available commands:\n/start - Start the bot\n/ping - Test if the bot is responding\n/help - Show this help message"));

// Handle other message types
bot.on("message", (ctx) => {
  console.log("Received message:", ctx.message);
  // You can add more message handling logic here
});

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Verify webhook secret
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = requestUrl.pathname;
  const expectedPath = `/api/bot/${webhookSecret}`;
  
  if (!path.endsWith(webhookSecret)) {
    console.error("Invalid webhook secret");
    res.statusCode = 401;
    return res.end("Unauthorized");
  }
  
  if (req.method !== "POST") {
    res.statusCode = 200;
    return res.end("OK");
  }
  
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const update = body ? JSON.parse(body) : {};
    
    console.log("Received update:", JSON.stringify(update));
    
    await bot.handleUpdate(update);
    res.statusCode = 200;
    res.end("OK");
  } catch (e) {
    console.error("BOT WEBHOOK ERROR:", e);
    res.statusCode = 200; // Telegram expects 200 even on error
    res.end("OK");
  }
}
