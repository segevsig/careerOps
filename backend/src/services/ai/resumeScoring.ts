import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ResumeScoringResultItem {
  title: string;
  description: string;
}

export interface ResumeScoringResult {
  score: number;
  strengths: ResumeScoringResultItem[];
  gaps: ResumeScoringResultItem[];
  suggestions: string[];
}

export async function generateResumeScoring(
  cvText: string,
  jobDescription: string
): Promise<ResumeScoringResult> {
  const prompt = `
You are a careful, honest career coach and resume analyst.

You are given:
- A candidate resume (CV) text.
- A job description.

Your job:
- Evaluate how well the **actual written CV** matches the job description.
- **Do NOT invent or assume experience, skills, education or achievements that are not explicitly present in the CV text.**
- If the job description requires something that is not clearly mentioned in the CV, treat it as **missing** (a gap), even if it might be realistic that the candidate has it.
- Focus on what is truly written.

Scoring rules:
- Return an integer score between 0 and 100 (inclusive).
- Higher score = stronger match between the written CV and the job description.
- Consider role requirements, years of experience, skills/tech stack, domain knowledge, and responsibilities **only as they appear in the CV**.

Output format:
- You MUST return a strict JSON object with this exact shape:
{
  "score": number,
  "strengths": [
    { "title": string, "description": string },
    { "title": string, "description": string },
    { "title": string, "description": string }
  ],
  "gaps": [
    { "title": string, "description": string },
    { "title": string, "description": string },
    { "title": string, "description": string }
  ],
  "suggestions": string[]
}

Constraints:
- Provide **exactly 3** strengths and **exactly 3** gaps.
- For gaps, explain clearly what is missing in the CV compared to the job description.
- In suggestions, focus on **how to rewrite or reorganize the CV** and **what to explicitly mention** based ONLY on the candidate's real experience as written.
- If something is missing (e.g. a required skill or years of experience) and you do not see it in the CV, you may say:
  - "If you actually have X, add a clear bullet describing it; if you don't, don't claim it."
- Never phrase anything as if the candidate already has experience that does not exist in the CV.

Now analyze:

CV:
=======
${cvText}
=======

Job Description:
=======
${jobDescription}
=======

Return only the JSON object, with no extra text or explanation.
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message?.content;

  if (!content) {
    throw new Error('Empty response from AI service');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const result = parsed as Partial<ResumeScoringResult>;

  if (typeof result.score !== 'number') {
    throw new Error('AI response is missing a numeric score');
  }

  if (!Array.isArray(result.strengths)) {
    throw new Error('AI response is missing strengths array');
  }

  if (!Array.isArray(result.gaps)) {
    throw new Error('AI response is missing gaps array');
  }

  if (!Array.isArray(result.suggestions)) {
    throw new Error('AI response is missing suggestions array');
  }

  // Clamp and normalize score
  const normalizedScore = Math.min(100, Math.max(0, Math.round(result.score)));

  const strengths = result.strengths.slice(0, 3).map((item) => ({
    title: item?.title || 'Strength',
    description: item?.description || '',
  }));

  const gaps = result.gaps.slice(0, 3).map((item) => ({
    title: item?.title || 'Gap',
    description: item?.description || '',
  }));

  const suggestions = result.suggestions.filter(
    (s): s is string => typeof s === 'string'
  );

  return {
    score: normalizedScore,
    strengths,
    gaps,
    suggestions,
  };
}

