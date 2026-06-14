# WhatsApp Stratejisi

WhatsApp entegrasyonunda hedef, teklif isi olusturmak ve tamamlanan teklif ozetini musteriye guvenli sekilde dondurmektir. MVP'nin core akisi yerel masaustu uygulamasidir.

## Local EXE ve Meta Webhook Siniri

Meta WhatsApp Cloud API webhook'lari public HTTPS endpoint ister. Yerel Windows EXE dogrudan internete acik, sertifikali ve stabil public HTTPS endpoint saglamaz.

Bu nedenle yerel EXE tek basina Meta webhook callback alamaz. Uretim akisi icin ya guvenli bir tunel ya da kucuk bir relay servis gerekir.

## Yerel Mock/Test Modu

Bugunku gelistirme icin onerilen yol:

- WhatsApp mesajini manuel/test payload olarak `/api/jobs` endpoint'ine gondermek.
- JSON veya Prisma store'da isi olusturmak.
- Mock worker ile sonucu tamamlamak.
- Dashboard uzerinden sonucu dogrulamak.

Bu akis Meta webhook gerektirmez.

## Gelecek Secenekler

### Cloudflare Tunnel

Yerel uygulamaya public HTTPS adresi saglayabilir. Kurumsal guvenlik, erisim kontrolu ve loglama netlestirilmelidir.

### ngrok

Hizli test icin uygundur. Kalici uretim kullanimi icin hesap, domain, guvenlik ve maliyet degerlendirilmelidir.

### Kucuk Relay Server

Public HTTPS endpoint relay sunucuda olur. Relay, gelen webhook'u dogrular ve yerel uygulamaya guvenli kanal uzerinden aktarir.

### WhatsApp Cloud API Callback

Meta tarafindaki callback URL public HTTPS olmali, verify token ve imza dogrulama uygulanmalidir.

## Guvenlik Notlari

- WhatsApp token'lari client koduna yazilmaz.
- Secret'lar `.env.local` veya guvenli yerel ayar mekanizmasinda tutulur.
- Webhook imzalari dogrulanmadan is olusturulmaz.
- TCKN, telefon, plaka ve teklif bilgileri loglarda maskelenir.
- Relay kullanilirsa sadece gerekli alanlar tasinir.
