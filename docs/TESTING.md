# Test Plani

Bu dokuman MVP icin pratik test akislarini listeler. Komutlar PowerShell ile proje kokunden calistirilir.

## Tip Kontrol

```powershell
npm.cmd run typecheck
```

Beklenen sonuc:

```text
Hata olmadan tamamlanir.
```

## Build

```powershell
npm.cmd run build
```

Beklenen sonuc:

```text
Next.js production build hata olmadan tamamlanir.
```

## JSON Job Creation

Once dev server:

```powershell
npm.cmd run dev
```

Baska PowerShell oturumunda:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1"
```

Beklenen sonuc ornegi:

```json
{
  "ok": true,
  "data": {
    "id": "<job-id>",
    "status": "pending"
  }
}
```

Kontrol:

```powershell
Get-Content -Raw ".\.data\traffic-jobs.json"
```

## JSON Mock Worker

```powershell
python ".\worker\mock_doganium_worker.py"
```

Beklenen sonuc ornegi:

```json
{
  "ok": true,
  "jobId": "<job-id>",
  "status": "completed",
  "resultSaved": true
}
```

Kontrol:

```powershell
Get-Content -Raw ".\.data\traffic-results.json"
```

## Prisma DB Init

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-prisma-local-db.ps1"
```

Beklenen sonuc:

```text
.data/doganium.sqlite olusur veya guncellenir.
Prisma migration uygulanir.
```

## Prisma Job Creation/List Test

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prisma-traffic-job.ps1"
```

Beklenen sonuc:

```text
Prisma store ile test job olusturulur ve listelenir.
```

## Prisma Modunda API Testi

```powershell
$env:LOCAL_STORE_DRIVER = "prisma"
$env:DATABASE_URL = "file:../.data/doganium.sqlite"
npm.cmd run dev
```

Baska oturumda:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1"
```

Beklenen sonuc:

```text
Is SQLite store'a yazilir.
Dashboard is listesini gosterebilir.
```

Not: Mock worker henuz Prisma store ile entegre degildir.

## Dashboard Verification

Dev server acikken:

```text
http://127.0.0.1:3000/dashboard
```

Kontrol listesi:

- Son olusturulan is gorunuyor.
- JSON modunda mock worker sonrasi durum `completed` olarak gorunuyor.
- Sonuc paneli veya ilgili result bilgisi beklenen sekilde gorunuyor.
- Hata varsa hassas veri tam haliyle gorunmuyor.

## Doganium Automation Smoke

Doganium erisimi yetkili ortam gerektirir. Yetkili IP/ofis kosulu yoksa gercek login veya teklif otomasyonu testi beklenmez.

Mevcut smoke scriptleri sadece hazirlik ve inceleme icindir:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\inspect-doganium.ps1"
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\login-doganium-smoke.ps1"
```
