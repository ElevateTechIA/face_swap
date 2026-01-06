import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Providers } from '../providers';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';

// Define which locale params are valid
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params en Next.js 15
  const { locale } = await params;
  
  // Validar que el locale es válido
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Cargar los mensajes del locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
