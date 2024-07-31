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
        const { cidade, page, search, limit } = req.query;

        if (!cidade && !search && !page && !limit) {
            const tombos = await Tombo.findAll({
                attributes: ['hcf', 'latitude', 'longitude'],
                include: {
                    model: LocalColeta,
                    include: {
                        model: Cidade,
                        attributes: ['nome', 'latitude', 'longitude'],
                    },
                },
            });

            const result = tombos.map(tombo => {
                const localColeta = tombo.locais_coletum;
                const cidadeObj = localColeta ? localColeta.cidade : null;

                return {
                    hcf: tombo.hcf,
                    latitude: tombo.latitude,
                    longitude: tombo.longitude,
                    cidade: cidadeObj ? cidadeObj.nome : null,
                    latitudeCidade: cidadeObj ? cidadeObj.latitude : null,
                    longitudeCidade: cidadeObj ? cidadeObj.longitude : null,
                };
            });

            return res.status(200).json(result);
        }

        const pageInt = parseInt(page, 10) || 1;
        const limitInt = parseInt(limit, 10) || 5;
        const offset = (pageInt - 1) * limitInt;

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
            limit: limitInt,
            offset,
        };

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
                cidade: cidadeObj ? cidadeObj.nome : null,
                latitudeCidade: cidadeObj ? cidadeObj.latitude : null,
                longitudeCidade: cidadeObj ? cidadeObj.longitude : null,
            };
        });

        return res.status(200).json({
            points: result,
            totalPoints: tombos.count,
            totalPages: Math.ceil(tombos.count / limitInt),
            currentPage: pageInt,
        });
    } catch (error) {
        next(error);
    }

    return res.status(400).json({ message: 'Invalid query parameters' });
};
