/* eslint-disable max-len */
import {
    transformaLog,
    leLOG,
    transformaNomeLog,
    tempoGastoLog,
} from '../herbarium/log';

const fs = require('fs');

/**
 * A função todosLogs, retorna ao front end um JSON, na qual esse JSON
 * contêm o nome de todos os logs presentes no serviço que é foi
 * requisitado (que pode ser Reflora ou species Link). Além disso,
 * é calculado o tempo de duração do processo de serviço de atualização.
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const todosLogs = (request, response, next) => {
    const { herbarioVirtual } = request.query;
    let diretorioLog = '';
    /** linux */
    if (herbarioVirtual === 'reflora') {
        diretorioLog = `${__dirname}/../../logs/reflora`;
    } else {
        diretorioLog = `${__dirname}/../../logs/specieslink/`;
    }
    let nomeArquivos = '';
    const listaArquivos = fs.readdirSync(diretorioLog);
    if (listaArquivos.length > 0) {
        listaArquivos.forEach(arquivos => {
            nomeArquivos = `${nomeArquivos}"${transformaNomeLog(arquivos)}", `;
        });
        const jsonLogs = nomeArquivos.substring(0, nomeArquivos.lastIndexOf(','));
        let tempoGasto = '';
        /** linux */
        if (herbarioVirtual === 'reflora') {
            tempoGasto = tempoGastoLog(leLOG(`reflora/${listaArquivos[listaArquivos.length - 1].replace('.log', '')}`));
        } else {
            tempoGasto = tempoGastoLog(leLOG(`specieslink/${listaArquivos[listaArquivos.length - 1].replace('.log', '')}`));
        }
        response.status(200).json(JSON.parse(`{ "logs":[ ${jsonLogs} ], "duracao": "${tempoGasto}" }`));
    } else {
        response.status(200).json(JSON.parse('{ "logs":[ ], "duracao": " " }'));
    }
};

/**
 * A função getLog, retorna ao front end um JSON, na qual esse JSON é
 * o conteúdo de um log que foi solicitado, do serviço que foi solicitado
 * (que pode ser Reflora ou species Link).
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const getLog = (request, response, next) => {
    const processaNomeArquivoUm = request.query.nomeLog.replace(/\//g, '-');
    const processaNomeArquivoDois = processaNomeArquivoUm.replace(/:/g, '-');
    const processaNomeArquivoTres = processaNomeArquivoDois.replace(/ /g, '-');
    let conteudoLog = '';
    if (request.query.herbarioVirtual === 'reflora') {
        conteudoLog = transformaLog(leLOG(`/reflora/${processaNomeArquivoTres}`));
    } else {
        conteudoLog = transformaLog(leLOG(`/specieslink/${processaNomeArquivoTres}`));
    }
    response.status(200).json(conteudoLog);
};

export default { };
