// api/bot.js — MINIMAL NODE WEBHOOK (manual body read)
import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new Bot(token);

// basic commands
bot.command("start", (ctx) => ctx.reply("Hi! Send /ping"));
bot.command("ping",  (ctx) => ctx.reply("pong 🐸"));

// Node serverless handler with GET health and manual JSON parsing
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Health for browser GET
  if (req.method !== "POST") {
    res.statusCode = 200;
    return res.end("OK");
  }

  try {
    // Manually read raw body (Vercel-safe)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const update = body ? JSON.parse(body) : {};

    await bot.handleUpdate(update);

    res.statusCode = 200;
    res.end("OK");
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    // Telegram expects 200 even if we log an error
    res.statusCode = 200;
    res.end("OK");
  }
}

