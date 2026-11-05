/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // The default, 'media', makes NativeWind throw on web. No dark class is ever set, so the app
  // stays light, as dark mode is out of scope.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
