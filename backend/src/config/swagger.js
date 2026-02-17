const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ramadan Flow API',
            version: '1.0.0',
            description: 'Backend API for Ramadan Flow application',
        },
        servers: [
            {
                url: config.swagger.serverUrl,
                description: 'API Server',
            },
            {
                url: config.swagger.serverUrl.replace('/api', ''),
                description: 'Root Server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
