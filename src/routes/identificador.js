import * as identificadoresController from '../controllers/identificador-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarIdentificadorEsquema from '../validators/identificador-atualiza';
import cadastrarIdentificadorEsquema from '../validators/identificador-cadastro';
import listarIdentificadoresEsquema from '../validators/identificador-listagem';

export default app => {
    app.route('/identificadores').post([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(cadastrarIdentificadorEsquema),
        identificadoresController.cadastraIdentificador,
    ]);

    app.route('/identificadores').get([
        tokensMiddleware(['CURADOR']),
        listagensMiddleware,
        identificadoresController.encontradaIdentificador,
    ]);

    app.route('/identificadores').get([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(listarIdentificadoresEsquema),
        listagensMiddleware,
        identificadoresController.listaIdentificadores,
    ]);

    app.route('/identificadores/:id').put([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(atualizarIdentificadorEsquema),
        identificadoresController.atualizaIdentificador,
    ]);
};
