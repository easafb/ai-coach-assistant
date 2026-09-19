import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coach.ai — Yapay Zekâ Destekli Antrenman Asistanı",
  description:
    "Geçmiş antrenmanlarını okuyup bir sonraki seansını planlayan dijital antrenör.",
};

// Uygulama esas olarak telefonda kullanılıyor.
// viewportFit: "cover" çentikli/ev-göstergeli cihazlarda env(safe-area-inset-*)
// değerlerinin dolmasını sağlar; alt navigasyon bunlara dayanıyor.
// maximum-scale bilerek kısıtlanmadı: yakınlaştırmayı engellemek erişilebilirlik ihlali.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
