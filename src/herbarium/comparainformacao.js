/* Evita o warning de excendo o tamanho da linha */
/* eslint-disable max-len */
import Q from 'q';
import {
    selectInformacaoTomboJson,
    selectFamilia,
    selectGenero,
    selectEspecie,
    selectVariedade,
    selectSubespecie,
    selectInformacaoTomboJsonEsperando,
} from './herbariumdatabase';

/**
 * A função valorEhIndefinido, verifica se o valor que foi passado
 * por parâmetro é um valor indefinido ou não. Caso seja indefinido é retornado
 * true, se não seja indefindo é false.
 * @param {*} valor, é o valor que será verificado se ele é indefinido ou não.
 * @return true ou false, true caso o valor é indefinido, false caso o valor não é indefinido.
 */
function valorEhIndefinido(valor) {
    if (valor === undefined) {
        return true;
    }
    return false;
}

/**
 * A função valorEhNulo, verifica se o valor que foi passado por parâmetro
 * é um valor nulo ou não. Caso seja nulo é retornado true, se não é nulo é false.
 * @param {*} valor, é o valor que será verificado se ele é nulo ou não.
 * @return true ou false, true caso o valor é nulo, false caso o valor não é nulo.
 */
function valorEhNulo(valor) {
    /* Afim de evitar problemas na conversão do parseInt */
    if (valor === null) {
        return true;
    }
    return false;
}

/**
 * A função processaString, pega o valor que foi recebido por parâmetro
 * e processa ela, o processamento é basicamente remover apenas os espaços
 * vazios.
 * @param {*} valor, é o valor em que será feito o processo de remover espaços.
 * @return string, que é a string processada, ou seja, a string sem espaços e com caracteres minuscúlos.
 */
function processaString(valor) {
    return valor.replace(/\s/g, '');
}

/**
 * A função ehNuloEhIndefinidoEhVazio, verificar se a informação é nula, indefinido ou
 * se a string não é vazia.
 * @param {*} informacao, é o valor em que será verificado se a informação é nula, indefinida
 * ou se é vazia.
 * @return true ou false, true caso seja nulo, indefinido ou vazia, e caso contrário
 * false.
 */
function ehNuloEhIndefinidoEhVazio(informacao) {
    if (valorEhNulo(informacao) || valorEhIndefinido(informacao) || (informacao.length === 0)) {
        return true;
    }
    return false;
}

/**
 * A função ehIgualFamilia, faz um select no banco de dados para obter informações
 * da família, e com essa informação da família é comparada com a informação da
 * que veio na resposta da requisição do Herbário Virtual. Porém, antes chegar
 * no processo de comparação é verificado se existe a família no banco de dados,
 * se não existir não é comparado nada. Se existir resultado, é verificado
 * se o valor tanto retornado pelo Herbário Virtual, quanto o presente
 * no banco de dados são indefinido ou não, se for indefinido não é comparado.
 * Também não irá ser comparado se o valor do banco de dados, ou retornado
 * pelo Herbário Virtual, se os valores forem nulos. Por fim,
 * se passarem por todas essas condições, iremos processar os dois valores
 * (ou seja, remover espaços vazios e caracteres minuscúlos), e depois
 * de processar iremos comparar. Se for diferente esses valores iremos
 * retornar para que o mesmo possa ser adicionado no JSON, e caso contrário
 * não será adicionado.
 * @param {*} idFamilia, é o identificador da família presente na tabela de tombos, na qual é
 * necessário para se obter o nome da família.
 * @param {*} nomeFamiliaHerbarioVirtual, é o nome da família que está presente no Herbário Virtual.
 * @return string, que pode ser -1 ou o nome da família que está presente no Herbário Virtual.
 */
export function ehIgualFamilia(idFamilia, nomeFamiliaHerbarioVirtual) {
    const promessa = Q.defer();
    selectFamilia(idFamilia).then(resultadoFamiliaBd => {
        if (resultadoFamiliaBd.length === 0) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const nomeFamiliaBd = resultadoFamiliaBd[0].dataValues.nome;
        if (ehNuloEhIndefinidoEhVazio(nomeFamiliaBd) && !ehNuloEhIndefinidoEhVazio(nomeFamiliaHerbarioVirtual)) {
            promessa.resolve(nomeFamiliaHerbarioVirtual);
            return promessa.promise;
        } if (!ehNuloEhIndefinidoEhVazio(nomeFamiliaBd) && ehNuloEhIndefinidoEhVazio(nomeFamiliaHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        if (ehNuloEhIndefinidoEhVazio(nomeFamiliaBd) && ehNuloEhIndefinidoEhVazio(nomeFamiliaHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const processaNomeFamiliaBD = processaString(nomeFamiliaBd);
        const processaNomeFamiliaReflora = processaString(nomeFamiliaHerbarioVirtual);
        if (processaNomeFamiliaBD === processaNomeFamiliaReflora) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        promessa.resolve(nomeFamiliaHerbarioVirtual);
        return promessa.promise;
    });
    return promessa.promise;
}

/**
 * A função ehIgualGenero, faz um select no banco de dados para obter informações
 * da gênero, e com essa informação da gênero é comparada com a informação da
 * que veio na resposta da requisição do Herbário Virtual. Porém, antes chegar
 * no processo de comparação é verificado se existe a gênero no banco de dados,
 * se não existir não é comparado nada. Se existir resultado, é verificado
 * se o valor tanto retornado pelo Herbário Virtual, quanto o presente
 * no banco de dados são indefinido ou não, se for indefinido não é comparado.
 * Também não irá ser comparado se o valor do banco de dados, ou retornado
 * pelo Herbário Virtual, se os valores forem nulos. Por fim,
 * se passarem por todas essas condições, iremos processar os dois valores
 * (ou seja, remover espaços vazios e caracteres minuscúlos), e depois
 * de processar iremos comparar. Se for diferente esses valores iremos
 * retornar para que o mesmo possa ser adicionado no JSON, e caso contrário
 * não será adicionado.
 * @param {*} idGenero, é o identificador de gênero presente na tabela de tombos, na qual é
 * necessário para se obter o nome do gênero.
 * @param {*} nomeGeneroHerbarioVirtual, é o nome do gênero que está presente no Herbário Virtual.
 * @return string, que pode ser -1 ou o nome do gênero que está presente no Herbário Virtual.
 */
export function ehIgualGenero(idGenero, nomeGeneroHerbarioVirtual) {
    const promessa = Q.defer();
    selectGenero(idGenero).then(resultadoGeneroBd => {
        if (resultadoGeneroBd.length === 0) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const nomeGeneroBd = resultadoGeneroBd[0].dataValues.nome;
        if (ehNuloEhIndefinidoEhVazio(nomeGeneroBd) && !ehNuloEhIndefinidoEhVazio(nomeGeneroHerbarioVirtual)) {
            promessa.resolve(nomeGeneroHerbarioVirtual);
            return promessa.promise;
        } if (!ehNuloEhIndefinidoEhVazio(nomeGeneroBd) && ehNuloEhIndefinidoEhVazio(nomeGeneroHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        if (ehNuloEhIndefinidoEhVazio(nomeGeneroBd) && ehNuloEhIndefinidoEhVazio(nomeGeneroHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const processaNomeGeneroBd = processaString(nomeGeneroBd);
        const processaNomeGeneroReflora = processaString(nomeGeneroHerbarioVirtual);
        if (processaNomeGeneroBd === processaNomeGeneroReflora) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        promessa.resolve(nomeGeneroHerbarioVirtual);
        return promessa.promise;
    });
    return promessa.promise;
}

/**
 * A função ehIgualEspecie, faz um select no banco de dados para obter informações
 * da espécie, e com essa informação da espécie é comparada com a informação da
 * que veio na resposta da requisição do Herbário Virtual. Porém, antes chegar
 * no processo de comparação é verificado se existe a espécie no banco de dados,
 * se não existir não é comparado nada. Se existir resultado, é verificado
 * se o valor tanto retornado pelo Herbário Virtual, quanto o presente
 * no banco de dados são indefinido ou não, se for indefinido não é comparado.
 * Também não irá ser comparado se o valor do banco de dados, ou retornado
 * pelo Herbário Virtual, se os valores forem nulos. Por fim,
 * se passarem por todas essas condições, iremos processar os dois valores
 * (ou seja, remover espaços vazios e caracteres minuscúlos), e depois
 * de processar iremos comparar. Se for diferente esses valores iremos
 * retornar para que o mesmo possa ser adicionado no JSON, e caso contrário
 * não será adicionado.
 * @param {*} idEspecie, é o identificador de espécie presente na tabela de tombos, na qual é
 * necessário para se obter o nome do espécie.
 * @param {*} nomeEspecieHerbarioVirtual, é o nome do espécie que está presente no Herbário Virtual.
 * @return string, que pode ser -1 ou o nome do espécie que está presente no Herbário Virtual.
 */
export function ehIgualEspecie(idEspecie, nomeEspecieHerbarioVirtual) {
    const promessa = Q.defer();
    selectEspecie(idEspecie).then(resultadoEspecieBd => {
        if (resultadoEspecieBd.length === 0) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const nomeEspecieBd = resultadoEspecieBd[0].dataValues.nome;
        if (ehNuloEhIndefinidoEhVazio(nomeEspecieBd) && !ehNuloEhIndefinidoEhVazio(nomeEspecieHerbarioVirtual)) {
            promessa.resolve(nomeEspecieHerbarioVirtual);
            return promessa.promise;
        } if (!ehNuloEhIndefinidoEhVazio(nomeEspecieBd) && ehNuloEhIndefinidoEhVazio(nomeEspecieHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        if (ehNuloEhIndefinidoEhVazio(nomeEspecieBd) && ehNuloEhIndefinidoEhVazio(nomeEspecieHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const processaNomeEspecieBd = processaString(nomeEspecieBd);
        const processaNomeEspecieReflora = processaString(nomeEspecieHerbarioVirtual);
        if (processaNomeEspecieBd === processaNomeEspecieReflora) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        promessa.resolve(nomeEspecieHerbarioVirtual);
        return promessa.promise;
    });
    return promessa.promise;
}

/**
 * A função ehIgualSubespecie, faz um select no banco de dados para obter informações
 * da subespécie, e com essa informação da subespécie é comparada com a informação da
 * que veio na resposta da requisição do Herbário Virtual. Porém, antes chegar
 * no processo de comparação é verificado se existe a subespécie no banco de dados,
 * se não existir não é comparado nada. Se existir resultado, é verificado
 * se o valor tanto retornado pelo Herbário Virtual, quanto o presente
 * no banco de dados são indefinido ou não, se for indefinido não é comparado.
 * Também não irá ser comparado se o valor do banco de dados, ou retornado
 * pelo Herbário Virtual, se os valores forem nulos. Por fim,
 * se passarem por todas essas condições, iremos processar os dois valores
 * (ou seja, remover espaços vazios e caracteres minuscúlos), e depois
 * de processar iremos comparar. Se for diferente esses valores iremos
 * retornar para que o mesmo possa ser adicionado no JSON, e caso contrário
 * não será adicionado.
 * @param {*} idSubespecie, é o identificador de subespécie presente na tabela de tombos, na qual é
 * necessário para se obter o nome do subespécie.
 * @param {*} nomeSubespecieHerbarioVirtual, é o nome do subespécie que está presente no Herbário Virtual.
 * @return string, que pode ser -1 ou o nome do subespécie que está presente no Herbário Virtual.
 */
export function ehIgualSubespecie(idSubespecie, nomeSubespecieHerbarioVirtual) {
    const promessa = Q.defer();
    selectSubespecie(idSubespecie).then(resultadoSubespecieBd => {
        if (resultadoSubespecieBd.length === 0) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const nomeSubespecieBd = resultadoSubespecieBd[0].dataValues.nome;
        if (ehNuloEhIndefinidoEhVazio(nomeSubespecieBd) && !ehNuloEhIndefinidoEhVazio(nomeSubespecieHerbarioVirtual)) {
            promessa.resolve(nomeSubespecieHerbarioVirtual);
            return promessa.promise;
        } if (!ehNuloEhIndefinidoEhVazio(nomeSubespecieBd) && ehNuloEhIndefinidoEhVazio(nomeSubespecieHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        if (ehNuloEhIndefinidoEhVazio(nomeSubespecieBd) && ehNuloEhIndefinidoEhVazio(nomeSubespecieHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const processaNomeSubespecieBd = processaString(nomeSubespecieBd);
        const processaNomeSubespecieHerbarioVirtual = processaString(nomeSubespecieHerbarioVirtual);
        if (processaNomeSubespecieBd === processaNomeSubespecieHerbarioVirtual) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        promessa.resolve(nomeSubespecieHerbarioVirtual);
        return promessa.promise;
    });
    return promessa.promise;
}

/**
 * A função ehIgualVariedade, faz um select no banco de dados para obter informações
 * da variedade, e com essa informação da variedade é comparada com a informação da
 * que veio na resposta da requisição do Herbário Virtual. Porém, antes chegar
 * no processo de comparação é verificado se existe a variedade no banco de dados,
 * se não existir não é comparado nada. Se existir resultado, é verificado
 * se o valor tanto retornado pelo Herbário Virtual, quanto o presente
 * no banco de dados são indefinido ou não, se for indefinido não é comparado.
 * Também não irá ser comparado se o valor do banco de dados, ou retornado
 * pelo Herbário Virtual, se os valores forem nulos. Por fim,
 * se passarem por todas essas condições, iremos processar os dois valores
 * (ou seja, remover espaços vazios e caracteres minuscúlos), e depois
 * de processar iremos comparar. Se for diferente esses valores iremos
 * retornar para que o mesmo possa ser adicionado no JSON, e caso contrário
 * não será adicionado.
 * @param {*} idVariedade, é o identificador de variedade presente na tabela de tombos, na qual é
 * necessário para se obter o nome do variedade.
 * @param {*} nomeVariedadeHerbarioVirtual, é o nome do variedade que está presente no Herbário Virtual.
 * @return string, que pode ser -1 ou o nome do variedade que está presente no Herbário Virtual.
 */
export function ehIgualVariedade(idVariedade, nomeVariedadeHerbarioVirtual) {
    const promessa = Q.defer();
    selectVariedade(idVariedade).then(resultadoVariedadeBd => {
        if (resultadoVariedadeBd.length === 0) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const nomeVariedadeBd = resultadoVariedadeBd[0].dataValues.nome;
        if (ehNuloEhIndefinidoEhVazio(nomeVariedadeBd) && !ehNuloEhIndefinidoEhVazio(nomeVariedadeHerbarioVirtual)) {
            promessa.resolve(nomeVariedadeHerbarioVirtual);
            return promessa.promise;
        } if (!ehNuloEhIndefinidoEhVazio(nomeVariedadeBd) && ehNuloEhIndefinidoEhVazio(nomeVariedadeHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        if (ehNuloEhIndefinidoEhVazio(nomeVariedadeBd) && ehNuloEhIndefinidoEhVazio(nomeVariedadeHerbarioVirtual)) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        const processaNomeVariedadeBd = processaString(nomeVariedadeBd);
        const processaNomeVariedadeReflora = processaString(nomeVariedadeHerbarioVirtual);
        if (processaNomeVariedadeBd === processaNomeVariedadeReflora) {
            promessa.resolve(-1);
            return promessa.promise;
        }
        promessa.resolve(processaNomeVariedadeReflora);
        return promessa.promise;
    });
    return promessa.promise;
}

/**
 * A função ehIgualJson, compara dois JSON o que está presente
 * no banco de dados, com o que foi gerado quando encontrado
 * informações divergentes. Se o JSON presente no banco de dados
 * é igual ao JSON gerado então é igual e é retornado true,
 * caso não seja igual é retornado false.
 * @param {*} jsonBd, JSON presente na tabela de alterações, guardando informações das alterações.
 * @param {*} jsonGerado, JSON gerado quando foi feito a comparação das informações presentes
 * no banco de dados, com os do Herbário Virtual.
 * @return true ou false, true quando os dois JSON são iguais, e false quando os dois JSON são diferentes.
 */
function ehIgualJson(jsonBd, jsonGerado) {
    if (jsonBd === jsonGerado) {
        return true;
    }
    return false;
}

/**
 * A função existeAlteracaoSugerida, faz um select na tabela de alterações verificando
 * se tem alterações que não foram aprovadas, se tem alterações que não foram aprovadas
 * retorna true (somente nesse caso o true significa que tem alterações esperando). Caso
 * todas alterações tenham sido aprovadas, eu verifico se o JSON presente no resultado
 * dessa consulta é igual ou diferente ao JSON que foi gerado a partir das comparações
 * feitas. Se for igual a um dos JSON presentes no resultado da consulta eu retorno true,
 * representando que essa alteração já foi sugerida, caso contrário retorno false.
 * @param {*} nroTombo, é o número do tombo utilizado para buscar informações de alterações
 * que possam existir.
 * @param {*} jsonGerado, JSON gerado quando foi feito a comparação das informações presentes
 * no banco de dados, com os do Herbário Virtual.
 * @return true ou false, true no primeiro select é referente se tem alterações esperando, já no
 * segundo select o true quando os dois JSON são iguais, e false quando os dois JSON são diferentes.
 */
export function existeAlteracaoSugerida(nroTombo, jsonGerado) {
    const promessa = Q.defer();
    selectInformacaoTomboJsonEsperando(nroTombo).then(listaTomboJsonEsperando => {
        if (listaTomboJsonEsperando.length > 0) {
            promessa.resolve(true);
            return promessa.promise;
        }
        selectInformacaoTomboJson(nroTombo).then(listaTomboJson => {
            if (listaTomboJson.length === 0) {
                promessa.resolve(false);
                return promessa.promise;
            }
            if (valorEhNulo(listaTomboJson) || valorEhIndefinido(listaTomboJson)) {
                promessa.resolve(true);
                return promessa.promise;
            }
            for (let i = 0; i < listaTomboJson.length; i += 1) {
                const tomboJson = listaTomboJson[i].dataValues.tombo_json;
                if (ehIgualJson(jsonGerado, tomboJson)) {
                    promessa.resolve(true);
                    return promessa.promise;
                }
            }
            promessa.resolve(false);
            return promessa.promise;
        });
        return promessa.promise;
    });
    return promessa.promise;
}

// =======================================================
