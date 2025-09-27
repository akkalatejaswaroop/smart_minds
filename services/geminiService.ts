import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { OutputType, GeneratedContent } from '../types';

export interface GenerateContentParams {
  outputType: OutputType;
  subject: string;
  concept: string;
  purpose: string;
  language: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const PROMPT_TEMPLATES = {
  explanation: `
Generate a comprehensive educational guide for the concept '{concept}' within the subject '{subject}'. 
The target audience is a student '{purpose}'. The tone should be academic, clear, and encouraging.
Respond in {language}.

Format the entire response using Markdown. Structure the guide with the following sections, using the exact headings provided:

# {concept}

## Learning Objectives
- After studying this material, you should be able to:
- (List 3-4 specific, measurable learning outcomes)

## Core Concepts
- (Provide a detailed, step-by-step explanation of the concept.)
- (Use subheadings with '###' for breaking down complex parts.)
- (Use bullet points, numbered lists, and **bold text** to improve clarity.)

## Key Takeaways
- (Summarize the 3-5 most critical points in a concise bulleted list.)

## Practice Questions
- (Provide 2-3 practice questions to test understanding.)
- (Include a mix of question types, like multiple-choice or short-answer.)
- (Provide the correct answer and a brief explanation for each question.)
`,
  presentation: `
Generate a professional presentation script for the concept '{concept}' from '{subject}'.
The script should be structured slide-by-slide, with clear headings and speaker notes.
Respond in {language}.

Use the following Markdown format:

## Slide 1: Title Slide
- **Title:** {concept}
- **Subtitle:** A deep dive into {subject}
- **Presenter:** SMART MINDS AI

## Slide 2: Agenda
- Introduction to the Concept
- Core Principles Explained
- Practical Examples
- Key Summary
- Q&A

## Slide 3: Introduction
- **Speaker Notes:** (Start with a hook to grab the audience's attention. Briefly explain what {concept} is and why it's important in the context of {subject}.)

(Continue generating slides for Core Principles, Examples, and Summary, each with clear speaker notes.)

## Slide 6: Conclusion & Q&A
- **Speaker Notes:** (Summarize the key takeaways. Thank the audience and open the floor for questions.)
`,
  examples: `
Provide two distinct and well-explained examples for the concept '{concept}' ({subject}).
Start with a brief introduction about why examples are crucial for mastering this topic.
Respond in {language}.

Use the following Markdown format:

### Introduction
(A short paragraph on the importance of practical examples for this concept.)

### Example 1: Academic/Technical Scenario
- **Scenario:** (Describe a detailed, technical scenario suitable for a university-level student.)
- **Application:** (Explain step-by-step how the concept is applied within this scenario.)
- **Outcome:** (Describe the result of applying the concept.)

### Example 2: Real-World Analogy
- **Scenario:** (Describe a simple, relatable, real-world scenario.)
- **Application:** (Explain how the concept applies in this simplified context.)
- **Outcome:** (Describe the result, making the connection back to the core concept clear.)

### Summary of Examples
(Briefly conclude by highlighting the key differences and insights from both examples.)
`,
  summary: `
Generate a concise, easy-to-digest summary for the concept '{concept}' within the subject '{subject}'.
The target audience is a student '{purpose}'. The tone should be clear and direct.
Respond in {language}.

Format the response as a well-structured bulleted list using Markdown.
- Start with a main heading for the concept.
- Use nested bullet points for clarity.
- **Bold** key terms.
`
};

const CONCEPT_MAP_PROMPT = `Generate a concept map for '{concept}' ({subject}).
1.  **Summary:** Provide a short, concise summary of the concept (under 100 words).
2.  **Mermaid Code:** Provide the concept map in Mermaid.js flowchart syntax (using \`graph TD;\`). The map must visually explain the key ideas and their relationships.
    - IMPORTANT: Enclose all node text in double quotes to prevent syntax errors with special characters (e.g., A["Node Text with (parentheses)"]).

Respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json. The JSON object should have two keys: "summary" and "mermaidCode". Respond in {language}.`;

const CONCEPT_MAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A short, concise summary of the concept.'
    },
    mermaidCode: {
      type: Type.STRING,
      description: 'The concept map in Mermaid.js flowchart syntax (graph TD).'
    },
  },
  required: ["summary", "mermaidCode"],
};

const QUIZ_PROMPT = `Generate an interactive multiple-choice quiz with 3 questions for the concept '{concept}' ({subject}). For each question, provide 4 options, indicate the correct answer, and give a brief explanation for why the answer is correct. Respond ONLY with a valid JSON object containing a single key "quiz", which holds an array of question objects. Do not include markdown formatting like \`\`\`json. Respond in {language}.`;

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    quiz: {
      type: Type.ARRAY,
      description: "An array of quiz questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The quiz question."
          },
          options: {
            type: Type.ARRAY,
            description: "An array of 4 possible answers.",
            items: {
              type: Type.STRING
            }
          },
          answer: {
            type: Type.STRING,
            description: "The correct answer, which must be one of the strings from the 'options' array."
          },
          explanation: {
            type: Type.STRING,
            description: "A brief explanation for why the answer is correct."
          }
        },
        required: ["question", "options", "answer", "explanation"]
      }
    }
  },
  required: ["quiz"]
};

const fillTemplate = (template: string, params: Omit<GenerateContentParams, 'outputType'>) => 
  template.replace(/{concept}/g, params.concept)
          .replace(/{subject}/g, params.subject)
          .replace(/{purpose}/g, params.purpose)
          .replace(/{language}/g, params.language);


export const generateTextStream = async ({
  outputType,
  subject,
  concept,
  purpose,
  language
}: GenerateContentParams): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const prompt = fillTemplate(PROMPT_TEMPLATES[outputType as keyof typeof PROMPT_TEMPLATES], { subject, concept, purpose, language });
  
  const stream = await ai.models.generateContentStream({
      model,
      contents: prompt,
  });

  return stream;
};

export const generateConceptMap = async ({
  subject,
  concept,
  purpose,
  language
}: GenerateContentParams): Promise<GeneratedContent> => {
  const prompt = fillTemplate(CONCEPT_MAP_PROMPT, { subject, concept, purpose, language });
  const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: CONCEPT_MAP_SCHEMA,
      },
  });
  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateQuiz = async ({
  subject,
  concept,
  purpose,
  language
}: GenerateContentParams): Promise<GeneratedContent> => {
  const prompt = fillTemplate(QUIZ_PROMPT, { subject, concept, purpose, language });
  const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: QUIZ_SCHEMA,
      },
  });
  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};