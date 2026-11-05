/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // The default, 'media', makes NativeWind throw on web. No dark class is ever set, so the app
  // stays light, as dark mode is out of scope.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Values from the Figma file's colour and text styles.
      colors: {
        primary: '#5F33E1',
        ink: '#24252C',
        muted: '#6E6A7C',
        soft: '#EDE8FF',
        date: '#AB94FF',
      },
      // Each weight is its own font file, so weight comes from the family, not font-semibold.
      fontFamily: {
        body: ['LexendDeca_400Regular'],
        heading: ['LexendDeca_600SemiBold'],
      },
    },
  },
  plugins: [],
};
