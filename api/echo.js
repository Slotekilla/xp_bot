// api/echo.js — pure webhook echo (no bot)
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 200;
    return res.end("OK ECHO");
  }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    console.log("ECHO HIT", req.method, req.url);
    console.log("ECHO BODY", raw);
    res.statusCode = 200;
    res.end("OK");
  } catch (e) {
    console.error("ECHO ERROR", e);
    res.statusCode = 200; // Telegram expects 200
    res.end("OK");
  }
}
