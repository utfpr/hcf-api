const controller = require('../controllers/reflora-controller');
const controllerComum = require('../controllers/herbariovirtual-controller');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /reflora,
 * /reflora-executando, /reflora-todoslogs, /reflora-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /reflora é preparaRequisição, e assim
 * por diante.
 */
export default app => {
    app.route('/reflora').get([
        controller.preparaRequisicao,
    ]);
    app.route('/reflora-executando').get([
        controller.estaExecutando,
    ]);
    app.route('/reflora-todoslogs').get([
        controllerComum.todosLogs,
    ]);
    app.route('/reflora-log').get([
        controllerComum.getLog,
    ]);
};
