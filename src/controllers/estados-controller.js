import pick from '~/helpers/pick';

import BadRequestException from '../errors/bad-request-exception';
import models from '../models';
import codigos from '../resources/codigos-http';

const { Op } = require('sequelize');

const {
    Estado,
    Pais,
    Cidade,
    sequelize,
    Sequelize,
} = models;

export const cadastrarEstado = (req, res, next) => {
    const { nome, sigla, pais_id: paisId } = req.body;

    const callback = async transaction => {
        const estadoConflitante = await Estado.findOne({
            where: {
                pais_id: paisId,
                [Sequelize.Op.or]: [
                    { nome },
                    { sigla },
                ],
            },
            transaction,
        });

        if (estadoConflitante) {
            let campoDuplicado = '';
            if (estadoConflitante.nome === nome) campoDuplicado = 'nome';
            else if (estadoConflitante.sigla === sigla) campoDuplicado = 'UF';

            return res.status(400).json({
                error: {
                    code: 308,
                    mensagem: `Já existe um estado com este ${campoDuplicado} neste país.`,
                },
            });

        }

        const estadoCriado = await Estado.create(
            { nome, sigla, pais_id: paisId },
            { transaction },
        );

        return estadoCriado;
    };

    return sequelize.transaction(callback)
        .then(async estadoCriado => {
            if (!estadoCriado) throw new BadRequestException(309);
            const estadoComPais = await Estado.findOne({
                where: { id: estadoCriado.id },
                attributes: { exclude: ['created_at', 'updated_at'] },
                include: [{ model: Pais, as: 'pais', attributes: ['id', 'nome', 'sigla'] }],
            });

            return res.status(codigos.CADASTRO_RETORNO).json(estadoComPais);
        })
        .catch(next);
};

export const listagem = async (req, res, next) => {
    try {
        const paisId = req.query.pais_id ? parseInt(req.query.pais_id, 10) : undefined;
        const { nome } = req.query;

        const where = {};
        if (!Number.isNaN(paisId) && paisId !== undefined) {
            where.pais_id = paisId;
        }

        if (nome) {
            where.nome = { [Op.like]: `%${nome}%` };
        }

        const estados = await Estado.findAll({
            attributes: { exclude: ['created_at', 'updated_at'] },
            include: [{ model: Pais, as: 'pais', attributes: ['id', 'nome', 'sigla'] }],
            where,
            order: [['id', 'DESC']],
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

        if (!estado) return res.status(404).json({ code: 404, mensagem: 'Estado não encontrado.' });

        return res.status(codigos.BUSCAR_UM_ITEM).json(estado);
    } catch (error) {
        return next(error);
    }
};

export const atualizarEstado = async (req, res, next) => {
    try {
        const { estadoId } = req.params;
        const dados = pick(req.body, ['nome', 'sigla', 'pais_id']);

        const estadoAtual = await Estado.findOne({ where: { id: estadoId } });
        if (!estadoAtual) {
            return res.status(404).json({ mensagem: 'Estado não encontrado.' });
        }

        const estadoConflitante = await Estado.findOne({
            where: {
                pais_id: dados.pais_id ?? estadoAtual.pais_id,
                id: { [Sequelize.Op.ne]: estadoId },
                [Sequelize.Op.or]: [
                    { nome: dados.nome },
                    { sigla: dados.sigla },
                ],
            },
        });

        if (estadoConflitante) {
            let campoDuplicado = '';
            if (estadoConflitante.nome === dados.nome) campoDuplicado = 'nome';
            else if (estadoConflitante.sigla === dados.sigla) campoDuplicado = 'UF';

            return res.status(400).json({
                error: {
                    code: 308,
                    mensagem: `Já existe um estado com este ${campoDuplicado} neste país.`,
                },
            });
        }

        const [updated] = await Estado.update(dados, { where: { id: estadoId } });
        if (updated === 0) return res.status(404).json({ mensagem: 'Estado não encontrado.' });

        const estadoAtualizado = await Estado.findOne({
            where: { id: estadoId },
            attributes: ['id', 'nome', 'sigla', 'pais_id'],
            include: [{ model: Pais, as: 'pais', attributes: ['id', 'nome', 'sigla'] }],
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

        const cidadesAssociadas = await Cidade.count({ where: { estado_id: estadoId } });

        if (cidadesAssociadas > 0) {
            return res.status(400).json({
                error: {
                    code: 400,
                    mensagem: `Não é possível excluir o estado. Existem ${cidadesAssociadas} cidade(s) associada(s) a este estado.`,
                },
            });
        }

        await Estado.destroy({ where: { id: estadoId } });
        return res.status(codigos.DESATIVAR).send();
    } catch (error) {
        return next(error);
    }
};

export default {};
