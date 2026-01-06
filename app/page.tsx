import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n';

// Página raíz que redirige al locale por defecto
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
