import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the SDK - Assumes GEMINI_API_KEY is in environment
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
    try {
        const { image, images, prompt, url, previousContext, pageContext } = await req.json();

        // Support array of images (walkthrough) or single image (legacy/fast capture)
        const imageArray = images || (image ? [image] : []);

        // Must have at least images or page context
        if (imageArray.length === 0 && !pageContext) {
            return NextResponse.json(
                { error: 'At least one image frame or page context is required' },
                { status: 400 }
            );
        }

        const imageParts = imageArray.map((img: string) => {
            const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
            const mimeType = img.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
            return { inlineData: { mimeType, data: base64Data } };
        });

        // Construct the context-aware prompt
        let contextText = `You are GuideHands, a visual co-pilot designed to help users navigate complex digital interfaces, such as government portals, accessible systems, or complex applications.\n`;

        const effectiveUrl = url || pageContext?.url;
        if (effectiveUrl) {
            contextText += `The user is currently on this URL: ${effectiveUrl}. Use this only as supporting context; the visible content is the primary source of truth.\n`;
        }

        // Include structured page context from the extension
        if (pageContext) {
            contextText += `\nStructured page context extracted from the DOM:\n`;
            if (pageContext.title) contextText += `Page title: "${pageContext.title}"\n`;
            if (pageContext.headings?.length) {
                contextText += `Headings: ${pageContext.headings.map((h: any) => `[${h.level}] ${h.text}`).join('; ')}\n`;
            }
            if (pageContext.buttons?.length) {
                contextText += `Buttons: ${pageContext.buttons.map((b: any) => b.text + (b.disabled ? ' (disabled)' : '')).join(', ')}\n`;
            }
            if (pageContext.links?.length) {
                contextText += `Links: ${pageContext.links.slice(0, 20).map((l: any) => l.text).join(', ')}\n`;
            }
            if (pageContext.formFields?.length) {
                contextText += `Form fields: ${pageContext.formFields.map((f: any) => `[${f.type}] ${f.label}${f.required ? ' (required)' : ''}`).join(', ')}\n`;
            }
            if (pageContext.visibleText) {
                contextText += `Visible page text (excerpt): "${pageContext.visibleText.substring(0, 800)}"\n`;
            }
        }

        if (imageArray.length > 1) {
            contextText += `NOTE: The user has provided a sequence of ${imageArray.length} sequential frames from a single scrolling session. Analyze them chronologically to understand the broader structure of the page before giving your final recommendation. The latest frame is the current state.\n`;
        }

        if (previousContext) {
            contextText += `Previous step context and user feedback: ${previousContext}\n`;
        }

        contextText += `The user is looking at this screen and their request is: "${prompt}".

Analyze the screen carefully and perform the following:
1. Explain what this page is in plain, accessible language.
2. Identify the likely next step to help the user achieve their goal.
3. If you are uncertain about a step, flag it clearly as a warning.
4. Provide structured, precise UI navigation actions only.
5. EXTREMELY IMPORTANT: You are a UI navigator. Do NOT make medical, legal, or official claims decisions. Do not evaluate eligibility. Only describe how to operate the interface.
6. Do not hallucinate hidden UI elements.`;

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
                        ...imageParts,
                        { text: contextText }
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

        // Add CORS headers for extension
        return NextResponse.json(parsedResult, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: 'Failed to analyze request' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { status: 'ok', service: 'GuideHands Analyze API' },
        {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
