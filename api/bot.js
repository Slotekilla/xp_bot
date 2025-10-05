// api/bot.js — MINIMAL NODE WEBHOOK (manual body read)
import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new Bot(token);
bot.command("start", (ctx) => ctx.reply("Hi! Send /ping"));
bot.command("ping",  (ctx) => ctx.reply("pong 🐸"));

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 200;
    return res.end("OK");
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const update = body ? JSON.parse(body) : {};
    await bot.handleUpdate(update);
    res.statusCode = 200;
    res.end("OK");
  } catch (e) {
    console.error("BOT WEBHOOK ERROR:", e);
    res.statusCode = 200; // always 200 for Telegram
    res.end("OK");
  }
}
