# Mimari

Doganium WhatsApp MVP local-first mimariye sahiptir. Uygulama, Ares Sigorta ofisinde veya Doganium'a erisim yetkisi olan Windows makinede calismak uzere tasarlanir. Core akis icin Supabase zorunlu degildir.

## Metin Akis Diyagrami

```text
Operator / WhatsApp test girdisi
  -> Next.js local API (/api/jobs)
  -> Yerel job store
       -> Varsayilan: .data/traffic-jobs.json
       -> Opsiyonel: .data/doganium.sqlite
  -> Worker
       -> Bugun: mock_doganium_worker.py
       -> Gelecek: gercek Doganium automation worker
  -> Sonuc store
       -> JSON result veya SQLite result
  -> Dashboard
  -> Gelecek: WhatsApp teklif ozeti
```

## Next.js Sorumluluklari

- Yerel web arayuzunu sunar.
- `/api/jobs` ile is olusturur ve listeler.
- `/api/jobs/[id]/result` ile is sonucunu okur/yazar.
- Dashboard icin yerel veriyi hazirlar.
- Store secimini `LOCAL_STORE_DRIVER` ile yapar.

## Electron Sorumluluklari

- Next.js uygulamasini masaustu EXE deneyimine tasir.
- Yerel desktop ayarlarini ve Doganium pencere/DevTools hazirliklarini yonetir.
- Gelecekte paketleme, log yolu ve operator ayarlari icin ana kabuk gorevini ustlenir.

## Python Worker Sorumluluklari

- Bugun mock worker, JSON store'daki bekleyen isi alir ve sahte teklif sonucu yazar.
- Doganium hazirlik scriptleri DevTools/CDP ile login ve pencere durumunu incelemek icindir.
- Gelecekte gercek worker, Doganium desktop/web akisini calistirip teklif sonuclarini store'a yazacaktir.

## JSON Store

Varsayilan storage katmanidir.

- Isler: `.data/traffic-jobs.json`
- Sonuclar: `.data/traffic-results.json`
- Avantaj: Basit, kurulumsuz, yerel test icin hizli.
- Sinir: Event/log iliskileri ve eszamanli islemler icin uzun vadede zayif kalir.

## Opsiyonel Prisma + SQLite

Prisma store, SQLite veritabanini `.data/doganium.sqlite` altinda kullanir. `LOCAL_STORE_DRIVER=prisma` ile aktif olur.

Mevcut durum:

- Is olusturma calisir.
- Is listeleme calisir.
- Result ve event modeli hazirlanmistir.
- Worker entegrasyonu henuz tamamlanmamistir.

## Gelecek Gercek Doganium Worker

Gercek worker su kosullara baglidir:

- Doganium'a yetkili IP/ofis makinesinden erisim.
- MFA veya manuel checkpoint akisi.
- Doganium sayfa/pencere otomasyonu.
- EGM/Trafik/PDF sonuc toplama.
- Hata, retry ve audit log stratejisi.
