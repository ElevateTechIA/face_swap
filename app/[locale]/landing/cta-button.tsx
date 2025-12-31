'use client';

import { useRouter } from 'next/navigation';

export function CTAButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/en'); // Navigate to main app page (English locale)
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-[#C9A063] hover:bg-[#B8915A] text-black font-semibold px-8 py-6 rounded-full text-lg transition-all duration-300 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}
