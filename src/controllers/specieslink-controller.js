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
 * onde o horário de fim é nulo e o serviço é SpeciesLink. Se o resultado dessa consulta
 * é maior que zero significa que foi retornado algum registro. Se existe algum registro no BD,
 * onde a data de fim é nula e o serviço é SpeciesLink eu verifico a periodicidade que é. Se a
 * periodicidade for manual, ele não pode nem agendar nem pedir novamente. Agora se a periodicidade
 * for semanal, mensal ou a cada dois meses, verificamos se a data atual é diferente da data de
 * próxima atualização; se for, eu atualizo com o novo valor.
 * Caso seja a mesma data, não poderá ser feito a troca.
 *
 * @param {*} request requisição vinda do front end
 * @param {*} response resposta enviada ao front end
 */
export const preparaRequisicao = (request, response) => {
    const { periodicidade } = request.query;
    const proximaAtualizacao = request.query.data_proxima_atualizacao;
    selectEstaExecutandoServico("SPECIESLINK").then(listaExecucaoSpecieslink => {
        if (listaExecucaoSpecieslink.length > 0) {
            const execucao = listaExecucaoSpecieslink[0].dataValues;
            const periodicidadeBD = execucao.periodicidade;

            if (periodicidadeBD === 'MANUAL') {
                response.status(200).json(JSON.parse(' { "result": "failed" } '));
            } else if ((periodicidadeBD === 'SEMANAL') || (periodicidadeBD === '1MES') || (periodicidadeBD === '2MESES')) {
                if (moment().format('DD/MM/YYYY') !== listaExecucaoSpecieslink[0].dataValues.data_proxima_atualizacao) {
                    const { id } = listaExecucaoSpecieslink[0].dataValues;
                    atualizaTabelaConfiguracao('SPECIESLINK', id, getHoraAtual(), null, periodicidade, proximaAtualizacao).then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                } else {
                    response.status(200).json({ result: 'failed' });
                }
            }
        } else {
            selectTemExecucaoServico('SPECIESLINK').then(execucaoSpecieslink => {
                if (execucaoSpecieslink.length === 0) {
                    insereExecucao(getHoraAtual(), null, periodicidade, proximaAtualizacao, "SPECIESLINK").then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                } else {
                    const { id } = execucaoSpecieslink[0].dataValues;
                    atualizaTabelaConfiguracao('SPECIESLINK', id, getHoraAtual(), null, periodicidade, proximaAtualizacao).then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                }
            });
        }
    });
};

/**
 * A função estaExecutando, faz um select no banco verificando se tem registros
 * de execução do SpeciesLink. Se tem execução é verificado a periodicidade.
 * Se a periodicidade é manual, eu envio um JSON informando que está executando.
 * O mesmo processo vale para uma periodicidade agendada.
 * Caso não exista execução, é retornado que não está executando.
 *
 * @param {*} request requisição vinda do front end
 * @param {*} response resposta enviada ao front end
 */
export const estaExecutando = (_, response) => {
    selectEstaExecutandoServico("SPECIESLINK").then(listaExecucaoSpecieslink => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        response.header('Access-Control-Allow-Methods', 'GET');

        if (listaExecucaoSpecieslink.length > 0) {
            const execucao = listaExecucaoSpecieslink[0].dataValues;
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
                const dataProximaAtualizacao = execucao.data_proxima_atualizacao;

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
