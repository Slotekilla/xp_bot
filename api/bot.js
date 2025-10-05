import { Bot, webhookCallback } from "grammy";
import { Redis } from "@upstash/redis";

// ===== ENV =====
const token = process.env.TELEGRAM_BOT_TOKEN;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.WEBHOOK_SECRET || "frogsecret";
const DAILY_XP_CAP = parseInt(process.env.DAILY_XP_CAP || "50", 10);
const XP_PER_MSG = parseInt(process.env.XP_PER_MSG || "1", 10);

// Fail early with clear messages (these show in Vercel logs)
if (!token) throw new Error("Missing env: TELEGRAM_BOT_TOKEN");
if (!redisUrl) throw new Error("Missing env: UPSTASH_REDIS_REST_URL");
if (!redisToken) throw new Error("Missing env: UPSTASH_REDIS_REST_TOKEN");

const redis = new Redis({ url: redisUrl, token: redisToken });
const bot = new Bot(token);

const today = () => new Date().toISOString().slice(0, 10);

// Award XP for any message in groups (daily cap per user)
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

// Commands
bot.command("ping", (ctx) => ctx.reply("pong 🐸"));

bot.command("me", async (ctx) => {
  const chat = ctx.chat, user = ctx.from;
  if (!chat || !user) return;
  const score = await redis.zscore(`xp:zset:${chat.id}:total`, String(user.id));
  await ctx.reply(`🐸 Your XP: ${score ?? 0}`);
});

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

// ---- Edge runtime handler (std/http) ----
export const config = { runtime: "edge" };
const handleUpdate = webhookCallback(bot, "std/http");

export default async function handler(req) {
  // začasno brez secret preverjanja
  return handleUpdate(req);
} catch (e) {
    console.error("BOT ERROR:", e);
    return new Response("Internal Error", { status: 500 });
  }
}

