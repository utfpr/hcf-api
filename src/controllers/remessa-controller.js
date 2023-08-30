import models from '../models';
import BadRequestExeption from '../errors/bad-request-exception';
import codigos from '../resources/codigos-http';

const {
    Herbario,
    Remessa,
    sequelize,
    Tombo,
    Sequelize: { Op },
    RetiradaExsiccata,
} = models;

export const cadastro = (request, response, next) => {

    const callback = transaction => Promise.resolve()
        .then(() => {
            const { tombos } = request.body;

            tombos.forEach(item => {
                if ((tombos.filter(tombo => tombo.hcf === item.hcf).length > 1)) {
                    throw new BadRequestExeption(703);
                }
            });
        })
        .then(() => {
            const { herbario_id: herbarioId } = request.body.remessa;
            const where = {
                ativo: true,
                id: herbarioId,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new BadRequestExeption(200);
            }
        })
        .then(() => {
            const { entidade_destino_id: entidadeDestino } = request.body.remessa;
            const where = {
                ativo: true,
                id: entidadeDestino,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new BadRequestExeption(200);
            }
        })
        .then(() => {
            const hcf = request.body.tombos.map(item => ({
                hcf: item.hcf,
            }));

            return Tombo.findAndCountAll({
                where: {
                    [Op.or]: hcf,
                    ativo: 1,
                    rascunho: 0,
                    situacao: 'REGULAR',
                },
                transaction,
            });
        })
        .then(tombos => {
            if (tombos.count !== request.body.tombos.length) {
                throw new BadRequestExeption(702);
            }
        })
        .then(() => {
            const body = {
                observacao: request.body.remessa.observacao,
                data_envio: request.body.remessa.data_envio,
                entidade_destino_id: request.body.remessa.entidade_destino_id,
                herbario_id: request.body.remessa.herbario_id,
            };

            return Remessa.create(body, { transaction });
        })
        .then(remessa => {
            if (!remessa) {
                throw new BadRequestExeption(700);
            }
            const tombos = request.body.tombos.map(item => ({
                retirada_exsiccata_id: remessa.id,
                tombo_hcf: item.hcf,
                tipo: item.tipo,
                data_vencimento: item.data_vencimento || null,
            }));


            return RetiradaExsiccata.bulkCreate(tombos, { transaction });
        })
        .then(() => {
            const reduce = (prev, item) => {
                const conteudo = prev[item.tipo] || [];

                return {
                    ...prev,
                    [item.tipo]: [
                        ...conteudo,
                        item.hcf,
                    ],
                };
            };

            const grupos = request.body.tombos.reduce(reduce, {});

            const updates = Object.keys(grupos)
                .map(key => Tombo.update({ situacao: key }, { transaction, where: { hcf: grupos[key] } }));

            return Promise.all(updates);
        });

    sequelize.transaction(callback)
        .then(herbario => {
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const listagem = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { numero_remessa: numRemessa, numero_tombo: numTombo, numero_herbario: numHerbario } = request.query;
    let retorno = {};
    let whereRemessa = {};
    let whereTombo = {};
    if (numRemessa && numHerbario) {
        whereRemessa = {
            id: numRemessa,
            [Op.or]: [
                {
                    herbario_id: numHerbario,
                },
                {
                    entidade_destino_id: numHerbario,
                },
            ],
        };
    } else if (!numRemessa && numHerbario) {
        whereRemessa = {
            [Op.or]: [
                {
                    herbario_id: numHerbario,
                },
                {
                    entidade_destino_id: numHerbario,
                },
            ],
        };
    } else if (numRemessa && !numHerbario) {
        whereRemessa = {
            id: numRemessa,
        };
    }
    if (numTombo) {
        whereTombo = {
            hcf: numTombo,
            rascunho: 0,
            ativo: 1,
        };
    }
    Promise.resolve()
        .then(() => Remessa.findAndCountAll())
        .then(remessas => {
            retorno.count = remessas.count;
            return Remessa.findAndCountAll({
                include: [
                    {
                        model: Tombo,
                        attributes: ['hcf'],
                        where: whereTombo,
                    },
                ],
                limit: limite,
                offset,
                where: whereRemessa,
            });
        })
        .then(remessas => {
            retorno = {
                ...retorno,
                remessas,
            };

            const idsHerbarios = [];

            remessas.rows.forEach(item => {
                idsHerbarios.push(item.herbario_id);
                idsHerbarios.push(item.entidade_destino_id);
            });

            return Herbario.findAll({
                attributes: ['id', 'nome', 'sigla'],
                where: {
                    id: {
                        [Op.in]: idsHerbarios,
                    },
                },
            });
        })
        .then(herbarios => {
            if (!herbarios) {
                throw new BadRequestExeption(701);
            }

            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: retorno.count,
                    pagina,
                    limite,
                },
                resultado: {
                    remessas: retorno.remessas.rows,
                    herbarios,
                },
            });
        })
        .catch(next);
};

export const alteracao = (request, response, next) => {

    const callback = transaction => Promise.resolve()
        .then(() => Remessa.findOne({
            where: {
                id: request.params.remessa_id,
            },
        }))
        .then(remessa => {
            if (!remessa) {
                throw new BadRequestExeption(704);
            }
        })
        .then(() => {
            const { tombos } = request.body;
            console.log("TOMBOOOOS")
            console.log(tombos)
            tombos.forEach(item => {
                if ((tombos.filter(tombo => tombo.hcf === item.hcf).length > 1)) {
                    throw new BadRequestExeption(703);
                }
            });
        })
        .then(() => {
            const { herbario_id: herbarioId } = request.body.remessa;
            const where = {
                ativo: true,
                id: herbarioId,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new BadRequestExeption(200);
            }
        })
        .then(() => {
            const { entidade_destino_id: entidadeDestino } = request.body.remessa;
            const where = {
                ativo: true,
                id: entidadeDestino,
            };

            return Herbario.findOne({ where, transaction });
        })
        .then(herbario => {
            if (!herbario) {
                throw new BadRequestExeption(200);
            }
        })
        .then(() => RetiradaExsiccata.findAll({
            where: {
                retirada_exsiccata_id: request.params.remessa_id,
            },
        }))
        .then(retiradas => {
            const hcf = retiradas.map(item => ({
                hcf: item.tombo_hcf,
            }));

            return Tombo.update({
                situacao: 'REGULAR',
            }, {
                where: {
                    [Op.or]: hcf,
                },
                transaction,
            });
        })
        .then(() => {
            const hcf = request.body.tombos.map(item => ({
                hcf: item.hcf,
            }));

            return Tombo.findAndCountAll({
                where: {
                    [Op.or]: hcf,
                    ativo: 1,
                    rascunho: 0,
                    situacao: 'REGULAR',
                },
                transaction,
            });
        })
        .then(tombos => {
            if (tombos.count !== request.body.tombos.length) {
                throw new BadRequestExeption(702);
            }
        })
        .then(() => {
            const body = {
                observacao: request.body.remessa.observacao,
                data_envio: request.body.remessa.data_envio,
                entidade_destino_id: request.body.remessa.entidade_destino_id,
                herbario_id: request.body.remessa.herbario_id,
            };

            return Remessa.update(body, {
                where: {
                    id: request.params.remessa_id,
                },
                transaction,
            });
        })
        .then(() => {
            const id = request.params.remessa_id;

            return RetiradaExsiccata.destroy({
                where: {
                    retirada_exsiccata_id: id,
                },
                transaction,
            });
        })
        .then(() => Remessa.findOne({
            where: {
                id: request.params.remessa_id,
            },
        }))
        .then(remessa => {
            if (!remessa) {
                throw new BadRequestExeption(704);
            }
            const tombos = request.body.tombos.map(item => ({
                retirada_exsiccata_id: remessa.id,
                tombo_hcf: item.hcf,
                tipo: item.tipo,
                data_vencimento: item.data_vencimento || null,
            }));


            return RetiradaExsiccata.bulkCreate(tombos, { transaction });
        })
        .then(() => {
            const reduce = (prev, item) => {
                const conteudo = prev[item.tipo] || [];

                return {
                    ...prev,
                    [item.tipo]: [
                        ...conteudo,
                        item.hcf,
                    ],
                };
            };

            const grupos = request.body.tombos.reduce(reduce, {});

            const updates = Object.keys(grupos)
                .map(key => Tombo.update({ situacao: key }, { transaction, where: { hcf: grupos[key] } }));

            return Promise.all(updates);
        });

    sequelize.transaction(callback)
        .then(herbario => {
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarRemessa = (request, response, next) => {
    const id = request.params.remessa_id;

    Promise.resolve()
        .then(() => Remessa.findOne({
            include: {
                model: Tombo,
                attributes: ['hcf'],
            },
            where: {
                id,
            },
        }))
        .then(remessa => {
            if (!remessa) {
                throw new BadRequestExeption(704);
            }
            response.status(codigos.LISTAGEM).json({
                remessa,
            });
        })
        .catch(next);
};

export const exclusao = (request, response, next) => {

    const callback = transaction => Promise.resolve()
        .then(() => {
            const id = request.params.remessa_id;
            return Remessa.findOne({
                where: {
                    id,
                },
                transaction,
            });
        })
        .then(remessa => {
            if (!remessa) {
                throw new BadRequestExeption(704);
            }
        })
        .then(() => {
            const id = request.params.remessa_id;

            return RetiradaExsiccata.findAll({
                attributes: ['tombo_hcf'],
                where: {
                    retirada_exsiccata_id: id,
                },
                transaction,
            });
        })
        .then(hcfs => {
            const tombos = hcfs.map(item => (item.tombo_hcf));
            return Tombo.update(
                { situacao: 'regular' },
                {
                    transaction,
                    where: {
                        hcf: {
                            [Op.in]: tombos,
                        },
                    },
                },
            );
        })
        .then(() => {
            const id = request.params.remessa_id;

            return RetiradaExsiccata.destroy({
                where: {
                    retirada_exsiccata_id: id,
                },
                transaction,
            });
        })
        .then(() => {
            const id = request.params.remessa_id;

            return Remessa.destroy({
                where: {
                    id,
                },
                transaction,
            });
        });

    sequelize.transaction(callback)
        .then(herbario => {
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const devolverTombo = (request, response, next) => {
    const hcf = request.query.tombo_id;
    const remessaId = request.query.remessa_id;

    const callback = transaction => Promise.resolve()
        .then(() => RetiradaExsiccata.findOne({
            where: {
                retirada_exsiccata_id: remessaId,
                tombo_hcf: hcf,
            },
            transaction,
        }))
        .then(tombo => {
            if (!tombo) {
                throw new BadRequestExeption(416);
            }
        })
        .then(() => Tombo.findOne({
            where: {
                hcf,
                ativo: 1,
                rascunho: 0,
                situacao: 'EMPRESTIMO',
            },
            transaction,
        }))
        .then(tombo => {
            if (!tombo) {
                throw new BadRequestExeption(416);
            }
        })
        .then(() => Tombo.update({
            situacao: 'REGULAR',
        }, {
            where: {
                hcf,
            },
            transaction,
        }))
        .then(() => RetiradaExsiccata.update({
            devolvido: 1,
        }, {
            where: {
                retirada_exsiccata_id: remessaId,
                tombo_hcf: hcf,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(tombo => {
            response.status(codigos.EDITAR_SEM_RETORNO).send();
        })
        .catch(next);
};
