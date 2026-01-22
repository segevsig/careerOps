import { getChannel, assertQueue } from '../../config/rabbitmq';
import { ConsumeMessage } from 'amqplib';

export interface MessageHandler<T = any> {
  (message: T, rawMessage: ConsumeMessage): Promise<void>;
}

/**
 * Consume messages from a queue
 */
export const consumeMessages = async <T>(
  queueName: string,
  handler: MessageHandler<T>,
  options?: {
    prefetch?: number; // Number of unacknowledged messages per consumer
    noAck?: boolean; // Auto-acknowledge messages
  }
): Promise<void> => {
  try {
    const channel = await getChannel();

    // Ensure queue exists
    await assertQueue(queueName);

    // Set prefetch count (how many messages to process concurrently)
    if (options?.prefetch) {
      await channel.prefetch(options.prefetch);
    }

    // Consume messages
    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) {
          return;
        }

        try {
          // Parse message
          const content = JSON.parse(msg.content.toString()) as T;

          // Handle message
          await handler(content, msg);

          // Acknowledge message (remove from queue)
          if (!options?.noAck) {
            channel.ack(msg);
          }
        } catch (error) {
          console.error(`Error processing message from queue ${queueName}:`, error);

          // Reject message and requeue (or send to dead letter queue)
          if (!options?.noAck) {
            channel.nack(msg, false, true); // requeue = true
          }
        }
      },
      {
        noAck: options?.noAck || false,
      }
    );

    console.log(`Started consuming messages from queue: ${queueName}`);
  } catch (error) {
    console.error(`Error setting up consumer for queue ${queueName}:`, error);
    throw error;
  }
};
