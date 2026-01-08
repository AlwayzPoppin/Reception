import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.reception.app',
    appName: 'Reception AI',
    webDir: 'public', // We won't strictly use this for hybrid, but it's required
    server: {
        // IMPORTANT: Replace this with your Vercel URL after deployment!
        url: 'https://reception-1h728qey2-michael-watkins-projects-6087af1b.vercel.app',
        cleartext: false
    },
    // Plugins configuration
    plugins: {
        // We can add local notifications, haptics, etc. later
    }
};

export default config;
