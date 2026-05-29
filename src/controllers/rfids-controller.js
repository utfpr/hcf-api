import { Op, Sequelize } from 'sequelize';
import models from '../models/index.js';

const { Rfid, TomboFoto } = models;

export const iniciarGravacao = async (request, response, next) => {
    const { tombo_foto_id } = request.body;

    try {
        const foto = await TomboFoto.findByPk(tombo_foto_id);
        if (!foto) return response.status(404).json({ erro: 'Foto não encontrada.' });

        const data = `${foto.tombo_hcf}#${foto.codigo_barra}`.replace(/\s/g, '');
        let rfid = await Rfid.findOne({ where: { tombo_foto_id } });

        if (rfid) {
            if (rfid.status === 'CONCLUIDO') {
                return response.status(409).json({ 
                    erro: 'Tombo já possui uma etiqueta RFID vinculada e concluída.' 
                });
            }

            rfid.epc = data;
            rfid.status = 'PENDENTE';
            await rfid.save();

        } else {
            rfid = await Rfid.create({
                tombo_foto_id,
                epc: data,
                status: 'PENDENTE'
            });
        }

        return response.status(201).json({
            mensagem: 'Operação iniciada.',
            rfid: {
                id: rfid.id,
                epc: rfid.epc,
                status: rfid.status
            }
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
                erro: 'Ttag já registrada como CONCLUIDO e não pode ser modificada.' 
            });
        }

        const statusFinal = status || '';

        switch (statusFinal) {
            case 'FALHA':
                rfid.tid = null;
                break;

            case 'CONCLUIDO':
                if (tid) {
                    const tagExistente = await Rfid.findOne({ where: { tid } });
                    
                    if (tagExistente && tagExistente.id !== Number(id)) {
                        return response.status(409).json({
                            erro: 'TID já se encontra vinculado a outro tombo no sistema.'
                        });
                    }
                    
                    rfid.tid = tid;
                }
                break;

            default:
                return response.status(400).json({
                    erro: `Operação negada. Status inválido: '${statusFinal}'.`
                });
        }

        rfid.status = statusFinal;
        await rfid.save();

        return response.status(200).json({
            mensagem: 'Operação finalizada.',
            rfid
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
                    required: Object.keys(whereFoto).length > 0 
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return response.status(200).json({
            dados: rfids.rows,
            meta: {
                total: rfids.count,
                pagina,
                limite
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
                [Op.notIn]: Sequelize.literal(`(SELECT tombo_foto_id FROM rfids WHERE status = 'CONCLUIDO' AND tombo_foto_id IS NOT NULL)`)
            }
        };

        if (q) {
            whereCondicao[Op.or] = [
                Sequelize.where(Sequelize.cast(Sequelize.col('tombo_hcf'), 'varchar'), { [Op.iLike]: `%${q}%` }),
                Sequelize.where(Sequelize.cast(Sequelize.col('codigo_barra'), 'varchar'), { [Op.iLike]: `%${q}%` })
            ];
        }

        const tombosPendentes = await TomboFoto.findAndCountAll({
            attributes: ['id', 'tombo_hcf', 'codigo_barra', 'caminho_foto'],
            where: whereCondicao,
            limit: limite,
            offset: offset,
            order: [['id', 'DESC']]
        });

        return response.status(200).json({
            dados: tombosPendentes.rows,
            meta: {
                total: tombosPendentes.count,
                pagina,
                limite
            }
        });

    } catch (error) {
        next(error);
    }
};
