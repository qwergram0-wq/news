import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Row = {
  title: string; source_name: string; source_url: string; published_at: string; category: string;
  description: string; language: string; image_url?: string | null; meta_checked_at?: string | null;
};

/* ---------------- 수집 피드 (세계일보 그룹 공식 RSS) ---------------- */
// cat 이 있으면 고정 카테고리, null 이면 제목+요약 키워드로 FASHION/LIFESTYLE 판정
const FEEDS: { name: string; url: string; cat: string | null }[] = [
  { name: "스포츠월드 스포츠", url: "https://www.sportsworldi.com/Articles/RSSList/sw_sports.xml", cat: "SPORTS" },
  { name: "세계일보 스포츠", url: "https://www.segye.com/Articles/RSSList/segye_sports.xml", cat: "SPORTS" },
  { name: "스포츠월드 라이프", url: "https://www.sportsworldi.com/Articles/RSSList/sw_life.xml", cat: null },
  { name: "세계일보 문화", url: "https://www.segye.com/Articles/RSSList/segye_culture.xml", cat: null },
];
const AUTO: Record<string, RegExp> = {
  FASHION: /패션|뷰티|의류|디자이너|컬렉션|런웨이|명품|화장품|코스메틱|스타일링|헤어|fashion/gi,
  LIFESTYLE: /라이프스타일|인테리어|여행|카페|맛집|레스토랑|웨니스|요리|음식|레시피|캠핑|리빙|호텔|핸스페이스|장보기|다이어트|수면|취미|레저|위크엔드|반려|육아|lifestyle/gi,
};
const BLOCK = /대통령|국회|검찰|탄핵|선거|정당|재판|구속|기소|전쟁|북한|화재|사망/;

function classifyAuto(text: string): string | null {
  if (BLOCK.test(text)) return null;
  let best: string | null = null, bestN = 0;
  for (const [cat, re] of Object.entries(AUTO)) {
    const n = (text.match(re) ?? []).length;
    if (n > bestN) { best = cat; bestN = n; }
  }
  return best;
}

/* ---------------- 유틸 ---------------- */
const ENT: Record<string, string> = { "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&apos;": "'", "&#39;": "'", "&nbsp;": " " };
const decode = (s: string) =>
  s.replace(/&(quot|amp|lt|gt|apos|nbsp|#39);/g, (m) => ENT[m]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const clean = (s: string) => decode((s || "").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const domainOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

async function getText(url: string, ms = 8000): Promise<{ text: string; finalUrl: string } | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "NEWSROOM-bot/0.1 (RSS + page meta only)", "Accept": "*/*" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null;
    const buf = new Uint8Array((await r.arrayBuffer()).slice(0, 1_500_000));
    const head = new TextDecoder("latin1").decode(buf.slice(0, 3000));
    let charset = /charset=([\w-]+)/i.exec(r.headers.get("content-type") ?? "")?.[1] ?? /(?:charset|encoding)=["']?([\w-]+)/i.exec(head)?.[1] ?? "utf-8";
    let text: string;
    try { text = new TextDecoder(charset.toLowerCase()).decode(buf); } catch { text = new TextDecoder("utf-8").decode(buf); }
    return { text, finalUrl: r.url || url };
  } catch { return null; }
}

function metaContent(html: string, keys: string[]): string {
  for (const k of keys) {
    const tag = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, "i").exec(html)?.[0];
    if (!tag) continue;
    const c = /content="([^"]*)"/i.exec(tag) ?? /content='([^']*)'/i.exec(tag);
    if (c && c[1].trim()) return decode(c[1].trim());
  }
  return "";
}
function httpsUrl(raw: string, base: string): string | null {
  try {
    const u = new URL(decode(raw), base);
    if (u.protocol === "http:") u.protocol = "https:";
    return u.protocol === "https:" ? u.toString().slice(0, 1000) : null;
  } catch { return null; }
}
async function fetchMeta(url: string): Promise<{ description: string; image: string | null }> {
  const res = await getText(url, 6000);
  if (!res) return { description: "", image: null };
  const html = res.text.slice(0, 300_000);
  const d = clean(metaContent(html, ["og:description", "description"]));
  const raw = metaContent(html, ["og:image", "og:image:url", "twitter:image"]);
  return { description: d.length >= 15 ? d.slice(0, 300) : "", image: raw ? httpsUrl(raw, res.finalUrl) : null };
}
async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const x = items[i++]; await fn(x); }
  }));
}

/* ---------------- RSS 파서 (너그러운 정규식 방식) ---------------- */
type Item = { title: string; link: string; date: string; desc: string; image: string | null };
function parseRss(xml: string, base: string): Item[] {
  const out: Item[] = [];
  for (const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)) {
    const b = m[0];
    const tag = (t: string) => {
      const r = new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i").exec(b);
      return r ? r[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim() : "";
    };
    const title = clean(tag("title"));
    let link = clean(tag("link")) || (/<link[^>]+href=["']([^"']+)/i.exec(b)?.[1] ?? "");
    if (!title || !link) continue;
    const rawDesc = tag("description") || tag("summary") || tag("content:encoded");
    const imgRaw = /<(?:enclosure|media:content|media:thumbnail)[^>]+url=["']([^"']+)/i.exec(b)?.[1]
      ?? /<img[^>]+src=["']([^"']+)/i.exec(decode(rawDesc))?.[1] ?? null;
    const d = new Date(tag("pubDate") || tag("published") || tag("updated") || tag("dc:date"));
    out.push({
      title, link: httpsUrl(link, base) ?? link,
      date: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
      desc: clean(rawDesc).slice(0, 300),
      image: imgRaw ? httpsUrl(imgRaw, base) : null,
    });
  }
  return out;
}

/* ---------------- handler ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apikey = req.headers.get("apikey") ?? "";
  if (!apikey) return json({ error: "apikey 헤더가 필요합니다" }, 401);
  const probe = await fetch(`${url}/rest/v1/articles?select=id&limit=1`, { headers: { apikey, Authorization: `Bearer ${apikey}` } });
  if (!probe.ok) return json({ error: "유효하지 않은 키입니다" }, 401);

  const db = createClient(url, service, { auth: { persistSession: false } });

  const { data: last } = await db.from("articles").select("collected_at").order("collected_at", { ascending: false }).limit(1);
  if (last?.[0] && Date.now() - new Date(last[0].collected_at).getTime() < 30_000) {
    return json({ ok: true, skipped: true, message: "방금 수집했습니다. 30초 뒤 다시 시도하세요." });
  }

  // 1) 피드를 동시에 읽고 파싱
  const report: string[] = [];
  const cand: { it: Item; cat: string | null; feed: string }[] = [];
  await Promise.all(FEEDS.map(async (f) => {
    const res = await getText(f.url);
    if (!res) { report.push(`${f.name} 접속실패`); return; }
    const items = parseRss(res.text, res.finalUrl).slice(0, 20);
    report.push(`${f.name} ${items.length}건`);
    for (const it of items) cand.push({ it, cat: f.cat, feed: f.name });
  }));

  // 2) 중복 제거
  const seenU = new Set<string>(), seenT = new Set<string>();
  const uniq = cand.filter(({ it }) => {
    const u = it.link.toLowerCase(), t = it.title.toLowerCase();
    if (seenU.has(u) || seenT.has(t)) return false;
    seenU.add(u); seenT.add(t); return true;
  });

  // 3) 요약/사진이 빠진 기사는 원문 페이지 메타로 보완 후 카테고리 확정
  const now = new Date().toISOString();
  const rows: Row[] = [];
  await pool(uniq, 6, async ({ it, cat }) => {
    let desc = it.desc, image = it.image;
    if (desc.length < 15 || !image) {
      const m = await fetchMeta(it.link);
      if (desc.length < 15) desc = m.description;
      if (!image) image = m.image;
    }
    const category = cat ?? classifyAuto(`${it.title} ${desc}`);
    if (!category) return;
    rows.push({
      title: it.title, source_name: domainOf(it.link), source_url: it.link, published_at: it.date,
      category, description: desc, language: "ko", image_url: image, meta_checked_at: now,
    });
  });
  const dropped = uniq.length - rows.length;

  let inserted = 0;
  if (rows.length) {
    const { data, error } = await db.from("articles").upsert(rows, { onConflict: "source_url", ignoreDuplicates: true }).select("id");
    if (error) return json({ ok: false, error: error.message }, 500);
    inserted = data?.length ?? 0;
  }

  // 4) 아직 메타를 확인하지 않은 기존 기사 보강 (호출당 최대 10개)
  const { data: todo } = await db.from("articles").select("id, source_url, description").is("meta_checked_at", null).order("collected_at", { ascending: false }).limit(10);
  await pool(todo ?? [], 6, async (a) => {
    const m = await fetchMeta(a.source_url);
    const patch: Record<string, unknown> = { meta_checked_at: new Date().toISOString(), image_url: m.image };
    if (!a.description && m.description) patch.description = m.description;
    await db.from("articles").update(patch).eq("id", a.id);
  });

  const by: Record<string, number> = {};
  for (const r of rows) by[r.category] = (by[r.category] ?? 0) + 1;
  const withImg = rows.filter((r) => r.image_url).length;
  return json({
    ok: true, fetched: rows.length, inserted,
    message: `후보 ${uniq.length}건 → 주제 일치 ${rows.length}건(${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(", ") || "없음"} · 사진 ${withImg}) · 제외 ${dropped}건 · 새로 저장 ${inserted}건 · 피드: ${report.join(", ")}`,
  });
});
