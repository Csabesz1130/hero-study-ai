import { NextApiRequest, NextApiResponse } from 'next';
import { UserPreferences, UserProgress } from '../../types/learning';
import { aiService } from '../../services/ai-service';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { preferences, progress } = req.body as {
            preferences: UserPreferences;
            progress: UserProgress[];
        };

        const content = await aiService.generatePersonalizedContent(preferences, progress);

        res.status(200).json(content);
    } catch (error) {
        console.error('Error generating personalized content:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
} 