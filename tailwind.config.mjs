/** @type {import('tailwindcss').Config} */
export default {
  // Le dice a Tailwind dónde buscar las clases de CSS en tu proyecto
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Diccionario de Severidad del Módulo 4
        critical: '#EF4444',
        high: '#F97316',
        medium: '#F59E0B',
        low: '#3B82F6',
      },
    },
  },
  plugins: [
    // Plugin de tipografía para renderizar el Markdown correctamente
    require('@tailwindcss/typography'),
  ],
};
