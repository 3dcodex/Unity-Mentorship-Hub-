
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCareerAdvice = async (role: string, query: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As an expert career counselor for university students (especially from diverse backgrounds), provide advice for a ${role}. Query: ${query}`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });
  return response.text;
};

export const getMentorshipMatches = async (userData: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this user profile: ${JSON.stringify(userData)}, suggest 3 types of mentors they should look for and why. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                mentorType: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["mentorType", "reason"]
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateProfessionalHeadshot = async (description: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A highly professional, realistic 4k headshot for LinkedIn. The person is ${description}. Studio lighting, neutral background, professional attire, looking at camera.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateInterviewQuestion = async (role: string, level: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a professional interviewer. Provide ONE challenging interview question for a ${level} level ${role} position. Format it as a JSON object with "question" and "hint" fields.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          hint: { type: Type.STRING }
        },
        required: ["question", "hint"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
