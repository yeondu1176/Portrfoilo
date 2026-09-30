const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

const safeText = (value, max) => String(value || "")
  .replace(/[<>]/g, c => c === "<" ? "&lt;" : "&gt;")
  .trim()
  .slice(0, max);

const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
};

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await response.json();
  return Boolean(result.success);
}

export async function onRequestGet({ env }) {
  return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY || "" });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (body.website) return json({ ok: true });

    const name = safeText(body.name, 40);
    const message = safeText(body.message, 500);
    if (!name || !message) return json({ error: "이름과 메시지를 입력해주세요." }, 400);
    if (!(await verifyTurnstile(request, env, body.turnstileToken))) {
      return json({ error: "스팸 방지 인증을 완료해주세요." }, 400);
    }

    const required = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH"];
    const missing = required.filter(key => !env[key]);
    if (missing.length) return json({ error: "서버 환경 변수가 설정되지 않았습니다.", missing }, 500);

    const createdAt = new Date().toISOString();
    const slug = crypto.randomUUID().slice(0, 8);
    const filename = `content/guestbook/${createdAt.replace(/[:.]/g, "-")}-${slug}.json`;
    const payload = JSON.stringify({ name, message, createdAt, approved: false }, null, 2);

    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${filename}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "portfolio-guestbook",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        message: `guestbook: add message from ${name}`,
        content: toBase64(payload),
        branch: env.GITHUB_BRANCH
      })
    });

    if (!gh.ok) return json({ error: "방명록 저장에 실패했습니다." }, 502);
    return json({ ok: true, message: "방명록이 전송되었습니다." }, 201);
  } catch {
    return json({ error: "요청을 처리하지 못했습니다." }, 500);
  }
}
