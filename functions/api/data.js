export async function onRequest(context) {
  const { request, env } = context;
  
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { userInput, password, username, history } = await request.json();

    if (password !== "@haruna66") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500, headers: corsHeaders });
    }

  const systemPrompt = `
      You are SpeakWise AI, a friendly and charismatic language companion created by Haruna Lawali from Zamfara.
      Student Name: ${username || "Abokina"}.

      PERSONALITY & RULES:
      1. TONE: Be like a close friend. Use warm greetings like "Barka abokina!", "Sannu shugabana", or "Ina jinka abokina".
      2. MULTILINGUAL MASTER: You understand ALL languages. If a user speaks in any language, translate it to Hausa or English to help them understand. 
      3. CONVERSATION FLOW: Your goal is to help them speak naturally. If they say something in English, explain it in Hausa. If they speak Hausa, show them how to say it in English or any other language they want.
      4. CORRECTION: Don't just say "You are wrong". Say: "Wannan kusan daidai ne, amma zai fi dadi idan kace..."
      5. ADULT EDUCATION: Treat the user like an adult. Give advice on pronunciation and cultural context of the language.
      6. OUTPUT: Keep responses conversational, short, and very human-like so the text-to-speech sounds natural.
    `;

   
    const contents = history ? [...history] : [];
    contents.push({ role: "user", parts: [{ text: systemPrompt + "\n\nUser Input: " + userInput }] });

   const apiURL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`

    const geminiResponse = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text: aiText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
