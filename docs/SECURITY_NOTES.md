# Guvenlik Notlari

Bu proje TCKN, telefon, plaka, Doganium credential'i ve trafik teklif sonucu gibi hassas verilerle calisabilir. Varsayilan yaklasim local-first ve minimum veri yayilimi olmalidir.

## Commit Edilmemesi Gerekenler

Asagidaki dosya ve klasorler repoya commit edilmemelidir:

- `.env.local`
- `.desktop/settings.json`
- `.data/`
- `.logs/`
- Yerel SQLite veritabani: `.data/doganium.sqlite`
- Doganium credential veya token iceren herhangi bir dosya.

## Kisisel Veri Maskeleme

- TCKN loglarda tam gosterilmemelidir.
- Telefon numarasi maskelenmelidir.
- Plaka ihtiyaca gore kisitli gorunmelidir.
- Raw WhatsApp mesajlari debug disinda kaydedilmemelidir.

Ornek maskeli gosterim:

```text
TCKN: 12*******90
Telefon: 90*******432
```

## Doganium Kimlik Bilgileri

- Doganium kullanici adi/sifre repoya yazilmaz.
- Credential client koduna gomulmez.
- Credential loglanmaz.
- Yerel ayar dosyasi kullanilacaksa dosya commit disinda kalir.

## IP ve MFA Kurallari

- Doganium IP kontrolleri bypass edilmez.
- MFA veya manuel checkpoint bypass edilmez.
- Sadece yetkili ofis/IP makinesi veya Doganium tarafindan onayli erisim modeli kullanilir.

## Guvenli Loglama

Loglarda bulunmamasi gerekenler:

- Sifre.
- Token.
- Tam TCKN.
- Tam WhatsApp mesaj metni.
- Doganium session/cookie degerleri.
- Gereksiz PDF veya teklif ham verisi.

Loglarda bulunabilecekler:

- Job ID.
- Maskeli telefon/TCKN.
- Durum degisimi.
- Hata kategorisi.
- Zaman bilgisi.

## SQLite Verisi

`.data/doganium.sqlite` kisisel veri icerebilir. Bu dosya:

- Yerel ve private kalmalidir.
- Commit edilmemelidir.
- Paylasilmadan once silinmeli veya anonimlestirilmelidir.
- Yedekleme stratejisi belirlenmeden uretimde kontrolsuz kopyalanmamalidir.
