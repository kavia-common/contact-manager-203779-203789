const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contact Manager API',
      version: '1.0.0',
      description: 'Express API for managing contacts (CRUD) with SQLite persistence.',
    },
    tags: [
      { name: 'Contacts', description: 'CRUD operations for contacts' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
