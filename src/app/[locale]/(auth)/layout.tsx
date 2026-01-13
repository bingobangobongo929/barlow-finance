import { setRequestLocale } from "next-intl/server";

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]">
            <span className="font-heading text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-[var(--text-primary)]">
            Barlow Finance
          </h1>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
