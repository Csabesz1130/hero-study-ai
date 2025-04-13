import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { MemoryConcept } from '../../../types/memory';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { concept } = req.body as { concept: MemoryConcept };

        const prompt = `Kérlek, generálj többérzékszervi erősítéseket a következő fogalomhoz: ${concept.name}
        Leírás: ${concept.description}
        Kategória: ${concept.category}
        
        Generálj:
        1. Vizuális gyakorlatokat (rajzolás, diagramok, szimbólumok)
        2. Hallás utáni gyakorlatokat (szöveg, zene, hangok)
        3. Kinézetikus gyakorlatokat (mozgás, gesztusok, tárgyak manipulálása)
        4. Olfaktorikus asszociációkat (szagok, illatok)
        5. Gustatorikus asszociációkat (ízök, ízletek)
        6. Érzelmi kapcsolatokat
        7. Térbeli gyakorlatokat`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív memóriatechnika-szakértő vagy, aki többérzékszervi erősítéseket generál fogalmakhoz."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 1000
        });

        const reinforcement = JSON.parse(completion.choices[0].message.content || '{}');
        res.status(200).json({ reinforcement });
    } catch (error) {
        console.error('Error generating multimodal reinforcement:', error);
        res.status(500).json({ error: 'Failed to generate multimodal reinforcement' });
    }
} 