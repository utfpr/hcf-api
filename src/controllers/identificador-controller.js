import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Identificador } = models;
const { TomboIdentificador } = models;

export const cadastraIdentificador = async (req, res, next) => {
    try {
        const identificador = await Identificador.create(req.body);
        res.status(codigos.CADASTRO_RETORNO).json(identificador);
    } catch (error) {
        next(error);
    }
};

export const listaIdentificadorPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const identificador = await Identificador.findByPk(id);

        if (!identificador) {
            return res.status(404).json({ mensagem: 'Identificador não encontrado.' });
        }

        res.status(200).json(identificador);
    } catch (error) {
        next(error);
    }

    return null;
};

export const listaIdentificadores = async (req, res, next) => {
    try {
        const identificadores = await Identificador.findAll({
            order: [['nome', 'ASC']],
        });
        res.status(200).json(identificadores);
    } catch (error) {
        next(error);
    }
};

export const listaIdentificadoresPorTombo = async (req, res, next) => {
    try {
        const { tomboHcf } = req.params;

        const tombosIdentificadores = await TomboIdentificador.findAll({
            where: { tombo_hcf: tomboHcf },
            attributes: ['identificador_id'],
            order: [['ordem', 'ASC']],
        });

        if (!tombosIdentificadores || tombosIdentificadores.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhum identificador encontrado para este tombo.' });
        }

        const identificadorIds = tombosIdentificadores.map(ti => ti.identificador_id);

        res.status(200).json(identificadorIds);
    } catch (error) {
        next(error);
    }
    return null;
};

export const atualizaIdentificador = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [updated] = await Identificador.update(req.body, {
            where: { id },
        });
        if (updated) {
            const updatedIdentificador = await Identificador.findByPk(id);
            res.status(200).json(updatedIdentificador);
        } else {
            throw new BadRequestException(404, 'Identificador não encontrado');
        }
    } catch (error) {
        next(error);
    }
};
