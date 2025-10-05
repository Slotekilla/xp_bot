import { Bot, webhookCallback } from "grammy";
import { Redis } from "@upstash/redis";

// ENV
const token = process.env.TELEGRAM_BOT_TOKEN;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const SECRET = process.env.WEBHOOK_SECRET || "frogsecret";
const DAILY_XP_CAP = parseInt(process.env.DAILY_XP_CAP || "50", 10);
const XP_PER_MSG = parseInt(process.env.XP_PER_MSG || "1", 10);

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

const bot = new Bot(token);
const today = () => new Date().toISOString().slice(0, 10);

// Dodeli XP na vsako sporočilo v skupini (z dnevnim limitom)
bot.on("message", async (ctx) => {
  const chat = ctx.chat, user = ctx.from;
  if (!chat || !user) return;
  if (chat.type !== "group" && chat.type !== "supergroup") return;

  const totalKey = `xp:zset:${chat.id}:total`;
  const dayKey   = `xp:zset:${chat.id}:${today()}`;
  const cntKey   = `xp:count:${chat.id}:${user.id}:${today()}`;

  const current = (await redis.get(cntKey)) || 0;
  if (current >= DAILY_XP_CAP) return;

  const p = redis.pipeline();
  p.incr(cntKey);
  p.expire(cntKey, 60 * 60 * 48);
  p.zincrby(totalKey, XP_PER_MSG, String(user.id));
  p.zincrby(dayKey,   XP_PER_MSG, String(user.id));
  await p.exec();
});

// /ping
bot.command("ping", (ctx) => ctx.reply("pong 🐸"));

// /me
bot.command("me", async (ctx) => {
  const chat = ctx.chat, user = ctx.from;
  if (!chat || !user) return;
  const score = await redis.zscore(`xp:zset:${chat.id}:total`, String(user.id));
  await ctx.reply(`🐸 Your XP: ${score ?? 0}`);
});

// /top
bot.command("top", async (ctx) => {
  const chat = ctx.chat; if (!chat) return;
  const top = await redis.zrevrange(`xp:zset:${chat.id}:total`, 0, 9, { withScores: true });
  if (!top || top.length === 0) return ctx.reply("No XP yet.");
  let out = "🏆 Top Frogs (All-time):\n";
  for (let i = 0; i < top.length; i += 2) {
    const uid = top[i];
    const score = top[i + 1];
    out += `${i/2 + 1}. <a href="tg://user?id=${uid}">frog</a> — ${score} XP\n`;
  }
  await ctx.reply(out, { parse_mode: "HTML" });
});

// Vercel handler (Node runtime)
export const config = { runtime: "nodejs18.x" };
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.searchParams.get("secret") !== SECRET) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }
  const handleUpdate = webhookCallback(bot, "express");
  return handleUpdate(req, res);
}
