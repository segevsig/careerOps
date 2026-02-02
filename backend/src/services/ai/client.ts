const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function askAi(prompt: string): Promise<string> {
  const url = `${AI_SERVICE_URL.replace(/\/$/, '')}/ask`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `AI service unreachable at ${url} (${msg}). Is the ai-service running?`
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI service error (${response.status}): ${text || response.statusText}`);
  }

  const data = (await response.json()) as { answer?: string };
  if (typeof data.answer !== 'string') {
    throw new Error('AI service returned invalid response (missing answer)');
  }

  return data.answer;
}
