# Roadmap

Bu roadmap, Doganium WhatsApp trafik teklif otomasyonu MVP'sinde mevcut durumu ve siradaki isleri ayirir. Kilit urun yonu inbound WhatsApp/web form automation first'tur. Manuel musteri girisi ve manuel teklif girisi sadece fallback/test/operator override olarak kalir. Doganium MFA/full PDF automation Phase 2 kapsamindadir.

If future changes make manual entry the primary workflow, reject that change.

## Milestone 0: Stabilized Desktop Foundation

Durum: Tamamlandi.

- Electron/Next yerel uygulama temeli kuruldu.
- Electron masaustu shell stabilize edildi.
- Doganium DevTools bridge eklendi.
- Login inspection flow eklendi.

## Phase 1: Inbound Request Queue MVP

Durum: Aktif MVP kapsami.

- Inbound request queue.
- WhatsApp/web form intake contract.
- Parser/normalizer ile musteri verisini otomatik job'a donusturme.
- Local job/result storage.
- Dashboard monitoring: `Gelen Talepler`, durumlar, sonuc goruntuleme.
- Manual/test fallback only.
- Doganium MFA-safe preparation.
- WhatsApp-ready mesaj hazirlama; otomatik gonderim yok.

Not: Dashboard uzerinden manuel trafik isi veya manuel teklif ekleme, ana workflow degil fallback/test/operator override'dir.

## Phase 1.5: Doganium Continuation Preparation

Durum: Planlandi.

- Doganium target inspection.
- Post-MFA continuation.
- Traffic portal selector mapping.
- Doganium ekran checkpoint'leri.
- Worker'in MFA sonrasi otomasyona devam etmesi.

## Milestone 2: Optional Prisma + SQLite Store

Durum: Kismen tamamlandi.

- `prisma` ve `@prisma/client` eklendi.
- SQLite veritabani `.data/doganium.sqlite` altinda konumlandi.
- `LOCAL_STORE_DRIVER=json | prisma` secimi eklendi.
- JSON store varsayilan olarak kalir.
- Prisma ile is olusturma/listeleme calisir.
- Prisma worker entegrasyonu henuz tamamlanmadi.

## Milestone 3: Documentation and Roadmap

Durum: Bu dokuman seti ile tamamlandi.

- README hazirlandi.
- `docs/` klasoru altinda proje notlari toplandi.
- Mimari notlari yazildi.
- Test notlari yazildi.
- Guvenlik notlari yazildi.
- Changelog baslatildi.

## Milestone 4: Dashboard UI/UX

Durum: Planlandi.

- Operation center dashboard.
- Durum kartlari.
- Son isler tablosu.
- Job detail panel.
- Sonuc kartlari.
- Mock/local mode indikatorleri.

## Milestone 5: Job Details, Events, Logs

Durum: Planlandi.

- Job timeline.
- Worker event kayitlari.
- Hata takibi.
- Sonuc gecmisi.
- Prisma-backed logs/events.

## Milestone 6: Prisma Worker Integration

Durum: Planlandi.

- Mock worker Prisma store kullanabilir hale gelecek.
- Gercek Doganium worker Prisma store'dan is okuyacak.
- `running`, `completed`, `failed` durumlari SQLite'a yazilacak.
- Sonuclar SQLite'a yazilacak.

## Milestone 7: WhatsApp Strategy

Durum: Planlandi.

- Once yerel test modu.
- Meta webhook icin public HTTPS gereksinimi netlestirilecek.
- Cloudflare Tunnel, ngrok veya relay secenekleri degerlendirilecek.
- Client tarafinda secret tutulmayacak.

## Phase 2: Full Doganium Traffic/PDF Automation

Durum: Phase 2 / MVP sonrasi.

- Full Doganium traffic/PDF automation.
- EGM/Trafik/PDF sonuc toplama.
- Automatic WhatsApp send.
- Production relay/webhook deployment if needed.
- MFA/authenticator checkpoint sonrasi otomasyon devam edebilir hale gelecek.

## Milestone 9: Desktop EXE Packaging

Durum: Planlandi.

- Electron Builder veya benzeri paketleme.
- App data path karari.
- Log dosyalari.
- Ayarlar ekrani/dosyasi.
- Guncelleme stratejisi.

## Milestone 10: Production Hardening

Durum: Planlandi.

- Yedekleme.
- Hata kurtarma.
- Audit log.
- Hassas veri maskeleme.
- Operator is akisi.
