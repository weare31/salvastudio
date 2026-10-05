# Dijital Katalog Kullanım Rehberi

## 1. Proje nasıl çalışır?

- **Bilgisayar (masaüstü):** Katalog her zaman çift sayfa (yan yana) gösterilir.
- **Mobil, dikey konum:** Katalog tek sayfa gösterilir.
- **Mobil, yatay konum:** Katalog çift sayfa gösterilir.
- **Mobilde ilk açılış:** Telefon dikey konumdaysa, önce "telefonunuzu çevirin" uyarısı çıkar. İsterseniz "Dikey devam et" seçeneğiyle tek sayfa moduna geçebilirsiniz.

## 2. Katalog görsellerini nereye koyacağım?

Görselleri şu klasöre koyun:

```
public/catalog/
```

Örnek:

```
01.webp
02.webp
03.webp
04.webp
```

## 3. Tavsiye edilen görsel formatı

**WebP** formatı tavsiye edilir, çünkü dosya boyutu genellikle JPG ve PNG'den daha küçüktür ve katalog daha hızlı açılır.

JPG ve PNG formatları da desteklenir, sorun yaşamazsınız.

## 4. A3 görsel ölçüsü

Her sayfa **A3 dikey (portre)** formatındadır:

- Genişlik: 297 mm
- Yükseklik: 420 mm

Önerilen çözünürlük örnekleri:

```
2480 x 3508 px
3508 x 4961 px
```

Tam çözünürlük farklı olabilir, önemli olan **A3 en-boy oranının** korunmasıdır.

**Önemli:** Her dosya TEK BİR A3 DİKEY sayfayı temsil eder. Yatay A3 sayfa oluşturmayın. İki dikey sayfa yan yana gösterilerek yatay bir "çift sayfa görünümü" (spread) oluşturulur — bunu sistem otomatik yapar, siz yatay görsel hazırlamazsınız.

## 5. En kolay katalog ekleme yöntemi (Otomatik Mod)

1. Görselleri `01.webp`, `02.webp`, `03.webp` şeklinde sırayla isimlendirin.
2. Bu dosyaları `public/catalog/` klasörüne atın.
3. `src/config/catalog.ts` dosyasını açın.
4. `pageCount` değerini toplam sayfa sayınız yapın.

Örnek:

```ts
autoPages: {
  pageCount: 32,
  ...
}
```

Bu ayar sayesinde sistem `01.webp`'den `32.webp`'e kadar tüm sayfaları otomatik olarak bulur. Tek dosya bile eklemeniz veya `import` yazmanız gerekmez.

## 6. Sayfa sırasını özel olarak değiştirmek (Manuel Mod)

Sayfa sırasını elle belirlemek isterseniz, önce modu değiştirin:

```ts
mode: "manual",
```

Sonra `pages` dizisini düzenleyin:

```ts
pages: [
  "/catalog/01.webp",
  "/catalog/02.webp",
  "/catalog/05.webp",
  "/catalog/03.webp",
],
```

Katalog, tam olarak bu dizideki sırayla gösterilir.

**Not:** `mode` alanı ya `"auto"` ya da `"manual"` olmalı, ikisi aynı anda aktif olamaz.

## 7. Katalog başlığını değiştirmek

`src/config/catalog.ts` dosyasında şu satırı düzenleyin:

```ts
title: "2026 Ürün Kataloğu",
```

## 8. Yeni katalog nasıl eklenir?

1. Eski görselleri silin veya başka bir klasöre taşıyın.
2. Yeni görselleri `public/catalog/` içine atın.
3. `01.webp`'den başlayarak sıralı isimlendirin.
4. `pageCount` değerini yeni toplam sayfa sayısı yapın.
5. Dosyayı kaydedin.
6. Tarayıcıda sayfayı yenileyin.

## 9. Projeyi bilgisayarda çalıştırma

Bu proje **Vite** ile hazırlanmıştır. Terminalde proje klasörünün içindeyken:

```
npm install
npm run dev
```

Terminalde çıkan adresi (örneğin `http://localhost:5173`) tarayıcınızda açın.

## 10. Telefonda test etme

Telefon ve bilgisayar **aynı Wi-Fi ağına** bağlı olmalıdır.

Proje zaten ağ üzerinden erişime açık şekilde ayarlanmıştır (`vite.config.ts` içinde `host: true`), yani ekstra bir ayar yapmanıza gerek yoktur. Sadece:

```
npm run dev
```

komutunu çalıştırdığınızda terminalde şuna benzer bir satır göreceksiniz:

```
Network: http://192.168.1.20:5173
```

Bu adresi telefonunuzun tarayıcısına yazarak kataloğu telefonda açabilirsiniz.

(İsterseniz aynı sonucu `npm run dev -- --host` komutuyla da alabilirsiniz, ama bu projede zaten varsayılan olarak açıktır.)

## 11. VS Code ile kullanım

1. Proje klasörünü VS Code ile açın.
2. Üstteki menüden "Terminal" → "New Terminal" seçeneğine tıklayın.
3. Açılan terminale `npm install` ve ardından `npm run dev` yazın.
4. Katalog görsellerinizi `public/catalog` klasörüne sürükleyip bırakın.
5. `src/config/catalog.ts` dosyasını açıp gerekli ayarı değiştirin.

## 12. Sık karşılaşılan sorunlar

**Görsel görünmüyor / "Sayfa görseli bulunamadı" yazıyor:**
Dosya adının ve `pageCount` değerinin doğru olduğundan emin olun. Tarayıcı konsolunda hangi dosyanın eksik olduğu yazılıdır.

**Dosya adı yanlış:**
Dosya adları `01`, `02` şeklinde, `digits` ayarındaki basamak sayısına uygun olmalıdır.

**Uzantı yanlış:**
`extension` ayarı gerçek dosya uzantınızla (webp/jpg/jpeg/png) aynı olmalı.

**pageCount yanlış:**
Klasördeki gerçek dosya sayısıyla `pageCount` eşleşmelidir.

**Telefon bağlanamıyor:**
Telefon ve bilgisayarın aynı Wi-Fi ağında olduğundan emin olun. Bazı ağlarda (özellikle ofis/misafir ağları) cihazlar birbirini göremeyebilir.

**Görseller yavaş açılıyor:**
Görselleri WebP formatına çevirmeyi ve dosya boyutunu küçültmeyi deneyin.

**Görsel oranı bozuk görünüyor:**
Görselinizin gerçek A3 (297x420) oranına yakın olduğundan emin olun.

## 13. Yayınlama

En kolay yol, projeyi statik olarak barındıran bir servise (örneğin Vercel veya Netlify) yüklemektir:

```
npm run build
```

Bu komut `dist/` klasörünü oluşturur. Bu klasörü seçtiğiniz statik hosting servisine yükleyerek kataloğu yayınlayabilirsiniz.
