import { Bot, webhookCallback } from "grammy";
import { Redis } from "@upstash/redis";

// ENV
const token = process.env.TELEGRAM_BOT_TOKEN!;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const secret = process.env.WEBHOOK_SECRET || "frogsecret";

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

// helpers
const today = () => new Date().toISOString().slice(0, 10);
const dailyCap = parseInt(process.env.DAILY_XP_CAP || "50", 10);
const xpPerMsg = parseInt(process.env.XP_PER_MSG || "1", 10);

const bot = new Bot(token);

// give XP on any group message
bot.on("message", async (ctx) => {
  const chat = ctx.chat;
  if (!chat || (chat.type !== "group" && chat.type !== "supergroup")) return;
  const user = ctx.from;
  if (!user) return;

  const totalKey = `xp:zset:${chat.id}:total`;
  const dayKey = `xp:zset:${chat.id}:${today()}`;
  const cntKey = `xp:count:${chat.id}:${user.id}:${today()}`;

  const current = (await redis.get<number>(cntKey)) || 0;
  if (current >= dailyCap) return;

  const p = redis.pipeline();
  p.incr(cntKey);
  p.expire(cntKey, 60 * 60 * 48);
  p.zincrby(totalKey, xpPerMsg, String(user.id));
  p.zincrby(dayKey, xpPerMsg, String(user.id));
  await p.exec();
});

// commands
bot.command("ping", (ctx) => ctx.reply("pong 🐸"));
bot.command("me", async (ctx) => {
  const chat = ctx.chat; const user = ctx.from;
  if (!chat || !user) return;
  const score = await redis.zscore(`xp:zset:${chat.id}:total`, String(user.id));
  await ctx.reply(`🐸 Your XP: ${score ?? 0}`);
});
bot.command("top", async (ctx) => {
  const chat = ctx.chat; if (!chat) return;
  const top = await redis.zrevrange(`xp:zset:${chat.id}:total`, 0, 9, { withScores: true });
  if (top.length === 0) return ctx.reply("No XP yet.");
  let out = "🏆 Top Frogs:\n";
  for (let i = 0; i < top.length; i += 2) {
    const uid = top[i] as string;
    const score = top[i + 1] as number;
    out += `${i / 2 + 1}. <a href="tg://user?id=${uid}">frog</a> — ${score} XP\n`;
  }
  await ctx.reply(out, { parse_mode: "HTML" });
});

// vercel handler
export default async function handler(req: Request) {
  // simple secret gate to avoid random hits
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== (process.env.WEBHOOK_SECRET || "frogsecret")) {
    return new Response("Forbidden", { status: 403 });
  }
  const handleUpdate = webhookCallback(bot, "std/http");
  return handleUpdate(req);
}
