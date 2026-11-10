import { Op, Sequelize } from 'sequelize';

import models from '../models/index.js';

const {
    Rfid,
    TomboFoto,
    Tombo,
    Especie,
    Genero,
    Familia,
    Coletor,
    sequelize,
} = models;

const getIncludedTomboFoto = rfidJson => (
    rfidJson.TomboFoto || rfidJson.tombos_foto || rfidJson.tombo_foto || rfidJson.TomboFotos
);

const getIncludedTombo = tomboFotoJson => (
    tomboFotoJson?.Tombo || tomboFotoJson?.tombo
);

const getNomeCientifico = tombo => (
    tombo?.especie?.nome || tombo?.Especie?.nome || tombo?.nome_cientifico || 'N/A'
);

const getColetorPrincipal = tombo => (
    tombo?.coletor?.nome || tombo?.Coletor?.nome || 'N/A'
);

const normalizarTid = tid => (typeof tid === 'string' ? tid.trim() : '');

const tidValido = tid => {
    const tidNormalizado = normalizarTid(tid);
    return tidNormalizado.length > 0 && tidNormalizado.toUpperCase() !== 'N/A';
};

const codificarParaEpcHex = (tomboHcf, codigoBarra) => {
    const tomboId = parseInt(tomboHcf, 10);
    const match = codigoBarra.match(/([a-zA-Z]+)(\d+)/);

    if (!match) {
        throw new Error('Formato de código de barras inválido para gravação RFID.');
    }

    const herbario = match[1];
    const numero = parseInt(match[2], 10);

    // ID Tombo (4 Bytes = 8 chars hex)
    const bloco1 = tomboId.toString(16).padStart(8, '0').toUpperCase();

    // Sigla herbario (4 Bytes = 8 chars hex)
    const prefixo = `_${herbario}`.substring(0, 4).padEnd(4, ' ');
    let bloco2 = '';

    for (let i = 0; i < 4; i++) {
        bloco2 += prefixo.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
    }

    // Numero cog de barras (4 Bytes = 8 chars hex)
    const bloco3 = numero.toString(16).padStart(8, '0').toUpperCase();

    return bloco1 + bloco2 + bloco3;
};

const decodificarEpcHex = epcHex => {
    if (!epcHex || epcHex.length !== 24) return epcHex;

    try {
        const hexBloco1 = epcHex.substring(0, 8);
        const hexBloco2 = epcHex.substring(8, 16);
        const hexBloco3 = epcHex.substring(16, 24);
        const tomboId = parseInt(hexBloco1, 16);
        let prefixo = '';

        for (let i = 0; i < 8; i += 2) {
            prefixo += String.fromCharCode(parseInt(hexBloco2.substring(i, i + 2), 16));
        }

        prefixo = prefixo.trim();

        const numero = parseInt(hexBloco3, 16);
        const numeroFormatado = String(numero).padStart(9, '0');

        return `${tomboId}${prefixo}${numeroFormatado}`;
    } catch {
        return epcHex;
    }
};

const codificarEpcFormatadoParaHex = epcFormatado => {
    if (typeof epcFormatado !== 'string') return null;

    const termo = epcFormatado.trim();
    const match = termo.match(/^(\d+)_([a-zA-Z]+)(\d+)$/);

    if (!match) return null;

    const [, tomboHcf, herbario, numero] = match;

    try {
        return codificarParaEpcHex(tomboHcf, `${herbario}${numero}`);
    } catch {
        return null;
    }
};

const criarFiltroEpc = epc => {
    if (typeof epc !== 'string' || !epc.trim()) return null;

    const termo = epc.trim();
    const epcHex = codificarEpcFormatadoParaHex(termo);

    if (epcHex) {
        return {
            [Op.or]: [
                { epc: epcHex },
                { epc: { [Op.iLike]: `%${termo}%` } },
            ],
        };
    }

    return {
        epc: { [Op.iLike]: `%${termo}%` },
    };
};

const normalizarIdsFiltro = valor => {
    const valores = Array.isArray(valor) ? valor : [valor];
    const ids = valores
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0);

    return [...new Set(ids)];
};

const filtrosFotosPendentes = filtros => {
    const whereFoto = {
        id: { [Op.notIn]: Sequelize.literal("(SELECT tombo_foto_id FROM rfids WHERE status = 'CONCLUIDO' AND tombo_foto_id IS NOT NULL)") },
    };

    if (filtros.q) {
        whereFoto[Op.or] = [
            Sequelize.where(Sequelize.cast(Sequelize.col('tombo_hcf'), 'varchar'), { [Op.iLike]: `%${filtros.q}%` }),
            { codigo_barra: { [Op.iLike]: `%${filtros.q}%` } },
        ];
    }

    if (filtros.tombo_hcf) {
        whereFoto.tombo_hcf = filtros.tombo_hcf;
    }

    const whereTombo = {};

    for (const campo of ['familia_id', 'genero_id', 'especie_id']) {
        const ids = normalizarIdsFiltro(filtros[campo] || filtros[`${campo}[]`]);

        if (ids.length) {
            whereTombo[campo] = { [Op.in]: ids };
        }
    }

    return {
        where: whereFoto,
        include: [{
            model: Tombo,
            attributes: ['hcf', 'nome_cientifico', 'nomes_populares', 'data_coleta_dia', 'data_coleta_mes', 'data_coleta_ano'],
            where: Object.keys(whereTombo).length ? whereTombo : undefined,
            required: Object.keys(whereTombo).length > 0,
            include: [
                { model: Especie, as: 'especie', attributes: ['nome'], required: false },
                { model: Coletor, as: 'coletor', attributes: ['nome'], required: false },
            ],
        }],
        attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
        order: [['id', 'DESC']],
    };
};

const formatarFotoPendente = foto => {
    const item = foto.toJSON();
    const tombo = getIncludedTombo(item);
    const partesData = [tombo?.data_coleta_dia, tombo?.data_coleta_mes, tombo?.data_coleta_ano];

    return {
        id: item.id,
        tombo_hcf: item.tombo_hcf,
        codigo_barra: item.codigo_barra,
        caminho_foto: item.caminho_foto,
        nome_cientifico: getNomeCientifico(tombo),
        coletor_principal: getColetorPrincipal(tombo),
        nome_popular: tombo?.nomes_populares || 'N/A',
        data_coleta: partesData.every(Boolean) ? partesData.map((parte, indice) => indice < 2 ? String(parte).padStart(2, '0') : parte).join('/') : 'N/A',
    };
};

const formatarRfidResposta = rfid => {
    const rfidJson = typeof rfid.toJSON === 'function' ? rfid.toJSON() : rfid;

    return {
        ...rfidJson,
        epc: decodificarEpcHex(rfidJson.epc),
        epc_hex: rfidJson.epc,
    };
};
export const iniciarGravacao = async (request, response, next) => {
    const { tombo_foto_id } = request.body;

    try {
        const foto = await TomboFoto.findByPk(tombo_foto_id);
        if (!foto) return response.status(404).json({ erro: 'Foto não encontrada.' });

        let epcHexParaGravar;

        try {
            epcHexParaGravar = codificarParaEpcHex(foto.tombo_hcf, foto.codigo_barra);
        } catch (err) {
            return response.status(400).json({ erro: err.message });
        }

        let rfid = await Rfid.findOne({ where: { tombo_foto_id } });

        if (rfid) {
            if (rfid.status === 'CONCLUIDO') {
                return response.status(409).json({
                    erro: 'Tombo já possui uma etiqueta RFID vinculada e concluída.',
                });
            }

            rfid.epc = epcHexParaGravar;
            rfid.status = 'PENDENTE';
            await rfid.save();

        } else {
            rfid = await Rfid.create({
                tombo_foto_id,
                epc: epcHexParaGravar,
                status: 'PENDENTE',
            });
        }

        return response.status(201).json({
            mensagem: 'Operação iniciada.',
            rfid: {
                id: rfid.id,
                epc: rfid.epc,
                status: rfid.status,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const finalizarGravacao = async (request, response, next) => {
    const { id } = request.params;
    const { status, tid } = request.body;

    try {
        const rfid = await Rfid.findByPk(id);
        if (!rfid) return response.status(404).json({ erro: 'Tag não encontrada.' });

        if (rfid.status === 'CONCLUIDO') {
            return response.status(409).json({
                erro: 'Ttag já registrada como CONCLUIDO e não pode ser modificada.',
            });
        }

        const statusFinal = status || '';

        switch (statusFinal) {
            case 'FALHA':
                rfid.tid = null;
                break;

            case 'CONCLUIDO':
                if (!tidValido(tid)) {
                    return response.status(400).json({
                        erro: 'TID obrigatório para concluir a gravação RFID.',
                    });
                }

                {
                    const tidNormalizado = normalizarTid(tid);
                    const tagExistente = await Rfid.findOne({ where: { tid: tidNormalizado } });

                    if (tagExistente && tagExistente.id !== Number(id)) {
                        return response.status(409).json({
                            erro: 'TID já se encontra vinculado a outro tombo no sistema.',
                        });
                    }

                    rfid.tid = tidNormalizado;
                }
                break;

            default:
                return response.status(400).json({
                    erro: `Operação negada. Status inválido: '${statusFinal}'.`,
                });
        }

        rfid.status = statusFinal;
        await rfid.save();

        return response.status(200).json({
            mensagem: 'Operação finalizada.',
            rfid,
        });

    } catch (error) {
        next(error);
    }
};

export const listagem = async (request, response, next) => {
    try {
        const limite = parseInt(request.query.limite) || 20;
        const pagina = parseInt(request.query.pagina) || 1;
        const offset = (pagina - 1) * limite;

        const {
            tombo_hcf,
            epc,
            codigo_barra,
            status,
            familia_id,
            genero_id,
            especie_id,
            excluir_lista_conferencia_id: excluirListaConferenciaId,
        } = request.query;
        const familiaFiltro = familia_id || request.query['familia_id[]'];
        const generoFiltro = genero_id || request.query['genero_id[]'];
        const especieFiltro = especie_id || request.query['especie_id[]'];
        const whereRfid = {};

        if (epc) {
            Object.assign(whereRfid, criarFiltroEpc(epc));
        }

        if (status) {
            whereRfid.status = status;
        }

        if (excluirListaConferenciaId !== undefined) {
            const listaId = Number(excluirListaConferenciaId);

            if (!Number.isSafeInteger(listaId) || listaId < 1) {
                return response.status(400).json({ mensagem: 'ID da lista de conferência inválido.' });
            }

            whereRfid.id = {
                [Op.notIn]: Sequelize.literal(`(SELECT rfid_id FROM listas_conferencias_rfids WHERE lista_conferencia_id = ${listaId})`),
            };
        }

        const whereFoto = {};

        if (tombo_hcf) {
            whereFoto.tombo_hcf = tombo_hcf;
        }

        if (codigo_barra) {
            whereFoto.codigo_barra = codigo_barra;
        }

        const whereTombo = {};

        const familiaIds = normalizarIdsFiltro(familiaFiltro);
        const generoIds = normalizarIdsFiltro(generoFiltro);
        const especieIds = normalizarIdsFiltro(especieFiltro);

        if (familiaIds.length > 0) {
            whereTombo.familia_id = { [Op.in]: familiaIds };
        }

        if (generoIds.length > 0) {
            whereTombo.genero_id = { [Op.in]: generoIds };
        }

        if (especieIds.length > 0) {
            whereTombo.especie_id = { [Op.in]: especieIds };
        }

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

        const rfids = await Rfid.unscoped().findAndCountAll({
            attributes: ['id', 'tombo_foto_id', 'epc', 'tid', 'status', 'created_at', 'updated_at'],
            limit: limite,
            offset,
            where: whereRfid,
            include: [
                {
                    model: TomboFoto,
                    attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
                    where: Object.keys(whereFoto).length > 0 ? whereFoto : undefined,
                    required: Object.keys(whereFoto).length > 0 || possuiFiltroTaxonomico,
                    include: includeTombo,
                },
            ],
            order: [['created_at', 'DESC']],
        });

        const dados = rfids.rows.map(formatarRfidResposta);

        return response.status(200).json({
            dados,
            meta: {
                total: rfids.count,
                pagina,
                limite,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const listarPendentesRfid = async (request, response, next) => {

    try {
        const limite = parseInt(request.query.limite) || 10;
        const pagina = parseInt(request.query.pagina) || 1;
        const offset = (pagina - 1) * limite;
        const tombosPendentes = await TomboFoto.findAndCountAll({
            ...filtrosFotosPendentes(request.query),
            limit: limite,
            offset: offset,
            distinct: true,
        });

        const dados = tombosPendentes.rows.map(formatarFotoPendente);

        return response.status(200).json({
            dados,
            meta: {
                total: tombosPendentes.count,
                pagina,
                limite,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const prepararImpressao = async (request, response, next) => {
    try {
        const fotos = await TomboFoto.findAll(filtrosFotosPendentes(request.body || {}));

        if (!fotos.length) {
            return response.status(200).json({ tags: [], total: 0 });
        }

        const tags = await sequelize.transaction(async transaction => {
            const resultado = [];

            for (const foto of fotos) {
                const dados = formatarFotoPendente(foto);
                const epc = codificarParaEpcHex(dados.tombo_hcf, dados.codigo_barra);
                const [rfid] = await Rfid.findOrCreate({
                    where: { tombo_foto_id: dados.id },
                    defaults: { epc, status: 'PENDENTE' },
                    transaction,
                });

                if (rfid.status === 'CONCLUIDO') {
                    continue;
                }

                if (rfid.epc !== epc || rfid.status !== 'PENDENTE' || rfid.tid) {
                    await rfid.update({ epc, status: 'PENDENTE', tid: null }, { transaction });
                }

                resultado.push({ ...dados, epc, rfid_id: rfid.id });
            }

            return resultado;
        });

        return response.status(200).json({ tags, total: tags.length });
    } catch (error) {
        next(error);
    }
};

export const confirmarLeituraImpressa = async (request, response, next) => {
    const epcInformado = typeof request.body?.epc === 'string' ? request.body.epc.trim() : '';
    const epc = /^[0-9a-f]{24}$/i.test(epcInformado) ? epcInformado.toUpperCase() : codificarEpcFormatadoParaHex(epcInformado);
    const tid = normalizarTid(request.body?.tid);

    if (!/^[0-9A-F]{24}$/.test(epc) || !tidValido(tid)) {
        return response.status(400).json({ erro: 'EPC hexadecimal de 24 caracteres e TID válido são obrigatórios.' });
    }

    try {
        const resultado = await sequelize.transaction(async transaction => {
            const rfid = await Rfid.findOne({ where: { epc }, transaction, lock: transaction.LOCK.UPDATE });

            if (!rfid) {
                return { status: 404, erro: 'EPC não encontrado entre os vínculos pendentes.' };
            }

            if (rfid.status === 'CONCLUIDO') {
                if (rfid.tid !== tid) {
                    return { status: 409, erro: 'Inconsistencia: vinculo já concluído em outra tag.' };
                }

                return { status: 200, rfid, repetida: true };
            }

            if (rfid.status !== 'PENDENTE') {
                return { status: 409, erro: 'Inconsistencia: vinculo nao pendente.' };
            }

            const rfidTid = await Rfid.findOne({ where: { tid }, transaction });

            if (rfidTid && rfidTid.id !== rfid.id) {
                return { status: 409, erro: 'Inconsistencia: vinculo já concluído em outra tag.' };
            }

            await rfid.update({ tid, status: 'CONCLUIDO' }, { transaction });
            return { status: 200, rfid, repetida: false };
        });

        if (resultado.erro) {
            return response.status(resultado.status).json({ erro: resultado.erro });
        }

        const foto = await TomboFoto.findByPk(resultado.rfid.tombo_foto_id);

        return response.status(200).json({
            rfid: { id: resultado.rfid.id, epc, tid, status: 'CONCLUIDO' },
            tombo_hcf: foto?.tombo_hcf,
            codigo_barra: foto?.codigo_barra,
            repetida: resultado.repetida,
        });

    } catch (error) {
        next(error);
    }
};

export const validarTid = async (request, response, next) => {
    const { tid } = request.params;
    const tidNormalizado = normalizarTid(tid);

    try {
        const rfid = await Rfid.findOne({
            where: { tid: tidNormalizado },
            include: [
                {
                    model: TomboFoto,
                    include: [
                        {
                            model: Tombo,
                            include: [
                                {
                                    model: Especie,
                                    as: 'especie',
                                    attributes: ['nome'],
                                },
                                {
                                    model: Coletor,
                                    as: 'coletor',
                                    attributes: ['nome'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!rfid) {
            return response.status(404).json({
                valido: false,
                mensagem: 'TID não encontrado.',
            });
        }

        const rfidJson = rfid.toJSON();
        const tomboFoto = getIncludedTomboFoto(rfidJson);
        const tombo = getIncludedTombo(tomboFoto);

        return response.status(200).json({
            valido: true,
            mensagem: 'TID validado com sucesso.',
            dados: {
                id_rfid: rfidJson.id,
                tid: rfidJson.tid,
                epc: decodificarEpcHex(rfidJson.epc),
                epc_hex: rfidJson.epc,
                epc_formatado: rfidJson.epc,
                status_rfid: rfidJson.status,
                tombo_hcf: tombo?.hcf || tomboFoto?.tombo_hcf || 'N/A',
                nome_cientifico: getNomeCientifico(tombo),
                coletor_principal: getColetorPrincipal(tombo),
            },
        });

    } catch (error) {
        next(error);
    }
};
