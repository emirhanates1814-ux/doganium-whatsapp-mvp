# Changelog

Bu dosya MVP icin onemli proje degisikliklerini ozetler. Tarihler repo gecmisindeki checkpoint ve mevcut calisma sirasina gore tutulur.

## 2026-06-18

### MVP Stabilizasyonu ve MFA Guvenli Doganium Hazirligi

- Dashboard MVP durumunu netlestirdi: local queue aktif, mock/manuel quote flow aktif, Doganium full automation sonraki faz.
- MFA/authenticator gerektiginde operatorun manuel dogrulama yapacagi belirtildi.
- Doganium Teknik Paneli login aksiyonu tam otomatik giris vaadi yerine Login/MFA kontrolu olarak netlestirildi.
- MVP checklist eklendi: is kuyrugu, sonuc goruntuleme, ayarlar, loglar, Doganium baglanti kontrolu ve EXE paketleme.
- Doganium tam otomatik PDF alma ve MFA full automation Phase 2 olarak ayrildi.

## 2026-06-14

### Dokumantasyon ve Roadmap

- README proje amaci, mevcut durum, kurulum ve test akisiyla guncellendi.
- Roadmap, mimari, yerel gelistirme, Doganium otomasyonu, job queue, WhatsApp stratejisi, UI/UX plani, Prisma SQLite, guvenlik ve test dokumanlari eklendi.
- Mevcut durum ile planlanan isler ayrildi.

### Optional Prisma SQLite Traffic Store

- Opsiyonel Prisma + SQLite store eklendi.
- SQLite veritabani `.data/doganium.sqlite` olarak konumlandi.
- `LOCAL_STORE_DRIVER=prisma` secimi eklendi.
- JSON store varsayilan kalmaya devam ediyor.
- Prisma ile is olusturma/listeleme calisir.
- Prisma worker entegrasyonu sonraki adim olarak duruyor.

### Local JSON Job Store and Mock Worker

- Yerel JSON job store eklendi.
- `/api/jobs` endpoint'i yerel store ile calisir hale geldi.
- `/api/jobs/[id]/result` endpoint'i yerel sonuc akisini destekler hale geldi.
- Mock Doganium worker, JSON store'daki pending isi tamamlayabilir hale geldi.
- Dashboard yerel isleri okuyabilir hale geldi.

### Doganium DevTools Login Inspection

- Doganium login inspection akisi eklendi.
- DevTools/CDP uzerinden pencere ve login durumu inceleme hazirlandi.
- Gercek Doganium otomasyonu yetkili IP/ofis erisimine bagli olarak bekliyor.

### Electron Preload IPC and Doganium DevTools Flow

- Electron preload IPC akisi guclendirildi.
- Doganium DevTools bridge icin desktop tarafindaki iletisim hazirlandi.
- Login ve pencere smoke kontrolleri icin scriptler eklendi.

### Electron Desktop Foundation Rebuild

- Electron masaustu temeli yeniden duzenlendi.
- Next.js local app ile Electron shell birlikte calisacak hale getirildi.
- Masaustu gelistirme akisi stabilize edildi.
