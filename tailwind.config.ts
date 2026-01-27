import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Theme colors
        'theme-primary': 'var(--color-primary)',
        'theme-primary-from': 'var(--color-primary-from)',
        'theme-primary-to': 'var(--color-primary-to)',
        'theme-accent': 'var(--color-accent)',
        'theme-accent-light': 'var(--color-accent-light)',
        'theme-bg-primary': 'var(--color-bg-primary)',
        'theme-bg-secondary': 'var(--color-bg-secondary)',
        'theme-bg-tertiary': 'var(--color-bg-tertiary)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
      },
      borderColor: {
        'theme': 'var(--color-border)',
        'theme-light': 'var(--color-border-light)',
      },
      backgroundColor: {
        'theme-primary': 'var(--color-bg-primary)',
        'theme-secondary': 'var(--color-bg-secondary)',
        'theme-tertiary': 'var(--color-bg-tertiary)',
      },
    },
  },
  plugins: [],
};
export default config;
