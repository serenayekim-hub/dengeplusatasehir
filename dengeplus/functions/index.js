// Ana sayfa: statik şablonu güncel içerikle doldurup gönderir
import { degerleriOku, sayfayiIsle } from "../lib/icerik.js";

export async function onRequestGet({ request, env }) {
  const yanit = await env.ASSETS.fetch(request);
  if (!yanit.ok || !(yanit.headers.get("Content-Type") || "").includes("text/html") || !env.ICERIK) return yanit;
  const degerler = await degerleriOku(env);
  const islenmis = sayfayiIsle(yanit, degerler);
  const basliklar = new Headers(islenmis.headers);
  basliklar.set("Cache-Control", "public, max-age=0, must-revalidate");
  basliklar.delete("ETag");
  return new Response(islenmis.body, { status: islenmis.status, headers: basliklar });
}
