/* eslint-disable max-len */
import fs from 'fs';
import { agendaComparacaoSpeciesLink } from '../herbarium/specieslink/main';
import { selectTemExecucaoServico } from '../herbarium/herbariumdatabase';

/**
 * A função preparaAtualizacao, verifica se o arquivo que foi enviado
 * pelo upload contem o cabeçalho esperado, se contiver nós iremos
 * preparar para que em um determinando momento seja feito o
 * processo de comparação dos dados.
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const preparaAtualizacao = (request, response, next) => {
    const conteudoArquivo = fs.readFileSync(request.file.path, 'utf8');
    if (conteudoArquivo.includes('datelastmodified\tinstitutioncode\tcollectioncode\tcatalognumber\tscientificname\tbasisofrecord\tkingdom\tphylum\tclass\tordem\tfamily\tgenus\tspecies\tsubspecies\tscientificnameauthor\tidentifiedby\tyearidentified\tmonthidentified\tdayidentified\ttypestatus\tcollectornumber\tfieldnumber\tcollector\tyearcollected\tmonthcollected\tdaycollected\tjulianday\ttimeofday\tcontinentocean\tcountry\tstateprovince\tcounty\tlocality\tlongitude\tlatitude\tlongitude_mun\tlatitude_mun\tcoordinateprecision\tboundingbox\tminimumelevation\tmaximumelevation\tminimumdepth\tmaximumdepth\tsex\tpreparationtype\tindividualcount\tpreviouscatalognumber\trelationshiptype\trelatedcatalogitem\tnotes\tbarcode')) {
        agendaComparacaoSpeciesLink(request.file.filename, response);
    } else {
        response.status(200).json(JSON.parse(' { "result": "error_file" } '));
    }
};

/**
 * A função statusExecucao, faz um select no banco verificando se tem registros
 * de execução do speciesLink. Se não é retornado nenhum registro é retornando
 * false, ou seja, não está sendo executado. Se é retornaod algum
 * registro é verificado se a hora que terminou é nula, se sim significa
 * que não está sendo executado, retornando false. Se o valor é igual EXECUTANDO,
 * significa que está sendo executado, logo será retornado true, e caso não
 * seja nenhuma dessa opções é retornado false.
 * @param {*} request, é a requisição vinda do front end, às vezes pode
 * conter alguns parâmetros nesse cabeçalhos para conseguir informações
 * específicas.
 * @param {*} response, é a resposta que será enviada ao back end.
 * @param {*} next, é utilizado para chamar a próxima função da pilha.
 */
export const statusExecucao = (request, response, next) => {
    selectTemExecucaoServico(2).then(execucao => {
        if (execucao.length === 0) {
            response.status(200).json(JSON.parse(' { "result": false } '));
        } else {
            const horaFim = execucao[0].dataValues.hora_fim;
            if (horaFim === null) {
                response.status(200).json(JSON.parse(' { "result": false } '));
            } else if (horaFim === 'EXECUTANDO') {
                response.status(200).json(JSON.parse(' { "result": true } '));
            } else {
                response.status(200).json(JSON.parse(' { "result": false } '));
            }
        }
    });
};

export default { };
