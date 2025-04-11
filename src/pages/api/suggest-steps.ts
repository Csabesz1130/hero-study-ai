import { NextApiRequest, NextApiResponse } from 'next';
import { GameMechanics, UserProgress } from '../../types/immersive';
import { aiService } from '../../services/ai-service';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { mechanics, progress } = req.body as {
            mechanics: GameMechanics;
            progress: UserProgress[];
        };

        const suggestions = await aiService.suggestNextSteps(mechanics, progress);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error suggesting next steps:', error);
        res.status(500).json({
            error: 'Internal server error',
