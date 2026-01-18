import swaggerJsdoc from 'swagger-jsdoc';
import { join } from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerOps API',
      version: '1.0.0',
      description: 'API documentation for CareerOps backend',
      contact: {
        name: 'CareerOps Team',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    join(__dirname, '../routes/*.ts'),
    join(__dirname, '../app.ts'),
  ], // paths to files containing OpenAPI definitions
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(options);
  if (!swaggerSpec || Object.keys(swaggerSpec).length === 0) {
    console.warn('Warning: Swagger spec is empty. Check that your route files contain @swagger JSDoc comments.');
  }
} catch (error) {
  console.error('Error generating Swagger spec:', error);
  // Export a minimal spec so the server doesn't crash
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'CareerOps API',
      version: '1.0.0',
      description: 'API documentation for CareerOps backend',
    },
    paths: {},
  };
}

export { swaggerSpec };
