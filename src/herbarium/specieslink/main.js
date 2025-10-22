import moment from 'moment';

import {
    selectTemExecucaoServico,
    insereExecucaoSpeciesLink,
    selectEstaExecutandoServico,
    atualizaNomeArquivoSpeciesLink,
    atualizaTabelaConfiguracao,
} from '../herbariumdatabase';
import { getHoraAtual } from '../log';
import { preparaExecucao } from '../main';

/**
 * A função agendaComparacaoSpeciesLink(), faz um select verificando se tem o serviço do SpeciesLink
 * na tabela de configuração. Se o resultado dessa busca for zero, ou seja, não
 * tem nada insere um dado na tabela, caso contrário eu verifico significa
 * que tem um registro no banco de dados. Então eu pego esse registro no BD,
 * e verifico se o valor da coluna hora_fim é diferente de nulo e EXECUTANDO.
 * Se essa condição for verdade, significa que o processo já acabou, então posso
 * atualiza com os novos valores. Caso contrário está executando.
 */
export function agendaComparacaoSpeciesLink(nomeArquivo, response) {
    selectTemExecucaoServico('SPECIESLINK').then(execucaoSpeciesLink => {
        if (execucaoSpeciesLink.length === 0) {
            insereExecucaoSpeciesLink(getHoraAtual(), null, nomeArquivo, "SPECIESLINK");
            response.status(200).json(JSON.parse(' { "result": "success" } '));
        } else {
            const horaFim = execucaoSpeciesLink[0].dataValues.hora_fim;
            const { id } = execucaoSpeciesLink[0].dataValues;
            if ((horaFim !== null) && (horaFim !== 'EXECUTANDO')) {
                atualizaNomeArquivoSpeciesLink(id, getHoraAtual(), nomeArquivo);
                response.status(200).json(JSON.parse(' { "result": "success" } '));
            } else {
                response.status(200).json(JSON.parse(' { "result": "failed" } '));
            }
        }
    });
}

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
 * do SpeexisteExecucaoSpeciesLink na tabela de configuração.
 */
function verificaRequisicoesAgendado(existeExecucaoSpeciesLink) {
    let agendamento = -1;
    if (existeExecucaoSpeciesLink[0].periodicidade === 'SEMANAL') {
        agendamento = moment().isoWeekday() + 7;
    } else if (existeExecucaoSpeciesLink[0].periodicidade === '1MES') {
        agendamento = moment().isoWeekday() + 30;
    } else if (existeExecucaoSpeciesLink[0].periodicidade === '2MESES') {
        agendamento = moment().isoWeekday() + 60;
    }
    if (moment().format('DD/MM/YYYY') === existeExecucaoSpeciesLink[0].data_proxima_atualizacao) {
        if (moment().format('HH') === '00') {
            preparaExecucao(existeExecucaoSpeciesLink[0], 2).then(() => {
                atualizaTabelaConfiguracao('SPECIESLINK', existeExecucaoSpeciesLink[0].id, getHoraAtual(), null, existeExecucaoSpeciesLink[0].periodicidade, moment().day(agendamento)
                    .format('DD/MM/YYYY'));
            });
        }
    }
}

/**
 * A função daemonSpeciesLink(), executa de um em um minuto,
 * e faz uma consulta na tabela de configuração, verificando se
 * é necessário realizar a comparação. Se é retornado alguma resultado
 * verifico se a periodicidade foi definida como manual ou não. Se foi
 * definida como manual significa que devo executar imediatamente,
 * caso seja um valor diferente disso, eu verifico qual a periodicidade.
 */
export function daemonSpeciesLink() {
    setInterval(() => {
        selectEstaExecutandoServico('SPECIESLINK').then(existeExecucaoSpeciesLink => {
            if (existeExecucaoSpeciesLink.length === 1) {
                if (existeExecucaoSpeciesLink[0].periodicidade === 'MANUAL') {
                    preparaExecucao(existeExecucaoSpeciesLink[0], 'SPECIESLINK');
                } else {
                    verificaRequisicoesAgendado(existeExecucaoSpeciesLink);
                }
            }
        });
    }, 60000);
}

export default {};
