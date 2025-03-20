/* eslint-disable max-len */
import fs from 'fs';

import {
    selectTemExecucaoServico,
    insereExecucaoSpeciesLink,
    selectEstaExecutandoServico,
    atualizaNomeArquivoSpeciesLink,
    atualizaHoraFimSpeciesLink,
} from '../herbariumdatabase';
import { getHoraAtual, escreveLOG, processaNomeLog } from '../log';
import { geraListaAleatorio } from '../teste';
import { processaArquivo } from './arquivo';
import { realizaComparacao } from './specieslink';

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
    selectTemExecucaoServico(2).then(execucaoSpeciesLink => {
        if (execucaoSpeciesLink.length === 0) {
            insereExecucaoSpeciesLink(getHoraAtual(), null, nomeArquivo, 2);
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
 * A função daemonSpeciesLink(), executa de um em um minuto,
 * e faz uma consulta na tabela de configuração, verificando se
 * é necessário realizar a comparação. Se é retornado alguma resultado
 * verifico se a periodicidade foi definida como manual ou não. Se foi
 * definida como manual significa que devo executar imediatamente,
 * caso seja um valor diferente disso, eu verifico qual a periodicidade.
 */
export function daemonSpeciesLink() {
    setInterval(() => {
        selectEstaExecutandoServico(1).then(existeExecucaoReflora => {
            if (existeExecucaoReflora.length === 1) {
                if (existeExecucaoReflora[0].periodicidade === 'MANUAL') {
                    preparaExecucaoReflora(existeExecucaoReflora[0]);
                } else {
                    verificaRequisicoesAgendado(existeExecucaoReflora);
                }
            }
        });
    }, 7200000);
}

export default {};
