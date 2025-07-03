import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client.
// The API key will be automatically picked up from the OPENAI_API_KEY environment variable.
const openai = new OpenAI();

interface DreamAnalysisRequest extends NextApiRequest {
  body: {
    dream: string;
  };
}

export default async function handler(req: DreamAnalysisRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { dream } = req.body;

  if (!dream || typeof dream !== 'string' || dream.trim() === '') {
    return res.status(400).json({ error: 'Dream text is required and must be a non-empty string.' });
  }

  try {
    const systemPrompt = `You are an AI assistant specialized in analyzing aspirational goals and dreams.
Your task is to parse the user's dream and extract key components: skills, knowledge domains, and potential career pathways.
Return the output as a structured JSON object with the following keys: "skills" (array of strings), "knowledgeDomains" (array of strings), and "careerPathways" (array of strings).

Example User Dream: "I want to be a master chef specializing in sustainable, farm-to-table Italian cuisine and open my own restaurant."
Example JSON Output:
{
  "skills": ["Advanced cooking techniques (Italian cuisine)", "Menu planning", "Kitchen management", "Sourcing ingredients (sustainable, local)", "Business management", "Customer service", "Food safety and hygiene"],
  "knowledgeDomains": ["Italian culinary history", "Sustainable agriculture", "Food science", "Restaurant operations", "Business finance", "Marketing"],
  "careerPathways": ["Head Chef", "Restaurant Owner/Operator", "Culinary Instructor", "Food Entrepreneur", "Sustainable Food Consultant"]
}

Ensure the JSON is valid and well-formed. The arrays should contain strings.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can also try 'gpt-4' for potentially better results
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze the following user dream: "${dream}"` },
      ],
      response_format: { type: "json_object" }, // Request JSON output from the model
      temperature: 0.3, // Lower temperature for more focused and deterministic output
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      console.error('OpenAI response content is null or undefined.');
      return res.status(500).json({ error: 'Failed to get a valid response from AI model (empty content).' });
    }

    // Attempt to parse the JSON string from the model
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse JSON response from OpenAI:', parseError);
      console.error('Raw OpenAI response string:', result);
      return res.status(500).json({ 
        error: 'Failed to parse AI model response. The response was not valid JSON.', 
        rawResponse: result 
      });
    }

    // Basic validation of the parsed structure (optional but good practice)
    if (!parsedResult.skills || !parsedResult.knowledgeDomains || !parsedResult.careerPathways ||
        !Array.isArray(parsedResult.skills) || !Array.isArray(parsedResult.knowledgeDomains) || !Array.isArray(parsedResult.careerPathways)) {
      console.error('Parsed JSON does not match expected structure:', parsedResult);
      return res.status(500).json({ 
        error: 'AI model response JSON does not have the expected structure (skills, knowledgeDomains, careerPathways arrays).',
        parsedResponse: parsedResult
      });
    }
    
    return res.status(200).json(parsedResult);

  } catch (error: any) {
    console.error('Error calling OpenAI API or processing its response:', error);
    let errorMessage = 'An unexpected error occurred while processing your dream.';
    // Check if it's an OpenAI APIError
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI API Error: ${error.status} ${error.name} - ${error.message}`;
      // You might want to log error.headers or error.error (which contains the raw error object from OpenAI)
      console.error('OpenAI API Error details:', { status: error.status, name: error.name, message: error.message, type: error.type, code: error.code });
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}
