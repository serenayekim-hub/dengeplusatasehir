# Denge Plus+ sitesi ve yönetim paneli kurulumu

Bu klasör, Denge Plus+ sitesini ve sitedeki metin, fotoğraf ve bağlantıları
düzenleyebileceğiniz yönetim panelini içerir. Kurulum bir kez yapılır, yaklaşık
20 dakika sürer. Sonrasında tüm düzenlemeler tarayıcıdan, panel üzerinden yapılır.

Yönetim paneli adresi: **siteadresiniz.com/yonetim**

---

## Gerekenler

1. Ücretsiz bir Cloudflare hesabı (dash.cloudflare.com).
2. Bilgisayarınızda **Node.js**. nodejs.org adresinden "LTS" yazan sürümü indirip kurun.
3. Bu klasör (zip dosyasını açın, örneğin Masaüstüne).

Aşağıdaki komutlar **Terminal** (Mac) veya **PowerShell** (Windows) penceresine
yazılır. Her komutu yazıp Enter'a basın.

---

## 1. Klasöre girin

Terminali açıp klasörün bulunduğu yere gidin. Örneğin klasör Masaüstündeyse:

```
cd Desktop/dengeplus
```

## 2. Gerekli aracı yükleyin

```
npm install
```

## 3. Cloudflare hesabınıza bağlanın

```
npx wrangler login
```

Tarayıcı açılır, Cloudflare'de "Allow" deyin.

## 4. İçeriklerin saklanacağı depoyu oluşturun

```
npx wrangler kv namespace create ICERIK
```

Ekranda `id = "..."` şeklinde uzun bir kimlik çıkar. Bu kimliği kopyalayın,
klasördeki **wrangler.toml** dosyasını Not Defteri ile açın ve
`BURAYA_KV_KIMLIGINI_YAPISTIRIN` yazan yere yapıştırıp kaydedin.

## 5. Cloudflare'de projeyi oluşturun

```
npx wrangler pages project create dengeplus --production-branch main
```

Daha önce aynı isimle proje oluşturduysanız bu adımı atlayın.

## 6. Panel kullanıcı adı ve şifresini belirleyin

Her komuttan sonra sizden değer istenir; yazıp Enter'a basın. Yazarken ekranda
görünmeyebilir, bu normaldir.

```
npx wrangler pages secret put ADMIN_KULLANICI --project-name dengeplus
npx wrangler pages secret put ADMIN_SIFRE --project-name dengeplus
```

Şifre en az 12 karakter olsun; harf, rakam ve işaret içersin.

Ardından oturumları güvenceye alan gizli anahtarı oluşturun. Önce bu komutla
rastgele bir anahtar üretin:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıkan uzun metni kopyalayın ve şu komutla kaydedin:

```
npx wrangler pages secret put OTURUM_ANAHTARI --project-name dengeplus
```

## 7. Siteyi yayına alın

```
npm run yayinla
```

İşlem bitince ekranda `https://dengeplus.pages.dev` gibi bir adres görünür.
Site artık yayında. Panele girmek için adresin sonuna `/yonetim` ekleyin.

## 8. Alan adını bağlayın

Cloudflare panelinde **Workers & Pages → dengeplus → Custom domains** bölümünden
alan adınızı (ör. dengeplus.com) ekleyin.

---

## Panel nasıl kullanılır?

- `siteadresiniz.com/yonetim` adresine girip kullanıcı adı ve şifrenizle giriş yapın.
- Soldaki bölümlerden düzenlemek istediğiniz yeri seçin.
- Metinleri değiştirin ya da "Fotoğrafı değiştir" ile yeni fotoğraf yükleyin.
- Üstteki **Değişiklikleri kaydet** butonuna basın. Değişiklik anında sitede görünür.
- Bir alanı ilk haline döndürmek için alanın altındaki **Varsayılana dön**'e basın.

## Güvenlik notları

- Oturum 12 saat sonra kendiliğinden kapanır.
- 15 dakika içinde 5 hatalı giriş denemesinde o bağlantı 15 dakika engellenir.
- Şifreler Cloudflare'de şifreli olarak saklanır, bu klasörde yer almaz.
- Şifreyi değiştirmek için 6. adımdaki komutu tekrar çalıştırın, ardından
  `npm run yayinla` ile siteyi yeniden yayınlayın.
- Panel şifresini yalnızca güvendiğiniz kişilerle paylaşın.

## Tasarım değişikliği gerekirse

Sitenin tasarımında (renk, yerleşim, yeni bölüm) değişiklik yapıldığında güncel
dosyaları bu klasöre koyup yalnızca şu komutu çalıştırmanız yeterli:

```
npm run yayinla
```

Panelden yaptığınız metin ve fotoğraf değişiklikleri ayrı saklandığı için
yeniden yayınlamada kaybolmaz.

## Bilgisayarda deneme (isteğe bağlı)

`.dev.vars.ornek` dosyasını `.dev.vars` adıyla kopyalayın ve şunu çalıştırın:

```
npm run yerel
```

Site `http://localhost:8788` adresinde açılır. Buradaki değişiklikler yalnızca
bilgisayarınızda kalır, yayındaki siteyi etkilemez.

## İleride Meta Pixel eklenirse

Sitenin güvenlik ayarları yalnızca izin verilen kaynaklardan kod çalıştırır.
Meta Pixel eklenirken `public/_headers` dosyasındaki güvenlik kuralına
Facebook adreslerinin de eklenmesi gerekir; aksi halde Pixel çalışmaz.
