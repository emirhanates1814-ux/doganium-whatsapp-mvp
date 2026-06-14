# Roadmap

Bu roadmap, Doganium WhatsApp trafik teklif otomasyonu MVP'sinde mevcut durumu ve siradaki isleri ayirir. Odak yerel Windows masaustu uygulamasi, yerel job queue, Doganium otomasyonu ve operator panelidir.

## Milestone 0: Stabilized Desktop Foundation

Durum: Tamamlandi.

- Electron/Next yerel uygulama temeli kuruldu.
- Electron masaustu shell stabilize edildi.
- Doganium DevTools bridge eklendi.
- Login inspection flow eklendi.

## Milestone 1: Local Job Queue MVP

Durum: Tamamlandi.

- Yerel JSON store eklendi.
- `/api/jobs` calisir.
- `/api/jobs/[id]/result` calisir.
- Mock worker eklendi.
- Dashboard yerel isleri okuyabilir.

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

## Milestone 8: Real Doganium Worker

Durum: Doganium erisimi bekliyor.

- Ofis/IP erisimi gerekiyor.
- Yerel queue'dan is calistirilacak.
- MFA/manual checkpoint akisi ele alinacak.
- EGM/Trafik/PDF otomasyonu tamamlanacak.

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
