import models from '../models';

const {
    Tombo,
    Tipo,
    Especie,
    Herbario,
    LocalColeta,
    Cidade,
    Coletor,
} = models;


export default {};

export function selecionaObjetoCompletoTomboPorId(condicoes, transacao) {
    const opcoes = {
        include: [
            {
                required: true,
                model: Tipo,
            },
            {
                required: true,
                model: Especie,
                as: 'especie',
            },
            {
                required: true,
                model: Herbario,
            },
            {
                required: true,
                model: LocalColeta,
                as: 'local_coleta',
                include: {
                    required: true,
                    model: Cidade,
                },
            },
            {
                required: true,
                model: Coletor,
                through: { attributes: [] },
            },
        ],

        where: condicoes,
        transaction: transacao,
    };

    return Tombo.findOne(opcoes);
}
