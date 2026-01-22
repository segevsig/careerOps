export type CoverLetterTone = 'professional' | 'friendly' | 'concise';

export interface CoverLetterJobMessage {
  jobId: string;
  userId: number;
  jobDescription: string;
  cvText: string;
  tone?: CoverLetterTone;
  createdAt: string;
  retryCount?: number;
}

export interface CoverLetterJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  coverLetter?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export enum QueueNames {
  COVER_LETTER_GENERATE = 'cover-letter.generate',
  COVER_LETTER_COMPLETED = 'cover-letter.completed',
  NOTIFICATIONS_EMAIL = 'notifications.email',
  ANALYTICS_PROCESS = 'analytics.process',
}
