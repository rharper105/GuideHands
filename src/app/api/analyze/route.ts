import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the SDK - Assumes GEMINI_API_KEY is in environment
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
    try {
        const { image, prompt } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Image is required for analysis' },
                { status: 400 }
            );
        }

        // Strip the data:image prefix if present, the SDK expects raw base64
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                screen_summary: {
                    type: Type.STRING,
                    description: "A concise summary of what this screen is and what the user is currently doing.",
                },
                user_goal: {
                    type: Type.STRING,
                    description: "What the user is attempting to achieve based on their prompt and the screen.",
                },
                recommended_next_step: {
                    type: Type.STRING,
                    description: "A natural-language explanation of what to do next.",
                },
                confidence: {
                    type: Type.NUMBER,
                    description: "Confidence percentage from 0 to 100 on how sure the model is of this advice.",
                },
                warnings: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                    },
                    description: "Any safety warnings, risks, or destructive actions the user should be aware of.",
                },
                actions: {
                    type: Type.ARRAY,
                    description: "A strict ordered list of UI actions the user needs to take.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: {
                                type: Type.STRING,
                                description: "The type of interaction.",
                                enum: ['click', 'type', 'scroll', 'select', 'wait'],
                            },
                            target: {
                                type: Type.STRING,
                                description: "A very clear visual description of the target UI element (e.g. 'The green Submit button in the bottom right').",
                            },
                            text: {
                                type: Type.STRING,
                                description: "The text to type, if the type is 'type'.",
                                nullable: true,
                            },
                            direction: {
                                type: Type.STRING,
                                description: "The direction to scroll, if the type is 'scroll'.",
                                enum: ['up', 'down'],
                                nullable: true,
                            },
                            reason: {
                                type: Type.STRING,
                                description: "Why this action is necessary.",
                            },
                        },
                        required: ['type', 'target', 'reason'],
                    },
                },
            },
            required: [
                'screen_summary',
                'user_goal',
                'recommended_next_step',
                'confidence',
                'warnings',
                'actions',
            ],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Data } },
                        { text: `The user needs help navigating this UI. Their request is: "${prompt}". Analyze the screen carefully, do not hallucinate hidden UI elements, and recommend safe actions to achieve their goal.` }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1, // Keep it deterministic and factual
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error("Empty response from Gemini");
        }

        const parsedResult = JSON.parse(resultText);
        return NextResponse.json(parsedResult);

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: 'Failed to analyze request' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'GuideHands Analyze API' });
}
