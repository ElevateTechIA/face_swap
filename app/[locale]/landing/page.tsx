'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CTAButton } from './cta-button';
import { LanguageSwitcher } from './language-switcher';
import { CheckCircle2, Sparkles, Zap, Shield } from 'lucide-react';
import heroImage from './assets/hero-image.png';
import uploadSelfieImage from './assets/Upload your selfie.png';
import pickTemplateImage from './assets/Pick a New Year template.png';
import unlockPhotoImage from './assets/Unlock your perfect photo.png';
import champagneToast from './assets/The Champagne Toast.jpg';
import cityLights from './assets/City Lights Glam.jpg';
import confettiParty from './assets/Confetti Party.jpg';
import elegantCountdown from './assets/Elegant Countdown.jpg';
import midnightCelebration from './assets/Midnight Celebration.jpg';
import redVelvet from './assets/Red Velvet Euphoria.jpg';

const templates = [
  { name: 'The Champagne Toast', image: champagneToast },
  { name: 'City Lights Glam', image: cityLights },
  { name: 'Confetti Party', image: confettiParty },
  { name: 'Elegant Countdown', image: elegantCountdown },
  { name: 'Midnight Celebration', image: midnightCelebration },
  { name: 'Red Velvet Euphoria', image: redVelvet },
];

const pricingPlans = [
  { name: 'Starter', credits: 1000, photos: 12, price: 8 },
  { name: 'Creator', credits: 2200, photos: 27, price: 15, popular: true },
  { name: 'Pro', credits: 4000, photos: 50, price: 25 },
  { name: 'Ultra', credits: 8000, photos: 100, price: 45 },
];

const stepImages = [uploadSelfieImage, pickTemplateImage, unlockPhotoImage];

export default function LandingPage() {
  const t = useTranslations('landing');

  const steps = [
    {
      number: 1,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      icon: '📸',
      image: stepImages[0],
    },
    {
      number: 2,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      icon: '🎨',
      image: stepImages[1],
    },
    {
      number: 3,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      icon: '✨',
      image: stepImages[2],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-yellow-800/20" />
        <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="relative z-10 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight">
                {t('hero.title')}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <CTAButton className="w-full sm:w-auto">
                {t('hero.cta')}
              </CTAButton>

              {/* Features */}
              <div className="flex flex-wrap gap-4 md:gap-6 mt-6 md:mt-8 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span>{t('hero.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                  <span>{t('hero.highQuality')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 mt-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-gray-800/50 px-3 md:px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('hero.endlessPresets')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-gray-800/50 px-3 md:px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4" />
                  <span>{t('hero.perfectFinishes')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-gray-800/50 px-3 md:px-4 py-2 rounded-full">
                  <Shield className="w-4 h-4" />
                  <span>{t('hero.premiumQuality')}</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg">
                {/* Decorative Frame */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-800/20 rounded-3xl transform rotate-3" />
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-3xl shadow-2xl">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden relative">
                    <Image
                      src={heroImage}
                      alt="Glamorous New Year Portrait"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Year Badge */}
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-full text-2xl font-bold shadow-lg">
                    {t('hero.year')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-100 to-white text-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16">
            {t('howItWorks.title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Step Visual */}
                  <div className="relative mb-6">
                    <div className="w-48 h-64 rounded-2xl shadow-lg relative overflow-hidden">
                      <Image
                        src={step.image}
                        alt={`Step ${step.number}: ${step.title}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Step Content */}
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 -right-6 text-4xl text-gray-400">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center mt-12 text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.footer')}
          </p>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16">
            {t('templates.title')}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-7xl mx-auto">
            {templates.map((template, index) => (
              <div
                key={index}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm md:text-base text-center">
                    {template.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <CTAButton>{t('templates.cta')}</CTAButton>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-100 to-white text-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            {t('pricing.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-800">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="text-center text-gray-600 mb-12 md:mb-16">
            {t('pricing.subtitle')}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'border-yellow-500 shadow-yellow-200' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    POPULAR
                  </div>
                )}

                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 mb-4">
                    {plan.credits.toLocaleString()} <span className="text-xs">{t('pricing.credits')}</span>
                  </div>

                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {t('pricing.generates', { count: plan.photos })}
                  </p>

                  <CTAButton className="w-full">
                    {t('pricing.cta')}
                  </CTAButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {t('features.title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('features.realistic.title')}</h3>
                  <p className="text-gray-400">
                    {t('features.realistic.description')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('features.instant.title')}</h3>
                  <p className="text-gray-400">
                    {t('features.instant.description')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('features.privacy.title')}</h3>
                  <p className="text-gray-400">
                    {t('features.privacy.description')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('features.premium.title')}</h3>
                  <p className="text-gray-400">
                    {t('features.premium.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-yellow-900/20 via-gray-900 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('finalCta.subtitle')}
          </p>
          <CTAButton className="text-xl px-12 py-8">
            {t('finalCta.cta')}
          </CTAButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>{t('footer.copyright')}</p>
            <div className="flex gap-6">
              <a href="/en" className="hover:text-white transition-colors">{t('footer.getStarted')}</a>
              <a href="/en" className="hover:text-white transition-colors">{t('footer.createPhotos')}</a>
              <a href="/en" className="hover:text-white transition-colors">{t('footer.tryNow')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
