# Yerel Gelistirme

Bu dokuman PowerShell komutlariyla yerel gelistirme akislarini ozetler. Komutlar proje kokunden calistirilmalidir.

## Tip Kontrol

```powershell
npm.cmd run typecheck
```

## Build

```powershell
npm.cmd run build
```

## Dev Server

Varsayilan:

```powershell
npm.cmd run dev
```

Alternatif web script:

```powershell
npm.cmd run dev:web
```

Electron ile:

```powershell
npm.cmd run desktop:dev
```

## JSON Store Test Isi

Dev server calisirken:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1"
```

Farkli port kullaniliyorsa:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1" -ApiBaseUrl "http://127.0.0.1:3001"
```

## Mock Worker

Bekleyen ilk JSON isi tamamlamak icin:

```powershell
python ".\worker\mock_doganium_worker.py"
```

Belirli bir is icin:

```powershell
python ".\worker\mock_doganium_worker.py" --job-id "<JOB_ID>"
```

## Prisma Local DB Baslatma

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-prisma-local-db.ps1"
```

## Prisma Store ile Dev Server

```powershell
$env:LOCAL_STORE_DRIVER = "prisma"
$env:DATABASE_URL = "file:../.data/doganium.sqlite"
npm.cmd run dev
```

Prisma test scripti:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prisma-traffic-job.ps1"
```

## Dashboard

```text
http://127.0.0.1:3000/dashboard
```

## Port Cakismasi

Node sureclerini gormek icin:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

Gelistirme ortaminda port cakismasi varsa ve ilgili surecleri kapatmak istiyorsan:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process
```

Bu komut calisan tum Node sureclerini kapatir; baska projeler aciksa dikkatli kullanilmalidir.
