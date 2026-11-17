import { CONFIG } from '../../../lib/board-config';

const layouts = Object.values(CONFIG.layouts).map(({ name, area, base, factor }) => ({ name, area, base, factor }));
const questions = CONFIG.questions.map(({ label, options }) => ({
  label,
  options: options.map(({ label, desc, add }) => ({ label, desc, add })),
}));

const instruction = [
  'You are Pip, the helper for the Discussion Board. Reply in the visitor’s language and keep answers concise and plain text.',
  'Help with this board, its interiors, layouts, indicative pricing, and finish options. Politely redirect unrelated questions.',
  'Never invent project facts. If information is missing, explain that you do not have it. Sample photos are illustrative. You cannot see browser uploads or personal details.',
  'Prices are indicative starting estimates in INR and final quotes require measurements and a site visit. Estimate = base plus each selected option add multiplied by the layout factor.',
  'Gallery holds photos and videos, Brochures holds PDFs, and Floor plans opens the layout estimate quiz. Users can pan, zoom, drag cards, and replace floor-plan images.',
  JSON.stringify({ studio: CONFIG.brandName, layouts, questions }),
].join('\n');

export async function POST(request) {
  const type = request.headers.get('content-type');
  if (type?.split(';')[0] !== 'application/json') {
    return Response.json({ error: 'Send the question as JSON.' }, { status: 415 });
  }

  const body = await request.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 9 ||
      messages.length % 2 === 0 || messages.some((entry, i) =>
        entry?.role !== (i % 2 === 0 ? 'user' : 'model') ||
        typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > 2500)) {
    return Response.json({ error: 'Enter a valid project question.' }, { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: 'Pip is unavailable until Gemini is configured.' }, { status: 503 });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: messages.map(({ role, text }) => ({ role, parts: [{ text }] })),
          generationConfig: { maxOutputTokens: 450, temperature: 0.3 },
        }),
      }
    );

    if (response.status === 429) {
      return Response.json({ error: 'Pip is busy. Please try again shortly.' }, { status: 429 });
    }
    if (!response.ok) {
      console.error('Gemini chat request failed with HTTP status', response.status);
      return Response.json({ error: 'Pip could not connect. Please try again later.' }, { status: 502 });
    }
    const result = await response.json();
    const answer = result.candidates?.[0]?.content?.parts
      ?.filter(part => !part.thought && typeof part.text === 'string')
      .map(part => part.text).join('').trim();
    if (!answer) {
      return Response.json({ error: 'Pip could not answer that. Try rephrasing your question.' }, { status: 502 });
    }
    return Response.json({ answer: answer.slice(0, 2500) });
  } catch (error) {
    const timeout = error.name === 'TimeoutError';
    return Response.json({ error: timeout ? 'Pip took too long. Please try again.' : 'Pip could not connect. Please try again.' }, { status: timeout ? 504 : 502 });
  }
}

