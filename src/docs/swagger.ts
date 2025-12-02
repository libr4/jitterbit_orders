import swaggerJSDoc from 'swagger-jsdoc';
import config from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders API',
      version: '1.0.0'
    },
    servers: [{ url: `http://localhost:${config.PORT || 3000}` }],
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
