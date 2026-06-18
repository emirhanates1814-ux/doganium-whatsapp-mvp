# Doganium WhatsApp Trafik Teklif Otomasyonu MVP

Doganium WhatsApp MVP, Ares Sigorta icin yerel Windows masaustu ortaminda calisan trafik sigortasi teklif otomasyonu prototipidir. Amac; teklif islerini almak veya elle olusturmak, yerelde saklamak, yetkili ofis/IP makinesinde Doganium otomasyonunu calistirmak, sonuc durumunu panelde izlemek ve ileride teklif ozetini WhatsApp uzerinden musteriye dondurmektir.

## Mevcut Durum

Bu proje local-first masaustu yazilimidir; bulut SaaS olarak tasarlanmamistir. Supabase, yerel masaustu is/panel akisi icin zorunlu degildir.

Tamamlanan ana parcalar:

- Next.js 16 yerel uygulama temeli.
- Electron masaustu shell.
- Doganium DevTools/CDP koprusu ve login inceleme akisi.
- `.data/` altinda varsayilan JSON is deposu.
- `/api/jobs` ve `/api/jobs/[id]/result` yerel store ile calisir.
- `worker/mock_doganium_worker.py` JSON store islerini mock sonuc ile tamamlayabilir.
- Dashboard yerel isleri okuyabilir, yeni trafik isi olusturabilir ve manuel teklif sonucu kaydedebilir.
- Tamamlanan is icin kopyalanabilir WhatsApp mesaj metni hazirlanabilir.
- Opsiyonel Prisma + SQLite store eklendi.
- `LOCAL_STORE_DRIVER=prisma` ile Prisma store is olusturma/listeleme yapabilir.

Henuz tamamlanmayan ana parcalar:

- Prisma store icin worker entegrasyonu.
- Gercek Doganium teklif otomasyonu.
- WhatsApp uzerinden uretim webhook akisi.
- EXE paketleme ve uretim sertlestirme.

## Ana Ozellikler

- Yerel trafik teklif isi olusturma.
- JSON dosya tabanli varsayilan job queue.
- Opsiyonel Prisma + SQLite job store.
- Mock worker ile offline test akisi.
- Dashboard uzerinden is durumlarini izleme.
- Doganium desktop/DevTools otomasyonu icin hazirlik.
- WhatsApp entegrasyonu icin yerel test ve gelecek webhook stratejisi.

## Yerel Gelistirme

Bagimlilikler zaten kurulu degilse proje paketlerini kurmak gerekir; bu belgede yeni paket kurulumu yapilmaz. Gelistirme komutlari PowerShell icindir.

Tip kontrol:

```powershell
npm.cmd run typecheck
```

Build:

```powershell
npm.cmd run build
```

Web dev server:

```powershell
npm.cmd run dev
```

Alternatif web script:

```powershell
npm.cmd run dev:web
```

Electron masaustu gelistirme:

```powershell
npm.cmd run desktop:dev
```

MVP masaustu akisini iki terminalle calistirmak icin:

```powershell
npm.cmd run dev
```

```powershell
npm.cmd run dev:electron
```

MVP karari: Doganium full automation, MFA bypass ve tam otomatik PDF alma Phase 2 kapsamindadir. MVP; local queue + mock/manuel quote result flow ile calisir.

## MVP Lokal Run Flow

1. Dev server'i baslatin:

```powershell
npm.cmd run dev
```

2. Electron penceresini acin:

```powershell
npm.cmd run dev:electron
```

3. Dashboard'da `MVP Test İşi Oluştur` aksiyonunu kullanin.

4. Mock worker'i calistirin:

```powershell
python .\worker\mock_doganium_worker.py
```

5. Dashboard'u yenileyin, olusan isi secin ve teklif sonucunu goruntuleyin.

Bu akis Doganium PDF otomasyonunun tamamlandigini iddia etmez; MFA/manual verification beklenen dis adimdir.

## Manuel MVP Trafik Teklif Akisi

Dashboard uzerinden gercek lokal MVP operasyonu:

1. `Yeni Trafik İşi` kartinda telefon, plaka, TCKN, belge seri no, dogum tarihi ve ham mesaj/not alanlarini doldurun.
2. `Yeni Trafik İşi Oluştur` ile isi yerel kuyruğa ekleyin.
3. Islem kuyrugundan isi secin.
4. `Manuel Teklif Ekle` bolumunde sigorta sirketi, prim tutari, para birimi, opsiyonel PDF/dosya yolu ve not girin.
5. `Kaydedince işi tamamlandı yap` seciliyse kayit sonrasi is `completed` olur.
6. Tamamlanan iste `WhatsApp Mesajı Hazırla` ile kopyalanabilir Turkce mesaj uretin.

WhatsApp gonderimi henuz yapilmaz; yalnizca operatorun kopyalayabilecegi metin hazirlanir.

## JSON Store Test Isi Olusturma

Once dev server acik olmalidir:

```powershell
npm.cmd run dev
```

Ardindan test isi olustur:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1"
```

Bu script `/api/jobs` endpoint'ine test payload gonderir ve varsayilan JSON store icin `.data/traffic-jobs.json` dosyasini kullanir.

## Mock Worker Calistirma

Bekleyen ilk JSON isi tamamlamak icin:

```powershell
python ".\worker\mock_doganium_worker.py"
```

Belirli bir job ID icin:

```powershell
python ".\worker\mock_doganium_worker.py" --job-id "<JOB_ID>"
```

Mock worker `.data/traffic-jobs.json` icindeki isi `running` yapar, mock teklif sonucunu `.data/traffic-results.json` dosyasina yazar ve isi `completed` durumuna alir.

## Prisma SQLite Baslatma

Yerel SQLite veritabanini hazirlamak icin:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-prisma-local-db.ps1"
```

Veritabani yolu:

```text
.data/doganium.sqlite
```

## Prisma Store ile Calisma

JSON store varsayilandir. Prisma store kullanmak icin ayni PowerShell oturumunda:

```powershell
$env:LOCAL_STORE_DRIVER = "prisma"
$env:DATABASE_URL = "file:../.data/doganium.sqlite"
npm.cmd run dev
```

Prisma test scripti:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prisma-traffic-job.ps1"
```

Not: Prisma ile is olusturma/listeleme hazirdir; mock worker henuz Prisma store uzerinden calisacak sekilde tamamlanmamistir.

## Dashboard Acma

Dev server calisirken:

```text
http://127.0.0.1:3000/dashboard
```

Electron masaustu ekrani:

```text
http://127.0.0.1:3000/desktop
```

## Onemli Klasorler

- `app/`: Next.js sayfalari ve API route'lari.
- `electron/`: Electron ana surec ve preload dosyalari.
- `lib/`: Store, parser, worker API ve yardimci moduller.
- `worker/`: Python mock ve Doganium otomasyon hazirlik kodlari.
- `prisma/`: Prisma schema ve migration dosyalari.
- `scripts/`: Yerel test, smoke ve baslatma scriptleri.
- `.data/`: Yerel job/result/SQLite verileri. Commit edilmez.
- `.logs/` veya `logs/`: Yerel loglar. Commit edilmez.
- `.desktop/`: Masaustu ayarlari. Commit edilmez.

## Guvenlik

`.env.local`, `.desktop/settings.json`, `.data/`, `.logs/` ve yerel SQLite veritabani commit edilmemelidir. TCKN, plaka, telefon, Doganium kimlik bilgileri ve teklif sonuclari kisisel/hassas veri sayilir. Doganium IP, MFA veya erisim kontrolleri atlatilmamalidir.

## Dokumanlar

- [Roadmap](docs/ROADMAP.md)
- [Mimari](docs/ARCHITECTURE.md)
- [Yerel Gelistirme](docs/LOCAL_DEVELOPMENT.md)
- [Doganium Otomasyonu](docs/DOGANIUM_AUTOMATION.md)
- [Job Queue](docs/JOB_QUEUE.md)
- [WhatsApp Stratejisi](docs/WHATSAPP_STRATEGY.md)
- [UI/UX Plani](docs/UI_UX_PLAN.md)
- [Prisma SQLite](docs/PRISMA_SQLITE.md)
- [Guvenlik Notlari](docs/SECURITY_NOTES.md)
- [Test Plani](docs/TESTING.md)
- [Changelog](docs/CHANGELOG.md)
