# Mimari

Doganium WhatsApp MVP local-first mimariye sahiptir. Uygulama, Ares Sigorta ofisinde veya Doganium'a erisim yetkisi olan Windows makinede calismak uzere tasarlanir. Core akis icin Supabase zorunlu degildir.

Kilit mimari karar: Normal musteri bilgisi manuel girilmez. Canonical input sources WhatsApp messages ve Ares Sigorta website/lead form submissions'tir. Manuel form ve manuel teklif kaydi sadece fallback/test/operator override olarak kalir.

If future changes make manual entry the primary workflow, reject that change.

## Metin Akis Diyagrami

```text
WhatsApp webhook / Website lead form
  -> Inbound adapter
  -> Parser / normalizer
  -> Local traffic job store
       -> Varsayilan: .data/traffic-jobs.json
       -> Opsiyonel: .data/doganium.sqlite
  -> Operation dashboard
       -> Operator gelen talebi gorur
       -> Operator Otomasyonu Baslat aksiyonunu kullanir
  -> Doganium automation worker
       -> Doganium starts / target is inspected
       -> MFA checkpoint gerekirse operator sadece MFA tamamlar
       -> Otomasyon MFA sonrasi devam eder
  -> Quote/PDF result store
       -> JSON result veya SQLite result
  -> WhatsApp response generator
       -> Phase 1: kopyalanabilir mesaj
       -> Phase 2: automatic sender
```

## Architecture Flow

1. Inbound adapters
   - WhatsApp webhook.
   - Ares Sigorta website form / lead form.
2. Parser/normalizer
   - Telefon, plaka, TCKN, belge seri no, dogum tarihi ve ham mesaj alanlarini normalize eder.
3. Local traffic job store
   - Gelen talebi local traffic quote job olarak saklar.
4. Operation dashboard
   - Operatorun gunluk ana ekranidir.
   - Ana dil `Gelen Talepler` ve `Otomasyonu Baslat` olmalidir.
5. Doganium automation worker
   - Doganium'u baslatir/kullanir.
   - Phase 1.5/2'de post-MFA continuation ve traffic portal mapping ile genisler.
6. MFA checkpoint
   - Manuel security checkpoint'tir.
   - Urun yonunu manuel CRM'e cevirmemelidir.
7. Quote/PDF result store
   - Teklif/PDF sonuclarini kaydeder.
8. WhatsApp response generator/sender
   - Phase 1: mesaj hazirlar.
   - Phase 2: otomatik gonderir.

## Next.js Sorumluluklari

- Yerel web arayuzunu sunar.
- `/api/jobs` ile inbound adapter veya fallback/test akisindan gelen isi olusturur ve listeler.
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
- MFA gerekirse worker/operator akisi MFA checkpoint olarak durur; MFA sonrasi otomasyon devam etmelidir.

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
