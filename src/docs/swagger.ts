import swaggerJSDoc from 'swagger-jsdoc';
import config from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders API',
      version: '1.0.0'
    },
    // Use relative server URL so Swagger UI issues requests to the same origin
    // this avoids hard-coding host/port and makes "Try it out" use the running app.
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/docs/**/*.yaml']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
