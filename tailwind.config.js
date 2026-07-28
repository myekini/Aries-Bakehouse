/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-cream)',
        white: 'var(--color-white)',
        chocolate: 'var(--color-choc)',
        cocoa: 'var(--color-cocoa)',
        olive: 'var(--color-olive)',
        caramel: 'var(--color-caramel)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};
