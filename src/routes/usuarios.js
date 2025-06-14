import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarUsuarioEsquema from '../validators/usuario-atualiza';
import atualizarSenhaEsquema from '../validators/usuario-atualiza-senha';
import cadastrarUsuarioEsquema from '../validators/usuario-cadastro';
import desativarUsuarioEsquema from '../validators/usuario-desativa';
import listagemUsuarioEsquema from '../validators/usuario-listagem';
import usuarioLoginEsquema from '../validators/usuario-login';

const controller = require('../controllers/usuarios-controller');

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
     *               example:
     *                 token: "jwt.token.aqui"
     *       401:
     *         description: Credenciais inválidas
     */
    app.route('/login')
        .post([
            validacoesMiddleware(usuarioLoginEsquema),
            controller.login,
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
     */
    app.route('/identificadores-predicao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
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
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *                   email:
     *                     type: string
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
     *               email:
     *                 type: string
     *               senha:
     *                 type: string
     *             required:
     *               - nome
     *               - email
     *               - senha
     *           example:
     *             nome: "Novo Usuário"
     *             email: "novo@email.com"
     *             senha: "senha123"
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
     *       400:
     *         description: Dados inválidos
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
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Usuário não encontrado
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
     *               example:
     *                 id: 1
     *                 nome: "Usuário 1"
     *                 email: "usuario1@email.com"
     *       404:
     *         description: Usuário não encontrado
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
     *       404:
     *         description: Usuário não encontrado
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
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Usuário não encontrado
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
