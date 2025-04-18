import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { UserPreferences } from '@/types/microLearning';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

class NotificationService {
    private messaging;
    private token: string | null = null;

    constructor() {
        const app = initializeApp(firebaseConfig);
        this.messaging = getMessaging(app);
    }

    public async requestPermission(): Promise<boolean> {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Értesítési engedély kérése sikertelen:', error);
            return false;
        }
    }

    public async getToken(): Promise<string | null> {
        try {
            if (!this.token) {
                this.token = await getToken(this.messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });
            }
            return this.token;
        } catch (error) {
            console.error('Token lekérése sikertelen:', error);
            return null;
        }
    }

    public async scheduleNotification(
        content: { title: string; body: string },
        userPreferences: UserPreferences
    ): Promise<void> {
        try {
            const token = await this.getToken();
            if (!token) return;

            // Ellenőrizzük, hogy az értesítések engedélyezve vannak-e
            if (!userPreferences.notificationEnabled) return;

            // Ellenőrizzük, hogy az aktuális időpont egyezik-e a preferált időpontokkal
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            const isPreferredTime = userPreferences.preferredTimes.some(time => {
                const [startHour, endHour] = time.time.split('-').map(Number);
                return currentHour >= startHour && currentHour <= endHour;
            });

            if (!isPreferredTime) return;

            // Értesítés küldése
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    notification: {
                        title: content.title,
                        body: content.body,
                    },
                    data: {
                        type: 'micro-learning',
                        timestamp: currentTime.toISOString(),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Értesítés küldése sikertelen');
            }
        } catch (error) {
            console.error('Értesítés ütemezése sikertelen:', error);
        }
    }

    public setupMessageHandler(
        onNotification: (payload: any) => void
    ): void {
        onMessage(this.messaging, (payload) => {
            onNotification(payload);
        });
    }

    public async updateNotificationPreferences(
        userId: string,
        preferences: Partial<UserPreferences>
    ): Promise<void> {
        try {
            const response = await fetch(`/api/users/${userId}/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            if (!response.ok) {
                throw new Error('Preferenciák frissítése sikertelen');
            }
        } catch (error) {
            console.error('Preferenciák frissítése sikertelen:', error);
        }
    }

    public async unsubscribe(): Promise<void> {
        try {
            const token = await this.getToken();
            if (!token) return;

            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            this.token = null;
        } catch (error) {
            console.error('Leiratkozás sikertelen:', error);
        }
    }
}

export const notificationService = new NotificationService(); 