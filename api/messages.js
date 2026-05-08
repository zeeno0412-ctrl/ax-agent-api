// Azure Bot Framework - Teams bot message handler
// Receives messages from Teams and replies with the AX Agent link

export default async function handler(req, res) {
  // CORS & method check
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const activity = req.body;
  if (!activity || activity.type !== "message") {
    return res.status(200).end();
  }

  try {
    // 1) Get Bot Framework access token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_APP_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.MICROSOFT_APP_ID,
          client_secret: process.env.MICROSOFT_APP_PASSWORD,
          scope: "https://api.botframework.com/.default",
        }),
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Token error:", tokenData);
      return res.status(500).json({ error: "Failed to get access token" });
    }

    // 2) Build reply text
    const agentUrl = process.env.AGENT_URL || "https://ax-agent-api.vercel.app";
    const replyText =
      `안녕하세요! 👋 **AX스쿼드 에이전트**입니다.\n\n` +
      `업무 자동화 아이디어를 접수하시려면 아래 링크를 방문해주세요:\n\n` +
      `🔗 ${agentUrl}`;

    // 3) Post reply to Bot Framework service URL
    const serviceUrl = activity.serviceUrl?.replace(/\/$/, "");
    const conversationId = activity.conversation?.id;

    const replyRes = await fetch(
      `${serviceUrl}/v3/conversations/${conversationId}/activities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: "message",
          from: { id: process.env.MICROSOFT_APP_ID, name: "AX Squad Bot" },
          recipient: activity.from,
          replyToId: activity.id,
          conversation: activity.conversation,
          text: replyText,
          textFormat: "markdown",
        }),
      }
    );

    if (!replyRes.ok) {
      const errText = await replyRes.text();
      console.error("Reply error:", errText);
      return res.status(500).json({ error: "Failed to send reply" });
    }

    return res.status(200).end();
  } catch (e) {
    console.error("Bot handler error:", e);
    return res.status(500).json({ error: e.message });
  }
}
