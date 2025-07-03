import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI(); // API key from OPENAI_API_KEY env var

interface ParsedDreamData {
  skills: string[];
  knowledgeDomains: string[];
  careerPathways: string[];
}

interface NarrativeGenerationApiRequest extends NextApiRequest {
  body: {
    dream: string;
    parsedDream: ParsedDreamData;
    genrePreference?: string;
    // In the future, we might add:
    // currentProgress?: any; // To track where the user is in their quest
    // previousSegment?: NarrativeSegment; // For context if generating subsequent segments
  };
}

export interface NarrativeSegment {
  segmentTitle: string;
  introductionText: string;
  challengeDescription: string;
  skillFocus: string;
  mentorFigure?: {
    name: string;
    dialogue: string;
  };
  milestoneAchieved?: string;
  nextStepPrompt: string;
}

export default async function handler(req: NarrativeGenerationApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { dream, parsedDream, genrePreference = 'Fantasy' } = req.body;

  if (!dream || !parsedDream || !parsedDream.skills || !parsedDream.knowledgeDomains) {
    return res.status(400).json({ error: 'Missing required fields: dream and parsedDream (with skills and knowledgeDomains).' });
  }

  // For simplicity, let's pick the first skill/domain to focus on for this segment.
  // A more advanced version would select based on progress or user choice.
  const currentSkillFocus = parsedDream.skills[0] || parsedDream.knowledgeDomains[0] || 'a new challenge';
  
  if (!currentSkillFocus) {
    return res.status(400).json({ error: 'No skills or knowledge domains found in parsedDream to focus on.' });
  }

  try {
    const systemPrompt = `
You are an AI Master Storyteller for "AI Dream Weaver," a quest-based learning system.
Your task is to generate an engaging narrative segment for a user's learning quest.
The user's ultimate dream is: "${dream}".
The key skills they need to develop are: ${parsedDream.skills.join(', ') || 'N/A'}.
The knowledge domains they need to explore are: ${parsedDream.knowledgeDomains.join(', ') || 'N/A'}.
The current segment should focus on the skill/domain: "${currentSkillFocus}".
The preferred narrative genre is: "${genrePreference}".

Generate a JSON object matching the NarrativeSegment structure:
{
  "segmentTitle": "string (A captivating title for this part of the quest)",
  "introductionText": "string (Set the scene, connect to the larger dream and genre. Max 2-3 sentences.)",
  "challengeDescription": "string (Describe a specific challenge or task related to '${currentSkillFocus}'. Make it sound like part of an epic quest. Max 2-3 sentences.)",
  "skillFocus": "string (Confirm the skill/domain: '${currentSkillFocus}')",
  "mentorFigure": { 
    "name": "string (Name of a mentor, guide, or mysterious character, fitting the genre)", 
    "dialogue": "string (A short piece of advice, a cryptic hint, or a challenge from this character related to the task. Max 1-2 sentences.)" 
  },
  "milestoneAchieved": "string (Optional: If this challenge represents a small milestone, describe it briefly. e.g., 'You've deciphered the first rune!'. Leave as null if not applicable yet.)",
  "nextStepPrompt": "string (A compelling hook or question to lead the user to the next part of their adventure or a decision point. Max 1-2 sentences.)"
}

Be creative and ensure the narrative is engaging and fits the genre.
The mentorFigure is optional; if you don't include one, make the mentorFigure field null.
The milestoneAchieved is optional; if not applicable, make it null.
Ensure the output is a valid JSON object.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Or 'gpt-4' for higher quality
      messages: [
        { role: 'system', content: systemPrompt },
        // We could add a user role message here if we want to refine the request based on user input for this specific segment
        { role: 'user', content: `Craft the next narrative segment for my quest to achieve: "${dream}", focusing on ${currentSkillFocus} in a ${genrePreference} style.`}
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Higher temperature for more creative/varied narratives
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      console.error('OpenAI narrative generation response content is null or undefined.');
      return res.status(500).json({ error: 'Failed to get a valid narrative response from AI model (empty content).' });
    }

    let parsedNarrative: NarrativeSegment;
    try {
      parsedNarrative = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse JSON narrative response from OpenAI:', parseError);
      console.error('Raw OpenAI narrative response string:', result);
      return res.status(500).json({ 
        error: 'Failed to parse AI model narrative response. The response was not valid JSON.', 
        rawResponse: result 
      });
    }
    
    // Basic validation (can be expanded)
    if (!parsedNarrative.segmentTitle || !parsedNarrative.introductionText || !parsedNarrative.challengeDescription || !parsedNarrative.nextStepPrompt) {
        console.error('Parsed narrative JSON does not match expected structure:', parsedNarrative);
        return res.status(500).json({ 
            error: 'AI model narrative response JSON does not have the expected structure.',
            parsedResponse: parsedNarrative
        });
    }

    return res.status(200).json(parsedNarrative);

  } catch (error: any) {
    console.error('Error calling OpenAI API for narrative generation:', error);
    let errorMessage = 'An unexpected error occurred while generating your narrative.';
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI API Error: ${error.status} ${error.name} - ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}
