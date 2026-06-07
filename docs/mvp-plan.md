# MVP Planı

## Hedef

WhatsApp'tan gelen trafik sigortası talebini sistemli şekilde almak, Doganium desktop uygulaması üzerinden otomatik sorgulatmak, PDF sonucunu işleyip müşteriye teklif özeti göndermek.

## İlk gerçek MVP

İlk sürüm tam otomatik değil, kontrollü otomasyon olmalıdır:

1. Müşteri WhatsApp'tan bilgileri gönderir.
2. Sistem bilgileri parse eder.
3. Eksik alan varsa otomatik mesaj döner.
4. Bilgiler tam ise kayıt `ready_for_worker` olur.
5. Worker işi alır.
6. İlk aşamada mock sonuç üretir.
7. Sonraki aşamada Doganium gerçek tıklama akışı bağlanır.
8. Teklif hazır olunca panelden WhatsApp mesajı gönderilir.

## Veri alanları

- TCKN
- Plaka
- Belge / Seri No
- Doğum tarihi
- Telefon numarası
- WhatsApp message id
- Durum
- Hata mesajı
- PDF URL
- En uygun şirket/fiyat
- En yüksek şirket/fiyat
- Önerilen şirket/fiyat

## Status akışı

```txt
missing_fields
ready_for_worker
running_doganium
pdf_downloaded
parsed
sent_to_customer
failed
manual_review
```

## Doganium RPA gerçek entegrasyon için gerekenler

- Doganium kurulu Windows cihaz
- Uygulama path'i
- Login ekranı selector bilgileri
- Menü/buton selector bilgileri
- Input selector bilgileri
- PDF indirme davranışı
- En az 3 örnek PDF
- Hata senaryoları: yanlış bilgi, EGM hata, PDF inmeme, sistem gecikmesi

## Production'a çıkmadan önce yapılacaklar

- Panel login
- Yetki sistemi
- Veri şifreleme
- Audit log
- Worker watchdog
- Retry policy
- Sentry/log sistemi
- Daily backup
- KVKK aydınlatma metni
- Ödeme linki entegrasyonu
