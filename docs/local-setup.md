# Local Setup

## Web

```powershell
npm install
Copy-Item .env.example .env.local
notepad .env.local
npm run typecheck
npm run build
npm run dev
```

Dashboard varsayılan olarak `http://localhost:3000` adresindedir.

## Supabase

Supabase SQL Editor içinde:

```powershell
Get-Content database\schema.sql
```

çıktısını çalıştırın veya dosyayı SQL Editor'a yapıştırın.

## Worker

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
.\scripts\setup-worker.ps1
cd worker
python main.py
```

`setup-worker.ps1`, `.env.local` içindeki `WORKER_API_KEY` değerini `worker/settings.json` içine yazar.

## Test Request

```powershell
.\scripts\create-test-request.ps1
```

Worker çalışıyorsa talebi alır ve mock sonucu yazar.
