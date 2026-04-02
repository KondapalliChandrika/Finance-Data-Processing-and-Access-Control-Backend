const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance Data Processing & Access Control API',
            version: '1.0.0',
            description: `
## Finance Dashboard Backend

REST API for a finance dashboard with:
- **JWT Authentication**
- **Role-Based Access Control** (viewer / analyst / admin)
- **Financial Records** (CRUD + filtering)
- **Dashboard Analytics** (summaries, trends, category breakdowns)

### Roles
| Role     | Capabilities |
|----------|---|
| viewer   | Read records & dashboard |
| analyst  | Read + create/update records + trends |
| admin    | Full access including user management & delete |

### Auth
Use **POST /api/auth/login** to get a token, then click **Authorize** and enter \`Bearer <token>\`.
      `,
            contact: { name: 'Finance Backend API' },
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'object' } },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                FinancialRecord: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        amount: { type: 'number', format: 'float' },
                        type: { type: 'string', enum: ['income', 'expense'] },
                        category: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        notes: { type: 'string' },
                        created_by: { type: 'integer' },
                        is_deleted: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
