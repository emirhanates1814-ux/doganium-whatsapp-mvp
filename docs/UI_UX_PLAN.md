# UI/UX Plani

Hedef arayuz, Ares Sigorta operatorlerinin inbound WhatsApp ve web form taleplerini takip edebilecegi temiz ve pratik bir sigorta otomasyon dashboard'idir. Pazarlama sitesi degil, operasyon merkezi gibi davranmalidir.

MVP odagi local operation dashboard, inbound request queue, WhatsApp/web form intake contract, yerel is kuyrugu ve MFA guvenli Doganium hazirligidir. Doganium MFA/authenticator veya tam otomatik PDF alma MVP blocker degildir; bu alan Phase 2 kapsaminda ele alinacaktir.

Normal kullanim manuel musteri girisi degildir. Manuel form test/fallback/operator override olarak gosterilmeli ve ana workflow gibi sunulmamalidir.

If future changes make manual entry the primary workflow, reject that change.

## Ana Dashboard

Hedef:

- Bekleyen, calisan, tamamlanan ve hata alan isleri hizli gostermek.
- Son isleri taranabilir tabloyla sunmak.
- Mock/local/Prisma modunu operatorun net gormesini saglamak.
- Ana dil `Gelen Talepler` ve `Otomasyonu Baslat` olmalidir.
- Local queue aktif, inbound WhatsApp/web form akisi hedef, Doganium full automation sonraki faz bilgisini net gostermek.
- MFA/manual verification gerektiginde "Manuel dogrulama gerekli" mesajini acik gostermek.
- Manual form varsa ikincil kart olmali ve `Test/Fallback` olarak etiketlenmelidir.
- Doganium Teknik Paneli gunluk workflow olarak sunulmamalidir; setup/debug ekranidir.

## Status Card Plani

Kartlar:

- Bekleyen isler.
- Calisan isler.
- MFA/manual bekleyenler.
- Tamamlanan isler.
- Hatali isler.

Kartlar kisa, sayisal ve aksiyon odakli olmalidir.

## Jobs Table

Tablo kolonlari:

- Olusturma zamani.
- Musteri telefonu, maskeli.
- Plaka.
- Kaynak: manual, whatsapp, test.
- Durum.
- Son guncelleme.
- Kisa aksiyon.
- Ana aksiyon: `Otomasyonu Baslat`.
- Kaynak dili: WhatsApp, Web Form, Test/Fallback.

Tablo filtreleri:

- Durum.
- Kaynak.
- Tarih araligi.
- Plaka veya telefon arama.

## Job Detail Panel

Panelde gorunecekler:

- Job temel bilgileri.
- Maskeli TCKN ve telefon.
- Plaka ve belge bilgisi.
- Durum gecmisi.
- Sonuc varsa teklif kartlari.
- Hata varsa operator icin net hata mesaji.
- Doganium MFA checkpoint gerekiyorsa operatorun yalnizca MFA tamamlayacagi anlatilmalidir.
- Manual teklif girisi varsa fallback/operator override olarak ayrilmalidir.

## Result Cards

Teklif sonuc kartlari:

- En dusuk prim.
- En yuksek prim.
- Onerilen teklif.
- Sirket bazli teklif listesi.
- Para birimi ve tarih.

Tamamlanmamis islerde sonuc alani bos vaat gostermemeli; mevcut durumu soylemelidir.

## Automation Status Panel

Gosterilecek durumlar:

- Local JSON veya Prisma modu.
- Mock worker kullanimi.
- Doganium DevTools baglanti durumu.
- Login inspection sonucu.
- Yetkili IP/ofis erisimi notu.
- MFA gorulurse manuel dogrulama gerektigi.
- Tam otomatik PDF alma sonraki faz notu.

## Logs Screen

Planlanan log ekrani:

- Worker eventleri.
- Job status degisimleri.
- Hatalar.
- Retry denemeleri.
- Doganium checkpoint notlari.

Loglarda TCKN, credential ve token gibi hassas veriler maskelenmelidir.

## Settings Screen

Planlanan ayarlar:

- Store driver secimi.
- Doganium EXE path.
- DevTools portu.
- Worker modu: mock veya real.
- Log seviyesi.
- WhatsApp test ayarlari.

Secret alanlari client tarafinda duz metin olarak gosterilmemelidir.

## Manual/Fallback UI Rules

- Manual customer entry primary CTA olamaz.
- Manual quote entry primary product language olamaz.
- Manual alanlar `Test/Fallback` veya `Operator override` etiketi tasimalidir.
- Operasyon Paneli'nin ana dili inbound talepler ve otomasyon baslatma uzerine kurulmalidir.
- Doganium Teknik Paneli setup/debug olarak kalmalidir.

## Tasarim Yonu

- Temiz, yogun ama okunabilir operasyon paneli.
- Sigorta isi icin sakin renkler, net durum renkleri.
- Tabloda hizli tarama onceligi.
- Gereksiz hero, pazarlama metni ve dekoratif alan yok.
- Operatorun siradaki aksiyonu her ekranda net olmali.
