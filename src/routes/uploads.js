import multer from 'multer';

import { upload } from '../config/directory';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controller = require('../controllers/uploads-controller');

// File upload validation
const fileFilter = (req, file, cb) => {
    // Allowed image MIME types
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Apenas imagens são aceitas.'), false);
    }
};

const uploadMiddleware = multer({
    dest: upload,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1, // Only one file per request
    },
});

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
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
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
