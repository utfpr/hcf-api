import models from '../models';

const { Op } = require('sequelize');

const { Cidade, LocalColeta, Tombo, Familia, Subfamilia, Genero, Especie, Subespecie, Variedade } = models;

export const listaTodosCidades = where =>
    Cidade.findAndCountAll({
        attributes: {
            exclude: ['updated_at', 'created_at'],
        },
        where,
    });

export const listagem = (request, response, next) => {
    let where = {};

    if (request.query.id !== undefined) {
        where = {
            estado_id: request.query.id,
        };
    }
    Promise.resolve()
        .then(() => listaTodosCidades(where))
        .then(cidades => {
            response.status(200).json(cidades.rows);
        })
        .catch(next);
};

export const ListaTodosOsTombosComLocalizacao = async (req, res, next) => {
    try {
        const { cidade, search } = req.query;
        const { limite: limit, pagina: pageInt, offset } = req.paginacao;

        if (!cidade && !search) {
            const tombos = await Tombo.findAll({
                attributes: ['hcf', 'latitude', 'longitude'],
                include: {
                    model: LocalColeta,
                    include: {
                        model: Cidade,
                        attributes: ['nome', 'latitude', 'longitude'],
                    },
                },
                order: [['hcf', 'ASC']],
            });

            const result = tombos.map(tombo => {
                const localColeta = tombo.locais_coletum;
                const cidadeObj = localColeta ? localColeta.cidade : null;

                return {
                    hcf: tombo.hcf,
                    latitude: tombo.latitude,
                    longitude: tombo.longitude,
                    cidade: {
                        nome: cidadeObj ? cidadeObj.nome : null,
                        latitude: cidadeObj ? cidadeObj.latitude : null,
                        longitude: cidadeObj ? cidadeObj.longitude : null,
                    },
                };
            });

            return res.status(200).json(result);
        }

        const queryOptions = {
            attributes: ['hcf', 'latitude', 'longitude'],
            where: {
                latitude: null,
                longitude: null,
            },
            include: {
                model: LocalColeta,
                required: true,
                include: {
                    model: Cidade,
                    required: true,
                    attributes: ['nome', 'latitude', 'longitude'],
                    where: {},
                },
            },
            order: [['hcf', 'ASC']],
        };

        if (req.query.pagina && req.query.limite) {
            queryOptions.limit = limit;
            queryOptions.offset = offset;
        }

        if (cidade) {
            queryOptions.include.include.where.nome = cidade;
        }

        if (search) {
            queryOptions.where.hcf = {
                [Op.like]: `%${search}%`,
            };
        }

        const tombos = await Tombo.findAndCountAll(queryOptions);

        const result = tombos.rows.map(tombo => {
            const localColeta = tombo.locais_coletum;
            const cidadeObj = localColeta ? localColeta.cidade : null;

            return {
                hcf: tombo.hcf,
                latitude: tombo.latitude,
                longitude: tombo.longitude,
                cidade: {
                    nome: cidadeObj ? cidadeObj.nome : null,
                    latitude: cidadeObj ? cidadeObj.latitude : null,
                    longitude: cidadeObj ? cidadeObj.longitude : null,
                },
            };
        });

        const response = {
            points: result,
            totalPoints: tombos.count,
        };

        if (req.query.pagina && req.query.limite) {
            response.totalPages = Math.ceil(tombos.count / limit);
            response.currentPage = pageInt;
        }

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }

    return res.status(500).json({ message: 'Internal server error' });
};

export const buscarHcfEspecifico = async (req, res, next) => {
    try {
        const { hcf } = req.params;

        const tombo = await Tombo.findOne({
            where: { hcf },
            attributes: ['hcf', 'latitude', 'longitude'],
            include: {
                model: LocalColeta,
                include: {
                    model: Cidade,
                    attributes: ['nome'],
                },
            },
        });

        if (!tombo) {
            return res.status(404).json({ message: 'Registro não encontrado' });
        }

        const localColeta = tombo.locais_coletum;
        const cidadeObj = localColeta ? localColeta.cidade : null;

        const result = {
            hcf: tombo.hcf,
            latitude: tombo.latitude || null,
            longitude: tombo.longitude || null,
            cidade: {
                nome: cidadeObj ? cidadeObj.nome : null,
            },
        };

        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};

export const buscarHcfsPorFaixaDeAltitude = async (req, res, next) => {
    try {
        const { minAltitude, maxAltitude } = req.params;

        const min = parseFloat(minAltitude);
        const max = parseFloat(maxAltitude);

        if (Number.isNaN(min) || Number.isNaN(max)) {
            return res.status(400).json({ message: 'Parâmetros de altitude inválidos' });
        }

        const tombos = await Tombo.findAll({
            where: {
                altitude: {
                    [Op.between]: [min, max],
                },
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
            },
            attributes: ['hcf', 'altitude', 'latitude', 'longitude'],
            include: {
                model: LocalColeta,
                include: {
                    model: Cidade,
                    attributes: ['nome'],
                },
            },
        });

        if (tombos.length === 0) {
            return res.status(404).json({ message: 'Nenhum registro encontrado na faixa de altitude especificada' });
        }

        const resultados = tombos.map(tombo => {
            const localColeta = tombo.locais_coletum;
            const cidadeObj = localColeta ? localColeta.cidade : null;

            return {
                hcf: tombo.hcf,
                altitude: tombo.altitude,
                latitude: tombo.latitude,
                longitude: tombo.longitude,
                cidade: {
                    nome: cidadeObj ? cidadeObj.nome : null,
                },
            };
        });

        return res.status(200).json({
            total: resultados.length,
            resultados,
        });
    } catch (error) {
        return next(error);
    }
};

export const buscarPontosTaxonomiaComFiltros = async (req, res, next) => {
    try {
        const {
            nomeFamilia,
            nomeSubFamilia,
            nomeGenero,
            nomeEspecie,
            nomeSubEspecie,
            nomeVariedade,
        } = req.query;

        if (
            !nomeFamilia &&
            !nomeSubFamilia &&
            !nomeGenero &&
            !nomeEspecie &&
            !nomeSubEspecie &&
            !nomeVariedade
        ) {
            return res
                .status(400)
                .json({ message: 'Pelo menos um filtro deve ser informado.' });
        }

        const pontos = await Tombo.findAll({
            attributes: ['hcf', 'latitude', 'longitude'],
            include: [
                {
                    model: Familia,
                    where: {
                        ...(nomeFamilia ? { nome: { [Op.eq]: nomeFamilia } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeFamilia,
                },
                {
                    model: Subfamilia,
                    where: {
                        ...(nomeSubFamilia ? { nome: { [Op.eq]: nomeSubFamilia } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeSubFamilia,
                },
                {
                    model: Genero,
                    where: {
                        ...(nomeGenero ? { nome: { [Op.eq]: nomeGenero } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeGenero,
                },
                {
                    model: Especie,
                    where: {
                        ...(nomeEspecie ? { nome: { [Op.eq]: nomeEspecie } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeEspecie,
                },
                {
                    model: Subespecie,
                    where: {
                        ...(nomeSubEspecie ? { nome: { [Op.eq]: nomeSubEspecie } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeSubEspecie,
                },
                {
                    model: Variedade,
                    where: {
                        ...(nomeVariedade ? { nome: { [Op.eq]: nomeVariedade } } : {}),
                        ativo: 1,
                    },
                    attributes: ['id', 'nome'],
                    required: !!nomeVariedade,
                },
            ],
        });

        if (!pontos || pontos.length === 0) {
            return res
                .status(404)
                .json({ message: 'Nenhum ponto encontrado com os filtros informados.' });
        }

        const result = pontos.map(ponto => ({
            hcf: ponto.hcf,
            latitude: ponto.latitude || null,
            longitude: ponto.longitude || null,
            familia: ponto.familia ? ponto.familia.nome : null,
            subFamilia: ponto.sub_familia ? ponto.sub_familia.nome : null,
            genero: ponto.genero ? ponto.genero.nome : null,
            especie: ponto.especy ? ponto.especy.nome : null,
            subEspecie: ponto.sub_especy ? ponto.sub_especy.nome : null,
            variedade: ponto.variedade ? ponto.variedade.nome : null,
        }));

        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};
