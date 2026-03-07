import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.moneymanager.app',
    appName: 'Clarity',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
