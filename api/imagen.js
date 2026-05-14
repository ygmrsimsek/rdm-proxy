export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-key',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });

  try {
    const body = await req.json();
    const { prompt, aspectRatio = '1:1' } = body;
    const geminiKey = req.headers.get('x-gemini-key') || body.geminiKey;

    if (!geminiKey) return new Response(JSON.stringify({ error: 'Missing Gemini key' }), { status: 400, headers: cors });
    if (!prompt) return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400, headers: cors });

    const googleRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio } })
      }
    );

    const data = await googleRes.json();

    if (!googleRes.ok) return new Response(JSON.stringify({ error: data.error?.message || 'Imagen error' }), { status: googleRes.status, headers: cors });
    if (!data.predictions?.[0]?.bytesBase64Encoded) return new Response(JSON.stringify({ error: 'No image returned', raw: data }), { status: 500, headers: cors });

    return new Response(
      JSON.stringify({ imageBase64: data.predictions[0].bytesBase64Encoded, mimeType: 'image/png' }),
      { status: 200, headers: cors }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
}
