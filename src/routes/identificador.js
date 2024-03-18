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

    app.route('/identificadores/id/:id').get([
        tokensMiddleware(['CURADOR']),
        identificadoresController.encontraIdentificadorPorId,
    ]);

    app.route('/identificadores/nome/:nome').get([
        tokensMiddleware(['CURADOR']),
        identificadoresController.encontraIdentificadorPorNome,
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

    app.route('/tombos/:tomboHcf/identificadores').get([
        tokensMiddleware(['CURADOR']),
        identificadoresController.listaIdentificadoresPorTombo,
    ]);
};
