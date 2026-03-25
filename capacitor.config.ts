import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nelbion.fasvia',
  appName: 'Fasvia',
  webDir: 'public',
  server: {
    url: 'https://fasvia-app.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
