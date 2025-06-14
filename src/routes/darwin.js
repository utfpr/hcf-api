import { obterModeloDarwinCore } from '../controllers/darwincore-controller';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

/**
 * @swagger
 * tags:
 *   name: DarwinCore
 *   description: Operações relacionadas ao modelo Darwin Core
 */
export default app => {
/**
 * @swagger
 * /darwincore:
 *   get:
 *     summary: Obtém o modelo Darwin Core
 *     tags: [DarwinCore]
 *     description: Retorna o modelo Darwin Core utilizado pelo sistema.
 *     responses:
 *       200:
 *         description: Arquivo Darwin Core retornado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
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
