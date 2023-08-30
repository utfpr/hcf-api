import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import cadastrarHerbarioEsquema from '../validators/herbario-cadastro';
import atualizarHerbarioEsquema from '../validators/herbario-atualiza';
import desativarHerbarioEsquema from '../validators/herbario-desativa';
import listagemHerbarioEsquema from '../validators/herbario-listagem';
import listagensMiddleware from '../middlewares/listagens-middleware';

const controller = require('../controllers/herbarios-controller');

export default app => {

    app.route('/herbarios')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(cadastrarHerbarioEsquema),
            controller.cadastro,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(listagemHerbarioEsquema),
            controller.listagem,
        ]);
    app.route('/herbarios/:herbario_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(atualizarHerbarioEsquema),
            controller.editar,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(desativarHerbarioEsquema),
            controller.desativar,
        ])
        .get([
            validacoesMiddleware(desativarHerbarioEsquema),
            controller.buscarHerbario,
        ]);
};
