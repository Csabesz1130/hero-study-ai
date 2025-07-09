import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const RATE_LIMIT = 100; // kérések száma
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 perc milliszekundumban

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string): boolean {
    const now = Date.now();
    const userData = requestCounts.get(ip);

    if (!userData) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (now > userData.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userData.count >= RATE_LIMIT) {
        return false;
    }

    userData.count++;
    return true;
}

export function withRateLimit(handler: Function) {
    return async function (req: Request) {
        const headersList = headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        if (!rateLimit(ip)) {
            return NextResponse.json(
                { error: 'Túl sok kérés. Kérlek várj egy kicsit.' },
                { status: 429 }
            );
        }

        return handler(req);
    };
}

export const rateLimiter = {
    async check(req: Request) {
        const headersList = headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const ok = rateLimit(ip);
        return { success: ok };
    },
}; 