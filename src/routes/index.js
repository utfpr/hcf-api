import express from 'express';

import cidades from './cidades';
import coletor from './coletor';
import darwin from './darwin';
import dashboard from './dashboard';
import estados from './estados';
import herbarios from './herbarios';
import identificador from './identificador';
import locais from './locais';
import paises from './paises';
import pendencias from './pendencias';
import reflora from './reflora';
import relatorio from './relatorio';
import remessas from './remessas';
import rfids from './rfids';
import specieslink from './specieslink';
import splinker from './splinker';
import taxonomias from './taxonomias';
import tombos from './tombos';
import uploads from './uploads';
import usuarios from './usuarios';

const router = express.Router();

const routes = [
    cidades,
    coletor,
    dashboard,
    darwin,
    estados,
    herbarios,
    identificador,
    locais,
    paises,
    pendencias,
    reflora,
    rfids,
    relatorio,
    remessas,
    specieslink,
    splinker,
    taxonomias,
    tombos,
    uploads,
    usuarios,
];

routes.forEach(route => route(router));

export default router;
