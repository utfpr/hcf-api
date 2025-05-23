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

export default app => {
    app.route('/login')
        .post([
            validacoesMiddleware(usuarioLoginEsquema),
            controller.login,
        ]);

    app.route('/coletores-predicao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.obtemColetores,
        ]);

    app.route('/identificadores-predicao')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.obtemIdentificadores,
        ]);

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
    app.route('/usuarios/:usuario_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            validacoesMiddleware(atualizarUsuarioEsquema),
            controller.editar,
        ])
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
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
