import parser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { storage, assets } from './config/directory';
import errors from './middlewares/erros-middleware';
import routes from './routes';

const app = express();
app.use(cors());
app.use(parser.json());
app.use(morgan('dev'));

app.use('/fotos', express.static(storage));
app.use('/assets', express.static(assets));

app.use('/api', routes);
app.use(errors);

export default app;
