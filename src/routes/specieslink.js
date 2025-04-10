const controllerComum = require('../controllers/herbariovirtual-controller');
const controller = require('../controllers/specieslink-controller');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /specieslink,
 * /specieslink-executando, /specieslink-todoslogs, /specieslink-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /specieslink é preparaRequisição, e assim
 * por diante.
 */
export default app => {
    app.route('/specieslink').get([
        controller.preparaRequisicao,
    ]);
    app.route('/specieslink-executando').get([
        controller.estaExecutando,
    ]);
    app.route('/specieslink-todoslogs').get([
        controllerComum.todosLogs,
    ]);
    app.route('/specieslink-log').get([
        controllerComum.getLog,
    ]);
};
