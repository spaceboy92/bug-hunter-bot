import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { 
  GEMINI_MODEL_NAME, 
  getWebsiteAnalysisPrompt, 
  WebsiteAnalysisResult, 
  GroundingChunk,
  getQueryGenerationPrompt,
  QueryGenerationResponse,
  getAgentNextQueryPrompt,
  AgentReasoningResponse,
} from '../constants';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper to sanitize and parse JSON from Gemini
const parseGeminiJsonResponse = (text: string, context?: string): any => {
  let jsonStr = text.trim();
  
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/; 
  const match = jsonStr.match(fenceRegex);

  if (match && match[1]) {
    jsonStr = match[1].trim();
  } else {
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const rawPreview = text.trim().substring(0, 500);
    console.error(`Failed to parse JSON response${context ? ` for ${context}` : ''}. Error: ${e instanceof Error ? e.message : String(e)}. Raw text preview: "${rawPreview}"`);
    throw new Error(`Received an invalid JSON response from the API${context ? ` for ${context}` : ''}. The response might be malformed. Check console for details.`);
  }
};

const handleGeminiApiError = (error: any, contextInfo: string): Error => {
    console.error(`Error calling Gemini API for ${contextInfo}:`, error);
    let errorMessage = `An unknown error occurred while communicating with the Gemini API for ${contextInfo}.`;

    if (error instanceof Error) {
        errorMessage = `API request failed while ${contextInfo}: ${error.message}`;
    } else if (typeof error === 'object' && error !== null) {
        const apiError = (error as any).error || error;
        if (apiError.message) {
            errorMessage = `Gemini API Error: ${apiError.message}`;
        }
        if (apiError.status) {
            errorMessage += ` (Status: ${apiError.status})`;
        }
        if (apiError.status === "RESOURCE_EXHAUSTED" || apiError.code === 429) {
            errorMessage = `You've exceeded your Gemini API quota. Please check your Google AI plan and billing details. (Status: ${apiError.status})`;
        }
    }
    
    return new Error(errorMessage);
};

export const generateFollowUpQuery = async (topic: string, history: { query: string, findingsSummary: string }[]): Promise<AgentReasoningResponse> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API Key is not configured.");
    }

    const prompt = getAgentNextQueryPrompt(topic, history);

    const requestParams: GenerateContentParameters = {
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.5,
        },
    };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent(requestParams);
        const responseText = response.text;
        if (!responseText) {
            throw new Error("Received an empty response from the API while generating follow-up query.");
        }
        
        const parsedJson = parseGeminiJsonResponse(responseText, 'generating follow-up query') as AgentReasoningResponse;
        
        if (!parsedJson || !parsedJson.reasoning || !parsedJson.nextQuery) {
            console.error("Parsed JSON for agent reasoning does not match expected structure:", parsedJson);
            throw new Error("API response for agent reasoning does not conform to the expected data structure.");
        }

        return parsedJson;

    } catch (error) {
        throw handleGeminiApiError(error, `agent follow-up query generation`);
    }
};

export const generateInitialQueries = async (): Promise<string[]> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API Key is not configured.");
    }

    const prompt = getQueryGenerationPrompt();

    const requestParams: GenerateContentParameters = {
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.8,
            thinkingConfig: { thinkingBudget: 0 },
        },
    };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent(requestParams);
        const responseText = response.text;
        if (!responseText) {
            throw new Error("Received an empty response from the API while generating queries.");
        }
        
        const parsedJson = parseGeminiJsonResponse(responseText, 'generating queries') as QueryGenerationResponse;
        
        if (!parsedJson || !Array.isArray(parsedJson.queries) || parsedJson.queries.length === 0) {
            console.error("Parsed JSON for queries does not match expected structure:", parsedJson);
            throw new Error("API response for queries does not conform to the expected data structure.");
        }

        return parsedJson.queries;

    } catch (error) {
        throw handleGeminiApiError(error, `query generation`);
    }
};

export const searchAndAnalyzeWebsites = async (searchQuery: string): Promise<WebsiteAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }
  
  const fullPrompt = getWebsiteAnalysisPrompt(searchQuery);
  
  const requestParams: GenerateContentParameters = {
    model: GEMINI_MODEL_NAME,
    contents: fullPrompt,
    config: {
      tools: [{googleSearch: {}}],
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent(requestParams);
    
    const responseText = response.text;
    if (!responseText) {
        throw new Error("Received an empty response from the API during website analysis.");
    }

    const parsedJson = parseGeminiJsonResponse(responseText, `analyzing query "${searchQuery}"`);
    
    if (typeof parsedJson !== 'object' || parsedJson === null || !Array.isArray(parsedJson.analyzedSites)) {
        console.error("Parsed JSON does not match expected structure for website analysis:", parsedJson);
        throw new Error("API response does not conform to the expected data structure for website analysis.");
    }

    const result: WebsiteAnalysisResult = {
        searchQuery: parsedJson.searchQuery || searchQuery, 
        analyzedSites: parsedJson.analyzedSites,
        groundingData: response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined
    };
    
    return result;

  } catch (error) {
     throw handleGeminiApiError(error, `website analysis for query "${searchQuery}"`);
  }
};