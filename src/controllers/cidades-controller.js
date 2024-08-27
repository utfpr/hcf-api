import models from '../models';

const { Op } = require('sequelize');

const { Cidade, LocalColeta, Tombo } = models;

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
