import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Message, UserPreferences } from '@/types/learning';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function analyzeMessageHistory(messages: Message[]): Partial<UserPreferences> {
    const analysis: Partial<UserPreferences> = {
        communicationStyle: "formal",
        learningSpeed: "medium"
    };

    if (messages.length === 0) {
        return analysis;
    }

    const formalKeywords = ['köszönöm', 'kérem', 'tisztelettel', 'szeretném'];
    const casualKeywords = ['sziasztok', 'helló', 'oké', 'rendben'];

    let formalCount = 0;
    let casualCount = 0;

    messages.forEach(message => {
        const text = message.content.toLowerCase();
        formalKeywords.forEach(keyword => {
            if (text.includes(keyword)) formalCount++;
        });
        casualKeywords.forEach(keyword => {
            if (text.includes(keyword)) casualCount++;
        });
    });

    if (formalCount > casualCount * 2) {
        analysis.communicationStyle = "formal";
    } else if (casualCount > formalCount * 2) {
        analysis.communicationStyle = "casual";
    }

    const messageCount = messages.length;
    const timeSpan = messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime();
    const messagesPerHour = messageCount / (timeSpan / (1000 * 60 * 60));

    if (messagesPerHour < 5) {
        analysis.learningSpeed = "slow";
    } else if (messagesPerHour > 15) {
        analysis.learningSpeed = "fast";
    }

    return analysis;
} 