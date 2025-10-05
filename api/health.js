export const config = { runtime: "edge" };

export default function handler() {
  // Do NOT print secrets; just show which keys exist
  const ok = {
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    WEBHOOK_SECRET: !!process.env.WEBHOOK_SECRET,
  };
  return new Response(JSON.stringify(ok), { status: 200, headers: { "content-type": "application/json" } });
}
