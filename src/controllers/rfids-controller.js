import { Op, Sequelize } from 'sequelize';

import models from '../models/index.js';

const { Rfid, TomboFoto, Tombo, Especie, Coletor } = models;

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

        const { tombo_hcf, epc, codigo_barra, status } = request.query;
        const whereRfid = {};

        if (epc) {
            whereRfid.epc = { [Op.iLike]: `%${epc}%` };
        }

        if (status) {
            whereRfid.status = status;
        }

        const whereFoto = {};

        if (tombo_hcf) {
            whereFoto.tombo_hcf = tombo_hcf;
        }

        if (codigo_barra) {
            whereFoto.codigo_barra = codigo_barra;
        }

        const rfids = await Rfid.findAndCountAll({
            limit: limite,
            offset,
            where: whereRfid,
            include: [
                {
                    model: TomboFoto,
                    attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
                    where: Object.keys(whereFoto).length > 0 ? whereFoto : undefined,
                    required: Object.keys(whereFoto).length > 0,
                },
            ],
            order: [['created_at', 'DESC']],
        });

        return response.status(200).json({
            dados: rfids.rows,
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
        const { q } = request.query;

        const whereCondicao = {
            id: {
                [Op.notIn]: Sequelize.literal('(SELECT tombo_foto_id FROM rfids WHERE status = \'CONCLUIDO\' AND tombo_foto_id IS NOT NULL)'),
            },
        };

        if (q) {
            whereCondicao[Op.or] = [
                Sequelize.where(Sequelize.cast(Sequelize.col('tombo_hcf'), 'varchar'), { [Op.iLike]: `%${q}%` }),
                Sequelize.where(Sequelize.cast(Sequelize.col('codigo_barra'), 'varchar'), { [Op.iLike]: `%${q}%` }),
            ];
        }

        const tombosPendentes = await TomboFoto.findAndCountAll({
            attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
            where: whereCondicao,
            include: [
                {
                    model: Tombo,
                    attributes: ['hcf', 'nome_cientifico'],
                    required: false,
                    include: [
                        {
                            model: Especie,
                            as: 'especie',
                            attributes: ['nome'],
                            required: false,
                        },
                        {
                            model: Coletor,
                            as: 'coletor',
                            attributes: ['nome'],
                            required: false,
                        },
                    ],
                },
            ],
            limit: limite,
            offset: offset,
            order: [['id', 'DESC']],
        });

        const dados = tombosPendentes.rows.map(tomboFoto => {
            const item = tomboFoto.toJSON();
            const tombo = getIncludedTombo(item);

            return {
                id: item.id,
                tombo_hcf: item.tombo_hcf,
                codigo_barra: item.codigo_barra,
                caminho_foto: item.caminho_foto,
                nome_cientifico: getNomeCientifico(tombo),
                coletor_principal: getColetorPrincipal(tombo),
            };
        });

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
                epc_formatado: rfidJson.epc,
                epc: decodificarEpcHex(rfidJson.epc),
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
