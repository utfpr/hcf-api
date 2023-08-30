import listaTaxonomiasSQL from '../resources/sqls/lista-taxonomias';
import models from '../models';
import BadRequestExeption from '../errors/bad-request-exception';
import codigos from '../resources/codigos-http';

const {
    sequelize, Sequelize: { Op }, Sequelize, Familia, Genero, Subfamilia, Especie, Variedade, Subespecie, Autor,
} = models;
// ////////////////////FAMILIA///////////////////////////
export const cadastrarFamilia = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                nome,
                ativo: 1,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (familiaEncontrada) {
                throw new BadRequestExeption(501);
            }
        })
        .then(() => Familia.create({ nome }, transaction));
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

export const buscarFamilias = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { familia } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (familia) {
        where = {
            ativo: 1,
            nome: { [Op.like]: `%${familia}%` },
        };
    }
    Promise.resolve()
        .then(() => Familia.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(familias => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: familias.count,
                    pagina,
                    limite,
                },
                resultado: familias.rows,
            });
        })
        .catch(next);
};

export const editarFamilia = (request, response, next) => {
    const id = request.params.familia_id;
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                id,
                ativo: 1,
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

    const callback = transaction => Promise.resolve()
        .then(() => Familia.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(familiaEncontrada => {
            if (!familiaEncontrada) {
                throw new BadRequestExeption(516);
            }
        })
        .then(() => Familia.update({ ativo: 0 }, {
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
        })
        .then(() => Subfamilia.create({ nome, familia_id: familiaId }, transaction));
    sequelize.transaction(callback)
        .then(subfamiliaCriado => {
            if (!subfamiliaCriado) {
                throw new BadRequestExeption(504);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarSubfamilia = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { subfamilia, familia_id: familiaId } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (subfamilia) {
        where = {
            ...where,
            nome: { [Op.like]: `%${subfamilia}%` },
        };
    }
    if (familiaId) {
        where = {
            ...where,
            familia_id: familiaId,
        };
    }
    Promise.resolve()
        .then(() => Subfamilia.findAndCountAll({
            attributes: ['id', 'nome', 'familia_id'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(subfamilias => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: subfamilias.count,
                    pagina,
                    limite,
                },
                resultado: subfamilias.rows,
            });
        })
        .catch(next);
};

export const excluirSubfamilia = (request, response, next) => {
    const id = request.params.subfamilia_id;

    const callback = transaction => Promise.resolve()
        .then(() => Subfamilia.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(520);
            }
        })
        .then(() => Subfamilia.update({ ativo: 0 }, {
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
        })
        .then(() => Genero.create({ nome, familia_id: familiaId }, transaction));
    sequelize.transaction(callback)
        .then(generoCriado => {
            if (!generoCriado) {
                throw new BadRequestExeption(506);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarGeneros = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { genero, familia_id: familiaId } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (genero) {
        where = {
            ...where,
            nome: { [Op.like]: `%${genero}%` },
        };
    }
    if (familiaId) {
        where = {
            ...where,
            familia_id: familiaId,
        };
    }
    Promise.resolve()
        .then(() => Genero.findAndCountAll({
            attributes: ['id', 'nome', 'familia_id'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(generos => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: generos.count,
                    pagina,
                    limite,
                },
                resultado: generos.rows,
            });
        })
        .catch(next);
};

export const excluirGeneros = (request, response, next) => {
    const id = request.params.genero_id;

    const callback = transaction => Promise.resolve()
        .then(() => Genero.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(519);
            }
        })
        .then(() => Genero.update({ ativo: 0 }, {
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
                ativo: true,
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
        .then(genero => Especie.create({
            nome, genero_id: generoId, familia_id: genero.familia_id, autor_id: autorId,
        },
        transaction));
    sequelize.transaction(callback)
        .then(especieCriada => {
            if (!especieCriada) {
                throw new BadRequestExeption(508);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarEspecies = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { especie, genero_id: generoId } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (especie) {
        where = {
            ...where,
            nome: { [Op.like]: `%${especie}%` },
        };
    }
    if (generoId) {
        where = {
            ...where,
            genero_id: generoId,
        };
    }
    Promise.resolve()
        .then(() => Especie.findAndCountAll({
            attributes: ['id', 'nome', 'genero_id', 'autor_id'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(especies => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: especies.count,
                    pagina,
                    limite,
                },
                resultado: especies.rows,
            });
        })
        .catch(next);
};

export const excluirEspecies = (request, response, next) => {
    const id = request.params.especie_id;

    const callback = transaction => Promise.resolve()
        .then(() => Especie.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(521);
            }
        })
        .then(() => Especie.update({ ativo: 0 }, {
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
            if (!autorId) {
                return undefined;
            }
            const where = {
                ativo: true,
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
                ativo: true,
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

export const buscarSubespecies = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { subespecie, especie_id: especieId } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (subespecie) {
        where = {
            ...where,
            nome: { [Op.like]: `%${subespecie}%` },
        };
    }
    if (especieId) {
        where = {
            ...where,
            especie_id: especieId,
        };
    }
    Promise.resolve()
        .then(() => Subespecie.findAndCountAll({
            attributes: ['id', 'nome', 'especie_id', 'autor_id'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(subespecies => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: subespecies.count,
                    pagina,
                    limite,
                },
                resultado: subespecies.rows,
            });
        })
        .catch(next);
};

export const excluirSubespecies = (request, response, next) => {
    const id = request.params.subespecie_id;

    const callback = transaction => Promise.resolve()
        .then(() => Subespecie.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(525);
            }
        })
        .then(() => Subespecie.update({ ativo: 0 }, {
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
            if (!autorId) {
                return undefined;
            }
            const where = {
                ativo: true,
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
                ativo: true,
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
        .then(especie => Variedade.create({
            nome,
            genero_id: especie.genero_id,
            especie_id: especieId,
            familia_id: especie.familia_id,
            autor_id: autorId,
        },
        transaction));
    sequelize.transaction(callback)
        .then(variedadeCriada => {
            if (!variedadeCriada) {
                throw new BadRequestExeption(512);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarVariedades = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { variedade, especie_id: especieId } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (variedade) {
        where = {
            ...where,
            nome: { [Op.like]: `%${variedade}%` },
        };
    }
    if (especieId) {
        where = {
            ...where,
            especie_id: especieId,
        };
    }
    Promise.resolve()
        .then(() => Variedade.findAndCountAll({
            attributes: ['id', 'nome', 'especie_id', 'autor_id'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(variedades => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: variedades.count,
                    pagina,
                    limite,
                },
                resultado: variedades.rows,
            });
        })
        .catch(next);
};

export const excluirVariedades = (request, response, next) => {
    const id = request.params.variedade_id;

    const callback = transaction => Promise.resolve()
        .then(() => Variedade.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(526);
            }
        })
        .then(() => Variedade.update({ ativo: 0 }, {
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
            if (!autorId) {
                return undefined;
            }
            const where = {
                ativo: true,
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

export const buscarAutores = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { autor } = request.query;
    let where;
    where = {
        ativo: 1,
    };
    if (autor) {
        where = {
            ativo: 1,
            nome: { [Op.like]: `%${autor}%` },
        };
    }

    Promise.resolve()
        .then(() => Autor.findAndCountAll({
            attributes: ['id', 'nome', 'iniciais'],
            order: [['created_at', 'DESC']],
            limit: limite,
            offset,
            where,
        }))
        .then(autores => {
            response.status(codigos.LISTAGEM).json({
                metadados: {
                    total: autores.count,
                    pagina,
                    limite,
                },
                resultado: autores.rows,
            });
        })
        .catch(next);
};

export const excluirAutores = (request, response, next) => {
    const id = request.params.autor_id;

    const callback = transaction => Promise.resolve()
        .then(() => Autor.findOne({
            where: {
                id,
                ativo: 1,
            },
            transaction,
        }))
        .then(encontrado => {
            if (!encontrado) {
                throw new BadRequestExeption(517);
            }
        })
        .then(() => Autor.update({ ativo: 0 }, {
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
