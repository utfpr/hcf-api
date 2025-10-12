/* eslint-disable max-len */
import moment from 'moment';

import {
    selectEstaExecutandoServico,
    atualizaTabelaConfiguracao,
} from '../herbariumdatabase';
import {
    getHoraAtual,
} from '../log';
import { preparaExecucao } from '../main';
/**
 * A função verificaRequisicoesAgendado, verifica a periodicidade
 * que foi definida pelo usuário e a partir disso calcula
 * a data da próxima atualização, que será utilizado se for atualizado.
 * Depois disso, é verificado se o dia atual é igual a data próxima
 * atualização registrada no BD, se for o mesmo dia verifico se a
 * hora é meia-noite, se for executo e no final da atualização
 * pego a data que foi feita anteriormente e atualizo para a data
 * da próxima atualização.
 * @param {*} existeExecucaoReflora, é o resultado da existência da execução
 * do Reflora na tabela de configuração.
 */
function verificaRequisicoesAgendado(existeExecucaoReflora) {
    let agendamento = -1;
    if (existeExecucaoReflora[0].periodicidade === 'SEMANAL') {
        agendamento = moment().isoWeekday() + 7;
    } else if (existeExecucaoReflora[0].periodicidade === '1MES') {
        agendamento = moment().isoWeekday() + 30;
    } else if (existeExecucaoReflora[0].periodicidade === '2MESES') {
        agendamento = moment().isoWeekday() + 60;
    }
    if (moment().format('DD/MM/YYYY') === existeExecucaoReflora[0].data_proxima_atualizacao) {
        if (moment().format('HH') === '00') {
            preparaExecucao(existeExecucaoReflora[0], 1).then(() => {
                atualizaTabelaConfiguracao(1, existeExecucaoReflora[0].id, getHoraAtual(), null, existeExecucaoReflora[0].periodicidade, moment().day(agendamento)
                    .format('DD/MM/YYYY'));
            });
        }
    }
}

/**
 * A função daemonFazRequisicaoReflora, executa de um em um minuto,
 * e faz uma consulta na tabela de configuração, verificando se
 * é necessário realizar a comparação. Se é retornado alguma resultado
 * verifico se a periodicidade foi definida como manual ou não. Se foi
 * definida como manual significa que devo executar imediatamente,
 * caso seja um valor diferente disso, eu verifico qual a periodicidade.
 */
export function daemonFazRequisicaoReflora() {
    setInterval(() => {
        selectEstaExecutandoServico(1).then(existeExecucaoReflora => {
            if (existeExecucaoReflora.length === 1) {
                if (existeExecucaoReflora[0].periodicidade === 'MANUAL') {
                    preparaExecucao(existeExecucaoReflora[0], 1);
                } else {
                    verificaRequisicoesAgendado(existeExecucaoReflora);
                }
            }
        });
    }, 60000);
}

export default {};
