/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './web/storefront/themes/default/**/*.{ejs,html,js}',
    './web/storefront/themes/default/partials/**/*.{ejs,html,js}',
    './public/javascripts/storefront/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Fashion design tokens
        ink: {
          50: '#f8f8f8',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0a0a0a',
        },
        gold: {
          400: '#d4af37',
          500: '#c89b3c',
          600: '#b8860b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        heading: ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
      maxWidth: {
        '8xl': '90rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
