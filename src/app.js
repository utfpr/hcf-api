import express from 'express';
import cors from 'cors';
import parser from 'body-parser';
import morgan from 'morgan';

import routes from './routes';
import errors from './middlewares/erros-middleware';

import { storage, assets } from './config/directory';

import { daemonFazRequisicaoReflora } from './herbarium/reflora/main';
import { daemonSpeciesLink } from './herbarium/specieslink/main';

const app = express();
app.use(cors());
app.use(parser.json());
app.use(morgan('dev'));

app.use('/fotos', express.static(storage));
app.use('/assets', express.static(assets));

app.use('/api', routes);
app.use(errors);

/**
 * Essas duas daemon são utilizadas, ela são iniciadas juntamente
 * com o back end. Essas daemon de tempos em tempos verificam
 * se é necessário realizar o processo de atualização do serviço.
 */
daemonFazRequisicaoReflora();
daemonSpeciesLink();


export default app;
