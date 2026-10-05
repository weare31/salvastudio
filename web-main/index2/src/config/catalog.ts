// ---------------------------------------------------------------------------
// config/catalog.ts
//
// KATALOĞU YÖNETMEK İÇİN NORMALDE SADECE BU DOSYAYI DÜZENLEMENİZ YETER.
//
// Görselleri şu klasöre koyun:  public/catalog/
// ---------------------------------------------------------------------------

export type CatalogMode = "auto" | "manual";

export const catalogConfig = {
  // Kataloğun başlığı. Şu an ekranda görünmüyor ama sekme/başlık için kullanılır.
  title: "Dijital Katalog",

  // -------------------------------------------------------------------------
  // MOD SEÇİMİ — SADECE "auto" YA DA "manual" YAZIN. İKİSİNİ BİRDEN AÇMAYIN.
  //
  //   "auto"   -> Sıralı dosya adları kullanır (01.webp, 02.webp, ...).
  //               Çoğu zaman istediğiniz mod budur.
  //   "manual" -> Aşağıdaki "pages" dizisini elle düzenlersiniz.
  //               Sayfa sırasını özelleştirmek istediğinizde kullanın.
  // -------------------------------------------------------------------------
  mode: "auto" as CatalogMode,

  // -------------------------------------------------------------------------
  // AUTO MOD AYARLARI (mode: "auto" iken kullanılır)
  // -------------------------------------------------------------------------
  autoPages: {
    // Toplam sayfa sayısını buradan değiştirin.
    pageCount: 32,

    // Görsellerin bulunduğu klasör (public/ klasörüne göre).
    folder: "/catalog",

    // Dosya uzantısı: "webp" | "jpg" | "jpeg" | "png"
    // WebP tavsiye edilir çünkü dosya boyutu genelde daha küçüktür.
    extension: "webp",

    // Dosya adındaki basamak sayısı.
    // digits: 2  ->  01.webp, 02.webp, ... 32.webp
    // digits: 3  ->  001.webp, 002.webp, ... 032.webp
    digits: 2,
  },

  // -------------------------------------------------------------------------
  // MANUEL MOD AYARLARI (mode: "manual" iken kullanılır)
  //
  // Sayfaları eklemek, silmek ya da sırasını değiştirmek için
  // bu diziyi düzenleyin. Görüntüleyici TAM OLARAK bu sırayla gösterir.
  // -------------------------------------------------------------------------
  pages: [
    "/catalog/01.webp",
    "/catalog/02.webp",
    "/catalog/03.webp",
    "/catalog/04.webp",
    "/catalog/05.webp",
  ] as string[],
};

/**
 * Görüntüleyicinin kullandığı nihai sayfa listesini üretir.
 * mode: "auto" ise pageCount'a göre otomatik üretir.
 * mode: "manual" ise pages dizisini olduğu gibi kullanır.
 */
export function resolveCatalogPages(): string[] {
  if (catalogConfig.mode === "manual") {
    return catalogConfig.pages;
  }

  const { pageCount, folder, extension, digits } = catalogConfig.autoPages;
  return Array.from({ length: pageCount }, (_, i) => {
    const num = String(i + 1).padStart(digits, "0");
    return `${folder}/${num}.${extension}`;
  });
}
