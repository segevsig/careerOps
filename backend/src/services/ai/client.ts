const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const BASE_URL = AI_SERVICE_URL.replace(/\/$/, '');

/**
 * Run an AI task by name. Backend sends only task + params; ai-service has one handler per task.
 */
export async function runTask<T = unknown>(
  task: string,
  params: Record<string, unknown>
): Promise<T> {
  const url = `${BASE_URL}/task`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, params }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `AI service unreachable at ${url} (${msg}). Is the ai-service running?`
    );
  }

  if (!response.ok) {
    const text = await response.text();
    let detail = text || response.statusText;
    try {
      const errBody = JSON.parse(text);
      const d = errBody?.detail;
      if (d != null) {
        detail = typeof d === 'string' ? d : Array.isArray(d) ? (d[0]?.msg ?? JSON.stringify(d)) : JSON.stringify(d);
      }
    } catch {
      // use text as-is
    }
    throw new Error(`AI service error (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as T;
  return data;
}

/** @deprecated Use runTask('cover_letter', params) or runTask('resume_scoring', params) instead. */
export async function askAi(prompt: string): Promise<string> {
  const url = `${BASE_URL}/ask`;

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
