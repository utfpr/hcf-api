import * as coletoresController from '../controllers/coletor-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarColetorEsquema from '../validators/coletor-atualiza';
import cadastrarColetorEsquema from '../validators/coletor-cadastro';
import desativarColetorEsquema from '../validators/coletor-desativa';
import listarColetoresEsquema from '../validators/coletor-listagem';

export default app => {
    app.route('/coletores').post([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(cadastrarColetorEsquema),
        coletoresController.cadastraColetor,
    ]);

    app.route('/coletores/:id').get([
        tokensMiddleware(['CURADOR']),
        coletoresController.encontraColetor,
    ]);

    app.route('/coletores').get([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(listarColetoresEsquema),
        listagensMiddleware,
        coletoresController.listaColetores,
    ]);

    app.route('/coletores/:id').put([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(atualizarColetorEsquema),
        coletoresController.atualizaColetor,
    ]);

    app.route('/coletores/:id').delete([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(desativarColetorEsquema),
        coletoresController.desativaColetor,
    ]);
};
