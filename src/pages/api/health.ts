import { NextApiRequest, NextApiResponse } from 'next';
import { checkConnection } from '@/db/production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const dbHealth = await checkConnection();
        const status = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth ? 'ok' : 'error'
            }
        };

        return res.status(dbHealth ? 200 : 503).json(status);
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({
            status: 'error',
            error: 'Internal server error'
        });
    }
} 