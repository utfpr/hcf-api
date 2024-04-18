import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controller = require('../controllers/pendencias-controller');

export default app => {
    app.route('/pendencias/TomboId/:tombo_id')
        .get([
            controller.verificaAlteracao,
        ]);

    app.route('/pendencias')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            listagensMiddleware,
            controller.listagem,
        ]);

    app.route('/pendencias/:pendencia_id')
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.desativar,
        ])
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.visualizar,
        ])
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.aceitarPendencia,
        ])
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.avaliaPendencia,
        ]);
};
