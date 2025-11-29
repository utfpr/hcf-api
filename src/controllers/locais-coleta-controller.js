import pick from '~/helpers/pick';

import BadRequestExeption from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    Relevo, Solo, Vegetacao, LocalColeta, Cidade, FaseSucessional, Estado, Pais, sequelize,
} = models;

export const cadastrarSolo = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Solo.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(soloEncontrado => {
            if (soloEncontrado) {
                throw new BadRequestExeption(300);
            }
        })
        .then(() => Solo.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(soloCriado => {
            if (!soloCriado) {
                throw new BadRequestExeption(301);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const cadastrarRelevo = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Relevo.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(relevoEncontrado => {
            if (relevoEncontrado) {
                throw new BadRequestExeption(302);
            }
        })
        .then(() => Relevo.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(relevoCriado => {
            if (!relevoCriado) {
                throw new BadRequestExeption(303);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const cadastrarVegetacao = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Vegetacao.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(vegetacaoEncontrada => {
            if (vegetacaoEncontrada) {
                throw new BadRequestExeption(304);
            }
        })
        .then(() => Vegetacao.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(vegetacaoCriada => {
            if (!vegetacaoCriada) {
                throw new BadRequestExeption(305);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarRelevos = (request, response, next) => {
    let where = {};

    if (request.query.nome) {
        where = {
            ...where,
            nome: { [sequelize.Op.like]: `%${request.query.nome}%` },
        };
    }

    Promise.resolve()
        .then(() => Relevo.findAndCountAll({
            attributes: ['id', 'nome'],
            where,
            order: [['nome', 'ASC']],
        }))
        .then(relevos => {
            response.status(codigos.LISTAGEM).json(relevos.rows);
        })
        .catch(next);
};

export const buscarSolos = (request, response, next) => {
    let where = {};

    if (request.query.nome) {
        where = {
            ...where,
            nome: { [sequelize.Op.like]: `%${request.query.nome}%` },
        };
    }

    Promise.resolve()
        .then(() => Solo.findAndCountAll({
            attributes: ['id', 'nome'],
            where,
            order: [['nome', 'ASC']],
        }))
        .then(solos => {
            response.status(codigos.LISTAGEM).json(solos.rows);
        })
        .catch(next);
};

export const buscarVegetacoes = (request, response, next) => {
    let where = {};

    if (request.query.nome) {
        where = {
            ...where,
            nome: { [sequelize.Op.like]: `%${request.query.nome}%` },
        };
    }

    Promise.resolve()
        .then(() => Vegetacao.findAndCountAll({
            attributes: ['id', 'nome'],
            where,
            order: [['nome', 'ASC']],
        }))
        .then(vegetacoes => {
            response.status(codigos.LISTAGEM).json(vegetacoes.rows);
        })
        .catch(next);
};

export const cadastrarLocalColeta = async (request, response, next) => {
    try {
        const dados = pick(request.body, ['descricao', 'complemento', 'cidade_id', 'fase_sucessional_id']);
        const localColeta = await LocalColeta.create(dados);
        response.status(201).json(localColeta);
    } catch (error) {
        next(error);
    }
};

export const buscarLocaisColeta = async (request, response, next) => {
    try {
        const { cidade_id: cidadeId, estado_id: estadoId, pais_id: paisId, descricao } = request.query;
        const { limite, pagina, offset } = request.paginacao;
        const { getAll } = request.query;

        const where = {};
        const include = [
            {
                model: Cidade,
                include: [
                    {
                        model: Estado,
                        include: [Pais],
                    },
                ],
            },
            { model: FaseSucessional },
        ];

        if (descricao) {
            where.descricao = { [sequelize.Op.like]: `%${descricao}%` };
        }

        if (cidadeId) {
            where.cidade_id = cidadeId;
        } else if (estadoId) {
            include[0].where = { estado_id: estadoId };
            include[0].required = true;
        } else if (paisId) {
            include[0].include[0].where = { pais_id: paisId };
            include[0].include[0].required = true;
            include[0].required = true;
        }

        const queryOptions = {
            where,
            include,
            order: [[sequelize.literal('LOWER(descricao)'), 'ASC']],
        };

        if (getAll !== 'true') {
            queryOptions.limit = limite;
            queryOptions.offset = offset;
        }

        const { count, rows } = await LocalColeta.findAndCountAll(queryOptions);

        if (getAll === 'true') {
            return response.status(200).json({
                resultado: rows,
            });
        }

        return response.status(200).json({
            metadados: {
                total: count,
                pagina,
                limite,
            },
            resultado: rows,
        });
    } catch (error) {
        return next(error);
    }
};

export const buscarLocalColetaPorId = async (request, response, next) => {
    try {
        const { id } = request.params;

        const localColeta = await LocalColeta.findOne({
            where: { id },
            include: [
                {
                    model: Cidade,
                    include: [
                        {
                            model: Estado,
                            include: [
                                Pais,
                            ],
                        },
                    ],
                },
                { model: FaseSucessional },
            ],
        });

        if (!localColeta) {
            response.status(404).json({
                mensagem: 'Local de coleta não encontrado.',
            });
            return;
        }

        response.status(200).json(localColeta);
    } catch (error) {
        next(error);
    }
};

export const atualizarLocalColeta = async (request, response, next) => {
    try {
        const { id } = request.params;
        const dados = pick(request.body, ['descricao', 'complemento', 'cidade_id', 'fase_sucessional_id']);

        const [updated] = await LocalColeta.update(dados, {
            where: { id },
        });

        if (updated === 0) {
            response.status(404).json({
                mensagem: 'Local de coleta não encontrado.',
            });
            return;
        }

        const localColetaAtualizado = await LocalColeta.findOne({
            where: { id },
            include: [
                { model: Cidade },
                { model: FaseSucessional },
            ],
        });

        response.status(200).json(localColetaAtualizado);
    } catch (error) {
        next(error);
    }
};

export const deletarLocalColeta = async (request, response, next) => {
    try {
        const { id } = request.params;

        const localColeta = await LocalColeta.findOne({
            where: { id },
        });

        if (!localColeta) {
            throw new BadRequestExeption('Local de Coleta não encontrado.');
        }

        const { Tombo } = models;
        const tombosAssociados = await Tombo.count({
            where: {
                local_coleta_id: id,
            },
        });

        if (tombosAssociados > 0) {
            throw new BadRequestExeption('Local de Coleta não pode ser excluído porque possui dependentes.');
        }

        await LocalColeta.destroy({
            where: { id },
        });

        response.status(204).send();

    } catch (error) {
        next(error);
    }
};
export default {};
