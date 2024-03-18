import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Coletor } = models;

export const cadastraColetor = async (req, res, next) => {
    try {
        const coletor = await Coletor.create(req.body);
        res.status(codigos.CADASTRO_RETORNO).json(coletor);
    } catch (error) {
        next(error);
    }
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
        const { limite, pagina } = req.paginacao;
        const offset = (pagina - 1) * limite;

        const result = await Coletor.findAll({
            where: { ativo: true },
            order: [['id', 'ASC']],
            limit: limite,
            offset,
        });

        const response = {
            metadados: {
                total: result.length,
                pagina,
                limite,
            },
            coletores: result,
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
            where: { id },
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
