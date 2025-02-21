import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Coletor, Sequelize: { Op } } = models;

export const cadastraColetor = async (req, res, next) => {
    try {
        if (req.body.numero) {
            const validaNumero = await Coletor.findOne({
                where: { numero: req.body.numero },
            });

            if (validaNumero) return res.status(400).json({ mensagem: 'Número do coletor já está em uso.' });
        }

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
            where: { id, ativo: true },
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

        const where = { ativo: true };
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
            where: { id, ativo: true },
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
        const [updated] = await Coletor.update({ ativo: false }, {
            where: { id, ativo: true },
        });

        if (updated) {
            res.status(codigos.DESATIVAR).send();
        } else {
            throw new BadRequestException(404, 'Coletor não encontrado');
        }
    } catch (error) {
        next(error);
    }
};
