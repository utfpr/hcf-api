import { Op } from 'sequelize';

import models from '../models/index.js';

const {
    Rfid,
    TomboFoto,
    Tombo,
    Familia,
    Genero,
    Especie,
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

const normalizarIdsFiltro = valor => {
    const valores = Array.isArray(valor) ? valor : [valor];
    const ids = valores
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0);

    return [...new Set(ids)];
};

const criarFiltroRfids = filtros => {
    const {
        tombo_hcf: tomboHcf,
        familia_id: familiaId,
        genero_id: generoId,
        especie_id: especieId,
        rfid_ids: rfidIdsRequest,
    } = filtros || {};
    const whereFoto = {};
    const whereTombo = {};
    const familiaIds = normalizarIdsFiltro(familiaId);
    const generoIds = normalizarIdsFiltro(generoId);
    const especieIds = normalizarIdsFiltro(especieId);
    const rfidIds = normalizarIdsRfids(rfidIdsRequest) || [];

    if (tomboHcf) whereFoto.tombo_hcf = tomboHcf;
    if (familiaIds.length > 0) whereTombo.familia_id = { [Op.in]: familiaIds };
    if (generoIds.length > 0) whereTombo.genero_id = { [Op.in]: generoIds };
    if (especieIds.length > 0) whereTombo.especie_id = { [Op.in]: especieIds };

    const possuiFiltroTaxonomico = Object.keys(whereTombo).length > 0;
    const includeTombo = [];

    if (possuiFiltroTaxonomico) {
        includeTombo.push({
            model: Tombo,
            attributes: ['hcf', 'familia_id', 'genero_id', 'especie_id'],
            where: whereTombo,
            required: true,
            include: [
                { model: Familia, attributes: ['id', 'nome'], required: false },
                { model: Genero, attributes: ['id', 'nome'], required: false },
                { model: Especie, as: 'especie', attributes: ['id', 'nome'], required: false },
            ],
        });
    }

    return {
        where: {
            status: 'CONCLUIDO',
            ...(rfidIds.length > 0 ? { id: { [Op.in]: rfidIds } } : {}),
        },
        include: [{
            model: TomboFoto,
            attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
            where: Object.keys(whereFoto).length > 0 ? whereFoto : undefined,
            required: Object.keys(whereFoto).length > 0 || possuiFiltroTaxonomico,
            include: includeTombo,
        }],
        possuiFiltro: Object.keys(whereFoto).length > 0 || possuiFiltroTaxonomico || rfidIds.length > 0,
    };
};

const buscarIdsRfidsPorFiltro = async (filtros, transaction) => {
    const filtro = criarFiltroRfids(filtros);
    const rfids = await Rfid.findAll({
        attributes: ['id'],
        where: filtro.where,
        include: filtro.include,
        transaction,
    });

    return {
        ids: rfids.map(rfid => rfid.id),
        possuiFiltro: filtro.possuiFiltro,
    };
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
        epc: rfidJson.epc,
        tid: rfidJson.tid,
        status: rfidJson.status,
        tombo_foto_id: rfidJson.tombo_foto_id,
        tombos_foto: rfidJson.TomboFoto || rfidJson.tombos_foto || null,
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
        const rfidIds = rfidIdsRequest === undefined
            || (Array.isArray(rfidIdsRequest) && rfidIdsRequest.length === 0)
            ? []
            : normalizarIdsRfids(rfidIdsRequest);

        if (!nome || !String(nome).trim()) {
            return response.status(400).json({ mensagem: 'Nome é obrigatório.' });
        }

        if (rfidIds === null) {
            return response.status(400).json({ mensagem: 'rfid_ids deve ser um array de IDs válidos.' });
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
        const { nome, descricao } = request.body;

        if (!nome || !String(nome).trim()) {
            return response.status(400).json({ mensagem: 'Nome é obrigatório.' });
        }

        const listaAtualizada = await sequelize.transaction(async transaction => {
            const lista = await ListaConferencia.findByPk(id, { transaction });

            if (!lista) {
                return { erro: { status: 404, mensagem: 'Lista de conferência não encontrada.' } };
            }

            lista.nome = String(nome).trim();
            lista.descricao = descricao;
            await lista.save({ transaction });

            return {
                ...formatarListaConferencia(lista),
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
                    attributes: ['id', 'epc', 'tid', 'status', 'tombo_foto_id'],
                    where: Object.keys(whereRfid).length > 0 ? whereRfid : undefined,
                    required: true,
                    include: [{
                        model: TomboFoto,
                        attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
                    }],
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

export const adicionarRfidsPorFiltro = async (request, response, next) => {
    try {
        const { id } = request.params;
        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const resultado = await sequelize.transaction(async transaction => {
            const { ids } = await buscarIdsRfidsPorFiltro(request.body, transaction);
            const existentes = await ListaConferenciaRfid.findAll({
                attributes: ['rfid_id'],
                where: {
                    lista_conferencia_id: id,
                    rfid_id: { [Op.in]: ids.length > 0 ? ids : [0] },
                },
                transaction,
            });
            const existentesSet = new Set(existentes.map(vinculo => vinculo.rfid_id));
            const novosIds = ids.filter(rfidId => !existentesSet.has(rfidId));

            if (novosIds.length > 0) {
                await ListaConferenciaRfid.bulkCreate(
                    novosIds.map(rfidId => ({ lista_conferencia_id: id, rfid_id: rfidId })),
                    { transaction },
                );
            }

            return { encontrados: ids.length, adicionados: novosIds.length };
        });

        return response.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

export const removerRfidsPorFiltro = async (request, response, next) => {
    try {
        const { id } = request.params;
        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const resultado = await sequelize.transaction(async transaction => {
            const { ids, possuiFiltro } = await buscarIdsRfidsPorFiltro(request.body, transaction);

            if (!possuiFiltro) {
                return { erro: { status: 400, mensagem: 'Informe ao menos um filtro para remover vínculos.' } };
            }

            const removidos = await ListaConferenciaRfid.destroy({
                where: {
                    lista_conferencia_id: id,
                    rfid_id: { [Op.in]: ids.length > 0 ? ids : [0] },
                },
                transaction,
            });

            return { removidos };
        });

        if (resultado?.erro) {
            return response.status(resultado.erro.status).json({ mensagem: resultado.erro.mensagem });
        }

        return response.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

export const removerTodosRfids = async (request, response, next) => {
    try {
        const { id } = request.params;
        const lista = await ListaConferencia.findByPk(id, { attributes: ['id'] });

        if (!lista) {
            return response.status(404).json({ mensagem: 'Lista de conferência não encontrada.' });
        }

        const removidos = await ListaConferenciaRfid.destroy({
            where: { lista_conferencia_id: id },
        });

        return response.status(200).json({ removidos });
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

const montarDetalhesTid = vinculos => vinculos.reduce((acc, vinculo) => {
    const rfid = vinculo.Rfid;
    const tid = normalizarTid(rfid?.tid);

    if (!tidValido(tid)) return acc;

    acc[tid] = {
        tid,
        rfid_id: rfid.id,
        tombo_foto_id: rfid.tombo_foto_id,
        tombo_hcf: rfid.tombos_foto?.tombo_hcf || rfid.TomboFoto?.tombo_hcf || null,
        codigo_barra: rfid.tombos_foto?.codigo_barra || rfid.TomboFoto?.codigo_barra || null,
        caminho_foto: rfid.tombos_foto?.caminho_foto || rfid.TomboFoto?.caminho_foto || null,
    };

    return acc;
}, {});

const mapearTidsComDetalhes = (tids = [], detalhesPorTid) => tids.map(tid => detalhesPorTid[tid] || { tid });

const formatarInventarioListaConferencia = (inventario, detalhesPorTid) => {
    const inventarioJson = typeof inventario.toJSON === 'function' ? inventario.toJSON() : inventario;
    const status = inventarioJson.status || {};

    return {
        ...inventarioJson,
        status_detalhado: {
            encontrados: mapearTidsComDetalhes(status.encontrados, detalhesPorTid),
            nao_encontrados: mapearTidsComDetalhes(status.nao_encontrados, detalhesPorTid),
            tids_invalidos: mapearTidsComDetalhes(status.tids_invalidos, detalhesPorTid),
        },
    };
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

        const vinculos = await ListaConferenciaRfid.findAll({
            attributes: ['id'],
            where: { lista_conferencia_id: id },
            include: [
                {
                    model: Rfid,
                    attributes: ['id', 'tid', 'tombo_foto_id'],
                    required: true,
                    include: [
                        {
                            model: TomboFoto,
                            attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
                        },
                    ],
                },
            ],
            order: [['id', 'ASC']],
        });

        const detalhesPorTid = montarDetalhesTid(vinculos);

        return response.status(200).json({
            dados: inventarios.rows.map(inventario => formatarInventarioListaConferencia(inventario, detalhesPorTid)),
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
