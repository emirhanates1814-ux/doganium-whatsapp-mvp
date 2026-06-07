# Codex Promptları

## Prompt 1 — Projeyi analiz et ve kurulum kontrolü yap

Bu repo Doganium + WhatsApp trafik teklif otomasyonu MVP projesidir. Next.js, TypeScript, Supabase ve Python worker kullanır. Önce dosya yapısını incele. README.md içindeki kurulumu kontrol et. TypeScript hatalarını, import sorunlarını ve eksik environment değişkenlerini tespit et. Gereksiz mimari değişiklik yapmadan sadece projeyi çalışır hale getirecek düzeltmeleri uygula.

## Prompt 2 — Dashboard'u geliştir

app/dashboard/page.tsx dosyasındaki dashboard'u daha profesyonel hale getir. Talepleri status'a göre filtreleyebileyim. "Tüm Talepler", "Worker Hazır", "Çalışıyor", "Teklif Hazır", "Hatalı" sekmeleri ekle. Mobil uyumlu, sade SaaS dashboard görünümü korunsun. Kod TypeScript ve Tailwind CSS ile temiz yazılsın.

## Prompt 3 — Doganium gerçek RPA adapter'ını hazırla

worker/doganium_adapter.py dosyasındaki PyWinAutoDoganiumAdapter sınıfını gerçek RPA için tamamlamaya hazırlan. Şimdilik selector değerlerini settings.json üzerinden alacak şekilde yapı kur. Login, EGM Sorgula, Trafik Sorgula, input doldurma, Trafiği Raporla ve PDF bekleme adımlarını ayrı metotlara böl. Henüz gerçek selector yoksa placeholder bırak ama kod yapısını production'a yakın kur. Hata yakalama ve timeout ekle.

## Prompt 4 — PDF parser'ı örnek metne göre geliştir

worker/pdf_parser.py dosyasını geliştir. Doganium PDF'inden çıkarılmış örnek text verisini kullanarak şirket adı ve fiyatları parse edecek fonksiyon yaz. Fiyatları normalize et, en uygun, en yüksek ve önerilen teklifi döndür. Test edilebilir küçük yardımcı fonksiyonlar oluştur.

## Prompt 5 — Güvenlik iyileştirmesi yap

Bu projede TCKN, doğum tarihi ve belge seri no gibi hassas veriler var. Supabase tarafında düz metin saklama yerine uygulama seviyesinde encryption/decryption helper tasarla. Loglarda sadece masked değer gösterilsin. raw_message alanını production için opsiyonel veya masked hale getir. Service role key'in client bundle'a sızmadığını kontrol et.
