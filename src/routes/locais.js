import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import nomeEsquema from '../validators/nome-obrigatorio';

const controller = require('../controllers/locais-coleta-controller');

export default app => {

    app.route('/solos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarSolo,
        ])
        .get([
            controller.buscarSolos,
        ]);

    app.route('/relevos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarRelevo,
        ])
        .get([
            controller.buscarRelevos,
        ]);

    app.route('/vegetacoes')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarVegetacao,
        ])
        .get([
            controller.buscarVegetacoes,
        ]);
};
