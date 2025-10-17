// FIX: Import new types to support added features.
// fix: Added Chat to the import from @google/genai.
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { OutputType, GeneratedContent, Book, DebateArguments, LearningPathModule, CodeAnalysisResult } from '../types';

export interface GenerateContentParams {
  outputType: OutputType;
  concept: string;
  purpose: string;
  language: string;
  complexity: string;
  tone?: string;
  context?: string;
}

export interface GenerateSummaryParams {
    bookTitle: string;
    content: string;
    scope: string; // e.g., 'the entire book' or 'the chapter "Introduction"'
    format: 'paragraph' | 'bullets' | 'concept-map';
    purpose: string;
    language: string;
}

export interface ContentInsightParams {
  bookTitle?: string;
  textContent?: string;
  insightType: 'summary' | 'concepts' | 'characters' | 'highlights' | 'quiz' | 'concept-map' | 'tone-style' | 'glossary' | 'eli5' | 'discussion-questions';
  format: 'paragraph' | 'bullets';
  purpose: string;
  language: string;
}


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const PROMPT_TEMPLATES = {
  explanation: `
Generate a concise explanation for the concept '{concept}'. 
The explanation should be specifically tailored for a user whose purpose is '{purpose}'.
The explanation should be clear, easy to understand, at a '{complexity}' level, and focused, similar in length and detail to a '5-mark' answer in an exam. 
The tone of the explanation should be '{tone}'. 
Avoid unnecessary jargon or overly deep dives unless the purpose is 'In-depth Knowledge'.
Respond in {language}.

Format the response using simple Markdown. Use a main heading for the concept, followed by bullet points or short paragraphs for the key points.
`,
  presentation: `
Generate a professional presentation script for the concept '{concept}'.
The presentation should be designed to help someone with the goal of '{purpose}'.
The script should be structured slide-by-slide, with clear headings and speaker notes, tailored to a '{complexity}' level of understanding.
Respond in {language}.

Use the following Markdown format:

## Slide 1: Title Slide
- **Title:** {concept}
- **Subtitle:** A presentation for the purpose of: {purpose}
- **Presenter:** SMART MINDS AI

## Slide 2: Agenda
- Introduction to the Concept
- Core Principles Explained
- Practical Examples
- Key Summary
- Q&A

## Slide 3: Introduction
- **Speaker Notes:** (Start with a hook to grab the audience's attention. Briefly explain what {concept} is and why it's important for '{purpose}'.)

(Continue generating slides for Core Principles, Examples, and Summary, each with clear speaker notes tailored to the purpose.)

## Slide 6: Conclusion & Q&A
- **Speaker Notes:** (Summarize the key takeaways. Thank the audience and open the floor for questions.)
`,
  examples: `
Provide two distinct and well-explained examples for the concept '{concept}'.
The examples should be suitable for a user whose goal is '{purpose}' and for a '{complexity}' level of understanding.
Start with a brief introduction about why examples are crucial for mastering this topic, especially for the user's purpose.
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
(Briefly conclude by highlighting how these examples help with the user's purpose of '{purpose}'.)
`,
  summary: `
Generate a concise, easy-to-digest summary for the concept '{concept}'.
The summary should be created for a user whose purpose is '{purpose}'. The summary's complexity should be '{complexity}'.
The tone should be clear and direct.
Respond in {language}.

Format the response as a well-structured bulleted list using Markdown.
- Start with a main heading for the concept.
- Use nested bullet points for clarity.
- **Bold** key terms.
`
};

const CONCEPT_MAP_PROMPT = `Generate a concept map for '{concept}'. The summary and map should be tailored for a user whose purpose is '{purpose}' and for a '{complexity}' level of understanding.
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

const QUIZ_PROMPT = `Generate an interactive multiple-choice quiz with 3 questions for the concept '{concept}'. The difficulty should be at a '{complexity}' level, suitable for a user whose purpose is '{purpose}'. For each question, provide 4 options, indicate the correct answer, and give a brief explanation for why the answer is correct. Respond ONLY with a valid JSON object containing a single key "quiz", which holds an array of question objects. Do not include markdown formatting like \`\`\`json. Respond in {language}.`;

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

const HIGHLIGHTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    highlights: {
      type: Type.OBJECT,
      properties: {
        keyIdeas: {
          type: Type.ARRAY,
          description: "A list of key ideas or themes from the book.",
          items: { type: Type.STRING }
        },
        quotes: {
          type: Type.ARRAY,
          description: "A list of notable quotes from the book.",
          items: { type: Type.STRING }
        },
        passages: {
          type: Type.ARRAY,
          description: "A list of significant passages or excerpts from the book.",
          items: { type: Type.STRING }
        },
      },
      required: ["keyIdeas", "quotes", "passages"]
    }
  },
  required: ["highlights"]
};

const GLOSSARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    glossary: {
      type: Type.ARRAY,
      description: 'A list of key terms and their definitions.',
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: 'The key term.' },
          definition: { type: Type.STRING, description: 'The definition of the term in context.' },
        },
        required: ['term', 'definition'],
      },
    },
  },
  required: ['glossary'],
};

// FIX: Add schemas for new features: Debate, Learning Path, and Code Analysis.
const DEBATE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pro: {
      type: Type.ARRAY,
      description: "A list of arguments for the topic.",
      items: { type: Type.STRING }
    },
    con: {
      type: Type.ARRAY,
      description: "A list of arguments against the topic.",
      items: { type: Type.STRING }
    }
  },
  required: ["pro", "con"]
};

const LEARNING_PATH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    path: {
      type: Type.ARRAY,
      description: "An array of learning modules.",
      items: {
        type: Type.OBJECT,
        properties: {
          moduleTitle: { type: Type.STRING, description: "The title of the learning module." },
          description: { type: Type.STRING, description: "A brief description of what the module covers." },
          keyTopics: {
            type: Type.ARRAY,
            description: "A list of key topics to cover in this module.",
            items: { type: Type.STRING }
          },
          resources: {
            type: Type.ARRAY,
            description: "A list of recommended learning resources.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the resource." },
                url: { type: Type.STRING, description: "The URL to the resource." },
                type: { type: Type.STRING, description: "The type of resource (e.g., Video, Article, Documentation, Course)." }
              },
              required: ["title", "url", "type"]
            }
          }
        },
        required: ["moduleTitle", "description", "keyTopics"]
      }
    }
  },
  required: ["path"]
};

const CODE_EXPLANATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A high-level summary of what the code does." },
    lineByLineExplanation: {
      type: Type.ARRAY,
      description: "A line-by-line or block-by-block explanation of the code.",
      items: {
        type: Type.OBJECT,
        properties: {
          lines: { type: Type.STRING, description: "The line number(s) this explanation refers to (e.g., '1-3')." },
          explanation: { type: Type.STRING, description: "The explanation for this line or block of code." }
        },
        required: ["lines", "explanation"]
      }
    },
    keyConcepts: {
      type: Type.ARRAY,
      description: "A list of key programming concepts demonstrated in the code.",
      items: { type: Type.STRING }
    }
  },
  required: ["summary", "lineByLineExplanation", "keyConcepts"]
};

const CODE_DEBUG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysisSummary: { type: Type.STRING, description: "A summary of the code's functionality and any issues found." },
    bugs: {
      type: Type.ARRAY,
      description: "A list of identified bugs or potential issues in the code.",
      items: {
        type: Type.OBJECT,
        properties: {
          line: { type: Type.STRING, description: "The line number where the bug is located." },
          issue: { type: Type.STRING, description: "A description of the bug or potential issue." },
          suggestion: { type: Type.STRING, description: "A suggestion on how to fix the issue." }
        },
        required: ["line", "issue", "suggestion"]
      }
    },
    correctedCode: { type: Type.STRING, description: "The complete, corrected version of the code snippet." }
  },
  required: ["analysisSummary", "bugs", "correctedCode"]
};


const fillTemplate = (template: string, params: Omit<GenerateContentParams, 'outputType' | 'context'>) => {
  let languageInstruction = params.language;
  if (params.language === 'Tenglish') {
    // Provide a clear definition of "Tenglish" for the model to prevent confusion with Hindi.
    languageInstruction = 'Tenglish (which is the Telugu language written in the English alphabet, commonly used for text messaging)';
  }

  return template.replace(/{concept}/g, params.concept)
                 .replace(/{purpose}/g, params.purpose)
                 .replace(/{language}/g, languageInstruction)
                 .replace(/{complexity}/g, params.complexity)
                 .replace(/{tone}/g, params.tone || 'neutral');
};


export const generateTextStream = async function* ({
  outputType,
  concept,
  purpose,
  language,
  complexity,
  tone,
  context
}: GenerateContentParams): AsyncGenerator<GenerateContentResponse> {
  const userRequest = fillTemplate(PROMPT_TEMPLATES[outputType as keyof typeof PROMPT_TEMPLATES], { concept, purpose, language, complexity, tone });
  
  let finalPrompt = userRequest;
  if (context) {
    finalPrompt = `You will be provided with a document as context. Your task is to use this context to answer the user's request about a specific concept.

--- DOCUMENT CONTEXT ---
${context}
------------------------

--- USER REQUEST ---
${userRequest}

Please ensure your response is based primarily on the information given in the document context.`;
  }
  
  const stream = await ai.models.generateContentStream({
      model,
      contents: finalPrompt,
  });

  for await (const chunk of stream) {
    yield chunk;
  }
};

export const generateConceptMap = async ({
  concept,
  purpose,
  language,
  complexity,
  context,
  tone
}: GenerateContentParams): Promise<GeneratedContent> => {
  const userRequest = fillTemplate(CONCEPT_MAP_PROMPT, { concept, purpose, language, complexity, tone });

  let finalPrompt = userRequest;
  if (context) {
    finalPrompt = `You will be provided with a document as context. Your task is to use this context to answer the user's request about a specific concept.

--- DOCUMENT CONTEXT ---
${context}
------------------------

--- USER REQUEST ---
${userRequest}

Please ensure your response is based primarily on the information given in the document context and strictly follows the requested JSON format.`;
  }
  
  const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: CONCEPT_MAP_SCHEMA,
      },
  });
  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateQuiz = async ({
  concept,
  purpose,
  language,
  complexity,
  context,
  tone
}: GenerateContentParams): Promise<GeneratedContent> => {
  const userRequest = fillTemplate(QUIZ_PROMPT, { concept, purpose, language, complexity, tone });
  
  let finalPrompt = userRequest;
  if (context) {
      finalPrompt = `You will be provided with a document as context. Your task is to use this context to answer the user's request about a specific concept.

--- DOCUMENT CONTEXT ---
${context}
------------------------

--- USER REQUEST ---
${userRequest}

Please ensure your response is based primarily on the information given in the document context and strictly follows the requested JSON format.`;
  }

  const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: QUIZ_SCHEMA,
      },
  });
  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateQuizFromContent = async (content: string): Promise<GeneratedContent> => {
    const prompt = `Generate an interactive multiple-choice quiz with 3 questions based on the following text. For each question, provide 4 options, the correct answer, and an explanation. Respond ONLY with a valid JSON object with a "quiz" key.
    
    Text: """${content}"""`;
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
}

export const generateBookSummary = async (params: GenerateSummaryParams): Promise<GeneratedContent> => {
    const formatInstruction = {
        paragraph: 'Provide a well-structured summary in paragraph form. Format using Markdown.',
        bullets: 'Provide a summary as a well-structured, nested bulleted list. Format using Markdown.',
        'concept-map': 'Provide a summary and a Mermaid.js concept map. Respond ONLY with a valid JSON object with keys "summary" and "mermaidCode". The mermaidCode should be a "graph TD" flowchart.'
    }[params.format];

    const prompt = `
    You are an expert academic summarizer.
    Summarize the following content from the book '${params.bookTitle}'.
    The user wants to summarize: ${params.scope}.
    The desired format is: ${params.format}.
    The summary should be tailored for this purpose: '${params.purpose}'.
    Respond in ${params.language}.

    --- INSTRUCTIONS ---
    ${formatInstruction}

    --- CONTENT TO SUMMARIZE ---
    ${params.content}
    `;

    if (params.format === 'concept-map') {
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
    } else {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return { text: response.text };
    }
};

export const generateContentInsights = async (params: ContentInsightParams): Promise<GeneratedContent> => {
    let contextPrompt: string;
    if (params.textContent) {
        // Truncate content to avoid exceeding token limits. This is a simple approach.
        const truncatedContent = params.textContent.length > 100000 ? params.textContent.substring(0, 100000) : params.textContent;
        contextPrompt = `Based on the following document content:\n\n"""\n${truncatedContent}\n"""\n\n`;
    } else if (params.bookTitle) {
        contextPrompt = `Based on your extensive knowledge of literature and digital resources, analyze the book "${params.bookTitle}". `;
    } else {
        throw new Error('Either bookTitle or textContent must be provided.');
    }
    
    let prompt = `${contextPrompt}The user's goal is: "${params.purpose}". Respond in ${params.language}. `;
    let schema: object | undefined = undefined;
    let isJsonOutput = false;

    switch (params.insightType) {
        case 'summary':
            prompt += `Generate a comprehensive summary in ${params.format} format. Format the response using simple Markdown.`;
            break;
        case 'concepts':
            prompt += `List and explain the key concepts or themes. The output should be in ${params.format} format. Format the response using simple Markdown.`;
            break;
        case 'characters':
            prompt += `Provide a list of major characters with brief descriptions of their roles. Format the response as a Markdown list. If the content is not a story with characters, state that.`;
            break;
        case 'highlights':
            prompt += `Extract key ideas, important quotes, and significant passages. Your response MUST be a valid JSON object matching the specified schema.`;
            schema = HIGHLIGHTS_SCHEMA;
            isJsonOutput = true;
            break;
        case 'quiz':
            prompt += `Generate a 3-question multiple-choice quiz based on the content. For each question, provide 4 options, the correct answer, and an explanation. Your response MUST be a valid JSON object matching the specified schema.`;
            schema = QUIZ_SCHEMA;
            isJsonOutput = true;
            break;
        case 'concept-map':
            prompt += `Generate a concept map of the main themes, characters, and plot points. Provide a short summary and the Mermaid.js flowchart syntax. Your response MUST be a valid JSON object matching the specified schema.`;
            schema = CONCEPT_MAP_SCHEMA;
            isJsonOutput = true;
            break;
        case 'tone-style':
            prompt += `Analyze the tone (e.g., formal, informal, academic, persuasive, narrative) and writing style (e.g., descriptive, concise, verbose, metaphorical). Provide the analysis as a Markdown formatted text.`;
            break;
        case 'glossary':
            prompt += `Identify and define key terminology or jargon found in the text. Your response MUST be a valid JSON object matching the specified schema.`;
            schema = GLOSSARY_SCHEMA;
            isJsonOutput = true;
            break;
        case 'eli5':
            prompt += `Explain the main ideas and concepts of the text in a very simple and easy-to-understand way, as if you were explaining it to a 5-year-old. Format the response using simple Markdown.`;
            break;
        case 'discussion-questions':
            prompt += `Generate a list of 5 thought-provoking discussion questions based on the content. These questions should be suitable for a study group or book club. Format the response as a numbered Markdown list.`;
            break;
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        ...(isJsonOutput && {
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        }),
    });

    const textResponse = response.text.trim();
    if (isJsonOutput) {
        try {
            return JSON.parse(textResponse);
        } catch (e) {
            console.error("Failed to parse JSON response:", textResponse);
            throw new Error("The AI returned an invalid JSON response. Please try again.");
        }
    }
    return { text: textResponse };
};


export const generateRecommendations = async (currentBook: Book, allBooks: Book[]): Promise<Book[]> => {
    const booklist = allBooks
        .filter(b => b.id !== currentBook.id)
        .map(b => `- ${b.title} by ${b.author} (Genre: ${b.genre}, Level: ${b.level}) (id: ${b.id})`)
        .join('\n');

    const prompt = `
    Based on the book "${currentBook.title}" (Genre: ${currentBook.genre}, Summary: ${currentBook.summary}), recommend 3 other relevant books from the following list.
    
    Available books:
    ${booklist}
    
    Respond ONLY with a JSON object containing a single key "recommendations", which is an array of the integer IDs of the recommended books. Example: {"recommendations": [2, 5, 8]}`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendations: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER }
                    }
                },
                required: ['recommendations']
            }
        },
    });
    
    try {
      const result = JSON.parse(response.text.trim());
      const recommendedIds: number[] = result.recommendations || [];
      return allBooks.filter(book => recommendedIds.includes(book.id));
    } catch (e) {
      console.error("Failed to parse recommendations:", e);
      // Fallback to simple genre-based recommendation
      return allBooks.filter(b => b.genre === currentBook.genre && b.id !== currentBook.id).slice(0, 3);
    }
};

// FIX: Implement missing functions generateDebateArguments, generateLearningPath, and analyzeCode.
export const generateDebateArguments = async (topic: string): Promise<DebateArguments> => {
    const prompt = `Generate 3 distinct and well-reasoned arguments for (pro) and 3 against (con) the following debate topic: "${topic}".
    The arguments should be concise and suitable for a high-school level debate.
    Respond ONLY with a valid JSON object matching the specified schema. Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: DEBATE_SCHEMA,
        },
    });
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
};

export const generateLearningPath = async (goal: string): Promise<LearningPathModule[]> => {
    const prompt = `Create a detailed, step-by-step learning path for the following goal: "${goal}".
    The path should consist of several modules. Each module should have a title, a short description, a list of key topics to learn, and a list of 2-3 high-quality online resources (like articles, videos, or documentation) with their titles, URLs, and types.
    Respond ONLY with a valid JSON object with a single key "path" which holds an array of module objects. Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: LEARNING_PATH_SCHEMA,
        },
    });
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.path;
};

export const analyzeCode = async (code: string, action: 'explain' | 'debug'): Promise<CodeAnalysisResult> => {
    let prompt: string;
    let schema: object;

    if (action === 'explain') {
        prompt = `Analyze and explain the following code snippet. Provide a summary, a line-by-line breakdown, and identify key programming concepts.
        Respond ONLY with a valid JSON object matching the specified schema.

        Code:
        \`\`\`
        ${code}
        \`\`\``;
        schema = CODE_EXPLANATION_SCHEMA;
    } else { // action === 'debug'
        prompt = `Analyze the following code snippet to find and fix bugs. Provide a summary of the issues, a list of specific bugs with suggestions, and the fully corrected code. If no bugs are found, state that in the summary and return the original code.
        Respond ONLY with a valid JSON object matching the specified schema.

        Code:
        \`\`\`
        ${code}
        \`\`\``;
        schema = CODE_DEBUG_SCHEMA;
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
};

// fix: Added chat functionality for TutorChatView
let chat: Chat | null = null;

export const startChat = () => {
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a friendly and knowledgeable AI Tutor. Your goal is to help users understand complex topics by providing clear, concise explanations and asking thought-provoking questions. Adapt your teaching style to the user\'s level of understanding.',
    },
  });
};

export const sendMessageToTutor = async function* (message: string): AsyncGenerator<GenerateContentResponse> {
  if (!chat) {
    startChat();
  }
  // This check is for typescript to be sure chat is not null.
  if (!chat) throw new Error("Chat not initialized");

  const stream = await chat.sendMessageStream({ message });
  for await (const chunk of stream) {
    yield chunk;
  }
};
