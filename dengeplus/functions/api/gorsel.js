import { oturumAl, kaynakDogruMu, json } from "../../lib/guvenlik.js";

const IZINLI = { "image/jpeg": true, "image/png": true, "image/webp": true };
const AZAMI = 5 * 1024 * 1024; // 5 MB

export async function onRequestPost({ request, env }) {
  if (!(await oturumAl(request, env))) return json({ hata: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın." }, 401);
  if (!kaynakDogruMu(request)) return json({ hata: "Geçersiz istek." }, 403);
  let form;
  try { form = await request.formData(); } catch { return json({ hata: "Dosya okunamadı." }, 400); }
  const dosya = form.get("dosya");
  if (!dosya || typeof dosya === "string") return json({ hata: "Dosya seçilmedi." }, 400);
  if (!IZINLI[dosya.type]) return json({ hata: "Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz." }, 415);
  if (dosya.size > AZAMI) return json({ hata: "Dosya 5 MB'tan büyük olamaz." }, 413);

  const veri = await dosya.arrayBuffer();
  // Dosyanın gerçekten görsel olduğunu ilk baytlarından kontrol et
  const b = new Uint8Array(veri.slice(0, 12));
  const jpg = b[0] === 0xff && b[1] === 0xd8;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45;
  if (!(jpg || png || webp)) return json({ hata: "Dosya geçerli bir görsel değil." }, 415);
  const tur = jpg ? "image/jpeg" : png ? "image/png" : "image/webp";

  const id = crypto.randomUUID();
  await env.ICERIK.put("gorsel:" + id, veri, { metadata: { tur, tarih: new Date().toISOString() } });
  return json({ tamam: true, url: "/gorsel/" + id });
}
