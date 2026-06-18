# Roadmap

Bu roadmap, Doganium WhatsApp trafik teklif otomasyonu MVP'sinde mevcut durumu ve siradaki isleri ayirir. MVP odagi yerel Windows masaustu uygulamasi, yerel job queue, mock/manuel sonuc akisi, Doganium baglanti kontrolu ve operator panelidir. Doganium MFA/full automation Phase 2 kapsamindadir.

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
- Local queue aktif.
- Mock/manuel quote flow aktif.
- Dashboard uzerinden yeni trafik isi olusturma aktif.
- Manuel teklif ekleme, result store'a kaydetme ve isi tamamlandi yapma aktif.
- Tamamlanan is icin kopyalanabilir WhatsApp mesaj hazirlama aktif.
- MFA/manual verification beklenen dis adim olarak kabul edildi.
- Doganium full automation MVP blocker degil; sonraki faz.

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

## Milestone 8: Phase 2 - Real Doganium Worker and MFA Automation

Durum: Phase 2 / MVP sonrasi.

- Ofis/IP erisimi gerekiyor.
- Yerel queue'dan is calistirilacak.
- MFA/authenticator checkpoint akisi tam otomasyona tasinacak.
- EGM/Trafik/PDF otomasyonu tamamlanacak.
- Tam otomatik PDF alma MVP kapsami disinda tutuldu.

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
