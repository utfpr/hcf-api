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
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-intervalo-de-data')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-intervalo-de-data')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-coletor-intervalo-de-data')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorColetorEIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-coletor-intervalo-de-data')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorColetorEIntervaloDeData,
        ]);

    app.route('/relatorio/local-coleta')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeLocalDeColeta,
        ]);

    app.route('/relatorio/local-coleta')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeLocalDeColeta,
        ]);

    app.route('/relatorio/familias-generos')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeFamiliasEGeneros,
        ]);

    app.route('/relatorio/familias-generos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeFamiliasEGeneros,
        ]);

    app.route('/relatorio/codigo-barras')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeCodigoDeBarras,
        ]);

    app.route('/relatorio/quantidade-por-familia')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeQuantidade,
        ]);

    app.route('/relatorio/quantidade-por-familia')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeQuantidade,
        ]);
};
