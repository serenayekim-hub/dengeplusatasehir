// İçeriği okuma, doğrulama ve sayfaya işleme
import { VARSAYILAN, TURLER } from "./sema.js";

export const ICERIK_ANAHTARI = "icerik";

export async function degerleriOku(env) {
  let kayitli = {};
  try {
    kayitli = (await env.ICERIK.get(ICERIK_ANAHTARI, "json")) || {};
  } catch {
    kayitli = {};
  }
  const sonuc = { ...VARSAYILAN };
  for (const [k, v] of Object.entries(kayitli)) if (k in VARSAYILAN && typeof v === "string") sonuc[k] = v;
  return sonuc;
}

// Bağlantılar: yalnızca güvenli adres türlerine izin ver
export function guvenliBaglanti(v) {
  const s = String(v || "").trim();
  if (/^(https?:\/\/|tel:|mailto:|#|\/(?!\/))/i.test(s) && !/[\s"'<>`]/.test(s)) return s;
  return null;
}
export function guvenliGorsel(v) {
  const s = String(v || "").trim();
  if (/^\/(images\/[\w\-.]+\.(jpg|jpeg|png|webp)|gorsel\/[a-f0-9-]{36})$/i.test(s)) return s;
  return null;
}

// Yönetim panelinden gelen değerleri doğrula; varsayılandan farklı olanları döndür
export function degerleriDogrula(gelen) {
  const kayit = {};
  const hatalar = [];
  if (!gelen || typeof gelen !== "object") return { kayit, hatalar: ["*"] };
  const eksik = Object.keys(VARSAYILAN).filter((k) => !(k in gelen));
  if (eksik.length) return { kayit, hatalar: eksik };
  for (const [k, ham] of Object.entries(gelen || {})) {
    if (!(k in VARSAYILAN)) continue;
    if (typeof ham !== "string") { hatalar.push(k); continue; }
    const tur = TURLER[k];
    let v = ham.replace(/\r\n/g, "\n");
    if (tur === "gorsel") v = guvenliGorsel(v);
    else if (tur === "baglanti") v = guvenliBaglanti(v);
    else if (tur === "whatsapp") v = /^\d{10,15}$/.test(v.replace(/\D/g, "")) ? v.replace(/\D/g, "") : null;
    else if (tur === "telefon") v = v.trim().length >= 7 && v.length <= 30 ? v.trim() : null;
    else v = v.length <= (tur === "uzun" || tur === "mesaj" ? 2000 : 300) ? v.trim() : null;
    if (v === null || v === "") { hatalar.push(k); continue; }
    if (v !== VARSAYILAN[k]) kayit[k] = v;
  }
  return { kayit, hatalar };
}

// Öznitelik değerlerinde tırnak işaretini güvenli karaktere çevir
function oznitelik(s) { return String(s).replace(/"/g, "\u201D").replace(/[<>]/g, ""); }

function kacis(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function telBaglantisi(tel) {
  let r = String(tel).replace(/[^\d+]/g, "");
  if (r.startsWith("+")) return "tel:" + r;
  if (r.startsWith("0")) r = "90" + r.slice(1);
  return "tel:+" + r;
}

// Statik sayfadaki data-i işaretli alanları güncel içerikle değiştir
export function sayfayiIsle(yanit, d) {
  const metin = { element(el) { const k = el.getAttribute("data-i"); if (k in d) el.setInnerContent(kacis(d[k]).replace(/\n/g, "<br>"), { html: true }); } };
  const src = { element(el) { const k = el.getAttribute("data-i-src"); const v = guvenliGorsel(d[k]); if (v) el.setAttribute("src", v); } };
  const href = { element(el) { const k = el.getAttribute("data-i-href"); const v = guvenliBaglanti(d[k]); if (v) el.setAttribute("href", v); } };
  const mesaj = { element(el) { const k = el.getAttribute("data-i-mesaj"); if (k in d) el.setAttribute("data-mesaj", oznitelik(d[k])); } };
  const icerik = { element(el) { const k = el.getAttribute("data-i-content"); if (k in d) el.setAttribute("content", oznitelik(d[k])); } };
  const arkaPlan = { element(el) { const k = el.getAttribute("data-i-bg"); const v = guvenliGorsel(d[k]); if (v) el.setAttribute("style", `--bg:url('${v}')`); } };
  const tel = { element(el) { el.setAttribute("href", telBaglantisi(d.telefon)); } };
  const wa = { element(el) { const k = el.getAttribute("data-i-wa"); if (k in d) el.setAttribute("data-wa", oznitelik(d[k])); } };
  return new HTMLRewriter()
    .on("[data-i]", metin)
    .on("[data-i-src]", src)
    .on("[data-i-href]", href)
    .on("[data-i-mesaj]", mesaj)
    .on("[data-i-content]", icerik)
    .on("[data-i-bg]", arkaPlan)
    .on("[data-i-tel]", tel)
    .on("[data-i-wa]", wa)
    .transform(yanit);
}
