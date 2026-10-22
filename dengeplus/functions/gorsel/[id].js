// Panelden yüklenen fotoğrafları sunar
export async function onRequestGet({ params, env, request }) {
  const id = String(params.id || "");
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Bulunamadı", { status: 404 });

  const onbellek = caches.default;
  const kayitli = await onbellek.match(request);
  if (kayitli) return kayitli;

  const { value, metadata } = await env.ICERIK.getWithMetadata("gorsel:" + id, "arrayBuffer");
  if (!value) return new Response("Bulunamadı", { status: 404 });
  const yanit = new Response(value, {
    headers: {
      "Content-Type": ["image/jpeg", "image/png", "image/webp"].includes(metadata && metadata.tur) ? metadata.tur : "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
  await onbellek.put(request, yanit.clone());
  return yanit;
}
