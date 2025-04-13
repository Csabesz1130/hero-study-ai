import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { MemoryConcept, MemoryPalace } from '../../../types/memory';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { concept, palace } = req.body as { concept: MemoryConcept; palace: MemoryPalace };

        const prompt = `Kérlek, hozz létre asszociációkat a következő fogalom és a memóriapalota helyei között:
        
        Fogalom:
        Név: ${concept.name}
        Leírás: ${concept.description}
        Kategória: ${concept.category}
        
        Memóriapalota helyei:
        ${palace.locations.map(loc => `- ${loc.name}: ${loc.description}`).join('\n')}
        
        Minden helyhez generálj:
        1. Egy vizuális asszociációt
        2. Egy történetet vagy jelenetet
        3. Érzékszervi részleteket (látás, hallás, tapintás, szaglás, ízlelés)
        4. Mozgást vagy interakciót
        5. Érzelmi kapcsolatot`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív memóriatechnika-szakértő vagy, aki erős asszociációkat hoz létre fogalmak és helyek között."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 1000
        });

        const associations = JSON.parse(completion.choices[0].message.content || '{}');
        res.status(200).json({ associations });
    } catch (error) {
        console.error('Error creating associations:', error);
        res.status(500).json({ error: 'Failed to create associations' });
    }
} 