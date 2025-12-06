const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CRM Prototype API',
            version: '1.0.0',
            description: 'API documentation for the CRM Prototype server',
        },
        servers: [
            {
                url: 'http://localhost:8001/api/v1',
                description: 'Local server',
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
    apis: ['./routes/*.js', './models/*.js', './docs/swagger/*.swagger.js'],
};

module.exports = swaggerJsdoc(options);