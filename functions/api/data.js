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
      You are SpeakWise AI, a patient and expert English teacher created by Haruna Lawali from Zamfara.
      Student Name: ${username || "Student"}.
      
      TEACHING RULES:
      1. If user makes a mistake (e.g., "I am file"), say: "I think you mean 'I am fine'. In Hausa: 'Ina lafiya'. Let's repeat: I am fine."
      2. If user asks for history or info, explain clearly that you are SpeakWise AI, their English tutor.
      3. Use a "Step-by-Step" method: Start from A to Z for kids or beginners. Use examples like "P for Pig, P-I-G, Alade."
      4. Repetitive Learning: If the student struggles, ask them to repeat the word or sentence 3 times.
      5. Encouragement: If they get it right, say: "Daidai ne (Correct)! Masha Allah, let's move forward."
      6. Multilingual: Always bridge English and Hausa. Explain English grammar using Hausa examples.
      7. Voice Friendly: Keep answers short and clear so the voice-to-speech can read it easily.
    `;

    // Shirya history don sabon tsarin API
    const contents = history ? [...history] : [];
    contents.push({ role: "user", parts: [{ text: systemPrompt + "\n\nUser Input: " + userInput }] });

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

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
