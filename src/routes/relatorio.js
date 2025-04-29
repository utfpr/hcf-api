import listagensMiddleware from '../middlewares/listagens-middleware';

/// relatorio/inventario-especies
const controller = require('../controllers/relatorios-controller');

export default app => {
    app.route('/relatorio/inventario-especies')
        .get([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ]);

    app.route('/relatorio/inventario-especies')
        .post([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ]);

    app.route('/relatorio/coleta-por-local-intervalo-de-data')
        .get([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);

    app.route('/relatorio/coleta-por-local-intervalo-de-data')
        .post([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);
};
