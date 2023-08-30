const controller = require('../controllers/paises-controller');

export default app => {

    app.route('/paises')
        .get([
            controller.listagem,
        ]);

    app.route('/paises/:pais_sigla/estados')
        .get([
            controller.listaEstadoPais,
        ]);
};
