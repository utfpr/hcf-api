import * as coletoresController from '../controllers/coletor-controller';
import tokensMiddleware from '../middlewares/tokens-middleware';

export default app => {
    app.route('/coletores').post([
        tokensMiddleware(['CURADOR', 'OPERADOR']),
        coletoresController.cadastraColetor,
    ]);

    app.route('/coletores/:id').get([
        tokensMiddleware(['CURADOR', 'OPERADOR']),
        coletoresController.listaColetorPorId,
    ]);

    app.route('/coletores').get([
        tokensMiddleware(['CURADOR', 'OPERADOR']),
        coletoresController.listaColetores,
    ]);


    app.route('/coletores/:id').put([
        tokensMiddleware(['CURADOR']),
        coletoresController.atualizaColetor,
    ]);

    app.route('/coletores/:id').delete([
        tokensMiddleware(['CURADOR']),
        coletoresController.desativaColetor,
    ]);
};
