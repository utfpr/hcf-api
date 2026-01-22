import BadRequestException from '../errors/bad-request-exception';
import limparEspacos from '../helpers/limpa-espaco';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Coletor, Sequelize: { Op } } = models;

export const cadastraColetor = async (req, res, next) => {
    try {
        if (req.body.nome) req.body.nome = limparEspacos(req.body.nome);

        const coletor = await Coletor.create(req.body);

        res.status(codigos.CADASTRO_RETORNO).json(coletor);
    } catch (error) {
        next(error);
    }
};

export const encontraColetor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coletor = await Coletor.findOne({ where: { id } });

        if (!coletor) {
            return res.status(404).json({ mensagem: 'Coletor não encontrado.' });
        }

        res.status(200).json(coletor);
    } catch (error) {
        next(error);
    }
};

export const listaColetores = async (req, res, next) => {
    try {
        const { id } = req.query;
        let { nome } = req.query;

        const { limite, pagina } = req.paginacao;
        const offset = (pagina - 1) * limite;

        const where = {};

        if (id) {
            where.id = id;
        } else if (nome) {
            nome = limparEspacos(nome);
            where.nome = { [Op.like]: `%${nome}%` };
        }

        const result = await Coletor.findAndCountAll({
            where,
            order: [['id', 'ASC']],
            limit: limite,
            offset,
        });

        res.status(200).json({
            metadados: {
                total: result.count,
                pagina,
                limite,
            },
            coletores: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

export const atualizaColetor = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.body.nome) req.body.nome = limparEspacos(req.body.nome);

        const [updated] = await Coletor.update(req.body, { where: { id } });

        if (!updated) {
            throw new BadRequestException(404, 'Coletor não encontrado');
        }

        const updatedColetor = await Coletor.findByPk(id);

        res.status(200).json(updatedColetor);
    } catch (error) {
        next(error);
    }
};

export const desativaColetor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { Tombo } = models;

        const coletor = await Coletor.findOne({ where: { id } });

        if (!coletor) {
            throw new BadRequestException(404, 'Coletor não encontrado');
        }

        const tombosAssociados = await Tombo.count({
            where: { coletor_id: id },
        });

        if (tombosAssociados > 0) {
            throw new BadRequestException(
                'Coletor não pode ser excluído porque possui dependentes.',
            );
        }

        await Coletor.destroy({ where: { id } });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
