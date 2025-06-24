import parser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { assets, upload } from './config/directory';
import swaggerSpec from './config/swagger';
import errors from './middlewares/erros-middleware';
import { generatePreview, reportPreview } from './reports/controller';
import routes from './routes';

const app = express();
app.use(cors());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(parser.json());
app.use(morgan('dev'));

app.use('/fotos', express.static(upload));
app.use('/assets', express.static(assets));

app.get('/reports/:fileName', reportPreview);
app.post('/reports/:fileName', generatePreview);

app.use('/api', routes);

app.use(errors);

export default app;
