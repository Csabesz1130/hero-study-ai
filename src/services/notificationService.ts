import { app } from '@/lib/firebase-app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { UserPreferences } from '@/types/microLearning';
import { ReviewSchedule } from '@/types/spacedRepetition';

export interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
}

export class NotificationService {
    private static instance: NotificationService;
    private messaging;
    private token: string | null = null;
    private permission: NotificationPermission = 'default';
    private notificationTimeouts: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {
        this.messaging = getMessaging(app);
        this.requestPermission();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private async requestPermission(): Promise<void> {
        if (!('Notification' in window)) {
            console.warn('A böngésző nem támogatja az értesítéseket');
            return;
        }

        try {
            this.permission = await Notification.requestPermission();
        } catch (error) {
            console.error('Hiba történt az értesítési engedély kérése során:', error);
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

    public async scheduleReviewNotifications(
        reviews: ReviewSchedule[],
        options: Partial<NotificationOptions> = {}
    ): Promise<void> {
        // Töröljük a meglévő időzítéseket
        this.clearAllNotifications();

        const defaultOptions: NotificationOptions = {
            title: 'Ismétlés időpontja',
            body: 'Ideje átnézni a tanulási anyagokat!',
            icon: '/icons/notification-icon.png',
            badge: '/icons/badge-icon.png',
            tag: 'review-notification',
            requireInteraction: true,
            silent: false
        };

        const finalOptions = { ...defaultOptions, ...options };

        reviews.forEach(review => {
            const timeUntilReview = review.scheduledDate.getTime() - Date.now();

            if (timeUntilReview > 0) {
                const timeout = setTimeout(() => {
                    this.showNotification(finalOptions);
                }, timeUntilReview);

                this.notificationTimeouts.set(review.id, timeout);
            }
        });
    }

    public clearAllNotifications(): void {
        this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.notificationTimeouts.clear();
    }

    public clearNotification(reviewId: string): void {
        const timeout = this.notificationTimeouts.get(reviewId);
        if (timeout) {
            clearTimeout(timeout);
            this.notificationTimeouts.delete(reviewId);
        }
    }

    private showNotification(options: NotificationOptions): void {
        if (this.permission !== 'granted') {
            console.warn('Nincs engedély az értesítések megjelenítéséhez');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            // Egyszerű böngésző értesítés
            new Notification(options.title, {
                body: options.body,
                icon: options.icon,
                tag: options.tag,
                requireInteraction: options.requireInteraction,
                silent: options.silent
            });
        } else {
            // Service Worker alapú értesítés
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(options.title, {
                    body: options.body,
                    icon: options.icon,
                    badge: options.badge,
                    tag: options.tag,
                    data: options.data,
                    requireInteraction: options.requireInteraction,
                    silent: options.silent
                });
            });
        }
    }

    public async registerPushNotifications(
        serviceWorkerRegistration: ServiceWorkerRegistration
    ): Promise<void> {
        try {
            const subscription = await serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });

            // Küldjük el a subscription adatokat a szervernek
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('Hiba történt a push értesítések regisztrálása során:', error);
        }
    }
}

export const notificationService = NotificationService.getInstance(); 