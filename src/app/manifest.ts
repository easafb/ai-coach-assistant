import type { MetadataRoute } from "next";

/**
 * Web App Manifest.
 *
 * Uygulama esas olarak salonda, telefonda kullanılıyor. Manifest olmadan
 * ana ekrana eklenemiyordu; şimdi tarayıcı çubuğu olmadan, tam ekran ve
 * uygulama gibi açılıyor. Haftada üç kez açılan bir araç için fark büyük.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coach.ai — Yapay Zekâ Destekli Antrenman Asistanı",
    short_name: "Coach.ai",
    description:
      "Geçmiş antrenmanlarını okuyup bir sonraki seansını planlayan dijital antrenör.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "tr",
    categories: ["health", "fitness"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
