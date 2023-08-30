import models from '../models';

const {
    Estado,
} = models;

export const listaTodosEstados = where => Estado.findAndCountAll({
    attributes: {
        exclude: ['updated_at', 'created_at'],
    },
    where,
});

export const listagem = (request, response, next) => {
    let where = {};

    if (request.query.id !== undefined) {
        where = {
            pais_id: request.query.id,
        };
    }
    Promise.resolve()
        .then(() => listaTodosEstados(where))
        .then(paises => {
            response.status(200).json(paises.rows);
        })
        .catch(next);
};
