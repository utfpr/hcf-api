import { Op } from 'sequelize';

import models from '../models/index.js';

const {
    Rfid,
    ListaConferencia,
    ListaConferenciaRfid,
    Inventario,
    sequelize,
} = models;

const normalizarTid = tid => (typeof tid === 'string' ? tid.trim() : '');

const tidValido = tid => {
    const tidNormalizado = normalizarTid(tid);

    return tidNormalizado.length > 0 && tidNormalizado.toUpperCase() !== 'N/A';
};

const normalizarIdsRfids = rfidIds => {
    if (!Array.isArray(rfidIds) || rfidIds.length < 1) return null;

    const ids = rfidIds.map(id => Number(id));

    if (ids.some(id => !Number.isInteger(id) || id < 1)) return null;

    return [...new Set(ids)];
};

const validarRfidsExistentes = async (rfidIds, transaction) => {
    const rfids = await Rfid.findAll({
        attributes: ['id', 'tid', 'tombo_foto_id'],
        where: { id: { [Op.in]: rfidIds } },
        order: [['id', 'ASC']],
        transaction,
    });

    if (rfids.length !== rfidIds.length) {
        return { valido: false, rfids };
    }

    return { valido: true, rfids };
};

const formatarRfidListaConferencia = rfid => {
    const rfidJson = typeof rfid.toJSON === 'function' ? rfid.toJSON() : rfid;

    return {
        id: rfidJson.id,
        tid: rfidJson.tid,
        tombo_foto_id: rfidJson.tombo_foto_id,
    };
};

const formatarListaConferencia = lista => {
    const listaJson = typeof lista.toJSON === 'function' ? lista.toJSON() : lista;

    return {
        id: listaJson.id,
        nome: listaJson.nome,
        descricao: listaJson.descricao,
    };
};

export const listarListasConferencias = async (request, response, next) => {
    try {
        const limite = parseInt(request.query.limite, 10) || 20;
        const pagina = parseInt(request.query.pagina, 10) || 1;
        const offset = (pagina - 1) * limite;
        const { nome } = request.query;
        const where = {};

        if (nome) {
            where.nome = { [Op.iLike]: `%${String(nome).trim()}%` };
        }

        const listas = await ListaConferencia.findAndCountAll({
            attributes: ['id', 'nome', 'descricao'],
            where,
            order: [['id', 'DESC']],
            limit: limite,
            offset,
        });

        return response.status(200).json({
            dados: listas.rows.map(formatarListaConferencia),
            meta: {
                total: listas.count,
                pagina,
                limite,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const criarListaConferencia = async (request, response, next) => {
    try {
        const { nome, descricao, rfid_ids: rfidIdsRequest } = request.body;
        const rfidIds = normalizarIdsRfids(rfidIdsRequest);

        if (!nome || !String(nome).trim()) {
            return response.status(400).json({ mensagem: 'Nome é obrigatório.' });
        }

        if (!rfidIds || rfidIds.length < 1) {
            return response.status(400).json({ mensagem: 'rfid_ids deve ser um array não vazio.' });
        }

        const listaCriada = await sequelize.transaction(async transaction => {
            const { valido, rfids } = await validarRfidsExistentes(rfidIds, transaction);

            if (!valido) {
                return { erro: { status: 400, mensagem: 'Um ou mais RFIDs informados não existem.' } };
            }

            const lista = await ListaConferencia.create(
                {
                    nome: String(nome).trim(),
                    descricao,
                },
                { transaction },
            );

            await ListaConferenciaRfid.bulkCreate(
                rfidIds.map(rfidId => ({
                    lista_conferencia_id: lista.id,
                    rfid_id: rfidId,
                })),
                { transaction },
            );

            return {
                ...formatarListaConferencia(lista),
                rfids: rfids.map(formatarRfidListaConferencia),
            };
        });

        if (listaCriada?.erro) {
            return response.status(listaCriada.erro.status).json({ mensagem: listaCriada.erro.mensagem });
        }

        return response.status(201).json(listaCriada);
    } catch (error) {
        next(error);
    }
};

export const buscarListaConferencia = async (request, response, next) => {
    try {
        const { id } = request.params;
        const lista = await ListaConferencia.findByPk(id, {
            attributes: ['id', 'nome', 'descricao'],
        });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        return response.status(200).json(formatarListaConferencia(lista));
    } catch (error) {
        next(error);
    }
};

export const atualizarListaConferencia = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { nome, descricao, rfid_ids: rfidIdsRequest } = request.body;
        const rfidIds = normalizarIdsRfids(rfidIdsRequest);

        if (!nome || !String(nome).trim()) {
            return response.status(400).json({ mensagem: 'Nome é obrigatório.' });
        }

        if (!rfidIds || rfidIds.length < 1) {
            return response.status(400).json({ mensagem: 'rfid_ids deve ser um array não vazio.' });
        }

        const listaAtualizada = await sequelize.transaction(async transaction => {
            const lista = await ListaConferencia.findByPk(id, { transaction });

            if (!lista) {
                return { erro: { status: 404, mensagem: 'Lista de conferência não encontrada.' } };
            }

            const { valido, rfids } = await validarRfidsExistentes(rfidIds, transaction);

            if (!valido) {
                return { erro: { status: 400, mensagem: 'Um ou mais RFIDs informados não existem.' } };
            }

            lista.nome = String(nome).trim();
            lista.descricao = descricao;
            await lista.save({ transaction });

            await ListaConferenciaRfid.destroy({
                where: { lista_conferencia_id: lista.id },
                transaction,
            });

            await ListaConferenciaRfid.bulkCreate(
                rfidIds.map(rfidId => ({
                    lista_conferencia_id: lista.id,
                    rfid_id: rfidId,
                })),
                { transaction },
            );

            return {
                ...formatarListaConferencia(lista),
                rfids: rfids.map(formatarRfidListaConferencia),
            };
        });

        if (listaAtualizada?.erro) {
            return response.status(listaAtualizada.erro.status).json({ mensagem: listaAtualizada.erro.mensagem });
        }

        return response.status(200).json(listaAtualizada);
    } catch (error) {
        next(error);
    }
};

export const listarRfidsListaConferencia = async (request, response, next) => {
    try {
        const { id } = request.params;
        const limite = parseInt(request.query.limite, 10) || 20;
        const pagina = parseInt(request.query.pagina, 10) || 1;
        const offset = (pagina - 1) * limite;
        const { tid } = request.query;

        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const whereRfid = {};
        if (tid) {
            whereRfid.tid = { [Op.iLike]: `%${String(tid).trim()}%` };
        }

        const vinculos = await ListaConferenciaRfid.findAndCountAll({
            attributes: ['id'],
            where: { lista_conferencia_id: id },
            include: [
                {
                    model: Rfid,
                    attributes: ['id', 'tid', 'tombo_foto_id'],
                    where: Object.keys(whereRfid).length > 0 ? whereRfid : undefined,
                    required: true,
                },
            ],
            order: [['id', 'ASC']],
            limit: limite,
            offset,
        });

        return response.status(200).json({
            dados: vinculos.rows.map(vinculo => formatarRfidListaConferencia(vinculo.Rfid)),
            meta: {
                total: vinculos.count,
                pagina,
                limite,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const registrarInventarioListaConferencia = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { tids } = request.body;

        if (!Array.isArray(tids)) {
            return response.status(400).json({ mensagem: 'tids deve ser um array.' });
        }

        const tidsNormalizados = tids.map(normalizarTid);
        if (tidsNormalizados.some(tid => !tidValido(tid))) {
            return response.status(400).json({ mensagem: 'tids não pode conter TID vazio ou N/A.' });
        }

        const tidsLidos = [...new Set(tidsNormalizados)];
        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const vinculos = await ListaConferenciaRfid.findAll({
            attributes: ['id'],
            where: { lista_conferencia_id: id },
            include: [
                {
                    model: Rfid,
                    attributes: ['id', 'tid', 'tombo_foto_id'],
                    required: true,
                },
            ],
            order: [['id', 'ASC']],
        });

        const tidsEsperados = vinculos
            .map(vinculo => normalizarTid(vinculo.Rfid?.tid))
            .filter(tidValido);
        const tidsEsperadosSet = new Set(tidsEsperados);
        const tidsLidosSet = new Set(tidsLidos);
        const encontrados = tidsEsperados.filter(tid => tidsLidosSet.has(tid));
        const naoEncontrados = tidsEsperados.filter(tid => !tidsLidosSet.has(tid));
        const tidsInvalidos = tidsLidos.filter(tid => !tidsEsperadosSet.has(tid));
        const totalEsperado = vinculos.length;
        const totalEncontrados = encontrados.length;
        const totalNaoEncontrados = totalEsperado - totalEncontrados;

        const inventario = await Inventario.create({
            lista_conferencia_id: Number(id),
            usuario_id: request.usuario?.id,
            total_esperado: totalEsperado,
            total_encontrados: totalEncontrados,
            total_nao_encontrados: totalNaoEncontrados,
            status: {
                encontrados,
                nao_encontrados: naoEncontrados,
                tids_invalidos: tidsInvalidos,
            },
        });

        return response.status(201).json(inventario);
    } catch (error) {
        next(error);
    }
};

const obterPaginacao = query => {
    const limite = parseInt(query.limite, 10) || 20;
    const pagina = parseInt(query.pagina, 10) || 1;

    return {
        limite,
        pagina,
        offset: (pagina - 1) * limite,
    };
};

const validarOrdem = ordemQuery => {
    const ordem = String(ordemQuery || 'DESC').toUpperCase();

    return ['ASC', 'DESC'].includes(ordem) ? ordem : null;
};

const criarDataValida = data => {
    const dataCriada = new Date(data);

    return Number.isNaN(dataCriada.getTime()) ? null : dataCriada;
};

const criarFiltroPeriodo = ({ dataInicio, dataFim }) => {
    const filtro = {};

    if (dataInicio) {
        const dataInicioCriada = criarDataValida(dataInicio);

        if (!dataInicioCriada) return null;

        filtro[Op.gte] = dataInicioCriada;
    }

    if (dataFim) {
        const dataFimCriada = criarDataValida(dataFim);

        if (!dataFimCriada) return null;

        filtro[Op.lte] = dataFimCriada;
    }

    return filtro;
};

export const listarInventariosListaConferencia = async (request, response, next) => {
    try {
        const { id } = request.params;
        const { limite, pagina, offset } = obterPaginacao(request.query);
        const { data_inicio: dataInicio, data_fim: dataFim } = request.query;
        const ordem = validarOrdem(request.query.ordem);

        if (!ordem) {
            return response.status(400).json({ mensagem: 'Ordenação inválida.' });
        }

        const filtrosData = criarFiltroPeriodo({ dataInicio, dataFim });

        if (!filtrosData) {
            return response.status(400).json({ mensagem: 'Data inválida.' });
        }

        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const where = { lista_conferencia_id: id };

        if (Object.keys(filtrosData).length > 0) {
            where.created_at = filtrosData;
        }

        const inventarios = await Inventario.unscoped().findAndCountAll({
            attributes: [
                'id',
                'lista_conferencia_id',
                'usuario_id',
                'total_esperado',
                'total_encontrados',
                'total_nao_encontrados',
                'status',
                'created_at',
            ],
            where,
            order: [['created_at', ordem]],
            limit: limite,
            offset,
        });

        return response.status(200).json({
            dados: inventarios.rows,
            meta: {
                total: inventarios.count,
                pagina,
                limite,
            },
        });
    } catch (error) {
        next(error);
    }
};
