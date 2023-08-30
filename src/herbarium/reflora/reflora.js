/* eslint-disable max-len */
import request from 'request';
import Q from 'q';
import throttledQueue from 'throttled-queue';
import { escreveLOG } from '../log';
import {
    selectUmCodBarra,
    atualizaTabelaReflora,
    decrementaTabelaReflora,
} from '../herbariumdatabase';

/**
 * A função processaRespostaReflora, converte o resultado da resposta do Reflora
 * que é recebido por parâmetro que é uma string para o formato JSON.
 * Nessa conversão aparece os acentos presentes nas palavras.
 * @param {*} respostaReflora, resposta com informações do tombo presente no Reflora.
 * @return JSON, retorna a informação do Reflora no formato JSON.
 */
export function processaRespostaReflora(respostaReflora) {
    return JSON.parse(respostaReflora);
}

/**
 * A função temResultadoRespostaReflora, verifica três coisas:
 * se tem resultado na chave 'result' retornado pela requisição do Reflora,
 * se a informação dessa chave é nula e o parâmetro que contêm essa chave não é nulo.
 * Se não for nenhum dessas condições representa que tem resultado e é retornado
 * true, caso seja uma dessas é false.
 * @param {*} respostaReflora, resposta com informações do tombo presente no Reflora.
 * @return true ou false, retorna true caso tenha resultado, e caso não tenha resultado retorna false.
 */
export function temResultadoRespostaReflora(respostaReflora) {
    if ((respostaReflora === null) || (respostaReflora.result === null) || (respostaReflora.result.length === 0)) {
        return false;
    }
    return true;
}

/**
 * A função jsonTemErro, verifica se no JSON retornado pelo
 * Reflora é um JSON de erro, que percebemos que algumas vezes nos
 * retornava. Então se o JSON retornado ao igual ao retornado JSON, retornamos
 * true, ou seja, existe erro, caso contrário é retornado false.
 * @param {*} respostaReflora, resposta com informações do tombo presente no Reflora.
 * @return true ou false, retorna true caso seja o JSON com erro, e caso não seja retorna false.
 */
function jsonTemErro(respostaReflora) {
    if (respostaReflora === '{"erro":"500","message":"Oops, something\'s gone wrong in server!"}') {
        return true;
    }
    return false;
}

/**
 * A função salvaRespostaReflora, verifica se o que foi retornado é uma mensagem de erro, e
 * se for é adicionado no log, juntamente com o código de barra e o erro. Caso não seja essa mensagem
 * é verifica se o JSON é o JSON de erro ou não. Se for o JSON com erro, eu guardo no banco de dados
 * e o ja_requisitou fica igual a zero (O ja_requisitou quando é false significa que não foi feita a requisição,
 * caso seja true é que foi feito a requisição). Caso seja o JSON esperado, eu guardo ele no banco de
 * dados e valor da coluna ja_requisitou fica igual a true.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito as mensagens de erros, caso ela ocorra.
 * @param {*} codBarra, é o código de barra do tombo que foi feito a requisição no Reflora.
 * @param {*} error, é o erro que pode ser retornado pela tentativa de requisição.
 * @param {*} response, é a resposta que pode ser retornado pela tentativa de requisição.
 * @param {*} body, é o corpo que pode ser retornado pela tentativa de requisição.
 */
export function salvaRespostaReflora(nomeArquivo, codBarra, error, response, body) {
    // if ((error !== null) && (error.code !== null)) {
    if (!error && response.statusCode === 200 && error === null) {
        if (jsonTemErro(body)) {
            atualizaTabelaReflora(codBarra, body, false);
        } else {
            atualizaTabelaReflora(codBarra, body, true);
        }
    } else {
        escreveLOG(`reflora/${nomeArquivo}`, `Falha na requisição do código de barra {${codBarra}} que foi ${error}`);
        decrementaTabelaReflora(codBarra);
    }
    // }
}

/**
 * A função fazRequisicaoReflora, faz um select no banco de dados, em que cada select feito
 * retorna apenas um valor de código de barra, e com esse código de barra
 * é feito a requisição ao Reflora para obter as informações daquele código de barra.
 * Com as informações será verificado se as informações serão salvas ou não no banco
 * de dados.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito as mensagens de erros, caso ela ocorra.
 * quando acabar de realizar as requisições de todas as informações do Reflora.
 */
export function fazRequisicaoReflora(nomeArquivo) {
    const promessa = Q.defer();
    const throttle = throttledQueue(1, 1500);
    selectUmCodBarra().then(codBarra => {
        if (codBarra.length === 0) {
            promessa.resolve(true);
        } else {
            const getCodBarra = codBarra[0].dataValues.cod_barra;
            throttle(() => {
                request(`http://servicos.jbrj.gov.br/v2/herbarium/${getCodBarra}`, { timeout: 4000 }, (error, response, body) => {
                    salvaRespostaReflora(nomeArquivo, getCodBarra, error, response, body);
                    promessa.resolve(fazRequisicaoReflora(nomeArquivo));
                });
            });
        }
    });
    return promessa.promise;
}

export default {

};
