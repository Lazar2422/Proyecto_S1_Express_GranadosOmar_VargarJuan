import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'yaml';

const app = express();
const file = fs.readFileSync('./openapi.yaml', 'utf8');
const swaggerDoc = yaml.parse(file);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  explorer: true,
}));

// opcional: mostrar la versión y estado
app.get('/api/v1/health', (req,res) => {
  res.json({ ok: true, status: 'healthy', version: process.env.APP_VERSION || '1.0.0' });
});

app.listen(4000, () => console.log('Swagger en http://localhost:4000/api-docs'));
