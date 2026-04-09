import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const GSHEET_URL = process.env.GSHEET_URL;
  if (!GSHEET_URL) {
    return NextResponse.json({ ok: false, error: "GSHEET_URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await fetch(GSHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    const text = await response.text();
    console.log("[GSheet proxy] status:", response.status, "body:", text.slice(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Apps Script HTTP ${response.status}`, body: text.slice(0, 200) },
        { status: 200 },
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Apps Script 응답 파싱 실패", body: text.slice(0, 200) },
        { status: 200 },
      );
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
