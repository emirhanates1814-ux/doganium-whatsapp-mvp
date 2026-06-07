# Doganium Worker

Windows üzerinde çalışan worker, Next.js API'den iş alır ve sonucu geri yazar.

## Kurulum

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
.\scripts\setup-worker.ps1
cd worker
python main.py
```

İlk çalıştırmada `mode` değeri `mock` kalmalıdır. `pywinauto` modu gerçek Doganium selector bilgileri çıkarıldıktan sonra tamamlanacak iskeleti içerir.

`settings.json` dosyası gizlidir ve Git'e eklenmemelidir. Doganium kullanıcı adı ve şifresi yalnızca bu dosyada tutulmalıdır.
