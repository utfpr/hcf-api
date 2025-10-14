import Q from 'q';

import {
    verificaSeTemDadosReflora,
    verificaSeTemDadosSpecieslink,
    atualizaFimTabelaConfiguracao,
    pegaTabelaSpecieslink,
    pegaTabelaReflora,
    limpaTabelaReflora,
    limpaTabelaSpecieslink,
    insereTabelaReflora,
    insereTabelaSpecieslink,
    selectCodBarra,
} from './herbariumdatabase';
import {
    escreveLOG, leLOG, processaNomeLog, getHoraFim,
} from './log';
import { fazRequisicaoReflora } from './reflora/reflora';
import { fazComparacaoTomboReflora } from './reflora/tombos';
import { fazRequisicaoSpecieslink } from './specieslink/specieslink';
import { fazComparacaoTomboSpecieslink } from './specieslink/tombos';
import { geraListaAleatorio } from './teste';

/**
 * A função comecaAtualizacao, primeiramente pega o maior valor de código
 * de barra existente, e partir do código de barra HCF000000001 até o maior valor
 * de código de barra e insere na tabela do Reflora ou do Specieslink. Com todos os códigos carregados
 * é pego um código de barra de cada vez e faz a requisição desse código de barra e inserido
 * em uma coluna da tabela. Após, obter informações de todos os códigos de barras, é iniciado
 * a comparação, e por fim, quando acaba o processo de comparação de todos os códigos
 * barras, apaga-se essa tabela do Reflora ou do Specieslink.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito quando iniciou, terminou
 * e algum erro que acontenceu durante o processo de comparação.
 * @param {*} idServico, em que o identificador um é o serviço do Reflora e o identificador
 * dois é o serviço do species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
function comecaAtualizacao(nomeArquivo, idServico) {
    const promessa = Q.defer();
    if (idServico === 1) {
        escreveLOG(`reflora/${nomeArquivo}`, 'Inicializando a aplicação do Reflora.');
        const tabelaReflora = pegaTabelaReflora();
        selectCodBarra().then(listaCodBarra => {
            // insereTabelaReflora(tabelaReflora, listaCodBarra.slice(0, 1)).then(() => {
            insereTabelaReflora(tabelaReflora, geraListaAleatorio(listaCodBarra, 0)).then(() => {
                fazRequisicaoReflora(nomeArquivo).then(resultadoRequisicaoReflora => {
                    if (resultadoRequisicaoReflora) {
                        fazComparacaoTomboReflora().then(resultadoComparacao => {
                            if (resultadoComparacao) {
                                escreveLOG(`reflora/${nomeArquivo}`, 'O processo de comparação do Reflora acabou.');
                                limpaTabelaReflora().then(() => {
                                    promessa.resolve();
                                });
                            }
                        });
                    }
                });
            });
        });
    } else if (idServico === 2) {
        escreveLOG(`specieslink/${nomeArquivo}`, 'Inicializando a aplicação do Specieslink.');
        const tabelaSpecieslink = pegaTabelaSpecieslink();
        selectCodBarra().then(listaCodBarra => {
            // insereTabelaSpecieslink(tabelaSpecieslink, listaCodBarra.slice(0, 1)).then(() => {
            insereTabelaSpecieslink(tabelaSpecieslink, geraListaAleatorio(listaCodBarra, 0)).then(() => {
                fazRequisicaoSpecieslink(nomeArquivo).then(resultadoRequisicaoSpecieslink => {
                    if (resultadoRequisicaoSpecieslink) {
                        fazComparacaoTomboSpecieslink().then(resultadoComparacao => {
                            if (resultadoComparacao) {
                                escreveLOG(`specieslink/${nomeArquivo}`, 'O processo de comparação do SpeciesLink acabou.');
                                limpaTabelaSpecieslink().then(() => {
                                    promessa.resolve();
                                });
                            }
                        });
                    }
                });
            });
        });
    }

    return promessa.promise;
}

/**
 * A função ehPossivelFazerComparacao, faz uma consulta no banco de dados
 * verificando se existe a tabela do reflora ou specieslink. Se essa tabela não existe
 * pode ser executado, caso contrário não pode ser executado.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito quando iniciou, terminou
 * e algum erro que acontenceu durante o processo de comparação.
 * * @param {*} idServico, em que o identificador um é o serviço do Reflora e o identificador
 * dois é o serviço do species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de verificar se existe uma tabela do reflora.
 */
function ehPossivelFazerComparacao(nomeArquivo, idServico) {
    const promessa = Q.defer();
    if (idServico === 1) {
        verificaSeTemDadosReflora().then(existe => {
            if (existe) {
                promessa.resolve();
            } else {
                comecaAtualizacao(nomeArquivo, 1).then(() => {
                    promessa.resolve();
                });
            }
        });
    } else if (idServico === 2) {
        verificaSeTemDadosSpecieslink().then(existe => {
            if (existe) {
                promessa.resolve();
            } else {
                comecaAtualizacao(nomeArquivo, 2).then(() => {
                    promessa.resolve();
                });
            }
        });
    }

    return promessa.promise;
}

/**
 * A função preparaExecucao, pega o resultado da existência da execução
 * de Reflora ou Specieslink na tabela de configuração e pega a hora de início que está
 * nesse resultado e transforma ele para que ele possa ser nome de arquivo.
 * Assim, ele verificar se é possível fazer a comparação do reflora, se foi
 * possível fazer, se foi feito a comparação do Reflora, ele verifica se
 * acabou mesmo o processo do Reflora, verificando se tem a mensagem desejada,
 * se sim atualiza com a hora que acabou o processo no banco de dados.
 * @param {*} existeExecucao, é o resultado da existência da execução
 * do Reflora ou Specieslink na tabela de configuração.
 * @param {*} idServico, em que o identificador um é o serviço do Reflora e o identificador
 * dois é o serviço do species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
// eslint-disable-next-line import/prefer-default-export
export function preparaExecucao(existeExecucao, idServico) {
    const promessa = Q.defer();
    const nomeArquivo = processaNomeLog(existeExecucao.dataValues.hora_inicio);
    ehPossivelFazerComparacao(nomeArquivo, idServico).then(() => {
        const { id } = existeExecucao.dataValues;
        let conteudoLOG;
        if (idServico === "REFLORA") {
            conteudoLOG = leLOG(`reflora/${nomeArquivo}`);
        } else if (idServico === "SPECIESLINK") {
            conteudoLOG = leLOG(`specieslink/${nomeArquivo}`);
        }
        if (conteudoLOG.includes('O processo de comparação do Reflora acabou.') || conteudoLOG.includes('O processo de comparação do SpeciesLink acabou.')) {
            const horaFim = getHoraFim(conteudoLOG);
            atualizaFimTabelaConfiguracao(id, horaFim);
            promessa.resolve();
        }
    });
    return promessa.promise;
}
