param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$randomSuffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)

$payload = @{
  object = "whatsapp_business_account"
  entry = @(
    @{
      id = "test-waba"
      changes = @(
        @{
          field = "messages"
          value = @{
            messaging_product = "whatsapp"
            metadata = @{
              display_phone_number = "15550000000"
              phone_number_id = "test-phone-number-id"
            }
            contacts = @(
              @{
                profile = @{
                  name = "Test Musteri"
                }
                wa_id = "905360000000"
              }
            )
            messages = @(
              @{
                from = "905360000000"
                id = "test-message-$randomSuffix"
                timestamp = [string][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                type = "text"
                text = @{
                  body = "TCKN: 11111111110 Plaka: 34ABC123 Belge Seri No: AB123456 Dogum Tarihi: 01.01.1990"
                }
              }
            )
          }
        }
      )
    }
  )
} | ConvertTo-Json -Depth 20

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "$BaseUrl/api/whatsapp/webhook" `
  -ContentType "application/json" `
  -Body $payload

Write-Output "Webhook test talebi gönderildi."
Write-Output ($response | ConvertTo-Json -Depth 10)
