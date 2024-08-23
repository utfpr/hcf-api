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
        const { limit, pagina: pageInt, offset } = req.paginacao;

        const queryOptions = {
            attributes: ['hcf', 'latitude', 'longitude'],
            where: {},
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
            limit,
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
                cidade: {
                    nome: cidadeObj ? cidadeObj.nome : null,
                    latitude: cidadeObj ? cidadeObj.latitude : null,
                    longitude: cidadeObj ? cidadeObj.longitude : null,
                },
            };
        });

        return res.status(200).json({
            points: result,
            totalPoints: tombos.count,
            totalPages: Math.ceil(tombos.count / limit),
            currentPage: pageInt,
        });
    } catch (error) {
        next(error);
    }

    return res.status(400).json({ message: 'Invalid query parameters' });
};
