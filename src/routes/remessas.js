import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import listagensMiddleware from '../middlewares/listagens-middleware';

const controller = require('../controllers/remessa-controller');

export default app => {
    app.route('/remessas')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.cadastro,
        ])
        .get([
            listagensMiddleware,
            controller.listagem,
        ]);

    app.route('/remessas/:remessa_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.alteracao,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.exclusao,
        ])
        .get([
            controller.buscarRemessa,
        ]);

    app.route('/remessas-devolver')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.devolverTombo,
        ]);
};
