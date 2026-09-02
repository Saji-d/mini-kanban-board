import type { Config } from 'tailwindcss';

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: withOpacity('--bg'),
        surface: withOpacity('--surface'),
        'surface-2': withOpacity('--surface-2'),
        'surface-3': withOpacity('--surface-3'),
        border: withOpacity('--border'),
        'border-strong': withOpacity('--border-strong'),
        ink: withOpacity('--ink'),
        'ink-muted': withOpacity('--ink-muted'),
        'ink-faint': withOpacity('--ink-faint'),
        accent: withOpacity('--accent'),
        'accent-ink': withOpacity('--accent-ink'),
        'accent-hover': withOpacity('--accent-hover'),
        teal: withOpacity('--teal'),
        danger: withOpacity('--danger'),
        success: withOpacity('--success'),
        rail: {
          1: withOpacity('--rail-1'),
          2: withOpacity('--rail-2'),
          3: withOpacity('--rail-3'),
          4: withOpacity('--rail-4'),
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
