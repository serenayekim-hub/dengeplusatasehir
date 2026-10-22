import { oturumSilCerezi, kaynakDogruMu, json } from "../../lib/guvenlik.js";

export async function onRequestPost({ request }) {
  if (!kaynakDogruMu(request)) return json({ hata: "Geçersiz istek." }, 403);
  return json({ tamam: true }, 200, { "Set-Cookie": oturumSilCerezi() });
}
