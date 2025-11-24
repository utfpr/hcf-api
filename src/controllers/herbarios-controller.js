import BadRequestExeption from '../errors/bad-request-exception';
import NotFoundExeption from '../errors/not-found-exception';
import omit from '../helpers/omit';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    sequelize,
    Sequelize: { Op, ForeignKeyConstraintError },
    Herbario,
    Endereco,
    Cidade,
    Estado,
    Pais,
} = models;

const catchForeignKeyConstraintError = err => {
    if (err.fields.includes('cidade_id')) {
        throw new BadRequestExeption(600);
    }

    throw err;
};

export const listaTodosHerbariosAtivos = (limit, offset, where) => Herbario.findAndCountAll({
    include: {
        model: Endereco,
        attributes: {
            exclude: ['cidade_id', 'updated_at', 'created_at'],
        },
        include: {
            model: Cidade,
            attributes: {
                exclude: ['estado_id', 'updated_at', 'created_at'],
            },
            include: {
                model: Estado,
                attributes: {
                    exclude: ['pais_id', 'updated_at', 'created_at'],
                },
                include: Pais,
            },
        },
    },
    where,
    limit,
    offset,
    order: [['id', 'DESC']],
});

export const buscarHerbario = (request, response, next) => {
    const where = {
        id: request.params.herbario_id,
    };
    const retorno = {
        herbario: {},
        paises: [],
        estados: [],
        cidades: [],
    };
    Promise.resolve()
        .then(() => listaTodosHerbariosAtivos(1, 0, where))
        .then(herbario => {
            retorno.herbario = herbario.rows[0];
            if (retorno.count === 0) {
                throw new NotFoundExeption(60);
            }
        })
        .then(() => Pais.findAll({
            attributes: {
                exclude: ['updated_at', 'created_at'],
            },
        }))

        .then(paises => retorno.paises = paises)
        .then(() => {
            if (retorno.herbario.endereco) {
                return Estado.findAll({
                    attributes: {
                        exclude: ['updated_at', 'created_at'],
                    },
                    where: {
                        pais_id: retorno.herbario.endereco.cidade.estado.paise.id,
                    },
                });
            }
            return [];
        })

        .then(estados => retorno.estados = estados)
        .then(() => {
            if (retorno.herbario.endereco) {
                return Cidade.findAll({
                    attributes: {
                        exclude: ['updated_at', 'created_at'],
                    },
                    where: {
                        estado_id: retorno.herbario.endereco.cidade.estado.id,
                    },
                });
            }
            return [];
        })

        .then(cidades => retorno.cidades = cidades)
        .then(() => {
            response.status(codigos.LISTAGEM).json(retorno);
        })
        .catch(next);
};

export const cadastro = (request, response, next) => {
    const callback = transaction => Promise.resolve()
        .then(() => {
            const { herbario } = request.body;
            const where = {
                email: herbario.email,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (herbario) {
                throw new BadRequestExeption(201);
            }

            const { endereco } = request.body;
            return Endereco.create(endereco, { transaction });
        })
        .then(endereco => {
            const herbario = {
                ...request.body.herbario,
                endereco_id: endereco.id,
            };

            return Herbario.create(herbario, { transaction });
        })
        .then(herbario => {
            const where = {
                id: herbario.id,
            };

            return Herbario.findOne({
                transaction,
                include: Endereco,
                where,
            });
        });

    sequelize.transaction(callback)
        .then(herbario => {
            response.status(201)
                .json(herbario);
        })
        .catch(ForeignKeyConstraintError, catchForeignKeyConstraintError)
        .catch(next);
};

export const editar = (request, response, next) => {
    const callback = transaction => Promise.resolve()
        .then(() => {
            const attributes = { exclude: undefined };
            const where = {
                id: request.params.herbario_id,
            };

            return Herbario.findOne({ attributes, where, transaction });
        })
        .then(async herbario => {
            if (!herbario) {
                throw new NotFoundExeption(200);
            }

            const endereco = omit(request.body.endereco, ['id']);

            const where = {
                id: herbario.endereco_id,
            };

            if (herbario.endereco_id === null) {
                const localizacao = await Endereco.create(endereco, { transaction });

                const dados = {
                    ...request.body.herbario,
                    endereco_id: localizacao.id,
                };

                return herbario.update(dados, { transaction });
            }

            const dados = omit(request.body.herbario, ['id', 'endereco_id']);

            await Endereco.update(endereco, { where, transaction });

            return herbario.update(dados, { transaction })
                .then(() => herbario);
        })
        .then(herbario => {
            const where = {
                id: herbario.id,
            };

            return Herbario.findOne({
                transaction,
                include: Endereco,
                where,
            });
        });

    sequelize.transaction(callback)
        .then(herbario => {
            response.status(200)
                .json(herbario);
        })
        .catch(ForeignKeyConstraintError, catchForeignKeyConstraintError)
        .catch(next);
};

export const desativar = (request, response, next) => {
    const { params } = request;

    const callback = transaction => Promise.resolve()
        .then(() => {
            const where = {
                id: params.herbario_id,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new NotFoundExeption(200);
            }
        })
        .then(() => {
            const { Tombo } = models;
            return Tombo.count({
                where: {
                    entidade_id: params.herbario_id,
                },
                transaction,
            });
        })
        .then(tombosCount => {
            if (tombosCount > 0) {
                throw new BadRequestExeption('Herbário não pode ser excluído porque possui dependentes.');
            }
        })
        .then(() => {
            const { Usuario } = models;
            return Usuario.count({
                where: {
                    herbario_id: params.herbario_id,
                },
                transaction,
            });
        })
        .then(usuariosCount => {
            if (usuariosCount > 0) {
                throw new BadRequestExeption('Herbário não pode ser excluído porque possui dependentes.');
            }
        })
        .then(() => {
            const { Remessa } = models;
            return Remessa.count({
                where: {
                    herbario_id: params.herbario_id,
                },
                transaction,
            });
        })
        .then(remessasOrigemCount => {
            if (remessasOrigemCount > 0) {
                throw new BadRequestExeption('Herbário não pode ser excluído porque possui dependentes.');
            }
        })
        .then(() => {
            const { Remessa } = models;
            return Remessa.count({
                where: {
                    entidade_destino_id: params.herbario_id,
                },
                transaction,
            });
        })
        .then(remessasDestinoCount => {
            if (remessasDestinoCount > 0) {
                throw new BadRequestExeption('Herbário não pode ser excluído porque possui dependentes.');
            }
        })
        .then(() => Herbario.destroy({
            where: {
                id: params.herbario_id,
            },
            transaction,
        }));

    sequelize.transaction(callback)
        .then(() => {
            response.status(204).send();
        })
        .catch(next);
};

export const listagem = (request, response, next) => {
    const { pagina, limite, offset } = request.paginacao;
    const { nome, email, sigla } = request.query;

    let where = {};

    if (nome) {
        where = {
            ...where,
            nome: { [Op.like]: `%${nome}%` },
        };
    }

    if (email) {
        where = {
            ...where,
            email: { [Op.like]: `%${email}%` },
        };
    }

    if (sigla) {
        where = {
            ...where,
            sigla: { [Op.like]: `%${sigla}%` },
        };
    }

    Promise.resolve()
        .then(() => listaTodosHerbariosAtivos(limite, offset, where))
        .then(listaHerbarios => {
            response.status(codigos.LISTAGEM)
                .json({
                    metadados: {
                        total: listaHerbarios.count,
                        pagina,
                        limite,
                    },
                    herbarios: listaHerbarios.rows,
                });
        })
        .catch(next);
};
