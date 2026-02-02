import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';

let connection: Connection | null = null;
let channel: Channel | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

export const getConnection = async (): Promise<Connection> => {
  if (connection) {
    return connection;
  }

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    logger.info('Connected to RabbitMQ');

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', err);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      logger.info('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', error instanceof Error ? error : undefined);
    connection = null;
    channel = null;
    throw error;
  }
};

/**
 * Get or create RabbitMQ channel
 */
export const getChannel = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  const conn = await getConnection();
  channel = await conn.createChannel();
  logger.info('RabbitMQ channel created');

  channel.on('error', (err) => {
    logger.error('RabbitMQ channel error', err);
    channel = null;
  });

  channel.on('close', () => {
    logger.info('RabbitMQ channel closed');
    channel = null;
  });

  return channel;
};

/**
 * Close RabbitMQ connection
 */
export const closeConnection = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  logger.info('RabbitMQ connection closed');
};

/**
 * Ensure queue exists
 */
export const assertQueue = async (queueName: string, options?: amqp.Options.AssertQueue): Promise<void> => {
  const ch = await getChannel();
  await ch.assertQueue(queueName, {
    durable: true, // Queue survives broker restart
    ...options,
  });
};
