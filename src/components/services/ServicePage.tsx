import type { ReactNode } from "react";
import { Mail, Phone, QrCode } from "lucide-react";

type ServicePageProps = {
  eyebrow: string;
  title: string;
  intro: string[];
  features: Array<{ icon: ReactNode; title: string; description: string }>;
};

export function ServicePage({ eyebrow, title, intro, features }: ServicePageProps) {
  const qrUrl = process.env.NEXT_PUBLIC_CONTACT_WECHAT_QR_URL;
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">{title}</h1>
        <div className="mt-5 grid max-w-4xl gap-3 text-base leading-8 text-slate-600">
          {intro.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-700">{feature.icon}</div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Contact</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <ContactItem icon={<QrCode size={18} />} label="WeChat" value={qrUrl ? "QR configured" : "Add NEXT_PUBLIC_CONTACT_WECHAT_QR_URL"} />
          <ContactItem icon={<Phone size={18} />} label="Phone" value={phone || "Add NEXT_PUBLIC_CONTACT_PHONE"} />
          <ContactItem icon={<Mail size={18} />} label="Email" value={email || "Add NEXT_PUBLIC_CONTACT_EMAIL"} />
        </div>
        {qrUrl ? <div className="mt-4 h-32 w-32 rounded-md border border-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${qrUrl})` }} aria-label="WeChat QR" /> : null}
      </section>
    </main>
  );
}

function ContactItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3">
      <span className="text-blue-700">{icon}</span>
      <span>
        <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </span>
    </div>
  );
}
