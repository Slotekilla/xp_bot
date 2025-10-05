// api/bot.js — MINIMAL NODE + LOGS
import { Bot, webhookCallback } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new Bot(token);

// basic commands
bot.command("start", (ctx) => ctx.reply("Hi! Send /ping"));
bot.command("ping",  (ctx) => ctx.reply("pong 🐸"));

// Node serverless handler with GET health and request logs
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // quick health for GET
  if (req.method !== "POST") {
    console.log("HEALTH CHECK", req.method, req.url);
    res.statusCode = 200;
    return res.end("OK");
  }

  // log that Telegram hit the webhook
  console.log("WEBHOOK HIT", req.method, req.url);

  const handle = webhookCallback(bot, "express");
  try {
    return handle(req, res);
  } catch (e) {
    console.error("BOT ERROR", e);
    res.statusCode = 500;
    res.end("Internal Error");
  }
}
