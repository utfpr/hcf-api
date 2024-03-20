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
    const { id, nome } = req.query;
    const { limite, pagina } = req.paginacao;
    const offset = (pagina - 1) * limite;

    const where = {};
    if (id) {
        where.id = id;
    } else if (nome) {
        where.nome = { [Op.like]: `%${nome}%` };
    }

    try {
        const result = await Identificador.findAndCountAll({
            where,
            attributes: ['id', 'nome'],
            limit: limite,
            offset,
        });

        res.status(200).json({
            metadados: {
                total: result.count,
                pagina,
                limite,
            },
            identificadores: result,
        });
    } catch (error) {
        next(error);
    }
};

export const listaIdentificadores = async (req, res, next) => {
    try {
        const { limite, pagina } = req.paginacao;
        const offset = (pagina - 1) * limite;

        const result = await Identificador.findAll({
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
            identificadores: result,
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
