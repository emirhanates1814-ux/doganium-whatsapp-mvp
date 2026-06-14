# Prisma SQLite

Prisma + SQLite, yerel desktop uygulamasinda JSON dosyalarinin sinirlarini asmadan daha duzenli veri modeli kurmak icin eklenmistir.

## Neden Yardimci Olur?

- Job, result ve event kayitlarini iliskili tutar.
- Dashboard sorgulari icin daha guclu temel saglar.
- Worker loglari, hata gecmisi ve audit trail icin uygundur.
- Tek dosyali SQLite yapisi local-first masaustu kurulumuna uyar.

## Mevcut Durum

- Opsiyonel Prisma store eklendi.
- SQLite veritabani `.data/doganium.sqlite` altinda kullanilir.
- JSON store varsayilan olarak kalir.
- `LOCAL_STORE_DRIVER=prisma` ile Prisma store aktif olur.
- Prisma ile is olusturma/listeleme calisir.
- Worker entegrasyonu henuz tamamlanmamistir.

## DB Baslatma

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-prisma-local-db.ps1"
```

## Prisma Modunda Calistirma

```powershell
$env:LOCAL_STORE_DRIVER = "prisma"
$env:DATABASE_URL = "file:../.data/doganium.sqlite"
npm.cmd run dev
```

## Prisma Testi

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prisma-traffic-job.ps1"
```

## Planlanan Sonraki Adim

Worker entegrasyonu Prisma store ile tamamlanacak:

- Mock worker Prisma store'dan pending is okuyacak.
- Is durumlari SQLite'a yazilacak.
- Sonuclar SQLite'a yazilacak.
- Event ve hata kayitlari SQLite'a eklenecek.
