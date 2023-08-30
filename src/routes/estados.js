const controller = require('../controllers/estados-controller');

export default app => {

    app.route('/estados')
        .get([
            controller.listagem,
        ]);
};
