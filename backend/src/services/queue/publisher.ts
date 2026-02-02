import { getChannel, assertQueue } from '../../config/rabbitmq';
import { QueueNames } from '../../types/queue.types';
import { logger } from '../../utils/logger';

/**
 * Publish a message to a queue
 */
export const publishMessage = async <T>(
  queueName: string,
  message: T,
  options?: { persistent?: boolean }
): Promise<boolean> => {
  try {
    const channel = await getChannel();
    
    // Ensure queue exists
    await assertQueue(queueName);

    // Publish message
    const sent = channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: options?.persistent !== false, // Messages survive broker restart
      }
    );

    if (sent) {
      logger.info('Message published to queue', { queueName });
      return true;
    } else {
      logger.warn('Failed to publish message to queue', { queueName });
      return false;
    }
  } catch (error) {
    logger.error('Publish message failed', error instanceof Error ? error : undefined);
    // Don't throw - return false so the API can still respond
    // The job is already saved in DB, it can be retried later
    return false;
  }
};

/**
 * Publish cover letter generation job
 */
export const publishCoverLetterJob = async (message: {
  jobId: string;
  userId: number;
  jobDescription: string;
  cvText: string;
  tone?: 'professional' | 'friendly' | 'concise';
  createdAt: string;
}): Promise<boolean> => {
  return publishMessage(QueueNames.COVER_LETTER_GENERATE, message);
};
