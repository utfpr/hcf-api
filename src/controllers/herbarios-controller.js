import BadRequestExeption from '../errors/bad-request-exception';
import NotFoundExeption from '../errors/not-found-exception';
import models from '../models';
import omit from '../helpers/omit';
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
        ativo: true,
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
            // eslint-disable-next-line
            console.log(herbario.rows[0].cidade)
            // eslint-disable-next-line prefer-destructuring
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
        // eslint-disable-next-line no-return-assign
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
        // eslint-disable-next-line no-return-assign
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
        // eslint-disable-next-line no-return-assign
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
                ativo: true,
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
            // eslint-disable-next-line
            console.log(request.body.herbario)
            const herbario = {
                ...request.body.herbario,
                endereco_id: endereco.id,
            };

            return Herbario.create(herbario, { transaction });
        })
        .then(herbario => {
            const where = {
                ativo: true,
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
                ativo: true,
                id: request.params.herbario_id,
            };

            return Herbario.findOne({ attributes, where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new NotFoundExeption(200);
            }

            const endereco = omit(request.body.endereco, ['id']);

            const where = {
                id: herbario.endereco_id,
            };

            return Endereco.update(endereco, { where, transaction })
                .then(() => herbario);
        })
        .then(herbario => {
            const dados = omit(request.body.herbario, ['id', 'endereco_id']);

            return herbario.update(dados, { transaction })
                .then(() => herbario);
        })
        .then(herbario => {
            const where = {
                ativo: true,
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

    Promise.resolve()
        .then(() => {
            const where = {
                ativo: true,
                id: params.herbario_id,
            };

            return Herbario.findOne({ where });
        })
        .then(herbario => {
            if (!herbario) {
                throw new NotFoundExeption(200);
            }

            const where = {
                ativo: true,
                id: params.herbario_id,
            };

            return herbario.update({ ativo: false }, { where });
        })
        .then(() => {
            response.status(204)
                .send();
        })
        .catch(next);
};

export const listagem = (request, response, next) => {
    const { pagina, limite, offset } = request.paginacao;
    const { nome, email, sigla } = request.query;

    let where = {
        ativo: true,
    };

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
