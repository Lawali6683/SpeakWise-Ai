import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
    const { request, env } = context;

    const allowedOrigins = [
        "https://speakwiseai.page.dev",
        "http://localhost:8080"
    ];

    const origin = request.headers.get("Origin");

    if (!allowedOrigins.includes(origin)) {
        return new Response(JSON.stringify({ error: "Forbidden origin" }), {
            status: 403
        });
    }

    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: corsHeaders(origin)
        });
    }

    try {
        const { userInput, password, username, history } = await request.json();

        if (password !== "@haruna66") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders(origin)
            });
        }

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const systemPrompt = `
You are SpeakWise AI, a patient English teacher created by Haruna Lawali from Zamfara.

User's Name: ${username || "Student"}.

Teaching Strategy:
1. If the user speaks Hausa, explain the meaning in English, then explain the English back in Hausa.
2. Correct grammar mistakes gently.
3. If correct say: "Daidai ne (Correct), let's move to the next part."
4. Use repetitive learning style if user struggles.
5. Keep responses short for voice conversation.
`;

        const chat = model.startChat({
            history: history || []
        });

        const result = await chat.sendMessage(
            systemPrompt + "\nUser: " + userInput
        );

        const response = await result.response;

        return new Response(
            JSON.stringify({ text: response.text() }),
            {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: corsHeaders(origin)
            }
        );
    }
}

function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
}
