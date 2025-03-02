export const obtemDadosDoRelatorioDeInventarioDeEspecies = async (req, res, next) => {
    try {
        // Deve ser ordenado por ordem alfabetica
        res.json({
            dados: [
                {
                    id: '0',
                    especie: 'a',
                    tombos: ['1', '2', '3'],
                },
                {
                    id: '1',
                    especie: 'b',
                    tombos: ['4', '5', '6'],
                },
                {
                    id: '2',
                    especie: 'c',
                    tombos: ['7', '8', '9'],
                },
                {
                    id: '3',
                    especie: 'd',
                    tombos: ['10', '11', '12'],
                },
            ],
        });
    } catch (error) {
        next(error);
    }

    return null;
};

export const outraFn = async () => {};
