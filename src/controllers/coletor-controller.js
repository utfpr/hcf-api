import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Coletor, Sequelize: { Op } } = models;

export const cadastraColetor = async (req, res, next) => {
    try {
        const coletor = await Coletor.create(req.body);

        res.status(codigos.CADASTRO_RETORNO).json(coletor);
    } catch (error) {
        next(error);
    }

    return null;
};

export const encontraColetor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coletor = await Coletor.findOne({
            where: { id },
        });

        if (!coletor) {
            return res.status(404).json({ mensagem: 'Coletor não encontrado.' });
        }

        res.status(200).json(coletor);
    } catch (error) {
        next(error);
    }

    return null;
};

export const listaColetores = async (req, res, next) => {
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

        const result = await Coletor.findAndCountAll({
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
            coletores: result.rows,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const atualizaColetor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [updated] = await Coletor.update(req.body, {
            where: { id },
        });
        if (updated) {
            const updatedColetor = await Coletor.findByPk(id);
            res.status(200).json(updatedColetor);
        } else {
            throw new BadRequestException(404, 'Coletor não encontrado');
        }
    } catch (error) {
        next(error);
    }
};

export const desativaColetor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { Tombo } = models;

        const coletor = await Coletor.findOne({
            where: { id },
        });

        if (!coletor) {
            throw new BadRequestException(404, 'Coletor não encontrado');
        }

        const tombosAssociados = await Tombo.count({
            where: {
                coletor_id: id            },
        });

        if (tombosAssociados > 0) {
            throw new BadRequestException('Coletor não pode ser excluído porque possui dependentes.');
        }

        await Coletor.destroy({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
