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

        const prompt = `Kérlek, generálj egy élénk, emlékezetes képet a következő fogalomhoz: ${concept.name}
        Leírás: ${concept.description}
        Kategória: ${concept.category}
        
        A képnek tartalmaznia kell:
        1. Vizuális elemeket
        2. Mozgást
        3. Érzelmeket
        4. Színeket
        5. Szövegeket vagy szimbólumokat
        6. Térbeli elrendezést`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív memóriatechnika-szakértő vagy, aki élénk, emlékezetes képeket generál fogalmakhoz."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 500
        });

        const imagery = completion.choices[0].message.content;
        res.status(200).json({ imagery });
    } catch (error) {
        console.error('Error generating imagery:', error);
        res.status(500).json({ error: 'Failed to generate imagery' });
    }
} 