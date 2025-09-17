import pick from '~/helpers/pick';

import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    Estado,
    Pais,
    sequelize,
    Sequelize,
} = models;

export const cadastrarEstado = (req, res, next) => {
    const { nome, sigla, codigo_telefone: codigoTelefone, pais_id: paisId } = req.body;

    const callback = transaction => Promise.resolve()
        .then(() => Estado.findOne({
            where: {
                [Sequelize.Op.or]: [{ nome }, { sigla }],
                pais_id: paisId,
            },
            transaction,
        }))
        .then(estadoEncontrado => {
            if (estadoEncontrado) {
                throw new BadRequestException(308);
            }
        })
        .then(() => Estado.create({ nome, sigla, codigoTelefone, pais_id: paisId, }, { transaction }));

    return sequelize.transaction(callback)
        .then(estadoCriado => {
            if (!estadoCriado) throw new BadRequestException(309);
            return res.status(codigos.CADASTRO_RETORNO).json(estadoCriado);
        })
        .catch(next);
};

export const listagem = async (req, res, next) => {
    try {
        const estados = await Estado.findAll({
            attributes: { exclude: ['created_at', 'updated_at'] },
            include: [{ model: Pais, as: 'pais', attributes: ['id', 'nome', 'sigla'] }],
            order: [['id', 'ASC']],
        });

        return res.status(codigos.LISTAGEM).json(estados);
    } catch (error) {
        return next(error);
    }
};

export const encontrarEstado = async (req, res, next) => {
    try {
        const { estadoId } = req.params;

        const estado = await Estado.findOne({
            where: { id: estadoId },
        });

        if (!estado) return res.status(404).json({ mensagem: 'Estado não encontrado.' });

        return res.status(codigos.BUSCAR_UM_ITEM).json(estado);
    } catch (error) {
        return next(error);
    }
};

export const atualizarEstado = async (req, res, next) => {
    try {
        const { estadoId } = req.params;
        const dados = pick(req.body, ['nome', 'sigla', 'codigo_telefone']);

        const [updated] = await Estado.update(dados, { where: { id: estadoId } });
        if (updated === 0) return res.status(404).json({ mensagem: 'Estado não encontrado.' });

        const estadoAtualizado = await Estado.findOne({
            where: { id: estadoId },
            attributes: ['id', 'nome', 'sigla', 'codigo_telefone', 'pais_id'],
        });

        return res.status(codigos.EDITAR_RETORNO).json(estadoAtualizado);
    } catch (error) {
        return next(error);
    }
};

export const desativarEstado = async (req, res, next) => {
    try {
        const { estadoId } = req.params;

        const estado = await Estado.findOne({ where: { id: estadoId } });
        if (!estado) {
            return res.status(404).json({ mensagem: 'Estado não encontrado.' });
        }

        // Verifica cidades associadas
        const { Cidade } = models;
        const cidadesAssociadas = await Cidade.count({ where: { estado_id: estadoId } });

        if (cidadesAssociadas > 0) {
            return res.status(400).json({
                mensagem: `Não é possível excluir o estado. Existem ${cidadesAssociadas} cidade(s) associada(s) a este estado.`,
            });
        }

        await Estado.destroy({ where: { id: estadoId } });
        return res.status(codigos.DESATIVAR).send();
    } catch (error) {
        return next(error);
    }
};

export default {};
