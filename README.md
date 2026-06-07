# Doganium WhatsApp MVP

WhatsApp üzerinden gelen trafik sigortası bilgilerini alıp Supabase'e kaydeden, Doganium worker kuyruğuna aktaran ve teklif sonucu hazır olduğunda müşteriye güvenli WhatsApp özeti gönderen MVP altyapısı.

## Mimari

- Next.js dashboard: `app/page.tsx`
- API routes: WhatsApp webhook, worker jobs, teklif mesajı gönderimi
- Supabase PostgreSQL: talepler, sonuçlar, WhatsApp mesaj logları
- Python worker: mock veya ileride PyWinAuto Doganium adapter
- WhatsApp Cloud API: test numarası ve Phone Number ID ile mesaj alışverişi

Dashboard verisi auth olmayan MVP aşamasında server-side admin client ile okunur. Service role key client component içine girmez.

## Kurulum

```powershell
npm install
Copy-Item .env.example .env.local
```

`.env.local` içine şu değerleri doldurun:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

WORKER_API_KEY=

WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=v21.0

APP_BASE_URL=http://localhost:3000
```

`.env.local` Git'e eklenmemelidir.

## Supabase

`database/schema.sql` dosyasını Supabase SQL Editor içinde çalıştırın. Bu dosya:

- `traffic_quote_requests`
- `traffic_quote_results`
- `whatsapp_messages`
- gerekli indexler
- service role RLS policy'leri

oluşturur.

## Dashboard

```powershell
npm run dev
```

Dashboard: `http://localhost:3000`

## Desktop MVP Kullanımı

Windows üzerinde tek launcher ile Next.js dashboard ve worker EXE birlikte başlatılır. İlk çalıştırmadan önce worker EXE build edilmelidir.

```powershell
.\scripts\build-worker-exe.ps1
.\scripts\start-desktop.ps1
```

Durum kontrolü:

```powershell
.\scripts\desktop-status.ps1
```

Çalışan launcher süreçlerini durdurma:

```powershell
.\scripts\stop-desktop.ps1
```

`start-desktop.ps1`, `worker/dist/DoganiumWorker.exe` yoksa durur ve önce EXE build etmenizi ister. Launcher `.desktop/desktop-pids.json` içinde PID bilgilerini, `logs/` ve `worker/logs/` altında süreç loglarını tutar. Bu dosyalar Git'e eklenmez.

## Worker Mock Geliştirme

EXE yerine doğrudan Python ile geliştirme/test için:

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

İlk aşamada `mode` değeri `mock` kalmalıdır.

## Doganium UI Inspect

Gerçek Doganium otomasyonuna geçmeden önce açık pencere başlıklarını ve UI Automation tree çıktısını alın.

Pencereleri listeleme:

```powershell
.\scripts\inspect-doganium.ps1
```

Başlığa göre Doganium penceresini dump etme:

```powershell
.\scripts\inspect-doganium.ps1 -Title "Doganium"
```

Tüm görünür top-level pencereleri dump etme:

```powershell
.\scripts\inspect-doganium.ps1 -DumpAll
```

Çıktı console'a basılır ve `worker/inspect-output/doganium-ui-tree.txt` dosyasına yazılır. Password alanlarında value dump edilmez.

## Coordinate Fallback

Doganium ekranı CefSharp içinde çalıştığı için ilk gerçek otomasyon aşamasında coordinate/keyboard fallback kullanılacak. Doganium penceresi her smoke test ve worker çalışmasında `100,100` konumuna, `1200x750` boyutuna alınır. Koordinatlar bu sabit pencere yerleşimine göre ölçülür.

Yönetici yetkisi zorunludur; VS Code veya PowerShell yönetici olarak çalışmalıdır.

Pencere smoke testi:

```powershell
.\scripts\smoke-doganium-window.ps1
```

Mouse koordinat ölçümü:

```powershell
.\scripts\coordinate-probe.ps1
```

Probe çıktısında `screenX`, `screenY`, `relativeX`, `relativeY` görünür. Login alanı, şifre alanı ve giriş butonu koordinatları `relativeX/relativeY` değerleriyle çıkarılmalıdır.

Login smoke testi:

```powershell
.\scripts\login-doganium-smoke.ps1
```

## Test Talebi

```powershell
.\scripts\create-test-request.ps1
```

Ardından worker çalışıyorsa mock teklif sonucu üretip talebi `parsed` durumuna taşır.

## WhatsApp Test

```powershell
.\scripts\test-whatsapp-send.ps1 -To "905xxxxxxxxx" -Message "Doganium WhatsApp MVP test mesajı"
```

Phone Number ID veya access token boşsa script açıklayıcı hata verir.

## Kontrol Komutları

```powershell
npm run typecheck
npm run build
npm run check
```

Python syntax kontrolü:

```powershell
cd worker
python -m py_compile main.py api_client.py doganium_adapter.py models.py config.py
```

## Güvenlik Notları

- `.env.local`, `worker/settings.json`, service role key, WhatsApp token ve worker API key commit edilmez.
- `SUPABASE_SERVICE_ROLE_KEY` sadece server-side dosyalarda kullanılır.
- `NEXT_PUBLIC_*` sadece public/publishable değerler içindir.
- TCKN, belge seri no ve doğum tarihi UI'da maskeli gösterilmelidir.
- Kart bilgisi WhatsApp üzerinden istenmez.
- Doganium kullanıcı adı ve şifresi yalnızca `worker/settings.json` içinde tutulur.
