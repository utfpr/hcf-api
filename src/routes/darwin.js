import { obterModeloDarwinCore } from '../controllers/darwincore-controller';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

export default app => {
    app.route('/darwincore')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            obterModeloDarwinCore,
        ]);
};
