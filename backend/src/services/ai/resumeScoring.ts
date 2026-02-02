import { runTask } from './client';

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
  const result = await runTask<ResumeScoringResult>('resume_scoring', {
    cvText,
    jobDescription,
  });

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
