# AR başlangıç paketi

GitHub Pages üzerinde çalışan, sunucu veya API anahtarı istemeyen MindAR denemesi.
İlk sürüm resmi MindAR örnek kartı üzerinde dönen halka ve küp gösterir; bu bir teknik testtir, nihai proje tasarımı değildir.

## Yayınlama
1. GitHub'da yeni, public bir depo açın (örnek ad: ar-deneme).
2. Bu klasörün İÇİNDEKİ dosyaları deponun köküne yükleyin. index.html doğrudan kökte olmalı.
3. Settings → Pages → Deploy from a branch → main → /(root) → Save.
4. GitHub'ın verdiği HTTPS adresini telefonda açın.
5. Aynı adresin sonuna /afis.html ekleyip bilgisayarda açın. Telefona kamera izni verip bu karta doğrultun.

Mevcut sitenin dosyalarını değiştirmek gerekmez; ayrı depo kullanın. Özel domain zorunlu değil.
Domain/alt alan adı ayarı için önce tam domain ve mevcut Pages depo adresi belirlenmeli. Bu pakette CNAME yoktur; mevcut DNS ayarları değiştirilmemiştir.

## Kendi içeriklerinizi eklemek
1. Afişi assets/afis.jpg olarak koyun.
2. https://hiukim.github.io/mind-ar-js-doc/tools/compile/ adresinde afişi derleyip çıkan dosyayı assets/targets.mind olarak kaydedin.
3. config.js içindeki poster ve target alanlarını bu yollarla değiştirin. Görsel değiştirilince .mind dosyasını da yeniden üretin.
4. Sessiz H.264 MP4 videoyu assets/animasyon.mp4 olarak ekleyin; config.js video değerini bu yola ayarlayın.
5. aspectRatio değerini afişin genişliği / yüksekliği olarak girin. Video ve afiş aynı en-boy oranında olsun.

Kamera izninden sonra normal akışta başlatma butonu yoktur. Video hedef bulunduğunda oynar, kaybolduğunda durur. Yeniden bulunduğunda başa dönme config.js ile ayarlanabilir. Sesli video otomatik oynatması garanti edilmediği için sessiz oynatma kullanılır. Tarayıcıların ek engelleri cihazda test edilmelidir.

## Test listesi
- iPhone Safari ve Android Chrome üzerinde kamera izni ve hedef takibi.
- Kamera iznini reddetme durumunda açıklayıcı hata.
- Hedefi kadrajdan çıkarma ve tekrar gösterme.
- Videolu sürümde oynama/durma ve sekme değişiminde duraklama.
- Baskıdan gerçek ışıkta deneme; yansıma ve zayıf ışığı kontrol etme.

Bu paket burada gerçek telefon kamerasıyla doğrulanmadı. Canlı yayın ve cihaz testi ayrıca yapılmalı.

## Bağımlılıklar ve sınırlar
MindAR 1.2.5 (MIT), A-Frame 1.6.0 (MIT). Sürümler sabitlenmiştir. Başlangıçta kütüphaneler ve örnek hedef internetten yüklenir; CDN kesintileri yüklemeyi etkileyebilir. Tamamen çevrimdışı değildir. Son sürümde kütüphaneler ve hedef dosyaları lisans bildirimleri korunarak yerelleştirilebilir.
MindAR görüntüleme kotası uygulamaz. GitHub Pages trafik ve kullanım sınırları geçerlidir. Kamera görüntüsünü yükleyen veya kaydeden uygulama kodu yoktur; üçüncü taraf CDN'lere dosya indirme istekleri yapılır. Public depodaki dosyalar herkese açıktır; gizli bilgi yüklemeyin.

Kaynak: https://github.com/hiukim/mind-ar-js
Örnek hedef: MindAR resmi card-example örneği.
