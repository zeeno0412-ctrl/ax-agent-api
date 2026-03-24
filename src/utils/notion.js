const NOTION_API_URL = "https://ix.ax.gsretail.com/axsquad-agent/api/v2/notion";
const NOTION_DB_ID = import.meta.env.NOTION_DB_ID;
const NOTION_QUERY_DB_ID = "31336db6-f007-803a-b949-000bbc72fdfd";

function getAuthHeaders() {
  const token = sessionStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function saveToNotion({ receiptId, answers, verdict, firstMsg, pov }) {
  try {
    const res = await fetch(NOTION_API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        request_type: "insert",
        datasource_id: NOTION_DB_ID,
        workspace_secret: "",
        request_body: {
          parent: { database_id: NOTION_DB_ID },
          properties: {
            "과제명":       { title:     [{ text: { content: (firstMsg || "").slice(0, 100) } }] },
            "접수번호":     { rich_text: [{ text: { content: receiptId || "" } }] },
            "판정":         { select:    { name: verdict || "MAYBE" } },
            "신청자":       { rich_text: [{ text: { content: answers?.name    || "-" } }] },
            "팀명":         { rich_text: [{ text: { content: answers?.team    || "-" } }] },
            "대상":         { rich_text: [{ text: { content: answers?.who     || "-" } }] },
            "니즈":         { rich_text: [{ text: { content: answers?.need    || "-" } }] },
            "인사이트":     { rich_text: [{ text: { content: answers?.insight || "-" } }] },
            "현재상황":     { rich_text: [{ text: { content: answers?.current || "-" } }] },
            "기대효과":     { rich_text: [{ text: { content: answers?.effect  || "-" } }] },
            "데이터산출물": { rich_text: [{ text: { content: answers?.data    || "-" } }] },
            "PoV":          { rich_text: [{ text: { content: pov || "-" } }] },
            "접수일시":     { date:      { start: new Date().toISOString() } },
          }
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || data.message };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function queryNotion(filter = {}) {
  try {
    const res = await fetch(NOTION_API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        request_type: "query",
        datasource_id: NOTION_QUERY_DB_ID,
        workspace_secret: "",
        request_body: {
          filter,
          sorts: [{ property: "접수일시", direction: "descending" }]
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || data.message };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const NOTION_USER_DB_ID = "32c36db6-f007-8054-923c-000b75b70e7f";

export async function queryNotionUsers() {
  try {
    const res = await fetch(NOTION_API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        request_type: "user_list",
        datasource_id: NOTION_USER_DB_ID,
        workspace_secret: "",
        request_body: {
          filter: {
            property: "사용여부",
            select: { equals: "Y" }
          }
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || data.message };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message, isFetchError: true };
  }
}
