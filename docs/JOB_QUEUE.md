# Job Queue

Job queue, trafik teklif islerinin yerelde saklanmasi, worker tarafindan islenmesi ve dashboard'da izlenmesi icin kullanilir.

## Mevcut JSON Store

Varsayilan store JSON dosyalaridir:

```text
.data/traffic-jobs.json
.data/traffic-results.json
```

`.data/` commit edilmez. Bu dosyalar kisisel veri ve teklif sonucu icerebilir.

## Opsiyonel Prisma SQLite Store

Prisma store su veritabanini kullanir:

```text
.data/doganium.sqlite
```

Aktif etmek icin:

```powershell
$env:LOCAL_STORE_DRIVER = "prisma"
$env:DATABASE_URL = "file:../.data/doganium.sqlite"
npm.cmd run dev
```

Mevcut durumda Prisma ile is olusturma ve listeleme calisir. Worker entegrasyonu planlidir.

## Job Status Degerleri

- `pending`: Is bekliyor.
- `running`: Worker is uzerinde calisiyor.
- `waiting_mfa`: Manuel/MFA checkpoint bekleniyor.
- `completed`: Is tamamlandi.
- `failed`: Is hata ile bitti.
- `cancelled`: Is iptal edildi.

## Job Sekli

Temel job alanlari:

```json
{
  "id": "<uuid>",
  "customerPhone": "<masked-phone>",
  "customerName": "Opsiyonel",
  "tckn": "<masked-tckn>",
  "plate": "<plate>",
  "documentSerial": "<document-serial>",
  "birthDate": "<date>",
  "rawMessage": "Opsiyonel ham mesaj",
  "source": "manual | whatsapp | test",
  "status": "pending",
  "createdAt": "<iso-date>",
  "updatedAt": "<iso-date>"
}
```

## Result Sekli

Temel result alanlari:

```json
{
  "jobId": "<uuid>",
  "quotes": [
    {
      "company": "Sirket",
      "premium": 12345.67,
      "currency": "TRY",
      "description": "Aciklama"
    }
  ],
  "cheapestPremium": 12345.67,
  "highestPremium": 18000,
  "summary": "Teklif ozeti",
  "createdAt": "<iso-date>",
  "updatedAt": "<iso-date>"
}
```

## Mock Worker Davranisi

`worker/mock_doganium_worker.py` sadece JSON store ile calisir.

Akis:

1. Bekleyen ilk isi bulur veya verilen `--job-id` degerini kullanir.
2. Isi `running` yapar.
3. Mock teklif sonucunu `.data/traffic-results.json` dosyasina yazar.
4. Isi `completed` yapar.

Komut:

```powershell
python ".\worker\mock_doganium_worker.py"
```

## Gelecek Worker Entegrasyonu

Planlanan isler:

- Mock worker'in Prisma store okuyup yazabilmesi.
- Gercek Doganium worker'in JSON veya Prisma store secimine uymasi.
- Worker event ve error loglarinin SQLite'a yazilmasi.
- Result history ve retry bilgisinin dashboard'da gorunmesi.
