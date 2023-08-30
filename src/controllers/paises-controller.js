import models from '../models';

const {
    Pais,
    Estado,
} = models;

export const listaTodosPaises = () => Pais.findAndCountAll({
    attributes: {
        exclude: ['updated_at', 'created_at'],
    },
});

export const listagem = (request, response, next) => {
    Promise.resolve()
        .then(() => listaTodosPaises())
        .then(paises => {
            response.status(200).json(paises.rows);
        })
        .catch(next);
};

export const listaEstadoPais = (request, response, next) => {
    const { pais_sigla: paisSigla } = request.params;

    const attributes = {
        exclude: [
            'paises_nome',
            'created_at',
            'updated_at',
        ],
    };
    const where = {
        paises_sigla: paisSigla,
    };

    Estado.findAll({ attributes, where })
        .then(estados => {
            response.status(200)
                .json(estados);
        })
        .catch(next);
};
