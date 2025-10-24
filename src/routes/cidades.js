import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarCidadeEsquema from '../validators/cidade-atualiza';
import cadastrarCidadeEsquema from '../validators/cidade-cadastro';
import desativarCidadeEsquema from '../validators/cidade-desativa';

const controller = require('../controllers/cidades-controller');

/**
 * @swagger
 * tags:
 *   name: Cidades
 *   description: Operações relacionadas às cidades
 */
export default app => {
    /**
     * @swagger
     * /cidades:
     *   get:
     *     summary: Lista todas as cidades
     *     tags: [Cidades]
     *     parameters:
     *       - in: query
     *         name: nome
     *         schema:
     *           type: string
     *         description: Filtrar por nome da cidade
     *       - in: query
     *         name: id
     *         schema:
     *           type: integer
     *         description: Filtrar por ID do estado
     *     responses:
     *       200:
     *         description: Lista de cidades retornada com sucesso
     *   post:
     *     summary: Cadastra uma nova cidade
     *     tags: [Cidades]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *               estado_id:
     *                 type: integer
     *             required:
     *               - nome
     *               - estado_id
     *     responses:
     *       201:
     *         description: Cidade cadastrada com sucesso
     */
    app.route('/cidades')
        .get([
            controller.listagem,
        ])
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(cadastrarCidadeEsquema),
            controller.cadastrarCidade,
        ]);

    /**
     * @swagger
     * /cidades/{cidadeId}:
     *   get:
     *     summary: Busca uma cidade pelo ID
     *     tags: [Cidades]
     *   put:
     *     summary: Atualiza uma cidade
     *     tags: [Cidades]
     *   delete:
     *     summary: Desativa uma cidade
     *     tags: [Cidades]
     */
    app.route('/cidades/:cidadeId')
        .get([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR]),
            controller.encontrarCidade,
        ])
        .put([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(atualizarCidadeEsquema),
            controller.atualizarCidade,
        ])
        .delete([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(desativarCidadeEsquema),
            controller.desativarCidade,
        ]);
};
