/**
 * Yükleme iskeleti.
 * Next, loading.tsx dosyasını navigasyon başlar başlamaz gösteriyor; bu
 * sayede sunucu sayfayı hazırlarken ekran boş kalmıyor. Telefonda hissedilen
 * fark büyük: dokunma ile ilk piksel arasındaki sessizlik kayboluyor.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-2xl ${className}`} />;
}

export function SkeletonScreen({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label="Yükleniyor" className="animate-fade">
      {children}
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}
