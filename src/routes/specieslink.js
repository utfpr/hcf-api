import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controllerComum = require('../controllers/herbariovirtual-controller');
const controller = require('../controllers/specieslink-controller');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /specieslink,
 * /specieslink-executando, /specieslink-todoslogs, /specieslink-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /specieslink é preparaRequisição, e assim
 * por diante.
 */
export default app => {
    app.route('/specieslink').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.preparaRequisicao,
    ]);
    app.route('/specieslink-executando').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.estaExecutando,
    ]);
    app.route('/specieslink-todoslogs').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.todosLogs,
    ]);
    app.route('/specieslink-log').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.getLog,
    ]);
};
