import multer from 'multer';

import { upload } from '../config/directory';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controller = require('../controllers/uploads-controller');

const uploadMiddleware = multer({ dest: upload });

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Operações relacionadas aos uploads de imagens
 */
export default app => {
    /**
     * @swagger
     * /uploads:
     *   post:
     *     summary: Faz upload de uma nova imagem
     *     tags: [Uploads]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imagem:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Imagem enviada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 url: "/uploads/123456789.jpg"
     *       400:
     *         description: Erro no upload
     */
    app.route('/uploads')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            uploadMiddleware.single('imagem'),
            controller.post,
        ]);

    /**
     * @swagger
     * /uploads/atualizaImagem:
     *   post:
     *     summary: Atualiza uma imagem existente
     *     tags: [Uploads]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imagem:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Imagem atualizada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 url: "/uploads/123456789.jpg"
     *       400:
     *         description: Erro ao atualizar imagem
     */
    app.route('/uploads/atualizaImagem')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            uploadMiddleware.single('imagem'),
            controller.put,
        ]);

    /**
     * @swagger
     * /uploads/criaCodigoSemFoto:
     *   post:
     *     summary: Cria um código para um registro sem foto
     *     tags: [Uploads]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imagem:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Código criado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 codigo: "ABC123"
     *                 url: "/uploads/semfoto.jpg"
     *       400:
     *         description: Erro ao criar código
     */
    app.route('/uploads/criaCodigoSemFoto')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            uploadMiddleware.single('imagem'),
            controller.postBarrSemFotos,
        ]);
};
