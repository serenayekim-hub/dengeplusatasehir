import { ayarlarTamamMi, esitMi, jetonUret, oturumCerezi, kaynakDogruMu, json, denemeEngelliMi, denemeKaydet, denemeSifirla } from "../../lib/guvenlik.js";

export async function onRequestPost({ request, env }) {
  if (!ayarlarTamamMi(env)) return json({ hata: "Yönetim paneli henüz yapılandırılmamış. Kurulum adımlarındaki şifre ayarlarını kontrol edin." }, 503);
  if (!kaynakDogruMu(request)) return json({ hata: "Geçersiz istek." }, 403);
  if (await denemeEngelliMi(request, env)) return json({ hata: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." }, 429);

  let govde;
  try { govde = await request.json(); } catch { return json({ hata: "Geçersiz istek." }, 400); }
  const kullanici = String(govde.kullanici || "");
  const sifre = String(govde.sifre || "");

  const [k, s] = await Promise.all([
    esitMi(kullanici, env.ADMIN_KULLANICI, env.OTURUM_ANAHTARI),
    esitMi(sifre, env.ADMIN_SIFRE, env.OTURUM_ANAHTARI),
  ]);
  if (!(k && s)) {
    await denemeKaydet(request, env);
    return json({ hata: "Kullanıcı adı veya şifre hatalı." }, 401);
  }
  await denemeSifirla(request, env);
  return json({ tamam: true }, 200, { "Set-Cookie": oturumCerezi(await jetonUret(kullanici, env)) });
}
