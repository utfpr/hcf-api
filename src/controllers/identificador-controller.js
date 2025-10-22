import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Identificador, Sequelize: { Op } } = models;

export const cadastraIdentificador = async (req, res, next) => {
    try {
        const identificador = await Identificador.create(req.body);
        res.status(codigos.CADASTRO_RETORNO).json(identificador);
    } catch (error) {
        next(error);
    }
};

export const encontradaIdentificador = async (req, res, next) => {
    try {
        const { id } = req.params;
        const identificador = await Identificador.findOne({
            where: { id },
        });

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
        const { id, nome } = req.query;
        const { limite, pagina } = req.paginacao;
        const offset = (pagina - 1) * limite;

        const where = {};
        if (id) {
            where.id = id;
        } else if (nome) {
            where.nome = { [Op.like]: `%${nome}%` };
        }

        const result = await Identificador.findAndCountAll({
            where,
            order: [['id', 'ASC']],
            limit: limite,
            offset,
        });

        const response = {
            metadados: {
                total: result.count,
                pagina,
                limite,
            },
            identificadores: result.rows,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
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

export const excluirIdentificador = async (req, res, next) => {
    try {
        const { id } = req.params;

        const identificador = await Identificador.findOne({
            where: { id },
        });

        if (!identificador) {
            throw new BadRequestException('Identificador não encontrado');
        }

        const { TomboIdentificador } = models;
        const tombosAssociados = await TomboIdentificador.count({
            where: {
                identificador_id: id,
            },
        });

        if (tombosAssociados > 0) {
            throw new BadRequestException('Identificador não pode ser excluído porque possui dependentes.');
        }

        await Identificador.destroy({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
