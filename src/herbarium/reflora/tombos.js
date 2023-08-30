/* Evita o warning de excendo o tamanho da linha */
/* eslint-disable max-len */
import Q from 'q';
import throttledQueue from 'throttled-queue';
import {
    ehIgualFamilia,
    ehIgualGenero,
    ehIgualEspecie,
    ehIgualVariedade,
    existeAlteracaoSugerida,
    ehIgualSubespecie,
} from '../comparainformacao';
import {
    processaRespostaReflora,
    temResultadoRespostaReflora,
} from './reflora';
import {
    selectUmaInformacaoReflora,
    selectNroTomboNumBarra,
    selectTombo,
    atualizaJaComparouTabelaReflora,
    insereAlteracaoSugerida,
    selectExisteServicoUsuario,
    insereIdentificadorUsuario,
} from '../herbariumdatabase';

/**
 * A função fazComparacaoInformacao, é comparado informações do banco de dados com as que
 * estão no Reflora. As informações a serem comparadas são: família, gênero,
 * espécie, subespécie e variedade. Depois de comparar cada uma dessas informações
 * quando encontrado divergência é adicionado em um JSON. Após realizar todas as comparações
 * ele procurar na tabela de alterações e verifica se encontra um JSON parecido com o
 * que está no banco de dados, se for encontrado um JSON igual não é adicionado,
 * caso não seja encontrado é adicionado um novo registro na tabela de alterações.
 * Além disso, alguns detalhes que vale a pena ressaltar é que não é comparado
 * informação da subfamília, isso porque no JSON vindo do Reflora não é retornado
 * informação de subfamília. Foram vistos outros sete herbários (UNOP, HUCP, HUEM,
 * DVPR, MBM, UNIP, HUFU) e também não retornam esse tipo de informação.
 * Uma última coisa que vale a pena ressaltar é que o script feito pela Elaine para gerar o
 * DarwinCore, não é feito consultas ao banco de dados referente a subfamília.
 * @param {*} nroTombo, é o número do tombo para serem pesquisadas informações no banco de dados.
 * @param {*} codBarra, é o código de barra relacionado ao tombo do HCF a qual será gerado o JSON
 * de alteração.
 * @param {*} informacaoReflora, informação do tombo que irá ser comparado com as presentes no banco
 * de dados.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
export async function geraJsonAlteracao(nroTombo, codBarra, informacaoReflora) {
    const promessa = Q.defer();
    selectTombo(nroTombo).then(async tomboBd => {
        if (tomboBd.length === 0) {
            promessa.resolve();
        }
        let alteracaoInformacao = '{';
        const processaInformacaoBd = tomboBd[0].dataValues;
        // família
        if (processaInformacaoBd.familia_id !== null) {
            await ehIgualFamilia(processaInformacaoBd.familia_id, informacaoReflora.family).then(familia => {
                if (familia !== -1) {
                    alteracaoInformacao += `"familia_nome": "${familia}", `;
                }
            });
        }
        // gênero
        if (processaInformacaoBd.genero_id !== null) {
            await ehIgualGenero(processaInformacaoBd.genero_id, informacaoReflora.genus).then(genero => {
                if (genero !== -1) {
                    alteracaoInformacao += `"genero_nome": "${genero}", `;
                }
            });
        }
        // espécie
        if (processaInformacaoBd.especie_id !== null) {
            await ehIgualEspecie(processaInformacaoBd.especie_id, informacaoReflora.specificepithet).then(especie => {
                if (especie !== -1) {
                    alteracaoInformacao += `"especie_nome": "${especie}", `;
                }
            });
        }
        if (informacaoReflora.taxonrank !== null) {
            if (informacaoReflora.taxonrank === 'SUB_ESPECIE') {
                // subespecie
                if (processaInformacaoBd.sub_especie_id !== null) {
                    await ehIgualSubespecie(processaInformacaoBd.sub_especie_id, informacaoReflora.infraespecificepithet).then(subespecie => {
                        if (subespecie !== -1) {
                            alteracaoInformacao += `"subespecie_nome": "${subespecie}", `;
                        }
                    });
                }
            } else if (informacaoReflora.taxonrank === 'VARIEDADE') {
                // variedade
                if (processaInformacaoBd.variedade_id !== null) {
                    await ehIgualVariedade(processaInformacaoBd.variedade_id, informacaoReflora.infraespecificepithet).then(variedade => {
                        if (variedade !== -1) {
                            alteracaoInformacao += `"variedade_nome": "${variedade}", `;
                        }
                    });
                }
            }
        }
        alteracaoInformacao = alteracaoInformacao.substring(0, alteracaoInformacao.lastIndexOf(','));
        alteracaoInformacao += '}';
        atualizaJaComparouTabelaReflora(codBarra);
        promessa.resolve(alteracaoInformacao);
    });
    return promessa.promise;
}

/**
 * A função getDiaIdentificacao procura na data que foi passada por parâmetro,
 * e verifica se existe um dia de identificação, caso exista a mesma é retornada,
 * caso não ache é retornado nulo.
 * @param {*} dataIdentificacao, é uma string na qual será procurado o dia de identificação.
 * @return valorDiaIdentificacao ou null, retorna o dia que foi feita a identificação caso exista,
 * caso contrário retorna nulo.
 */
export function getDiaIdentificacao(dataIdentificacao) {
    // O s. d. significa sem determinação
    if ((dataIdentificacao.length > 0) && (dataIdentificacao !== null) && (dataIdentificacao !== 's. d.')) {
        if (dataIdentificacao.indexOf('/') !== dataIdentificacao.lastIndexOf('/')) {
            const valorDiaIdentificacao = dataIdentificacao.substring(0, dataIdentificacao.indexOf('/'));
            if (valorDiaIdentificacao.length === 0) {
                return null;
            }
            if (Number.isNaN(parseInt(valorDiaIdentificacao))) {
                return null;
            }
            if (parseInt(valorDiaIdentificacao) > 0 && parseInt(valorDiaIdentificacao) < 32) {
                return parseInt(valorDiaIdentificacao);
            }
            return null;
        }
    }
    return null;
}

/**
 * A função getMesIdentificacao procura na data que foi passada por parâmetro,
 * e verifica se existe um mês de identificação, caso exista a mesma é retornada,
 * caso não ache é retornado nulo.
 * @param {*} dataIdentificacao, é uma string na qual será procurado o mês de identificação.
 * @return valorDiaIdentificacao ou null, retorna o mês que foi feita a identificação caso exista,
 * caso contrário retorna nulo.
 */
export function getMesIdentificacao(dataIdentificacao) {
    // O s. d. significa sem determinação
    if ((dataIdentificacao.length > 0) && (dataIdentificacao !== null) && (dataIdentificacao !== 's. d.')) {
        if (dataIdentificacao.indexOf('/') !== dataIdentificacao.lastIndexOf('/')) {
            const valorMesIdentificacao = dataIdentificacao.substring(dataIdentificacao.indexOf('/') + 1, dataIdentificacao.lastIndexOf('/'));
            if (valorMesIdentificacao.length === 0) {
                return null;
            }
            if (Number.isNaN(parseInt(valorMesIdentificacao))) {
                return null;
            }
            return parseInt(valorMesIdentificacao);
        }
        if (dataIdentificacao.indexOf('/') === dataIdentificacao.lastIndexOf('/')) {
            const valorMesIdentificacao = dataIdentificacao.substring(0, dataIdentificacao.lastIndexOf('/'));
            if (valorMesIdentificacao.length === 0) {
                return null;
            }
            if (Number.isNaN(parseInt(valorMesIdentificacao))) {
                return null;
            }
            if (parseInt(valorMesIdentificacao) > 0 && parseInt(valorMesIdentificacao) < 13) {
                return parseInt(valorMesIdentificacao);
            }
            return null;
        }
    }
    return null;
}

/**
 * A função getAnoIdentificacao procura na data que foi passada por parâmetro,
 * e verifica se existe um ano de identificação, caso exista a mesma é retornada,
 * caso não ache é retornado nulo.
 * @param {*} dataIdentificacao, é uma string na qual será procurado o ano de identificação.
 * @return valorDiaIdentificacao ou null, retorna o ano que foi feita a identificação caso exista,
 * caso contrário retorna nulo.
 */
export function getAnoIdentificacao(dataIdentificacao) {
    // O s. d. significa sem determinação
    if ((dataIdentificacao.length > 0) && (dataIdentificacao !== null) && (dataIdentificacao !== 's. d.')) {
        const valorAnoIdentificacao = dataIdentificacao.substring(dataIdentificacao.lastIndexOf('/') + 1, dataIdentificacao.length);
        if (valorAnoIdentificacao.length === 0) {
            return null;
        }
        if (Number.isNaN(parseInt(valorAnoIdentificacao))) {
            return null;
        }
        if (parseInt(valorAnoIdentificacao) > 0) {
            return parseInt(valorAnoIdentificacao);
        }
        return null;
    }
    return null;
}

/**
 * A função fazComparacaoInformacao, primeiramente verifica se tem informações
 * do reflora esperado. Se tem as informações esperada eu pego o número de tombo
 * equivalente aquele tombo de código de barra, e com esse valor de número de tombo
 * eu consigo pegar informações relacionadas a esse tombo. Comparando as informações
 * vindas do Reflora com as presentes no banco de dados, eu verifico se me gerou
 * um JSON. Quando me retorna JSON, eu verifico se existe essa alteração no banco
 * de dados se não existe eu insiro ela no banco de dados.
 * @param {*} codBarra, é o código de barra relacionado ao tombo do HCF.
 * @param {*} informacaoReflora, informação do tombo que está exposta do Reflora.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
export function fazComparacaoInformacao(codBarra, informacaoReflora) {
    const promessa = Q.defer();
    if (temResultadoRespostaReflora(informacaoReflora)) {
        selectNroTomboNumBarra(codBarra).then(nroTombo => {
            if (nroTombo.length > 0) {
                const getNroTombo = nroTombo[0].dataValues.tombo_hcf;
                const getInformacaoReflora = informacaoReflora.result[0];
                geraJsonAlteracao(getNroTombo, codBarra, getInformacaoReflora).then(alteracao => {
                    if (alteracao.length > 2) {
                        existeAlteracaoSugerida(getNroTombo, alteracao).then(existe => {
                            if (!existe) {
                                const nomeIdentificador = getInformacaoReflora.identifiedby;
                                selectExisteServicoUsuario(nomeIdentificador).then(listaUsuario => {
                                    if (listaUsuario.length === 0) {
                                        insereIdentificadorUsuario(nomeIdentificador).then(idUsuario => {
                                            const diaIdentificacao = getDiaIdentificacao(getInformacaoReflora.dateidentified);
                                            const mesIdentificacao = getMesIdentificacao(getInformacaoReflora.dateidentified);
                                            const anoIdentificacao = getAnoIdentificacao(getInformacaoReflora.dateidentified);
                                            insereAlteracaoSugerida(idUsuario, 'ESPERANDO', getNroTombo, alteracao, diaIdentificacao, mesIdentificacao, anoIdentificacao);
                                            // eslint-disable-next-line no-console
                                            console.log(getInformacaoReflora.identifiedby);
                                            // eslint-disable-next-line no-console
                                            console.log(getInformacaoReflora.dateidentified);
                                        });
                                    } else {
                                        const diaIdentificacao = getDiaIdentificacao(getInformacaoReflora.dateidentified);
                                        const mesIdentificacao = getMesIdentificacao(getInformacaoReflora.dateidentified);
                                        const anoIdentificacao = getAnoIdentificacao(getInformacaoReflora.dateidentified);
                                        const { id } = listaUsuario[0].dataValues;
                                        insereAlteracaoSugerida(id, 'ESPERANDO', getNroTombo, alteracao, diaIdentificacao, mesIdentificacao, anoIdentificacao);
                                        // eslint-disable-next-line no-console
                                        console.log(getInformacaoReflora.identifiedby);
                                        // eslint-disable-next-line no-console
                                        console.log(getInformacaoReflora.dateidentified);
                                    }
                                });
                                promessa.resolve();
                            }
                            promessa.resolve();
                        });
                    }
                    promessa.resolve();
                });
            }
        });
    } else {
        promessa.resolve();
    }
    return promessa.promise;
}

/**
 * A função fazComparacaoTombo, faz um select na tabela do reflora verificando
 * se tem algum tombo que já foi comparado ou não. Se o resultado dessa requisição
 * é maior que zero, então eu pego o json e começo a realizar as comparações, e depois
 * marco que esse json já foi comparado. Após isso, eu chamo novamente essa função
 * e faço isso até com que seja comparado todos os json.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a recursão.
 */
export function fazComparacaoTombo() {
    const promessa = Q.defer();
    const throttle = throttledQueue(1, 2000);
    selectUmaInformacaoReflora().then(informacaoReflora => {
        if (informacaoReflora.length === 0) {
            // eslint-disable-next-line no-console
            console.log('akc');
            promessa.resolve(true);
        } else {
            // eslint-disable-next-line no-console
            console.log('akd');
            const getCodBarra = informacaoReflora[0].dataValues.cod_barra;
            const getInformacaoReflora = processaRespostaReflora(informacaoReflora[0].dataValues.tombo_json);
            throttle(() => {
                fazComparacaoInformacao(getCodBarra, getInformacaoReflora).then(() => {
                    atualizaJaComparouTabelaReflora(getCodBarra);
                    promessa.resolve(fazComparacaoTombo());
                });
            });
        }
    });
    return promessa.promise;
}
