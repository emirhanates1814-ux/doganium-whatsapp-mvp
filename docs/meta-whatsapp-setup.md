# Meta WhatsApp Setup

## Test Numarasıyla Başla

İlk testleri Meta'nın verdiği test phone number ile yapın. Şirket hattını bu aşamada taşımayın.

## Access Token

Meta Developer panelinden geçici veya sistem kullanıcısı tokenı oluşturun ve `.env.local` içine `WHATSAPP_ACCESS_TOKEN` olarak ekleyin. Token değeri Git'e eklenmez.

## Phone Number ID

WhatsApp > API Setup ekranındaki Phone Number ID değerini `.env.local` içine `WHATSAPP_PHONE_NUMBER_ID` olarak yazın.

## Recipient Ekleme

Test alıcı telefonunu Meta panelinde allowed recipient olarak ekleyin ve doğrulayın.

## Send Message Test

```powershell
.\scripts\test-whatsapp-send.ps1 -To "905xxxxxxxxx" -Message "Doganium WhatsApp MVP test mesajı"
```

## Webhook

Meta webhook için public HTTPS URL gerekir:

```txt
https://PUBLIC_DOMAIN/api/whatsapp/webhook
```

Local geliştirmede ngrok veya cloudflared gibi HTTPS tünel kullanılabilir.

`WHATSAPP_VERIFY_TOKEN` bizim belirlediğimiz herhangi güçlü bir doğrulama metnidir. Meta panelindeki Verify Token alanıyla `.env.local` değeri aynı olmalıdır.
