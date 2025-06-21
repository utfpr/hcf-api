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
 *     description: Retorna o modelo Darwin Core utilizado pelo sistema em formato CSV.
 *     responses:
 *       200:
 *         description: Arquivo Darwin Core em formato CSV retornado com sucesso.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
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
