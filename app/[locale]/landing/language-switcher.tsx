'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLanguage = (newLocale: string) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
      <Globe className="w-4 h-4 text-gray-400" />
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
          currentLocale === 'en'
            ? 'bg-yellow-500 text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('es')}
        className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
          currentLocale === 'es'
            ? 'bg-yellow-500 text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  );
}
