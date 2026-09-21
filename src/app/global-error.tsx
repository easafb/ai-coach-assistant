"use client";

// Kök layout'ta oluşan hatalar error.tsx'e ulaşmaz; onları burası yakalar.
// Bu dosya kök layout'un yerine geçtiği için kendi <html> ve <body>'sini
// tanımlamak zorunda.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "24rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: ".5rem" }}>
            Uygulama açılamadı
          </h1>
          <p style={{ color: "#737373", fontSize: ".875rem", marginBottom: "2rem" }}>
            Beklenmedik bir hata oluştu.
            {error.digest && ` (kod: ${error.digest})`}
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              width: "100%",
              minHeight: "3rem",
              borderRadius: "1rem",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
