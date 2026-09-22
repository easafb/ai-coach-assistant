import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni — Coach.ai",
  description: "Coach.ai'ın kişisel verileri nasıl işlediğine dair aydınlatma metni.",
};

/**
 * Giriş gerektirmeyen bir sayfa: kullanıcı hesap açmadan ÖNCE okuyabilmeli.
 * /gizlilik proxy'deki korumalı önekler arasında değil.
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-24 text-white">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 flex min-h-11 w-fit items-center gap-2 font-bold text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft size={20} /> Geri
        </Link>

        <h1 className="mb-2 text-3xl font-black tracking-tight">
          Gizlilik ve Aydınlatma Metni
        </h1>
        <p className="mb-10 text-sm text-neutral-500">
          Son güncelleme: 22 Eylül 2026 · Coach.ai beta sürümü
        </p>

        <div className="space-y-8 text-[15px] leading-relaxed text-neutral-300">
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Veri sorumlusu</h2>
            <p>
              Coach.ai, Emir Asaf Baş tarafından geliştirilen kişisel bir
              projedir. 6698 sayılı Kişisel Verilerin Korunması Kanunu
              (&quot;KVKK&quot;) kapsamında veri sorumlusu Emir Asaf
              Baş&apos;tır. Sorularınız ve hak talepleriniz için uygulamadaki
              geri bildirim özelliğini kullanabilir veya doğrudan{" "}
              <a
                href="mailto:easafb1907@gmail.com"
                className="font-semibold text-blue-400 underline"
              >
                easafb1907@gmail.com
              </a>{" "}
              adresine e-posta gönderebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Hangi veriler işleniyor</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Kimlik ve iletişim:</strong> Google
                hesabınızla giriş yaptığınızda ad ve e-posta adresiniz.
              </li>
              <li>
                <strong className="text-white">Antrenman verileri:</strong>{" "}
                oluşturduğunuz programlar, kaydettiğiniz setler (ağırlık, tekrar),
                antrenman tarih ve süreleri.
              </li>
              <li>
                <strong className="text-white">
                  Sağlıkla ilgili beyanlarınız (Özel Nitelikli Kişisel Veri):
                </strong>{" "}
                Koç özelliğine yazdığınız ağrı, yorgunluk veya sakatlık
                bildirimleri.
              </li>
              <li>
                <strong className="text-white">Teknik kayıtlar:</strong> hata
                raporları ve gönderdiğiniz geri bildirimler.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">
              İşleme amacı ve hukuki sebepler
            </h2>
            <p className="mb-3">
              Verileriniz yalnızca uygulamanın çalışması için işlenir: geçmiş
              antrenmanlarınıza bakarak bir sonraki seansınız için ağırlık
              önerisi üretmek, programınızı durumunuza göre uyarlamak ve
              geçmişinizi size göstermek. Reklam veya profilleme amacıyla
              kullanılmaz, üçüncü taraflara satılmaz.
            </p>
            <p>
              Kişisel verileriniz, KVKK&apos;nın 5. maddesinde yer alan{" "}
              <em>
                bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili
                olması
              </em>{" "}
              ve{" "}
              <em>
                veri sorumlusunun meşru menfaatleri için veri işlenmesinin
                zorunlu olması
              </em>{" "}
              hukuki sebeplerine dayanılarak otomatik yollarla işlenmektedir.
              Sağlık verileriniz ise Kanun&apos;un 6. maddesi uyarınca yalnızca
              vereceğiniz açık rızaya istinaden işlenmektedir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">
              Verilerin paylaşıldığı taraflar ve yurt dışına aktarım
            </h2>
            <p className="mb-3">
              Uygulama altyapısının sağlanması ve yapay zekâ özelliklerinin
              çalışabilmesi için verileriniz, sunucuları yurt dışında bulunan
              aşağıdaki hizmet sağlayıcılara aktarılmaktadır. Bu aktarım,
              Kanun&apos;un 9. maddesi kapsamında vereceğiniz açık rızaya
              istinaden gerçekleştirilir:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Supabase</strong> — veritabanı ve
                kimlik doğrulama.
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — uygulamanın
                barındırılması.
              </li>
              <li>
                <strong className="text-white">Google</strong> — hesabınızla giriş
                ve Koç özelliğinin çalıştığı Gemini yapay zekâ servisi.
              </li>
            </ul>
            <p className="mt-3">
              Koç özelliğini kullandığınızda yazdığınız metin ve antrenman özetiniz
              yanıt üretilmesi için Google&apos;a iletilir. Bu veriler adınız veya
              e-postanızla birlikte gönderilmez.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Saklama süresi</h2>
            <p>
              Verileriniz hesabınız açık kaldığı sürece saklanır. Hesabınızı
              sildiğinizde antrenman geçmişiniz, programlarınız ve tüm ilgili
              kayıtlar kalıcı olarak silinir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Haklarınız</h2>
            <p className="mb-3">
              Kişisel verilerinizle ilgili olarak; işlenip işlenmediğini öğrenme,
              bilgi talep etme, düzeltilmesini veya silinmesini isteme ve
              işlenmesine itiraz etme haklarına sahipsiniz.
            </p>
            <p>
              Bunlardan ikisini uygulamadan doğrudan kullanabilirsiniz:{" "}
              <Link href="/hesap" className="font-semibold text-blue-400 underline">
                Hesap sayfasından
              </Link>{" "}
              tüm verilerinizi indirebilir veya hesabınızı tüm verisiyle birlikte
              silebilirsiniz. KVKK madde 11 kapsamındaki diğer talepleriniz için
              geri bildirim özelliğiyle veya{" "}
              <a
                href="mailto:easafb1907@gmail.com"
                className="font-semibold text-blue-400 underline"
              >
                easafb1907@gmail.com
              </a>{" "}
              adresi üzerinden bize ulaşabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Güvenlik</h2>
            <p>
              Verileriniz satır bazlı güvenlik politikalarıyla korunur: her sorgu
              kimliğinize göre filtrelenir ve başka bir kullanıcının verisine
              erişemezsiniz. Yönetici olarak geliştiricinin veritabanına teknik
              erişimi bulunmaktadır.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="mb-3 text-lg font-bold text-amber-400">
              Sağlık uyarısı ve sorumluluk reddi
            </h2>
            <p className="text-neutral-300">
              Coach.ai bir tıbbi cihaz değildir ve verdiği öneriler tıbbi tavsiye
              yerine geçmez. Ağırlık önerileri geçmiş performansınıza dayanan
              matematiksel hesaplamalardır. Ağrı, sakatlık veya sağlık sorunu
              yaşıyorsanız bir sağlık profesyoneline başvurun. Antrenman
              sırasında oluşabilecek sakatlıklardan kullanıcı sorumludur.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Beta sürümü</h2>
            <p>
              Uygulama şu anda kapalı beta aşamasındadır. Hata oluşabilir ve
              nadiren veri kaybı yaşanabilir. Değişiklik olduğunda bu metin
              güncellenir.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
