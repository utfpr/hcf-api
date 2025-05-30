import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

/// relatorio/inventario-especies
const controller = require('../controllers/relatorios-controller');

export default app => {
    app.route('/relatorio/inventario-especies')
        .get([
            tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ]);

    app.route('/relatorio/inventario-especies')
        .post([
            tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ]);

    app.route('/relatorio/coleta-por-local-intervalo-de-data')
        .get([
            tokensMiddleware([
            TIPOS_USUARIOS.CURADOR, 
            TIPOS_USUARIOS.OPERADOR, 
            TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-local-intervalo-de-data')
        .post([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);
};
