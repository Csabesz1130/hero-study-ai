import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { analyticsService } from '@/services/analytics-service';
import { mlService } from '@/services/ml-service';

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
                const { startDate, endDate } = req.query;
                const data = await analyticsService.getUserAnalytics(
                    userId,
                    new Date(startDate as string),
                    new Date(endDate as string)
                );
                return res.status(200).json(data);
            } catch (error) {
                console.error('Hiba az analitikai adatok lekérdezése közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        case 'POST':
            try {
                const { type, data, sessionId, metadata } = req.body;
                const event = await analyticsService.trackEvent(userId, {
                    type,
                    data,
                    sessionId,
                    metadata,
                });

                // Automatikus tanulási stílus elemzés
                if (type === 'learning_interaction') {
                    const learningStyle = await mlService.analyzeLearningStyle(userId);
                    await analyticsService.updateLearningStyle(userId, learningStyle);
                }

                // Tudásmegtartás frissítése
                if (type === 'assessment_complete' && metadata?.topic) {
                    const retention = await mlService.predictKnowledgeRetention(
                        userId,
                        metadata.topic
                    );
                    await analyticsService.updateKnowledgeRetention(userId, retention);
                }

                return res.status(201).json(event);
            } catch (error) {
                console.error('Hiba az esemény rögzítése közben:', error);
                return res.status(500).json({ error: 'Belső szerver hiba' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 