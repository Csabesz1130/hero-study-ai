import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { EducationalContent } from '../../../types/educational-content';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content } = req.body as { content: EducationalContent };

        // Infografika generálása
        const infographicPrompt = `Kérlek, generálj egy infografikát a következő tartalomhoz: ${content.title}
        Tartalom: ${content.originalText}
        
        Az infografikának tartalmaznia kell:
        1. Főbb pontok vizuális ábrázolását
        2. Kapcsolódó ikonokat és szimbólumokat
        3. Színes és vonzó elrendezést
        4. Könnyen követhető folyamatábrát
        5. Kulcsfogalmak kiemelését`;

        const infographic = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív infografika-tervező vagy, aki szöveges tartalmat alakít át vizuális formátumba."
                },
                {
                    role: "user",
                    content: infographicPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        // Animáció leírás generálása
        const animationPrompt = `Kérlek, generálj egy animáció leírást a következő tartalomhoz: ${content.title}
        Tartalom: ${content.originalText}
        
        Az animációnak tartalmaznia kell:
        1. Mozgás és átmenetek leírását
        2. Karakterek és tárgyak viselkedését
        3. Időzítést és tempót
        4. Vizuális effekteket
        5. Hanghatásokat`;

        const animation = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív animátor vagy, aki szöveges tartalmat alakít át animációs formátumba."
                },
                {
                    role: "user",
                    content: animationPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        // Diagram generálása
        const diagramPrompt = `Kérlek, generálj egy diagram leírást a következő tartalomhoz: ${content.title}
        Tartalom: ${content.originalText}
        
        A diagramnak tartalmaznia kell:
        1. Kapcsolatok és hierarchia ábrázolását
        2. Adatok és trendek vizualizálását
        3. Összehasonlító elemeket
        4. Jelmagyarázatot
        5. Könnyen értelmezhető struktúrát`;

        const diagram = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Te egy kreatív diagram-tervező vagy, aki szöveges tartalmat alakít át diagram formátumba."
                },
                {
                    role: "user",
                    content: diagramPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        res.status(200).json({
            infographic: infographic.choices[0].message.content,
            animation: animation.choices[0].message.content,
            diagram: diagram.choices[0].message.content
        });
    } catch (error) {
        console.error('Error transforming content to visual:', error);
        res.status(500).json({ error: 'Failed to transform content to visual format' });
    }
} 