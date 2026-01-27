import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {locales} from '@/i18n';
import {headers} from 'next/headers';
import {BrandProvider} from '@/app/contexts/BrandContext';
import {getBrandConfigByDomain, getDomainFromRequest} from '@/lib/brand/brand-service';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const {locale} = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Load messages for this locale
  const messages = (await import(`@/messages/${locale}.json`)).default;

  // Load brand configuration based on current domain
  const headersList = await headers();
  const domain = getDomainFromRequest(headersList);
  const brandConfig = await getBrandConfigByDomain(domain);

  return (
    <BrandProvider brandConfig={brandConfig}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </BrandProvider>
  );
}
