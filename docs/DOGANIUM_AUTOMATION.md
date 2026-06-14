# Doganium Otomasyonu

Doganium otomasyonu, yerel Windows makinede calisan Doganium uygulamasini veya Doganium oturumunu DevTools/CDP uzerinden inceleme ve ileride teklif akisini otomatiklestirme hedefiyle hazirlanmistir.

## EXE Path Konsepti

Doganium uygulamasi makineye kurulu bir EXE olarak dusunulur. Nihai kurulumda bu path operator ayarlarindan veya `.desktop/settings.json` gibi yerel, commit edilmeyen bir ayar dosyasindan okunmalidir.

Bu dokuman fake path veya credential icermez. Gercek path ve kimlik bilgileri repoya yazilmaz.

## DevTools Portu

Hazirlik akisi DevTools/CDP icin `9222` portunu hedefler.

```text
127.0.0.1:9222
```

Bu port sadece yerel makinede otomasyon ve login inspection icin kullanilmalidir.

## Login Inspection Durumu

Eklenen akis, Doganium penceresi ve login durumunu incelemek icindir. Bu kisim gercek teklif otomasyonunun tamamlandigi anlamina gelmez.

Mevcut hedef:

- Doganium penceresine ulasilabiliyor mu?
- DevTools baglantisi acik mi?
- Login sayfasi veya oturum durumu gorulebiliyor mu?
- MFA/manual checkpoint var mi?

## IP Kisitlamasi

Doganium gercek login/otomasyon akisi, yetkili IP veya ofis erisimi olmadan tamamlanamaz. Bu, teknik bir eksik degil; sistemin guvenlik kosuludur.

## Izinli Secenekler

- Yetkili ofis makinesinde calismak.
- Doganium tarafindan onayli statik IP kullanmak.
- Doganium tarafindan onayli VPN/cozum kullanmak.

## Yasak Yaklasimlar

- IP kontrolunu atlatmaya calismak.
- MFA veya manuel onay adimlarini bypass etmek.
- Doganium credential'larini repoya, client koduna veya loglara yazmak.
- Yetkisiz otomasyon denemeleri yapmak.

## Siradaki Isler

- Yetkili ortamda login inspection tekrar calistirilacak.
- MFA/manual checkpoint davranisi kaydedilecek.
- Teklif akisi adimlari kontrollu sekilde haritalanacak.
- Worker, job queue'dan is alacak sekilde gercek otomasyona baglanacak.
