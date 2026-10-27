import sharedConfig from '../../packages/config/tailwind.config';

/** @type {import('tailwindcss').Config} */
export default {
  ...sharedConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};