/// relatorio/inventario-especies
const controller = require('../controllers/relatorios-controller');

export default app => {
    app.route('/relatorio/inventario-especies')
        .get(controller.obtemDadosDoRelatorioDeInventarioDeEspecies);
};
