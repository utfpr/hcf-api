import nodemailer from 'nodemailer';

import { UserRegistrationDTO } from '../dtos/UserRegistrationDTO';
import BadRequestExeption from '../errors/bad-request-exception';
import { comparaSenha, gerarSenha } from '../helpers/senhas';
import { constroiPayloadUsuario, geraTokenResetSenha, geraTokenUsuario } from '../helpers/tokens';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    Sequelize: { Op }, Usuario, TipoUsuario, Coletor, Identificador,
} = models;

export const encontraUsuarioAtivoPorEmail = email => {
    const where = {
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

    const where = {};

    const {
        nome, tipo, email, telefone,
    } = request.query;

    if (nome) {
        where.nome = {
            [Op.iLike]: `%${nome}%`,
        };
    }
    if (tipo) {
        where.tipo_usuario_id = tipo;
    }
    if (email) {
        where.email = {
            [Op.iLike]: `%${email}%`,
        };
    }
    if (telefone) {
        where.telefone = {
            [Op.iLike]: `%${telefone}%`,
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

            response.status(codigos.CADASTRO_RETORNO).json(new UserRegistrationDTO(retorno));
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
        .then(() => Usuario.findOne({
            where: { id: usuarioId },
        }))
        .then(usuario => {
            if (!usuario) {
                throw new BadRequestExeption(106);
            }
            return usuario;
        })
        .then(() => {
            const { Alteracao } = models;
            return Alteracao.count({
                where: {
                    usuario_id: usuarioId,
                },
            });
        })
        .then(alteracoesCount => {
            if (alteracoesCount > 0) {
                throw new BadRequestExeption('Usuário não pode ser excluído porque possui dependentes.');
            }
        })
        .then(() => Usuario.destroy({
            where: { id: usuarioId },
        }))
        .then(() => {
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
                nome: { [Op.iLike]: `%${nome}%` },
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
        .then(() => Identificador.findAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            where: {
                nome: { [Op.iLike]: `%${nome}%` },
            },
            limit: 10,
        }))
        .then(identificadores => {
            response.status(200).json(identificadores);
        })
        .catch(next);
};

export const atualizarSenha = (request, response, next) => {
    const { usuarioId } = request.params;
    const { senhaAtual, novaSenha } = request.body;

    Promise.resolve()
        .then(() => Usuario.scope(null).findOne({
            where: { id: usuarioId },
            attributes: ['senha'],
        }))
        .then(user => {
            if (!user) {
                throw new BadRequestExeption(106);
            }
            if (!user.senha) {
                throw new BadRequestExeption(100);
            }

            if (!comparaSenha(senhaAtual, user.senha)) {
                throw new BadRequestExeption(100);
            }
            const novaSenhaHash = gerarSenha(novaSenha);
            return Usuario.update({ senha: novaSenhaHash }, { where: { id: usuarioId } });
        })
        .then(() => {
            response.status(codigos.EDITAR_SEM_RETORNO).send();
        })
        .catch(next);
};

export const solicitarTrocaDeSenha = async (request, response, next) => {
    const { email } = request.body;
    try {
        const user = await encontraUsuarioAtivoPorEmail(email);
        if (user) {
            const token = geraTokenResetSenha();
            const dataExpiracao = new Date();
            dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 45);

            await Usuario.update(
                { token_troca_senha: token, token_troca_senha_expiracao: dataExpiracao },
                { where: { id: user.id } },
            );

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const link = `${process.env.URL_PAINEL}reset-senha?token=${token}`;
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Sistema HCF" <no-reply@hcf.com>',
                to: email,
                subject: 'Redefinição de senha',
                html: `
          <p>Olá ${user.nome},</p>
          <p>Você solicitou uma redefinição de senha.</p>
          <p>Não compartilhe esse link.</p>
          <p>Clique no link abaixo para criar uma nova senha token válido por 45 minutos.</p>
          <a href="${link}">${link}</a>
        `,
            });
        }

        return response.status(codigos.EDITAR_SEM_RETORNO).send();
    } catch (err) {
        return next(err);
    }
};

export const redefinirSenhaComToken = async (request, response, next) => {
    const { token, nova_senha: novaSennha } = request.body;

    try {
        if (!token || !novaSennha) {
            throw new BadRequestExeption(400, 'Token e nova senha são obrigatórios.');
        }

        const user = await Usuario.findOne({
            where: {
                token_troca_senha: token,
                token_troca_senha_expiracao: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return response.status(400).json({
                mensagem: 'Token inválido ou expirado.',
            });

        }

        const novaSenhaHash = gerarSenha(novaSennha);
        await Usuario.update(
            {
                senha: novaSenhaHash,
                token_troca_senha: null,
                token_troca_senha_expiracao: null,
            },
            { where: { id: user.id } },
        );

        return response.status(codigos.EDITAR_SEM_RETORNO).send();
    } catch (err) {
        return next(err);
    }
};

export default {};
