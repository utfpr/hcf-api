import models from '../models';

const {
    Cidade,
} = models;

export const listaTodosCidades = where => Cidade.findAndCountAll({
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
