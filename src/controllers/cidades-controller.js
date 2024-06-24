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
                    attributes: ['nome', 'latitude', 'longitude'],
                },
            },
        });

        const result = tombos.map(tombo => {
            const localColeta = tombo.locais_coletum;
            const cidade = localColeta ? localColeta.cidade : null;

            return {
                hcf: tombo.hcf,
                latitude: tombo.latitude,
                longitude: tombo.longitude,
                cidade: cidade ? cidade.nome : null,
                latitudeCidade: cidade ? cidade.latitude : null,
                longitudeCidade: cidade ? cidade.longitude : null,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
