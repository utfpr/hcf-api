import parser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { assets, upload } from './config/directory';
import errors from './middlewares/erros-middleware';
import reporting from './reporting';
import routes from './routes';

const app = express();
app.use(cors());
app.use(parser.json());
app.use(morgan('dev'));

app.use('/fotos', express.static(upload));
app.use('/assets', express.static(assets));

app.use('/api', routes);

app.use('/', reporting);

app.use(errors);

export default app;
