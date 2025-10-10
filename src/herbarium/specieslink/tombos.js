/* Evita o warning de excendo o tamanho da linha */
/* eslint-disable max-len */
import Q from 'q';
import throttledQueue from 'throttled-queue';

import {
    ehIgualFamilia,
    ehIgualGenero,
    ehIgualEspecie,
    existeAlteracaoSugerida,
} from '../comparainformacao';
import {
    selectUmaInformacaoSpecieslink,
    selectNroTomboNumBarra,
    selectTombo,
    atualizaJaComparouTabelaSpecieslink,
    insereAlteracaoSugerida,
    selectExisteServicoUsuario,
    insereIdentificadorUsuario,
} from '../herbariumdatabase';
import {
    processaRespostaSpecieslink,
    temResultadoRespostaSpecieslink,
} from './specieslink';

/**
 * A função fazComparacaoInformacao, é comparado informações do banco de dados com as que
 * estão no Specieslink. As informações a serem comparadas são: família, gênero,
 * espécie, subespécie e variedade. Depois de comparar cada uma dessas informações
 * quando encontrado divergência é adicionado em um JSON. Após realizar todas as comparações
 * ele procurar na tabela de alterações e verifica se encontra um JSON parecido com o
 * que está no banco de dados, se for encontrado um JSON igual não é adicionado,
 * caso não seja encontrado é adicionado um novo registro na tabela de alterações.
 * Além disso, alguns detalhes que vale a pena ressaltar é que não é comparado
 * informação da subfamília, isso porque no JSON vindo do Specieslink não é retornado
 * informação de subfamília. Foram vistos outros sete herbários (UNOP, HUCP, HUEM,
 * DVPR, MBM, UNIP, HUFU) e também não retornam esse tipo de informação.
 * Uma última coisa que vale a pena ressaltar é que o script feito pela Elaine para gerar o
 * DarwinCore, não é feito consultas ao banco de dados referente a subfamília.
 * @param {*} nroTombo, é o número do tombo para serem pesquisadas informações no banco de dados.
 * @param {*} codBarra, é o código de barra relacionado ao tombo do HCF a qual será gerado o JSON
 * de alteração.
 * @param {*} informacaoSpecieslink, informação do tombo que irá ser comparado com as presentes no banco
 * de dados.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
export async function geraJsonAlteracao(nroTombo, codBarra, informacaoSpecieslink) {
    const promessa = Q.defer();
    selectTombo(nroTombo).then(async tomboBd => {
        if (tomboBd.length === 0) {
            promessa.resolve();
        }
        let alteracaoInformacao = '{';
        const processaInformacaoBd = tomboBd[0].dataValues;
        // família
        if (processaInformacaoBd.familia_id !== null) {
            await ehIgualFamilia(processaInformacaoBd.familia_id, informacaoSpecieslink.family).then(familia => {
                if (familia !== -1) {
                    alteracaoInformacao += `"familia_nome": "${familia}", `;
                    alteracaoInformacao += `"autor": "${informacaoSpecieslink.scientificnameauthorship}", `;
                }
            });
        }
        // gênero
        if (processaInformacaoBd.genero_id !== null) {
            await ehIgualGenero(processaInformacaoBd.genero_id, informacaoSpecieslink.genus).then(genero => {
                if (genero !== -1) {
                    alteracaoInformacao += `"genero_nome": "${genero}", `;
                    alteracaoInformacao += `"autor": "${informacaoSpecieslink.scientificnameauthorship}", `;
                }
            });
        }
        // espécie
        if (processaInformacaoBd.especie_id !== null) {
            await ehIgualEspecie(processaInformacaoBd.especie_id, informacaoSpecieslink.specificepithet).then(especie => {
                if (especie !== -1) {
                    alteracaoInformacao += `"especie_nome": "${especie}", `;
                    alteracaoInformacao += `"autor": "${informacaoSpecieslink.scientificnameauthorship}", `;
                }
            });
        }
        alteracaoInformacao = alteracaoInformacao.substring(0, alteracaoInformacao.lastIndexOf(','));
        alteracaoInformacao += '}';
        atualizaJaComparouTabelaSpecieslink(codBarra);
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
 * do Specieslink esperado. Se tem as informações esperada eu pego o número de tombo
 * equivalente aquele tombo de código de barra, e com esse valor de número de tombo
 * eu consigo pegar informações relacionadas a esse tombo. Comparando as informações
 * vindas do Specieslink com as presentes no banco de dados, eu verifico se me gerou
 * um JSON. Quando me retorna JSON, eu verifico se existe essa alteração no banco
 * de dados se não existe eu insiro ela no banco de dados.
 * @param {*} codBarra, é o código de barra relacionado ao tombo do HCF.
 * @param {*} informacaoSpecieslink, informação do tombo que está exposta do Specieslink.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
export function fazComparacaoInformacao(codBarra, informacaoSpecieslink) {
    const promessa = Q.defer();
    if (temResultadoRespostaSpecieslink(informacaoSpecieslink)) {
        selectNroTomboNumBarra(codBarra).then(nroTombo => {
            if (nroTombo.length > 0) {
                const getNroTombo = nroTombo[0].dataValues.tombo_hcf;
                const getInformacaoSpecieslink = informacaoSpecieslink.features[0].properties;
                geraJsonAlteracao(getNroTombo, codBarra, getInformacaoSpecieslink).then(alteracao => {
                    if (alteracao.length > 2) {
                        existeAlteracaoSugerida(getNroTombo, alteracao).then(existe => {
                            if (!existe) {
                                const nomeIdentificador = getInformacaoSpecieslink.identifiedby ?? '';
                                selectExisteServicoUsuario(nomeIdentificador).then(listaUsuario => {
                                    if (listaUsuario.length === 0) {
                                        insereIdentificadorUsuario(nomeIdentificador).then(idUsuario => {
                                            const diaIdentificacao = getInformacaoSpecieslink.dayidentified;
                                            const mesIdentificacao = getInformacaoSpecieslink.monthidentified;
                                            const anoIdentificacao = getInformacaoSpecieslink.yearidentified;
                                            insereAlteracaoSugerida(idUsuario, 'ESPERANDO', getNroTombo, alteracao, diaIdentificacao, mesIdentificacao, anoIdentificacao);
                                            // eslint-disable-next-line no-console
                                            console.log(getInformacaoSpecieslink.identifiedby);
                                            // eslint-disable-next-line no-console
                                            console.log(getInformacaoSpecieslink.dateidentified);
                                        });
                                    } else {
                                        const diaIdentificacao = getInformacaoSpecieslink.dayidentified;
                                        const mesIdentificacao = getInformacaoSpecieslink.monthidentified;
                                        const anoIdentificacao = getInformacaoSpecieslink.yearidentified;
                                        const { id } = listaUsuario[0].dataValues;
                                        insereAlteracaoSugerida(id, 'ESPERANDO', getNroTombo, alteracao, diaIdentificacao, mesIdentificacao, anoIdentificacao);
                                        // eslint-disable-next-line no-console
                                        console.log(getInformacaoSpecieslink.identifiedby);
                                        // eslint-disable-next-line no-console
                                        console.log(getInformacaoSpecieslink.dateidentified);
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
 * A função fazComparacaoTomboSpecieslink, faz um select na tabela do specieslink verificando
 * se tem algum tombo que já foi comparado ou não. Se o resultado dessa requisição
 * é maior que zero, então eu pego o json e começo a realizar as comparações, e depois
 * marco que esse json já foi comparado. Após isso, eu chamo novamente essa função
 * e faço isso até com que seja comparado todos os json.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a recursão.
 */
export function fazComparacaoTomboSpecieslink() {
    const promessa = Q.defer();
    const throttle = throttledQueue(1, 2000);
    selectUmaInformacaoSpecieslink().then(informacaoSpecieslink => {
        if (informacaoSpecieslink.length === 0) {
            // eslint-disable-next-line no-console
            console.log('akc');
            promessa.resolve(true);
        } else {
            // eslint-disable-next-line no-console
            console.log('akd');
            const getCodBarra = informacaoSpecieslink[0].dataValues.cod_barra;
            const getInformacaoSpecieslink = processaRespostaSpecieslink(informacaoSpecieslink[0].dataValues.tombo_json);
            throttle(() => {
                fazComparacaoInformacao(getCodBarra, getInformacaoSpecieslink).then(() => {
                    atualizaJaComparouTabelaSpecieslink(getCodBarra);
                    promessa.resolve(fazComparacaoTomboSpecieslink());
                });
            });
        }
    });
    return promessa.promise;
}
