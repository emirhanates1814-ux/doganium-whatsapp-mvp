# Architecture

## Web Dashboard

`app/page.tsx`, son 50 trafik teklif talebini listeler. Auth olmayan MVP aşamasında veri okuma server-side admin helper üzerinden yapılır; service role key browser'a taşınmaz.

## API Routes

- `GET/POST /api/whatsapp/webhook`: Meta doğrulama ve gelen mesaj işleme.
- `GET /api/jobs`: Worker için sıradaki işi verir.
- `POST/PATCH /api/jobs`: Worker sonucunu kaydeder.
- `POST /api/messages`: Hazır teklifi müşteriye WhatsApp üzerinden gönderir.

## Supabase

Tablolar:

- `traffic_quote_requests`
- `traffic_quote_results`
- `whatsapp_messages`

RLS açık kalır. MVP için server route'ları service role ile çalışır.

## Worker

Python worker `worker/main.py` içinde sonsuz döngüyle iş çeker. `mock` modunda sahte teklif üretir. `pywinauto` modu selectorlar hazır olana kadar güvenli iskelet olarak kalır.

## Doganium Adapter

`MockDoganiumAdapter` uçtan uca test içindir. `PyWinAutoDoganiumAdapter` ileride Doganium login, EGM sorgu, trafik sorgu, rapor ve PDF indirme adımlarını taşıyacak.

## WhatsApp Cloud API

Webhook gelen mesajları alır. Eksik bilgi varsa cevap göndermeye çalışır. Phone Number ID veya token eksikse webhook crash olmaz; gönderim logu `send_failed` olabilir.

## Data Flow

```txt
Customer WhatsApp
  -> Meta Webhook
  -> /api/whatsapp/webhook
  -> traffic_quote_requests + whatsapp_messages
  -> Python worker /api/jobs
  -> Doganium adapter mock/pywinauto
  -> traffic_quote_results
  -> dashboard
  -> /api/messages
  -> WhatsApp Cloud API
  -> customer
```
