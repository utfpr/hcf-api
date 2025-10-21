import multer from 'multer';

import { upload } from '../config/directory';
import * as controller from '../controllers/uploads-controller';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

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
     *     summary: Faz upload de uma nova imagem ou sobrescreve uma existente
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
     *                 description: Arquivo de imagem
     *               codigo_foto:
     *                 type: string
     *                 description: Código da foto (obrigatório)
     *                 example: "HCF000012345"
     *               tombo_hcf:
     *                 type: string
     *                 description: Número do tombo HCF
     *               em_vivo:
     *                 type: boolean
     *                 description: Se é uma foto em vivo
     *             required:
     *               - imagem
     *               - codigo_foto
     *     responses:
     *       201:
     *         description: Imagem enviada/atualizada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 url:
     *                   type: string
     *                   example: "/uploads/HCF000012345.jpg"
     *                 codigo:
     *                   type: string
     *                   example: "HCF000012345"
     *                 message:
     *                   type: string
     *                   example: "Imagem criada com sucesso"
     *       400:
     *         description: Erro no upload (arquivo ou código não fornecido)
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
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
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
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
