# Salva AR Studio v2

GitHub Pages üzerinde statik stüdyo; Supabase Auth/Postgres/quick-task ve ImageKit ile çalışır.

## Sayfalar
- index.html: projeler, yükleme, güncelleme, koleksiyon bağlantısı.
- login.html / signup.html: ayrı giriş ve kayıt. Kayıt şifre tekrarı ve doğrulama maili içerir.
- poster.html?id=UUID: poster, yerel QR üretimi, SVG indirme ve A4 yazdırma/PDF.
- view.html?id=UUID: MindAR izleyici, kullanıcı dokunuşuyla isteğe bağlı ses.
- collection.html?ids=UUID,UUID&title=...: en fazla 12 yayınlanmış projeden bağlantıya dayalı koleksiyon. Koleksiyon veritabanında saklanmaz; seçilen projeler ve başlık URL'dedir.

## Yayına alma sırası
1. Supabase SQL Editor'de ../supabase/ar-v2.sql dosyasını çalıştır.
2. Supabase Edge Functions içindeki MEVCUT quick-task kodunu ../supabase/quick-task.ts ile değiştirip deploy et.
3. IMAGEKIT_PRIVATE_KEY secret'ını koru; SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY platformda mevcut olmalı. Frontend'e secret koyma.
4. quick-task için legacy JWT gateway doğrulaması kapalı kalmalı (config.toml). Fonksiyon her istekte auth.getUser ile doğrulanmış kullanıcıyı kontrol eder.
5. Bu dalı main'e birleştirerek GitHub Pages dosyalarını yayınla.
6. Supabase Auth URL Configuration'da https://salvastudio.co ve kullanılıyorsa www karşılığı için /ar/ dönüş adresini kontrol et. Resend SMTP mevcut ayarları korunur.

SQL ve Edge Function uygulama erişimi bu çalışma ortamında yoktur. GitHub'a dosya eklemek bunları Supabase'e otomatik deploy ETMEZ.

## Geriye uyumluluk
Önce frontend yayınlanırsa eski upload ve silme akışı çalışabilir. usage çağrısı eski sunucuda reddedilince yalnızca kişisel proje sayısı gösterilir; Güncelle butonu kapalıdır. Supabase güncellemesinden sonra gerçek ortak alan ve güncelleme açılır. Önce sunucuyu güncellemek önerilir.

## Güncelleme davranışı
- Projenin UUID'si, bağlantısı ve QR'ı aynı kalır.
- Şimdilik güncellemede poster ve video yeniden seçilir; posterin kendisi değişirse basılı kopya da değiştirilmelidir.
- Eski yayın, üç yeni dosya yüklenip tek veritabanı işlemiyle değiştirilene kadar erişilebilir.
- Eski ve yeni dosyalar için geçici depolama sayılır. Başarısız güncelleme eski yayını korur.
- Dosya temizlenemezse ar_replacements kaydı alanı rezerve etmeye devam eder; cleanup kayıtları usage çağrısında yeniden denenir. failed kayıtları için 15 dakika sonra ilgili projeyi silerek tüm varlıkları temizle. Otomatik sınırsız zaman aşımı temizlemesi yoktur.
- Kayıtların RLS politikaları istemciye yazma yetkisi vermez. Yeni RPC'ler yalnızca service_role içindir.

## Kontroller ve sınırlar
- Kişi başına 3 proje; son 24 saatte kişi başına 5 ve toplam 100 yükleme denemesi; global 2 GiB rezervasyon.
- Poster en fazla 2 MiB, video 10 MiB ve hedef 5 MiB; 60 saniye ve oran kontrolleri istemcide yapılır.
- Poster analizi küçük bir görüntüde kontrast/kenar yoğunluğu sezgisidir; MindAR'ın ölçülmüş tanıma başarısı değildir.
- Üst üste önizleme kırpma yapmaz; kaydırıcı ilk kareyle posteri karşılaştırır.
- Sıkıştırma yalnızca tarayıcı hem canvas.captureStream hem MP4 MediaRecorder desteklerse açılır. Video sessizleştirilir, en uzun kenar 960 px, 24 fps, hedef 900 kbps. Daha küçük oluşmazsa orijinal korunur. Desteklenmeyen tarayıcıda dışarıda MP4 hazırlama açıklaması gösterilir.
- QR içerikleri üçüncü taraf QR servisine gönderilmez. QR, Supabase, MindAR ve Three.js kitaplıkları sabit sürümlü CDN bağlantılarından yüklenir.
- Gerçek servis planındaki trafik kotası, ImageKit dışı dosyalar ve Supabase diğer kullanımları bu 2 GiB göstergesinde yer almaz.

## Test
Node 22 ile repo kökünde: `node tests/ar-v2.mjs`
GitHub Actions aynı kontrolü PR'da çalıştırır. Testler sahte Supabase/ImageKit ile auth, sahiplik, kota, başarılı/başarısız güncelleme ve kayıp commit yanıtını kapsar.
Gerçek Supabase SQL işlemleri ve mobil tarayıcı, kamera, CDN, QR taranabilirliği ve MP4 desteği canlı ortamda ayrıca denenmelidir.
