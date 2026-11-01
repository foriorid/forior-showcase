/** Konfigurasi Tailwind untuk build CSS statis.
 *  Rebuild setelah mengubah kelas di index.html:
 *    npm install && npm run build:css
 */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        foriorBrand: '#281775',
        appleBg: '#F5F5F7',
        appleDark: '#1D1D1F',
        appleGray: '#6E6E73',
        appleCard: '#FFFFFF',
        appleBorder: '#E5E5EA',
      },
    },
  },
};
