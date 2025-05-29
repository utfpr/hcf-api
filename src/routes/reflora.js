const controllerComum = require('../controllers/herbariovirtual-controller');
const controller = require('../controllers/reflora-controller');
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /reflora,
 * /reflora-executando, /reflora-todoslogs, /reflora-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /reflora é preparaRequisição, e assim
 * por diante.
 */
export default app => {
    app.route('/reflora').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.preparaRequisicao,
    ]);
    app.route('/reflora-executando').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.estaExecutando,
    ]);
    app.route('/reflora-todoslogs').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.todosLogs,
    ]);
    app.route('/reflora-log').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.getLog,
    ]);
};
