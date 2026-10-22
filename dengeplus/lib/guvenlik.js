// Oturum, giriş ve istek güvenliği yardımcıları
const enc = new TextEncoder();
const OTURUM_SURESI = 12 * 60 * 60; // 12 saat (saniye)
const CEREZ = "dp_oturum";

function b64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlCoz(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function hmacAnahtar(gizli) {
  return crypto.subtle.importKey("raw", enc.encode(gizli), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// Uzunluğa ve içeriğe göre zaman sızdırmayan karşılaştırma
export async function esitMi(a, b, gizli) {
  const k = await hmacAnahtar(gizli);
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign("HMAC", k, enc.encode(String(a))),
    crypto.subtle.sign("HMAC", k, enc.encode(String(b))),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let fark = 0;
  for (let i = 0; i < x.length; i++) fark |= x[i] ^ y[i];
  return fark === 0;
}

export function ayarlarTamamMi(env) {
  return Boolean(env.ADMIN_KULLANICI && env.ADMIN_SIFRE && env.OTURUM_ANAHTARI && env.OTURUM_ANAHTARI.length >= 32 && env.ICERIK);
}

// Şifre ya da kullanıcı adı değiştiğinde eski oturumların hepsi geçersiz kalır
function imzaAnahtari(env) {
  return env.OTURUM_ANAHTARI + "|" + env.ADMIN_KULLANICI + "|" + env.ADMIN_SIFRE;
}

export async function jetonUret(kullanici, env) {
  const veri = b64url(enc.encode(JSON.stringify({ u: kullanici, exp: Math.floor(Date.now() / 1000) + OTURUM_SURESI })));
  const imza = await crypto.subtle.sign("HMAC", await hmacAnahtar(imzaAnahtari(env)), enc.encode(veri));
  return veri + "." + b64url(imza);
}

async function jetonDogrula(jeton, env) {
  if (!jeton || !jeton.includes(".")) return null;
  const [veri, imza] = jeton.split(".");
  try {
    const gecerli = await crypto.subtle.verify("HMAC", await hmacAnahtar(imzaAnahtari(env)), b64urlCoz(imza), enc.encode(veri));
    if (!gecerli) return null;
    const icerik = JSON.parse(new TextDecoder().decode(b64urlCoz(veri)));
    if (!icerik.exp || icerik.exp < Math.floor(Date.now() / 1000)) return null;
    if (icerik.u !== env.ADMIN_KULLANICI) return null;
    return icerik;
  } catch {
    return null;
  }
}

export function cerezOku(request, ad = CEREZ) {
  const satir = request.headers.get("Cookie") || "";
  for (const parca of satir.split(";")) {
    const [k, ...v] = parca.trim().split("=");
    if (k === ad) return v.join("=");
  }
  return null;
}

export function oturumCerezi(jeton) {
  return `${CEREZ}=${jeton}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${OTURUM_SURESI}`;
}
export function oturumSilCerezi() {
  return `${CEREZ}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function oturumAl(request, env) {
  if (!ayarlarTamamMi(env)) return null;
  return jetonDogrula(cerezOku(request), env);
}

// Değişiklik yapan isteklerin aynı siteden geldiğini doğrula
export function kaynakDogruMu(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

export function json(veri, durum = 200, ekBasliklar = {}) {
  return new Response(JSON.stringify(veri), {
    status: durum,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...ekBasliklar },
  });
}

// Başarısız giriş denemelerini IP başına sınırla (15 dakikada 5 deneme)
const DENEME_SINIRI = 5;
const DENEME_SURESI = 15 * 60;
function ipAl(request) {
  return request.headers.get("CF-Connecting-IP") || "bilinmiyor";
}
export async function denemeEngelliMi(request, env) {
  const n = parseInt((await env.ICERIK.get("deneme:" + ipAl(request))) || "0", 10);
  return n >= DENEME_SINIRI;
}
export async function denemeKaydet(request, env) {
  const anahtar = "deneme:" + ipAl(request);
  const n = parseInt((await env.ICERIK.get(anahtar)) || "0", 10);
  await env.ICERIK.put(anahtar, String(n + 1), { expirationTtl: DENEME_SURESI });
}
export async function denemeSifirla(request, env) {
  await env.ICERIK.delete("deneme:" + ipAl(request));
}
