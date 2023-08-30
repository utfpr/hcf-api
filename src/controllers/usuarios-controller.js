import { comparaSenha, gerarSenha } from '../helpers/senhas';
import { constroiPayloadUsuario, geraTokenUsuario } from '../helpers/tokens';
import BadRequestExeption from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    Sequelize: { Op }, Usuario, TipoUsuario, Coletor,
} = models;

export const encontraUsuarioAtivoPorEmail = email => {
    const where = {
        ativo: true,
        email,
    };

    return Usuario.findOne({
        attributes: {
            exclude: undefined,
        },
        include: TipoUsuario,
        where,
    });
};

export const cadastraUsuario = usuario => Usuario.create(usuario);


export const atualizaUsuario = (usuario, usuarioId) => Usuario.update(usuario, {
    where: {
        id: usuarioId,
    },
});

export const listaTodosUsuariosAtivos = (limit, offset, where) => Usuario.findAndCountAll({
    include: [{
        model: TipoUsuario,
        attributes: {
            exclude: ['updated_at'],
        },
    }],
    where,
    limit,
    offset,
    order: [['id', 'DESC']],
});

export const encontrarUsuario = id => Usuario.findOne({
    attributes: {
        exclude: ['ativo', 'tipo_usuario_id', 'senha', 'created_at', 'updated_at'],
    },
    include: [{
        model: TipoUsuario,
        attributes: {
            exclude: ['created_at', 'updated_at'],
        },
    }],
    where: {
        id,
        ativo: true,
    },
});

export const login = (request, response, next) => {
    const { body } = request;

    encontraUsuarioAtivoPorEmail(body.email)
        .then(usuario => {
            if (!usuario || !comparaSenha(body.senha, usuario.senha)) {
                throw new BadRequestExeption(100);
            }

            const payload = constroiPayloadUsuario(usuario);

            return {
                token: geraTokenUsuario(payload),
                usuario: payload,
            };
        })
        .then(retorno => {
            response.status(codigos.LOGIN)
                .json(retorno);
        })
        .catch(next);
};

export const recuperarSenha = (request, response, next) => {
    const { body, senha } = request;

    encontraUsuarioAtivoPorEmail(body.email)
        .then(usuario => {
            if (!usuario) {
                throw new BadRequestExeption(100);
            }
            return usuario;
        })
        .then(usuario => {
            const pass = gerarSenha(senha);
            Usuario.update(
                { senha: pass },
                {
                    where: {
                        id: usuario.id,
                    },
                },
            );
        })
        .then(retorno => {
            response.status(codigos.EDITAR_SEM_RETORNO)
                .json(retorno);
        })
        .catch(next);
};

export const listagem = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;

    const where = {
        ativo: true,
    };

    const {
        nome, tipo, email, telefone,
    } = request.query;

    if (nome) {
        where.nome = {
            [Op.like]: `%${nome}%`,
        };
    }
    if (tipo) {
        where.tipo_usuario_id = tipo;
    }
    if (email) {
        where.email = {
            [Op.like]: `%${email}%`,
        };
    }
    if (telefone) {
        where.telefone = {
            [Op.like]: `%${telefone}%`,
        };
    }
    Promise.resolve()
        .then(() => listaTodosUsuariosAtivos(limite, offset, where))
        .then(listaUsuarios => {
            response.status(200)
                .json({
                    metadados: {
                        total: listaUsuarios.count,
                        pagina,
                        limite,
                    },
                    usuarios: listaUsuarios.rows,
                });
        })
        .catch(next);
};

export const cadastro = (request, response, next) => {
    const { body } = request;

    Promise.resolve()
        .then(() => encontraUsuarioAtivoPorEmail(body.email))
        .then(usuario => {
            if (usuario) {
                throw new BadRequestExeption(110);
            }
            body.senha = gerarSenha(body.senha);
        })
        .then(() => cadastraUsuario(body))
        .then(retorno => {
            if (!retorno) {
                throw new BadRequestExeption(112);
            }
            response.status(codigos.CADASTRO_RETORNO).json(retorno);
        })
        .catch(next);
};

export const editar = (request, response, next) => {
    const { body, params } = request;
    const usuarioId = parseInt(params.usuario_id);
    Promise.resolve()
        .then(() => encontraUsuarioAtivoPorEmail(body.email))
        .then(usuario => {
            if (usuario) {
                if (usuario.id !== usuarioId) {
                    throw new BadRequestExeption(110);
                }
            }
            if (body.senha) {
                body.senha = gerarSenha(body.senha);
            }
        })
        .then(() => atualizaUsuario(body, usuarioId))
        .then(retorno => {
            if (!retorno) {
                throw new BadRequestExeption(111);
            }
            response.status(codigos.EDITAR_SEM_RETORNO).send();
        })
        .catch(next);
};

export const desativar = (request, response, next) => {
    const usuarioId = parseInt(request.params.usuario_id);
    Promise.resolve()
        .then(() => Usuario.update({
            ativo: false,
        }, {
            where: {
                id: usuarioId,
            },
        }))
        .then(retorno => {
            if (!retorno[0]) {
                throw new BadRequestExeption(106);
            }
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const usuario = (request, response, next) => {
    const id = request.params.usuario_id;

    Promise.resolve()
        .then(() => encontrarUsuario(id))
        .then(user => {
            if (!user) {
                throw new BadRequestExeption(106);
            }

            response.status(codigos.BUSCAR_UM_ITEM)
                .json(user);
        })
        .catch(next);
};

export const obtemColetores = (request, response, next) => {
    const { nome } = request.query;

    Promise.resolve()
        .then(() => Coletor.findAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            where: {
                ativo: true,
                nome: { [Op.like]: `%${nome}%` },
            },
            limit: 10,
        }))
        .then(coletores => {
            response.status(200).json(coletores);
        })
        .catch(next);
};

export const obtemIdentificadores = (request, response, next) => {
    const { nome } = request.query;

    Promise.resolve()
        .then(() => Usuario.findAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            where: {
                ativo: true,
                nome: { [Op.like]: `%${nome}%` },
            },
            limit: 10,
        }))
        .then(identificadores => {
            response.status(200).json(identificadores);
        })
        .catch(next);
};

export default {};
