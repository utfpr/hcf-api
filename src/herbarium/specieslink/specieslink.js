/* eslint-disable max-len */
import Q from 'q';
import {
    selectTombo,
    insereAlteracaoSugerida,
    selectExisteServicoUsuario,
    insereIdentificadorUsuario,
} from '../herbariumdatabase';
import {
    ehIgualFamilia,
    ehIgualGenero,
    ehIgualEspecie,
    ehIgualSubespecie,
    existeAlteracaoSugerida,
} from '../comparainformacao';

/**
 * A função getDiaIdentificacao verifica se o dia que foi passado não
 * é uma string vazia ou se é um não número, e se for um desses casos
 * é nulo. Caso não seja nenhum desses retorna o valor.
 * @param {*} diaIdentificacao, é uma string na qual será verificado se está correto ou não o dia.
 * @return valorDiaIdentificacao ou null, retorna o dia que foi feita a identificação
 * caso esteja correto, caso contrário retorna nulo.
 */
export function getDiaIdentificacao(diaIdentificacao) {
    if (diaIdentificacao.length === 0) {
        return null;
    }
    const valorDiaIdentificacao = parseInt(diaIdentificacao);
    if (Number.isNaN(valorDiaIdentificacao)) {
        return null;
    }
    if (valorDiaIdentificacao > 0 && valorDiaIdentificacao < 32) {
        return valorDiaIdentificacao;
    }
    return null;
}

/**
 * A função getMesIdentificacao verifica se o mês que foi passado não
 * é uma string vazia ou se é um não número, e se for um desses casos
 * é nulo. Caso não seja nenhum desses retorna o valor.
 * @param {*} mesIdentificacao, é uma string na qual será verificado se está correto ou não o mês.
 * @return valorMesIdentificacao ou null, retorna o mês que foi feita a identificação
 * caso esteja correto, caso contrário retorna nulo.
 */
export function getMesIdentificacao(mesIdentificacao) {
    if (mesIdentificacao.length === 0) {
        return null;
    }
    const valorMesIdentificacao = parseInt(mesIdentificacao);
    if (Number.isNaN(valorMesIdentificacao)) {
        return null;
    }
    if (valorMesIdentificacao > 0 && valorMesIdentificacao < 13) {
        return valorMesIdentificacao;
    }
    return null;
}

/**
 * A função getAnoIdentificacao verifica se o ano que foi passado não
 * é uma string vazia ou se é um não número, e se for um desses casos
 * é nulo. Caso não seja nenhum desses retorna o valor.
 * @param {*} anoIdentificacao, é uma string na qual será verificado se está correto ou não o ano.
 * @return valorMesIdentificacao ou null, retorna o ano que foi feita a identificação
 * caso esteja correto, caso contrário retorna nulo.
 */
export function getAnoIdentificacao(anoIdentificacao) {
    if (anoIdentificacao.length === 0) {
        return null;
    }
    const valorAnoIdentificacao = parseInt(anoIdentificacao);
    if (Number.isNaN(valorAnoIdentificacao)) {
        return null;
    }
    if (valorAnoIdentificacao > 0) {
        return valorAnoIdentificacao;
    }
    return null;
}

/**
 * A função realizaComparacao, ela percorre a lista de conteúdo de informações
 * presentes no arquivo do species Link que foi passado por parâmetro, e de maneira
 * recursivamente, e em cada iteração que retorna um elemento da lista é feito a
 * comparação das informações. Todas as informações que forem divergentes que forem encontradas
 * serão adicionadas no JSON. Com esse JSON gerado, é verificado se esse JSON já
 * está presente na tabela de alterações, se está na tabela de alterações não será inserido,
 * caso não esteja presente é inserido essa alteração.
 * Para o pessoal do herbário submeter os dados para os species Link, é utilizado o
 * software spLinker e nele você pode escolher quais informações você deseja enviar
 * para o species Link, porém não existe a opção de enviar informações de subfamília
 * e variedade (Informações obtidas a partir do manual do software, e do README
 * disponível no software).
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito quando iniciou ou terminou
 * o processo de comparação.
 * @param {*} listaConteudoArquivo, é o conteúdo do arquivo do species Link carregado nessa lista.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando acabar de realizar a comparação de informações.
 */
export function realizaComparacao(nomeArquivo, listaConteudoArquivo) {
    const promessa = Q.defer();
    if (listaConteudoArquivo.length === 0) {
        promessa.resolve(true);
    } else {
        const conteudo = listaConteudoArquivo.pop();
        const codBarra = conteudo[3];
        selectTombo(codBarra).then(async tombo => {
            if (tombo.length === 0) {
                promessa.resolve(realizaComparacao(nomeArquivo, listaConteudoArquivo));
            } else {
                let alteracaoInformacao = '{';
                const informacoesTomboBd = tombo[0].dataValues;
                // INFORMAÇÕES DO SPECIESLINK
                const nomeFamilia = conteudo[10].replace(/"/g, '');
                const nomeGenero = conteudo[11].replace(/"/g, '');
                const nomeEspecie = conteudo[12].replace(/"/g, '');
                const nomeSubespecie = conteudo[13].replace(/"/g, '');
                const identificador = conteudo[15].replace(/"/g, '');
                const anoIdentificacao = conteudo[16].replace(/"/g, '');
                const mesIdentificacao = conteudo[17].replace(/"/g, '');
                const diaIdentificacao = conteudo[18].replace(/"/g, '');
                await ehIgualFamilia(informacoesTomboBd.familia_id, nomeFamilia).then(familia => {
                    if (familia !== -1) {
                        alteracaoInformacao += `"familia_nome": "${familia}", `;
                    }
                });
                await ehIgualGenero(informacoesTomboBd.genero_id, nomeGenero).then(genero => {
                    if (genero !== -1) {
                        alteracaoInformacao += `"genero_nome": "${genero}", `;
                    }
                });
                await ehIgualEspecie(informacoesTomboBd.especie_id, nomeEspecie).then(especie => {
                    if (especie !== -1) {
                        alteracaoInformacao += `"especie_nome": "${especie}", `;
                    }
                });
                // subespecie
                await ehIgualSubespecie(informacoesTomboBd.sub_especie_id, nomeSubespecie).then(subespecie => {
                    if (subespecie !== -1) {
                        alteracaoInformacao += `"subespecie_nome: ${subespecie}", `;
                    }
                });
                alteracaoInformacao = alteracaoInformacao.substring(0, alteracaoInformacao.lastIndexOf(','));
                alteracaoInformacao += '}';
                if (alteracaoInformacao.length > 2) {
                    existeAlteracaoSugerida(codBarra, alteracaoInformacao).then(existe => {
                        if (!existe) {
                            selectExisteServicoUsuario(identificador).then(listaUsuario => {
                                if (listaUsuario.length === 0) {
                                    insereIdentificadorUsuario(identificador).then(idUsuario => {
                                        insereAlteracaoSugerida(idUsuario, 'ESPERANDO', codBarra, alteracaoInformacao, getDiaIdentificacao(diaIdentificacao), getMesIdentificacao(mesIdentificacao), getAnoIdentificacao(anoIdentificacao));
                                        // eslint-disable-next-line no-console
                                        console.log(identificador);
                                        // eslint-disable-next-line no-console
                                        console.log(`${diaIdentificacao}/${mesIdentificacao}/${anoIdentificacao}`);
                                        promessa.resolve(realizaComparacao(nomeArquivo, listaConteudoArquivo));
                                    });
                                } else {
                                    const { id } = listaUsuario[0].dataValues;
                                    insereAlteracaoSugerida(id, 'ESPERANDO', codBarra, alteracaoInformacao, getDiaIdentificacao(diaIdentificacao), getMesIdentificacao(mesIdentificacao), getAnoIdentificacao(anoIdentificacao));
                                    // eslint-disable-next-line no-console
                                    console.log(identificador);
                                    // eslint-disable-next-line no-console
                                    console.log(`${diaIdentificacao}/${mesIdentificacao}/${anoIdentificacao}`);
                                    promessa.resolve(realizaComparacao(nomeArquivo, listaConteudoArquivo));
                                }
                            });
                        } else {
                            promessa.resolve(realizaComparacao(nomeArquivo, listaConteudoArquivo));
                        }
                    });
                } else {
                    promessa.resolve(realizaComparacao(nomeArquivo, listaConteudoArquivo));
                }
            }
        });
    }
    return promessa.promise;
}

export default {};
