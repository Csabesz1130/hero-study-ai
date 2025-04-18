import { MicroLearningContent } from '@/types/microLearning';

export class ContentCondenser {
    private static readonly MAX_DURATION = 5; // perc
    private static readonly MAX_WORDS = 300;
    private static readonly KEY_POINTS_RATIO = 0.2;

    public static condenseContent(content: string): string {
        // Szöveg előfeldolgozása
        const cleanedContent = this.preprocessContent(content);

        // Kulcsfontosságú pontok kinyerése
        const keyPoints = this.extractKeyPoints(cleanedContent);

        // Tartalom strukturálása
        const structuredContent = this.structureContent(keyPoints);

        // Tartalom optimalizálása mobil eszközökre
        return this.optimizeForMobile(structuredContent);
    }

    private static preprocessContent(content: string): string {
        // HTML címkék eltávolítása
        const withoutHtml = content.replace(/<[^>]*>/g, '');

        // Felesleges szóközök eltávolítása
        const cleaned = withoutHtml.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    private static extractKeyPoints(content: string): string[] {
        // Mondatok szétválasztása
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Mondatok súlyozása
        const weightedSentences = sentences.map(sentence => ({
            text: sentence,
            weight: this.calculateSentenceWeight(sentence)
        }));

        // Kulcsfontosságú mondatok kiválasztása
        const sortedSentences = weightedSentences.sort((a, b) => b.weight - a.weight);
        const keyPointsCount = Math.ceil(sentences.length * this.KEY_POINTS_RATIO);

        return sortedSentences
            .slice(0, keyPointsCount)
            .map(s => s.text.trim());
    }

    private static calculateSentenceWeight(sentence: string): number {
        let weight = 0;

        // Kulcsszavak súlyozása
        const keywords = ['fontos', 'kritikus', 'lényeges', 'fő', 'alapvető'];
        keywords.forEach(keyword => {
            if (sentence.toLowerCase().includes(keyword)) {
                weight += 2;
            }
        });

        // Hosszúság alapú súlyozás
        const words = sentence.split(' ');
        if (words.length >= 5 && words.length <= 15) {
            weight += 1;
        }

        // Kérdő mondatok súlyozása
        if (sentence.includes('?')) {
            weight += 1;
        }

        return weight;
    }

    private static structureContent(keyPoints: string[]): string {
        // Bevezető
        const introduction = "Nézzük meg a legfontosabb pontokat:";

        // Kulcspontok formázása
        const formattedPoints = keyPoints.map((point, index) =>
            `${index + 1}. ${point}`
        ).join('\n\n');

        // Összefoglaló
        const summary = "\n\nEzek a kulcsfontosságú megállapítások segítenek a témakör megértésében.";

        return `${introduction}\n\n${formattedPoints}${summary}`;
    }

    private static optimizeForMobile(content: string): string {
        // Rövid bekezdések létrehozása
        const paragraphs = content.split('\n\n');
        const optimizedParagraphs = paragraphs.map(p => {
            // Túl hosszú bekezdések felosztása
            if (p.length > 100) {
                return p.match(/.{1,100}(?:\s|$)/g)?.join('\n') || p;
            }
            return p;
        });

        return optimizedParagraphs.join('\n\n');
    }

    public static createMicroContent(
        title: string,
        originalContent: string,
        tags: string[],
        learningObjectives: string[]
    ): MicroLearningContent {
        const condensedContent = this.condenseContent(originalContent);

        return {
            id: crypto.randomUUID(),
            title,
            summary: this.extractKeyPoints(condensedContent)[0],
            content: condensedContent,
            duration: this.estimateDuration(condensedContent),
            difficulty: 'intermediate', // Alapértelmezett, felhasználói preferenciák alapján módosítható
            tags,
            learningObjectives,
            mediaUrls: [], // Opcionális médiák hozzáadása
            quiz: this.generateQuiz(condensedContent)
        };
    }

    private static estimateDuration(content: string): number {
        const words = content.split(/\s+/).length;
        const readingSpeed = 200; // szavak percenként
        const baseDuration = words / readingSpeed;

        // Minimum 1 perc, maximum 5 perc
        return Math.min(Math.max(Math.ceil(baseDuration), 1), this.MAX_DURATION);
    }

    private static generateQuiz(content: string) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const questions = sentences.slice(0, 3).map(sentence => ({
            text: `Mi a fő üzenete ennek a kijelentésnek: "${sentence.trim()}"?`,
            options: [
                sentence.trim(),
                this.generateDistractor(sentence),
                this.generateDistractor(sentence),
                this.generateDistractor(sentence)
            ],
            correctAnswer: 0
        }));

        return { questions };
    }

    private static generateDistractor(sentence: string): string {
        // Egyszerű distraktor generálás a mondat módosításával
        const words = sentence.split(' ');
        const modifiedWords = [...words];
        const indexToChange = Math.floor(Math.random() * words.length);
        modifiedWords[indexToChange] = this.getSimilarWord(words[indexToChange]);
        return modifiedWords.join(' ');
    }

    private static getSimilarWord(word: string): string {
        // Egyszerű szócsere logika
        const similarWords: Record<string, string[]> = {
            'fontos': ['lényeges', 'kritikus', 'alapvető'],
            'tanulás': ['oktatás', 'képzés', 'fejlesztés'],
            'tudás': ['ismeret', 'tudomány', 'megértés']
        };

        const lowerWord = word.toLowerCase();
        if (similarWords[lowerWord]) {
            return similarWords[lowerWord][Math.floor(Math.random() * similarWords[lowerWord].length)];
        }

        return word;
    }
} 