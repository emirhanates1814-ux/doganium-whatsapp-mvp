# UI/UX Plani

Hedef arayuz, Ares Sigorta operatorlerinin gunluk is takibi yapabilecegi temiz ve pratik bir sigorta otomasyon dashboard'idir. Pazarlama sitesi degil, operasyon merkezi gibi davranmalidir.

MVP odagi local operation dashboard, yerel is kuyrugu, mock/manuel sonuc akisi ve MFA guvenli Doganium hazirligidir. Doganium MFA/authenticator veya tam otomatik PDF alma MVP blocker degildir; bu alan Phase 2 kapsaminda ele alinacaktir.

## Ana Dashboard

Hedef:

- Bekleyen, calisan, tamamlanan ve hata alan isleri hizli gostermek.
- Son isleri taranabilir tabloyla sunmak.
- Mock/local/Prisma modunu operatorun net gormesini saglamak.
- Local queue aktif, mock/manuel quote flow aktif, Doganium full automation sonraki faz bilgisini net gostermek.
- MFA/manual verification gerektiginde "Manuel dogrulama gerekli" mesajini acik gostermek.

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

## Tasarim Yonu

- Temiz, yogun ama okunabilir operasyon paneli.
- Sigorta isi icin sakin renkler, net durum renkleri.
- Tabloda hizli tarama onceligi.
- Gereksiz hero, pazarlama metni ve dekoratif alan yok.
- Operatorun siradaki aksiyonu her ekranda net olmali.
