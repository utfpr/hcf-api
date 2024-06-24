const controller = require('../controllers/cidades-controller');

export default app => {
    app.route('/cidades').get([controller.listagem]);

    app.route('/pontos').get([controller.listaTodosOsTombosComLocalizacao]);

};
