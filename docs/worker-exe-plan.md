# Worker EXE Plan

Önce worker'ın `mock` modunda uçtan uca çalıştığı doğrulanmalıdır. Ardından `pywinauto` modu gerçek Doganium selectorlarıyla test edilmelidir.

EXE üretimi sonraki adımdır:

```powershell
cd worker
.\.venv\Scripts\Activate.ps1
pip install pyinstaller
pyinstaller --onefile --name DoganiumWorker main.py
```

EXE üretmeden önce kontrol listesi:

- `python main.py` mock modda çalışıyor.
- `/api/jobs` auth ve sonuç yazma akışı başarılı.
- Doganium uygulaması hedef makinede açılabiliyor.
- Login ve sorgu selectorları Inspect.exe ile doğrulandı.
- PDF indirme klasörü sabit ve yazılabilir.

Bu doğrulamalar yapılmadan EXE üretmek hata ayıklamayı zorlaştırır.
