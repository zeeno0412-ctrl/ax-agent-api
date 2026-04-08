import crypto from "crypto";

const SHEET_ID = "1hvFRg7T0cPNWPCN7JptqmGfQ0xOPPZETBG4EW9w-VF4";
const SHEET_RANGE = "A:N";

function b64url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(creds.private_key, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`토큰 발급 실패: ${JSON.stringify(data)}`);
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credJson) return res.status(500).json({ ok: false, error: "GOOGLE_SERVICE_ACCOUNT 환경변수 없음" });

  try {
    const creds = JSON.parse(credJson);
    // private_key의 \n이 이스케이프된 경우 처리
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");

    const accessToken = await getAccessToken(creds);
    const d = req.body;

    const row = [
      d["과제명"]       || "",
      d["접수번호"]     || "",
      d["판정"]         || "",
      d["신청자"]       || "",
      d["팀명"]         || "",
      d["대상"]         || "",
      d["니즈"]         || "",
      d["인사이트"]     || "",
      d["현재상황"]     || "",
      d["기대효과"]     || "",
      d["데이터산출물"] || "",
      d["PoV"]          || "",
      d["접수일시"]     || "",
      d["신청자이메일"] || "",
    ];

    const sheetsRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    const sheetsData = await sheetsRes.json();
    console.log("[GSheet] Sheets API status:", sheetsRes.status, JSON.stringify(sheetsData).slice(0, 200));
    if (!sheetsRes.ok) {
      return res.status(200).json({ ok: false, error: sheetsData.error?.message || "Sheets API 오류" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[GSheet] error:", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
