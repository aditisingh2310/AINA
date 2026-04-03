const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AINA API',
      version: '1.0.0',
      description: 'AI-assist incident reporting API',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }],
    components: {
      schemas: {
        AuthRegister: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
          required: ['email', 'password'],
        },
        AuthLogin: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
          required: ['email', 'password'],
        },
        RefreshTokenRequest: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
          },
          required: ['refreshToken'],
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
