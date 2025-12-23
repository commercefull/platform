/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './web/storefront/views/**/*.{ejs,html,js}',
    './web/storefront/views/partials/**/*.{ejs,html,js}',
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
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
