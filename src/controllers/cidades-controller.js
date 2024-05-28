import models from '../models';

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

export const listaTodosOsTombosComLocalizacao = async (req, res, next) => {
    try {
        const tombos = await Tombo.findAll({
            attributes: ['hcf', 'latitude', 'longitude'],
            include: {
                model: LocalColeta,
                include: {
                    model: Cidade,
                    attributes: ['nome'],
                },
            },
        });

        const result = tombos.map(tombo => ({
            hcf: tombo.hcf,
            latitude: tombo.latitude,
            longitude: tombo.longitude,
            cidade: tombo.locais_coletum && tombo.locais_coletum.cidade ? tombo.locais_coletum.cidade.nome : null,
        }));

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
