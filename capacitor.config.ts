import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarvis.assistant',
  appName: 'JARVIS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
