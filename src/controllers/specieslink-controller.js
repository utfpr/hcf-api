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
 * onde o horário de fim é nulo e o serviço é Specieslink. Se o resultado dessa consulta
 * é maior que zero significa que foi retornado algum registro. Se existe algum registro no BD,
 * onde a data de fim é nula e o serviço é Specieslink eu verifico a periodicidade que é. Se a
 * periodicidade for manual, ele não pode nem agendar nem pedir novamente. Agora se a periodicidade
 * for semanal, mensal ou a cada dois meses, verificamos se a data atual é diferente dá data de
 * próxima atualização se for eu atualizo com o novo valor, independentemente se é manual ou periódica.
 * Caso seja a mesma data não poderá ser feito a troca.
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const preparaRequisicao = (request, response) => {
    const { periodicidade } = request.query;
    const proximaAtualizacao = request.query.data_proxima_atualizacao;
    selectEstaExecutandoServico("SPECIESLINK").then(listaExecucaoSpecieslink => {
        if (listaExecucaoSpecieslink.length > 0) {
            const periodicidadeBD = listaExecucaoSpecieslink[0].dataValues.periodicidade;
            if (periodicidadeBD === 'MANUAL') {
                response.status(200).json(JSON.parse(' { "result": "failed" } '));
            } else if ((periodicidadeBD === 'SEMANAL') || (periodicidadeBD === '1MES') || (periodicidadeBD === '2MESES')) {
                if (moment().format('DD/MM/YYYY') !== listaExecucaoSpecieslink[0].dataValues.data_proxima_atualizacao) {
                    const { id } = listaExecucaoSpecieslink[0].dataValues;
                    atualizaTabelaConfiguracao('SPECIESLINK', id, getHoraAtual(), null, periodicidade, proximaAtualizacao).then(() => {
                        response.status(200).json(JSON.parse(' { "result": "success" } '));
                    });
                } else {
                    response.status(200).json(JSON.parse(' { "result": "failed" } '));
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
 * de execução do Specieslink. Se tem execução do Specieslink é verificado a periodicidade
 * se a periodicidade é manual, eu envio um JSON com informações de que está executando
 * e que a periodicidade é manual (MANUAL === execução imediata). O mesmo processo vale para
 * uma periodicidade que é agendada. Caso não seja retornando nada é retornando ao front
 * end que não está sendo executado.
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const estaExecutando = (_, response) => {
    selectEstaExecutandoServico("SPECIESLINK").then(listaExecucaoSpecieslink => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        response.header('Access-Control-Allow-Methods', 'GET');
        if (listaExecucaoSpecieslink.length > 0) {
            const { periodicidade } = listaExecucaoSpecieslink[0].dataValues;
            if (periodicidade === 'MANUAL') {
                response.status(200).json(JSON.parse(' { "executando": true, "periodicidade": " " } '));
            } else if ((periodicidade === 'SEMANAL') || (periodicidade === '1MES') || (periodicidade === '2MESES')) {
                if (moment().format('DD/MM/YYYY') !== listaExecucaoSpecieslink[0].dataValues.data_proxima_atualizacao) {
                    response.status(200).json(JSON.parse(` { "executando": false, "periodicidade": "${periodicidade}" } `));
                } else {
                    response.status(200).json(JSON.parse(` { "executando": true, "periodicidade": "${periodicidade}" } `));
                }
            }
        } else {
            response.status(200).json(JSON.parse(' { "executando": false, "periodicidade": " " } '));
        }
    });
};

export default { };
