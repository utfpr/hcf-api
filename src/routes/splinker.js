import { obterModeloSPLinker, obterUltimaExecucaoSPLinker } from '../controllers/splinker-controller';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

export default app => {
    app.route('/splinker')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            obterModeloSPLinker,
        ]);

    app.route('/splinker/ultima-execucao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            obterUltimaExecucaoSPLinker,
        ]);
};
