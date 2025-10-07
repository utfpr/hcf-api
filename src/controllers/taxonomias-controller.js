import BadRequestExeption from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';
import listaTaxonomiasSQL from '../resources/sqls/lista-taxonomias';
import verifyRecaptcha from '../utils/verify-recaptcha';

const {
    sequelize, Sequelize: { Op }, Sequelize, Reino, Familia, Genero, Subfamilia, Especie, Variedade, Subespecie, Autor, Tombo,
} = models;
// ////////////////////FAMILIA///////////////////////////
export const cadastrarFamilia = (request, response, next) => {
    const { nome, reinoId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (familiaEncontrada) {
                throw new BadRequestExeption(501);
            }
        })
        .then(() => Familia.create({ nome, reino_id: reinoId }, transaction));
    sequelize.transaction(callback)
        .then(familiaCriada => {
            console.log(familiaCriada); // eslint-disable-line
            if (!familiaCriada) {
                throw new BadRequestExeption(502);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const cadastrarReino = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Reino.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(reinoEncontrado => {
            if (reinoEncontrado) {
                throw new BadRequestExeption(501);
            }
        })
        .then(() => Reino.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(reinoCriado => {
            console.log(reinoCriado); // eslint-disable-line
            if (!reinoCriado) {
                throw new BadRequestExeption(502);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const editarReino = (request, response, next) => {
    const id = request.params.reino_id;
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Reino.findOne({
            where: {
                id,
            },
            transaction,
        }))
        .then(reinoEncontrado => {
            if (!reinoEncontrado) {
                throw new BadRequestExeption(516);
            }
        })
        .then(() => Reino.update({ nome }, {
            where: {
                id,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(reinoEditado => {
            console.log(reinoEditado); // eslint-disable-line
            if (!reinoEditado) {
                throw new BadRequestExeption(502);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarReinos = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const { reino, reinoId } = request.query;

        let where;
        if (reino) {
            where = { nome: { [Op.like]: `%${reino}%` } };
        }
        if (reinoId) {
            where = { ...where, reino_id: reinoId };
        }

        const resultado = await Reino.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
        });

        response.status(codigos.LISTAGEM).json({
            metadados: {
                total: resultado.count,
                pagina,
                limite,
            },
            resultado: resultado.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const buscarFamilias = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const { familia, reino_id: reinoId } = request.query;

        const where = {};
        if (familia) where.nome = { [Op.like]: `%${familia}%` };
        if (reinoId) where.reino_id = reinoId;

        const result = await Familia.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
            include: [{ model: Reino, attributes: ['id', 'nome'] }],
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const editarFamilia = (request, response, next) => {
    const id = request.params.familia_id;
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                id,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }
        })
        .then(() => Familia.update({ nome }, {
            where: {
                id,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(familiaCriada => {
            console.log(familiaCriada); // eslint-disable-line
            if (!familiaCriada) {
                throw new BadRequestExeption(502);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const excluirFamilia = (request, response, next) => {
    const id = request.params.familia_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Familia.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(familiaEncontrada => {
                if (!familiaEncontrada) {
                    throw new BadRequestExeption(516);
                }
            })
            .then(() =>
                Promise.all([
                    Genero.count({ where: { familia_id: id }, transaction }),
                    Tombo.count({ where: { familia_id: id }, transaction }),
                ])
            )
            .then(([generosCount, tombosCount]) => {
                if (generosCount > 0 || tombosCount > 0) {
                    throw new BadRequestExeption('A família não pode ser excluída porque possui dependentes.');
                }
            })
            .then(() =>
                Familia.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};
// /////////////////////SUBFAMILIA/////////////////////////
export const cadastrarSubfamilia = (request, response, next) => {
    const { nome, familia_id: familiaId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Subfamilia.findOne({
            where: {
                nome,
                familia_id: familiaId,
            },
            transaction,
        }))
        .then(subfamiliaEncontrada => {
            if (subfamiliaEncontrada) {
                throw new BadRequestExeption(503);
            }
        })
        .then(() => Familia.findOne({
            where: {
                id: familiaId,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }

            return familiaEncontrada;
        })
        .then(() => Subfamilia.create({ nome,
            familia_id: familiaId,
        }, transaction));
    sequelize.transaction(callback)
        .then(subfamiliaCriado => {
            if (!subfamiliaCriado) {
                throw new BadRequestExeption(504);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarSubfamilia = async (req, res, next) => {
    try {
        if (req.query.recaptchaToken) {
            await verifyRecaptcha(req);
        }

        const { limite, pagina, offset } = req.paginacao;
        const { orderClause } = req.ordenacao;

        const {
            subfamilia: nomeFiltro,
            familia_id: familiaIdRaw,
            familia_nome: familiaNomeFiltro,
        } = req.query;

        const where = {};
        if (nomeFiltro) {
            where.nome = { [Op.like]: `%${nomeFiltro}%` };
        }
        if (familiaIdRaw) {
            const familiaId = parseInt(familiaIdRaw, 10);
            if (!Number.isNaN(familiaId)) {
                where.familia_id = familiaId;
            }
        }

        const familiaWhere = {};
        if (familiaNomeFiltro) {
            familiaWhere.nome = { [Op.like]: `%${familiaNomeFiltro}%` };
        }

        const { count, rows } = await Subfamilia.findAndCountAll({
            attributes: ['id', 'nome'],
            where,
            order: orderClause,
            limit: parseInt(limite, 10),
            offset: parseInt(offset, 10),
            include: [
                { model: Familia, attributes: ['id', 'nome'], where: familiaWhere },
                { model: Autor, attributes: ['id', 'nome'], as: 'autor' },
            ],
        });

        return res.status(codigos.LISTAGEM).json({
            metadados: {
                total: count,
                pagina: parseInt(pagina, 10),
                limite: parseInt(limite, 10),
            },
            resultado: rows,
        });
    } catch (err) {
        return next(err);
    }
};

export const excluirSubfamilia = (request, response, next) => {
    const id = request.params.subfamilia_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Subfamilia.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(encontrado => {
                if (!encontrado) {
                    throw new BadRequestExeption(520);
                }
            })
            .then(() =>
                Promise.all([Tombo.count({ where: { sub_familia_id: id }, transaction })])
            )
            .then(([tombosCount]) => {
                if (tombosCount > 0) {
                    throw new BadRequestExeption('A subfamília não pode ser excluída porque possui dependentes.');
                }
            })
            .then(() =>
                Subfamilia.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarSubfamilia = (request, response, next) => {
    const { nome, familia_id: familiaId } = request.body;
    const subfamiliaId = parseInt(request.params.subfamilia_id);

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                id: familiaId,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }
        })
        .then(() => Subfamilia.findOne({
            where: {
                id: subfamiliaId,
            },
            transaction,
        }))
        .then(subfEncontrado => {
            if (!subfEncontrado) {
                throw new BadRequestExeption(520);
            }
        })
        .then(() => Subfamilia.update({ nome, familia_id: familiaId }, {
            where: {
                id: subfamiliaId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(subfCriado => {
            if (!subfCriado) {
                throw new BadRequestExeption(504);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

// //////////////////////GENERO/////////////////////
export const cadastrarGenero = (request, response, next) => {
    const { nome, familia_id: familiaId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Genero.findOne({
            where: {
                nome,
                familia_id: familiaId,
            },
            transaction,
        }))
        .then(generoEncontrado => {
            if (generoEncontrado) {
                throw new BadRequestExeption(505);
            }
        })
        .then(() => Familia.findOne({
            where: {
                id: familiaId,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }

            return familiaEncontrada;
        })
        .then(() => Genero.create({ nome,
            familia_id: familiaId,
        }, transaction));
    sequelize.transaction(callback)
        .then(generoCriado => {
            if (!generoCriado) {
                throw new BadRequestExeption(506);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarGeneros = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const { genero, familia_id: familiaId, familia_nome: familiaNome } = request.query;

        const where = {};
        if (genero) where.nome = { [Op.like]: `%${genero}%` };
        if (familiaId) where.familia_id = familiaId;

        const familiaWhere = {};
        if (familiaNome) familiaWhere.nome = { [Op.like]: `%${familiaNome}%` };

        const result = await Genero.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
            include: [
                { model: Familia, attributes: ['id', 'nome'], where: familiaWhere },
            ],
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const excluirGeneros = (request, response, next) => {
    const id = request.params.genero_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Genero.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(generoEncontrado => {
                if (!generoEncontrado) {
                    throw new BadRequestExeption(519);
                }
            })
            .then(() =>
                Promise.all([
                    Especie.count({ where: { genero_id: id }, transaction }),
                    Tombo.count({ where: { genero_id: id }, transaction }),
                ])
            )
            .then(([especiesCount, tombosCount]) => {
                if (especiesCount > 0 || tombosCount > 0) {
                    throw new BadRequestExeption('O gênero não pode ser excluído porque possui dependentes.');
                }
            })
            .then(() =>
                Genero.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarGenero = (request, response, next) => {
    const { nome, familia_id: familiaId } = request.body;
    const generoId = parseInt(request.params.genero_id);

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                id: familiaId,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }
        })
        .then(() => Genero.findOne({
            where: {
                id: generoId,
            },
            transaction,
        }))
        .then(generoEncontrado => {
            if (!generoEncontrado) {
                throw new BadRequestExeption(519);
            }
        })
        .then(() => Genero.update({ nome, familia_id: familiaId }, {
            where: {
                id: generoId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(generoCriado => {
            if (!generoCriado) {
                throw new BadRequestExeption(506);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};
// ///////////////////////ESPECIE////////////////////////////
export const cadastrarEspecie = (request, response, next) => {
    const { nome, genero_id: generoId, autor_id: autorId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => {
            if (!autorId) {
                return undefined;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Especie.findOne({
            where: {
                nome,
                genero_id: generoId,
            },
            transaction,
        }))
        .then(especieEncontrada => {
            if (especieEncontrada) {
                throw new BadRequestExeption(507);
            }
        })
        .then(() => Genero.findOne({
            where: {
                id: generoId,
            },
            transaction,
        }))
        .then(generoEncontrado => {
            if (!generoEncontrado) {
                throw new BadRequestExeption(519);
            }
            return generoEncontrado;
        })
        .then(genero => Especie.create(
            {
                nome,
                genero_id: generoId,
                familia_id: genero.familia_id,
                autor_id: autorId,
            },
            transaction
        ));
    sequelize.transaction(callback)
        .then(especieCriada => {
            if (!especieCriada) {
                throw new BadRequestExeption(508);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarEspecies = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const {
            especie, genero_id: generoId,
            familia_nome: familiaNome,
            genero_nome: generoNome,
        } = request.query;

        const where = {};
        if (especie) where.nome = { [Op.like]: `%${especie}%` };
        if (generoId) where.genero_id = generoId;

        const familiaWhere = {};
        if (familiaNome) familiaWhere.nome = { [Op.like]: `%${familiaNome}%` };

        const generoWhere = {};
        if (generoNome) generoWhere.nome = { [Op.like]: `%${generoNome}%` };

        const result = await Especie.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
            include: [
                { model: Familia, attributes: ['id', 'nome'], where: familiaWhere },
                { model: Genero, attributes: ['id', 'nome'], where: generoWhere },
                { model: Autor, attributes: ['id', 'nome'], as: 'autor' },
            ],
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const excluirEspecies = (request, response, next) => {
    const id = request.params.especie_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Especie.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(encontrado => {
                if (!encontrado) {
                    throw new BadRequestExeption(521);
                }
            })
            .then(() =>
                Promise.all([
                    Subespecie.count({ where: { especie_id: id }, transaction }),
                    Variedade.count({ where: { especie_id: id }, transaction }),
                    Tombo.count({ where: { especie_id: id }, transaction }),
                ])
            )
            .then(([subEspeciesCount, variedadesCount, tombosCount]) => {
                if (subEspeciesCount > 0 || variedadesCount > 0 || tombosCount > 0) {
                    throw new BadRequestExeption('A espécie não pode ser excluída porque possui dependentes.');
                }
            })
            .then(() =>
                Especie.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarEspecie = (request, response, next) => {
    const { nome, genero_id: generoId, autor_id: autorId } = request.body;
    const especieId = parseInt(request.params.especie_id);

    const callback = transaction => Promise.resolve()
        .then(() => Genero.findOne({
            where: {
                id: generoId,
            },
            transaction,
        }))
        .then(generoEncontrado => {
            if (!generoEncontrado) {
                throw new BadRequestExeption(519);
            }
        })
        .then(() => Especie.findOne({
            where: {
                id: especieId,
            },
            transaction,
        }))
        .then(especieEncontrado => {
            if (!especieEncontrado) {
                throw new BadRequestExeption(521);
            }
        })
        .then(() => {
            if (autorId === null) {
                return null;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId !== null) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Especie.update({ nome, genero_id: generoId, autor_id: autorId }, {
            where: {
                id: especieId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(especieCriado => {
            if (!especieCriado) {
                throw new BadRequestExeption(522);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};
// ////////////////////SUBESPECIE///////////////////////////
export const cadastrarSubespecie = (request, response, next) => {
    const { nome, especie_id: especieId, autor_id: autorId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => {
            if (!autorId) {
                return undefined;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Subespecie.findOne({
            where: {
                nome,
                especie_id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (encontrado) {
                throw new BadRequestExeption(509);
            }
        })
        .then(() => Especie.findOne({
            where: {
                id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(521);
            }
            return encontrado;
        })
        .then(especie => Subespecie.create({
            nome,
            genero_id: especie.genero_id,
            especie_id: especieId,
            familia_id: especie.familia_id,
            autor_id: autorId,
        }, transaction));
    sequelize.transaction(callback)
        .then(subespecieCriada => {
            if (!subespecieCriada) {
                throw new BadRequestExeption(524);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarSubespecies = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const {
            subespecie,
            especie_id: especieId,
            familia_nome: familiaNome,
            genero_nome: generoNome,
            especie_nome: especieNome,
        } = request.query;

        const where = {};
        if (subespecie) where.nome = { [Op.like]: `%${subespecie}%` };
        if (especieId) where.especie_id = especieId;

        const familiaWhere = {};
        if (familiaNome) familiaWhere.nome = { [Op.like]: `%${familiaNome}%` };

        const generoWhere = {};
        if (generoNome) generoWhere.nome = { [Op.like]: `%${generoNome}%` };

        const especieWhere = {};
        if (especieNome) especieWhere.nome = { [Op.like]: `%${especieNome}%` };

        const result = await Subespecie.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
            include: [
                { model: Familia, attributes: ['id', 'nome'], where: familiaWhere },
                { model: Genero, attributes: ['id', 'nome'], where: generoWhere },
                { model: Especie, attributes: ['id', 'nome'], where: especieWhere, as: 'especie' },
                { model: Autor, attributes: ['id', 'nome'], as: 'autor' },
            ],
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const excluirSubespecies = (request, response, next) => {
    const id = request.params.subespecie_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Subespecie.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(encontrado => {
                if (!encontrado) {
                    throw new BadRequestExeption(525);
                }
            })
            .then(() =>
                Promise.all([Tombo.count({ where: { sub_especie_id: id }, transaction })])
            )
            .then(([tombosCount]) => {
                if (tombosCount > 0) {
                    throw new BadRequestExeption('A subespécie não pode ser excluída porque possui dependentes.');
                }
            })
            .then(() =>
                Subespecie.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarSubespecie = (request, response, next) => {
    const { nome, especie_id: especieId, autor_id: autorId } = request.body;
    const subespecieId = parseInt(request.params.subespecie_id);

    const callback = transaction => Promise.resolve()
        .then(() => Subespecie.findOne({
            where: {
                id: subespecieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(525);
            }
        })
        .then(() => {
            if (autorId === null) {
                return null;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId !== null) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Especie.findOne({
            where: {
                id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(521);
            }
            return encontrado;
        })
        .then(especie => Subespecie.update({
            nome,
            especie_id: especieId,
            genero_id: especie.genero_id,
            familia_id: especie.familia_id,
            autor_id: autorId,
        }, {
            where: {
                id: subespecieId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(especieCriado => {
            if (!especieCriado) {
                throw new BadRequestExeption(522);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

// //////////////////////VARIEDADE/////////////////////////////
export const cadastrarVariedade = (request, response, next) => {
    const { nome, especie_id: especieId, autor_id: autorId } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => {
            if (!autorId) {
                return undefined;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Variedade.findOne({
            where: {
                nome,
                especie_id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (encontrado) {
                throw new BadRequestExeption(511);
            }
        })
        .then(() => Especie.findOne({
            where: {
                id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(521);
            }
            return encontrado;
        })
        .then(especie => Variedade.create(
            {
                nome,
                genero_id: especie.genero_id,
                especie_id: especieId,
                familia_id: especie.familia_id,
                autor_id: autorId,
            },
            transaction
        ));
    sequelize.transaction(callback)
        .then(variedadeCriada => {
            if (!variedadeCriada) {
                throw new BadRequestExeption(512);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarVariedades = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { orderClause } = request.ordenacao;
        const {
            variedade,
            especie_id: especieId,
            familia_nome: familiaNome,
            genero_nome: generoNome,
            especie_nome: especieNome,
        } = request.query;

        const where = {};
        if (variedade) where.nome = { [Op.like]: `%${variedade}%` };
        if (especieId) where.especie_id = especieId;

        const familiaWhere = {};
        if (familiaNome) familiaWhere.nome = { [Op.like]: `%${familiaNome}%` };

        const generoWhere = {};
        if (generoNome) generoWhere.nome = { [Op.like]: `%${generoNome}%` };

        const especieWhere = {};
        if (especieNome) especieWhere.nome = { [Op.like]: `%${especieNome}%` };

        const result = await Variedade.findAndCountAll({
            attributes: ['id', 'nome'],
            order: orderClause,
            limit: limite,
            offset,
            where,
            include: [
                { model: Familia, attributes: ['id', 'nome'], where: familiaWhere },
                { model: Genero, attributes: ['id', 'nome'], where: generoWhere },
                { model: Especie, attributes: ['id', 'nome'], where: especieWhere, as: 'especie' },
                { model: Autor, attributes: ['id', 'nome'], as: 'autor' },
            ],
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const excluirVariedades = (request, response, next) => {
    const id = request.params.variedade_id;

    const callback = transaction => Promise.resolve()
        .then(() => Variedade.findOne({
            where: {
                id,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(526);
            }
        })
        .then(() =>
            Promise.all([Tombo.count({ where: { variedade_id: id }, transaction })])
        )
        .then(([tombosCount]) => {
            if (tombosCount > 0) {
                throw new BadRequestExeption('A variedade não pode ser excluída porque possui dependentes.');
            }
        })
        .then(() => Variedade.destroy({
            where: {
                id,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarVariedade = (request, response, next) => {
    const { nome, especie_id: especieId, autor_id: autorId } = request.body;
    const variedadeId = parseInt(request.params.variedade_id);

    const callback = transaction => Promise.resolve()
        .then(() => {
            if (autorId === null) {
                return null;
            }
            const where = {
                id: autorId,
            };
            return Autor.findOne({
                where,
                transaction,
            });
        })
        .then(autor => {
            if (autorId !== null) {
                if (!autor) {
                    throw new BadRequestExeption(532);
                }
            }
        })
        .then(() => Variedade.findOne({
            where: {
                id: variedadeId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(526);
            }
        })
        .then(() => Especie.findOne({
            where: {
                id: especieId,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(521);
            }
            return encontrado;
        })
        .then(especie => Variedade.update({
            nome,
            especie_id: especieId,
            genero_id: especie.genero_id,
            familia_id: especie.familia_id,
            autor_id: autorId,
        }, {
            where: {
                id: variedadeId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(variedade => {
            if (!variedade) {
                throw new BadRequestExeption(527);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

// //////////////////AUTORES//////////////////
export const cadastrarAutores = (request, response, next) => {
    const { nome, iniciais } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Autor.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(autorEncontrado => {
            if (autorEncontrado) {
                throw new BadRequestExeption(513);
            }
        })
        .then(() => Autor.create({ nome, iniciais }, transaction));
    sequelize.transaction(callback)
        .then(autorCriado => {
            if (!autorCriado) {
                throw new BadRequestExeption(514);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarAutores = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }

        const { limite, pagina, offset } = request.paginacao;
        const { autor } = request.query;
        const { orderClause } = request.ordenacao;

        const where = {};
        if (autor) where.nome = { [Op.like]: `%${autor}%` };

        const result = await Autor.findAndCountAll({
            attributes: ['id', 'nome', 'iniciais'],
            order: orderClause,
            limit: limite,
            offset,
            where,
        });

        return response.status(codigos.LISTAGEM).json({
            metadados: { total: result.count, pagina, limite },
            resultado: result.rows,
        });
    } catch (err) {
        next(err);
    }
    return true;
};

export const excluirAutores = (request, response, next) => {
    const id = request.params.autor_id;

    const callback = transaction =>
        Promise.resolve()
            .then(() =>
                Autor.findOne({
                    where: {
                        id,
                    },
                    transaction,
                })
            )
            .then(encontrado => {
                if (!encontrado) {
                    throw new BadRequestExeption(517);
                }
            })
            .then(() =>
                Promise.all([
                    Subespecie.count({ where: { autor_id: id }, transaction }),
                    Especie.count({ where: { autor_id: id }, transaction }),
                    Variedade.count({ where: { autor_id: id }, transaction }),
                ])
            )
            .then(([subEspeciesCount, especiesCount, variedadesCount]) => {
                if (subEspeciesCount > 0 || especiesCount > 0 || variedadesCount > 0) {
                    throw new BadRequestExeption('O autor não pode ser excluído porque possui dependentes.');
                }
            })
            .then(() =>
                Autor.destroy({
                    where: {
                        id,
                    },
                    transaction,
                })
            );

    sequelize
        .transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

export const editarAutores = (request, response, next) => {
    const { nome, iniciais } = request.body;
    const autorId = parseInt(request.params.autor_id);

    const callback = transaction => Promise.resolve()
        .then(() => Autor.findOne({
            where: {
                id: autorId,
            },
            transaction,
        }))
        .then(autorEncontrado => {
            if (!autorEncontrado) {
                throw new BadRequestExeption(517);
            }
        })
        .then(() => Autor.update({ nome, iniciais }, {
            where: {
                id: autorId,
            },
            transaction,
        }));
    sequelize.transaction(callback)
        .then(autorAtualizado => {
            if (!autorAtualizado) {
                throw new BadRequestExeption(523);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};
// //////////////////////////////////////////////
export const listagem = (request, response, next) => {

    const sequelizeQueryTaxonomias = (limite, offset) => new Promise((resolve, reject) => {

        const type = Sequelize.QueryTypes.SELECT;
        sequelize.query(listaTaxonomiasSQL(true, limite, offset), { type })
            .then(resultadoCount => {
                let count = 0;
                if (Array.isArray(resultadoCount) && resultadoCount.length > 0) {
                    count = resultadoCount[0].count; // eslint-disable-line
                }

                const retorno = { count };

                return sequelize.query(listaTaxonomiasSQL(false, limite, offset), { type })
                    .then(resultado => ({
                        ...retorno,
                        rows: resultado,
                    }));
            })
            .then(resolve)
            .catch(reject);
    });

    const { limite, pagina, offset } = request.paginacao;

    Promise.resolve()
        .then(() => sequelizeQueryTaxonomias(limite, offset))
        .then(resultado => {
            response.status(200)
                .json({
                    metadados: {
                        total: resultado.count,
                        pagina,
                        limite,
                    },
                    resultado: resultado.rows,
                });
        })
        .catch(next);
};

export default {};
