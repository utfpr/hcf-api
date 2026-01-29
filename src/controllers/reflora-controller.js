import moment from 'moment';

import {
    selectTemExecucaoServico,
    insereExecucao,
    atualizaTabelaConfiguracao,
    selectEstaExecutandoServico,
} from '../herbarium/herbariumdatabase';
import {
    getHoraAtual,
} from '../herbarium/log';

/**
 * A função preparaRequisicao, faz um select no banco verificando se tem registros
 * onde o horário de fim é nulo e o serviço é Reflora. Se o resultado dessa consulta
 * é maior que zero significa que foi retornado algum registro. Se existe algum registro no BD,
 * onde a data de fim é nula e o serviço é Reflora eu verifico a periodicidade que é.
 */
export const preparaRequisicao = (request, response) => {
    const { periodicidade } = request.query;
    const proximaAtualizacao = request.query.data_proxima_atualizacao;
    selectEstaExecutandoServico("REFLORA").then(listaExecucaoReflora => {
        if (listaExecucaoReflora.length > 0) {
            const execucao = listaExecucaoReflora[0].dataValues;
            const { periodicidade: periodicidadeBD } = execucao;

            if (periodicidadeBD === 'MANUAL') {
                response.status(200).json(JSON.parse(' { "result": "failed" } '));
            } else if ((periodicidadeBD === 'SEMANAL') || (periodicidadeBD === '1MES') || (periodicidadeBD === '2MESES')) {
                if (moment().format('DD/MM/YYYY') !== listaExecucaoReflora[0].dataValues.data_proxima_atualizacao) {
                    const { id } = listaExecucaoReflora[0].dataValues;
                    atualizaTabelaConfiguracao('REFLORA', id, getHoraAtual(), null, periodicidade, proximaAtualizacao).then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                } else {
                    response.status(200).json({ result: 'failed' });
                }
            }
        } else {
            selectTemExecucaoServico('REFLORA').then(execucaoReflora => {
                if (execucaoReflora.length === 0) {
                    insereExecucao(getHoraAtual(), null, periodicidade, proximaAtualizacao, "REFLORA").then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                } else {
                    const { id } = execucaoReflora[0].dataValues;
                    atualizaTabelaConfiguracao('REFLORA', id, getHoraAtual(), null, periodicidade, proximaAtualizacao).then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                }
            });
        }
    });
};

/**
 * A função estaExecutando, faz um select no banco verificando se tem registros
 * de execução do Reflora.
 */
export const estaExecutando = (_, response) => {
    selectEstaExecutandoServico("REFLORA").then(listaExecucaoReflora => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        response.header('Access-Control-Allow-Methods', 'GET');

        if (listaExecucaoReflora.length > 0) {
            const execucao = listaExecucaoReflora[0].dataValues;
            const { periodicidade } = execucao;

            if (periodicidade === 'MANUAL') {
                response.status(200).json({
                    executando: true,
                    periodicidade: ' ',
                });
                return;
            }

            if (
                periodicidade === 'SEMANAL'
                || periodicidade === '1MES'
                || periodicidade === '2MESES'
            ) {
                const { data_proxima_atualizacao: dataProximaAtualizacao } = execucao;

                const executando = !!dataProximaAtualizacao
                    && !moment().isAfter(moment(dataProximaAtualizacao), 'day');

                response.status(200).json({
                    executando,
                    periodicidade,
                });
            }
        } else {
            response.status(200).json({
                executando: false,
                periodicidade: ' ',
            });
        }
    });
};

export default {};
