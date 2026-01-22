import rateLimit from 'express-rate-limit';

import * as controller from '../controllers/usuarios-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarUsuarioEsquema from '../validators/usuario-atualiza';
import atualizarSenhaEsquema from '../validators/usuario-atualiza-senha';
import cadastrarUsuarioEsquema from '../validators/usuario-cadastro';
import desativarUsuarioEsquema from '../validators/usuario-desativa';
import listagemUsuarioEsquema from '../validators/usuario-listagem';
import usuarioLoginEsquema from '../validators/usuario-login';
import redefinirSenhaEsquema from '../validators/usuario-redefine-senha';
import solicitarTrocaDeSenhaEsquema from '../validators/usuario-solicita-redefine-senha';

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        error: {
            code: 429,
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        },
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Operações relacionadas aos usuários
 */
export default app => {
    /**
     * @swagger
     * /login:
     *   post:
     *     summary: Realiza login do usuário
     *     tags: [Usuários]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               senha:
     *                 type: string
     *             required:
     *               - email
     *               - senha
     *           example:
     *             email: "usuario@email.com"
     *             senha: "senha123"
     *     responses:
     *       200:
     *         description: Login realizado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 token:
     *                   type: string
     *                 usuario:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     nome:
     *                       type: string
     *                     email:
     *                       type: string
     *                     tipo_usuario_id:
     *                       type: integer
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/login')
        .post([
            loginLimiter,
            validacoesMiddleware(usuarioLoginEsquema),
            controller.login,
        ]);

    /**
   * @swagger
   * /usuarios/solicitar-redefinicao-senha:
   *   post:
   *     summary: Inicia o processo de reset de senha para um usuário
   *     tags: [Usuários]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *             required:
   *               - email
   *           example:
   *             email: "usuario@exemplo.com"
   *     responses:
   *       '204':
   *         description: Solicitação recebida. Se o e-mail estiver cadastrado, um link para reset de senha será enviado.
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '500':
   *         $ref: '#/components/responses/InternalServerError'
   */
    app.route('/usuarios/solicitar-redefinicao-senha')
        .post([
            validacoesMiddleware(solicitarTrocaDeSenhaEsquema),
            controller.solicitarTrocaDeSenha,
        ]);

    /**
   * @swagger
   * /usuarios/redefinir-senha:
   *   put:
   *     summary: Redefine a senha do usuário usando um token válido
   *     tags: [Usuários]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *               nova_senha:
   *                 type: string
   *             required:
   *               - token
   *               - nova_senha
   *           example:
   *             token: "a1b2c3d4e5f6..."
   *             nova_senha: "minhanova_senhaSuperSegura123"
   *     responses:
   *       '204':
   *         description: Senha atualizada com sucesso.
   *       '400':
   *         $ref: '#/components/responses/BadRequest'
   *       '500':
   *         $ref: '#/components/responses/InternalServerError'
   */
    app.route('/usuarios/redefinir-senha')
        .put([
            validacoesMiddleware(redefinirSenhaEsquema),
            controller.redefinirSenhaComToken,
        ]);

    /**
     * @swagger
     * /coletores-predicao:
     *   get:
     *     summary: Lista coletores para predição
     *     tags: [Usuários]
     *     responses:
     *       200:
     *         description: Lista de coletores retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     description: ID do coletor
     *                   nome:
     *                     type: string
     *                     description: Nome do coletor
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/coletores-predicao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.obtemColetores,
        ]);

    /**
     * @swagger
     * /identificadores-predicao:
     *   get:
     *     summary: Lista identificadores para predição
     *     tags: [Usuários]
     *     responses:
     *       200:
     *         description: Lista de identificadores retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     description: ID do identificador
     *                   nome:
     *                     type: string
     *                     description: Nome do identificador
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/identificadores-predicao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            controller.obtemIdentificadores,
        ]);

    /**
     * @swagger
     * /usuarios:
     *   get:
     *     summary: Lista todos os usuários
     *     tags: [Usuários]
     *     responses:
     *       200:
     *         description: Lista de usuários retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 metadados:
     *                   type: object
     *                   properties:
     *                     total:
     *                       type: integer
     *                     pagina:
     *                       type: integer
     *                     limite:
     *                       type: integer
     *                 usuarios:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       nome:
     *                         type: string
     *                       telefone:
     *                         type: string
     *                       ra:
     *                         type: string
     *                         nullable: true
     *                       email:
     *                         type: string
     *                       tipos_usuario:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                           tipo:
     *                             type: string
     *                           created_at:
     *                             type: string
     *                             format: date-time
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   post:
     *     summary: Cadastra um novo usuário
     *     tags: [Usuários]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 minLength: 1
     *               email:
     *                 type: string
     *                 format: email
     *                 minLength: 1
     *               senha:
     *                 type: string
     *                 minLength: 1
     *               tipo_usuario_id:
     *                 type: integer
     *               herbario_id:
     *                 type: integer
     *             required:
     *               - nome
     *               - email
     *               - senha
     *               - tipo_usuario_id
     *               - herbario_id
     *           example:
     *             nome: "Novo Usuário"
     *             email: "novo@email.com"
     *             senha: "senha123"
     *             tipo_usuario_id: 2
     *             herbario_id: 1
     *     responses:
     *       201:
     *         description: Usuário cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 2
     *                 nome: "Novo Usuário"
     *                 email: "novo@email.com"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/usuarios')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            validacoesMiddleware(listagemUsuarioEsquema),
            listagensMiddleware,
            controller.listagem,
        ])
        .post([
            tokensMiddleware([
             TIPOS_USUARIOS.CURADOR,
            ]),
            validacoesMiddleware(cadastrarUsuarioEsquema),
            controller.cadastro,
        ]);

    /**
     * @swagger
     * /usuarios/{usuario_id}:
     *   put:
     *     summary: Edita um usuário
     *     tags: [Usuários]
     *     parameters:
     *       - in: path
     *         name: usuario_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do usuário
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *               email:
     *                 type: string
     *             required:
     *               - nome
     *               - email
     *           example:
     *             nome: "Usuário Editado"
     *             email: "editado@email.com"
     *     responses:
     *       200:
     *         description: Usuário editado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 nome: "Usuário Editado"
     *                 email: "editado@email.com"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Busca um usuário pelo ID
     *     tags: [Usuários]
     *     parameters:
     *       - in: path
     *         name: usuario_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do usuário
     *     responses:
     *       200:
     *         description: Dados do usuário encontrados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 telefone:
     *                   type: string
     *                 ra:
     *                   type: string
     *                   nullable: true
     *                 email:
     *                   type: string
     *                 herbario_id:
     *                   type: integer
     *                 tipos_usuario:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     tipo:
     *                       type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   delete:
     *     summary: Remove um usuário
     *     tags: [Usuários]
     *     parameters:
     *       - in: path
     *         name: usuario_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do usuário
     *     responses:
     *       204:
     *         description: Usuário removido com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/usuarios/:usuario_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizarUsuarioEsquema),
            controller.editar,
        ])
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            controller.usuario,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            validacoesMiddleware(desativarUsuarioEsquema),
            controller.desativar,
        ]);

    /**
     * @swagger
     * /usuarios/{usuarioId}/senha:
     *   put:
     *     summary: Atualiza a senha de um usuário
     *     tags: [Usuários]
     *     parameters:
     *       - in: path
     *         name: usuarioId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do usuário
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               senha:
     *                 type: string
     *             required:
     *               - senha
     *           example:
     *             senha: "novaSenha123"
     *     responses:
     *       200:
     *         description: Senha atualizada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 sucesso: true
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/usuarios/:usuarioId/senha')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizarSenhaEsquema),
            controller.atualizarSenha,
        ]);
};
