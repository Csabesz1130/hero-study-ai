import { NextApiRequest, NextApiResponse } from 'next';
import { UserProgress, GameMechanics } from '../../types/immersive';
import { aiService } from '../../services/ai-service';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { progress, mechanics } = req.body as {
            progress: UserProgress[];
            mechanics: GameMechanics;
        };

        const analysis = await aiService.analyzeProgress(progress, mechanics);

        res.status(200).json(analysis);
    } catch (error) {
        console.error('Error analyzing progress:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
} 