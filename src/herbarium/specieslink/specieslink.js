/* eslint-disable max-len */
import Q from 'q';
import request from 'request';
import throttledQueue from 'throttled-queue';

import {
    selectUmCodBarraSpecieslink,
    atualizaTabelaSpecieslink,
    decrementaTabelaSpecieslink,
} from '../herbariumdatabase';
import { escreveLOG } from '../log';

/**
 * A função processaRespostaSpecieslink, converte o resultado da resposta do Specieslink
 * que é recebido por parâmetro que é uma string para o formato JSON.
 * Nessa conversão aparece os acentos presentes nas palavras.
 * @param {*} respostaSpecieslink, resposta com informações do tombo presente no Specieslink.
 * @return JSON, retorna a informação do Specieslink no formato JSON.
 */
export function processaRespostaSpecieslink(respostaSpecieslink) {
    return JSON.parse(respostaSpecieslink);
}

/**
 * A função temResultadoRespostaSpecieslink, verifica três coisas:
 * se tem resultado na chave 'result' retornado pela requisição do Specieslink,
 * se a informação dessa chave é nula e o parâmetro que contêm essa chave não é nulo.
 * Se não for nenhum dessas condições representa que tem resultado e é retornado
 * true, caso seja uma dessas é false.
 * @param {*} respostaSpecieslink, resposta com informações do tombo presente no Specieslink.
 * @return true ou false, retorna true caso tenha resultado, e caso não tenha resultado retorna false.
 */
export function temResultadoRespostaSpecieslink(respostaSpecieslink) {
    if (respostaSpecieslink === null || (respostaSpecieslink.features === null) || (respostaSpecieslink.features.length === 0)) {
        return false;
    }
    return true;
}

/**
 * A função jsonTemErro, verifica se no JSON retornado pelo
 * Specieslink é um JSON de erro, que percebemos que algumas vezes nos
 * retornava. Então se o JSON retornado ao igual ao retornado JSON, retornamos
 * true, ou seja, existe erro, caso contrário é retornado false.
 * @param {*} respostaSpecieslink, resposta com informações do tombo presente no Specieslink.
 * @return true ou false, retorna true caso seja o JSON com erro, e caso não seja retorna false.
 */
function jsonTemErro(respostaSpecieslink) {
    if (respostaSpecieslink === '{"erro":"500","message":"Oops, something\'s gone wrong in server!"}') {
        return true;
    }
    return false;
}

/**
 * A função salvaRespostaSpecieslink, verifica se o que foi retornado é uma mensagem de erro, e
 * se for é adicionado no log, juntamente com o código de barra e o erro. Caso não seja essa mensagem
 * é verifica se o JSON é o JSON de erro ou não. Se for o JSON com erro, eu guardo no banco de dados
 * e o ja_requisitou fica igual a zero (O ja_requisitou quando é false significa que não foi feita a requisição,
 * caso seja true é que foi feito a requisição). Caso seja o JSON esperado, eu guardo ele no banco de
 * dados e valor da coluna ja_requisitou fica igual a true.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito as mensagens de erros, caso ela ocorra.
 * @param {*} codBarra, é o código de barra do tombo que foi feito a requisição no Specieslink.
 * @param {*} error, é o erro que pode ser retornado pela tentativa de requisição.
 * @param {*} response, é a resposta que pode ser retornado pela tentativa de requisição.
 * @param {*} body, é o corpo que pode ser retornado pela tentativa de requisição.
 */
export function salvaRespostaSpecieslink(nomeArquivo, codBarra, error, response, body) {
    // if ((error !== null) && (error.code !== null)) {
    if (!error && response.statusCode === 200 && error === null) {
        if (jsonTemErro(body)) {
            atualizaTabelaSpecieslink(codBarra, body, false);
        } else {
            atualizaTabelaSpecieslink(codBarra, body, true);
        }
    } else {
        escreveLOG(`specieslink/${nomeArquivo}`, `Falha na requisição do código de barra {${codBarra}} que foi ${error}`);
        decrementaTabelaSpecieslink(codBarra);
    }
    // }
}

/**
 * A função fazRequisicaoSpecieslink, faz um select no banco de dados, em que cada select feito
 * retorna apenas um valor de código de barra, e com esse código de barra
 * é feito a requisição ao Specieslink para obter as informações daquele código de barra.
 * Com as informações será verificado se as informações serão salvas ou não no banco
 * de dados.
 * @param {*} nomeArquivo, é o nome do arquivo aonde será escrito as mensagens de erros, caso ela ocorra.
 * quando acabar de realizar as requisições de todas as informações do Specieslink.
 */
export function fazRequisicaoSpecieslink(nomeArquivo) {
    const promessa = Q.defer();
    const throttle = throttledQueue(1, 1500);
    selectUmCodBarraSpecieslink().then(codBarra => {
        if (codBarra.length === 0) {
            promessa.resolve(true);
        } else {
            const getCodBarra = codBarra[0].dataValues.cod_barra;
            throttle(() => {
                request(`https://specieslink.net/ws/1.0/search?apikey=0bnfKgk1s8TwZfVjdHJf&barcode=${getCodBarra}`, { timeout: 4000 }, (error, response, body) => {
                    salvaRespostaSpecieslink(nomeArquivo, getCodBarra, error, response, body);
                    promessa.resolve(fazRequisicaoSpecieslink(nomeArquivo));
                });
            });
        }
    });
    return promessa.promise;
}

export default {

};
