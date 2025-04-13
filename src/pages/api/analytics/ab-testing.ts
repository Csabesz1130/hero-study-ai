import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { analyticsService } from '@/services/analytics-service';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
        return res.status(401).json({ error: 'Nincs bejelentkezve' });
    }

    const userId = session.user.id;

    switch (req.method) {
        case 'GET':
            try {
                const tests = await prisma.aBTest.findMany({
                    where: { status: 'active' },
                    include: {
                        assignments: {
                            where: { userId },
                        },
                    },
                });
                return res.status(200).json(tests);
            } catch (error) {
                console.error('Hiba az A/B tesztek lekérdezése közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        case 'POST':
            try {
                const { name, description, variants, startDate, endDate } = req.body;
                const test = await analyticsService.createABTest({
                    name,
                    description,
                    variants,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                return res.status(201).json(test);
            } catch (error) {
                console.error('Hiba az A/B teszt létrehozása közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 