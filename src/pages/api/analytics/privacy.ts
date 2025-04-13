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
                const settings = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        preferences: true,
                    },
                });
                return res.status(200).json(settings?.preferences || {});
            } catch (error) {
                console.error('Hiba az adatvédelmi beállítások lekérdezése közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        case 'POST':
            try {
                const { settings } = req.body;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        preferences: settings,
                    },
                });

                // Ha az anonimizálás be van kapcsolva, végrehajtjuk
                if (settings.anonymizeData) {
                    await analyticsService.anonymizeUserData(userId);
                }

                return res.status(200).json({ message: 'Beállítások mentve' });
            } catch (error) {
                console.error('Hiba az adatvédelmi beállítások mentése közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 