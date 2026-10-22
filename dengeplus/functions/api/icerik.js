import { oturumAl, kaynakDogruMu, json } from "../../lib/guvenlik.js";
import { SEMA } from "../../lib/sema.js";
import { degerleriOku, degerleriDogrula, ICERIK_ANAHTARI } from "../../lib/icerik.js";

export async function onRequestGet({ request, env }) {
  if (!(await oturumAl(request, env))) return json({ hata: "Oturum açmanız gerekiyor." }, 401);
  return json({ sema: SEMA, degerler: await degerleriOku(env) });
}

export async function onRequestPut({ request, env }) {
  if (!(await oturumAl(request, env))) return json({ hata: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın." }, 401);
  if (!kaynakDogruMu(request)) return json({ hata: "Geçersiz istek." }, 403);
  let govde;
  try { govde = await request.json(); } catch { return json({ hata: "Geçersiz istek." }, 400); }
  const { kayit, hatalar } = degerleriDogrula(govde.degerler);
  if (hatalar.length) return json({ hata: "Bazı alanlar boş ya da geçersiz.", alanlar: hatalar }, 422);
  await env.ICERIK.put(ICERIK_ANAHTARI, JSON.stringify(kayit));
  return json({ tamam: true, degistirilen: Object.keys(kayit).length });
}
