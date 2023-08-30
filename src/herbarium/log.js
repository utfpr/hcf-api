import fs from 'fs';
import moment from 'moment';

/**
 * A função getHoraAtual, retorna a data (dia, mês, ano) e horas
 * (horas, minutos, segundos), separadas por hífen. As informações
 * de data são separadas por '/' e quando é horas são separadas por ':'.
 * @return string, que é o nome do arquivo no formato compatível.
 */
export function getHoraAtual() {
    return moment().format('DD/MM/YYYY-HH:mm:ss');
}

/**
 * A função getNomeArquivo, retorna a data (dia, mês, ano) e horas
 * (horas, minutos, segundos) e essas informações são separadas por
 * hífen, pois se utilizar '/' ou ':', não é possível criar um arquivo.
 * @return string, que é o nome do arquivo no formato compatível.
 */
export function getNomeArquivo() {
    return moment().format('DD-MM-YYYY-HH-mm-ss');
}

/**
 * A função escreveLOG, escreve a mensagem que foi passado por
 * parâmetro, juntamente com a data e a hora atual, no arquivo
 * que também foi passado por parâmetro.
 * @param {*} nomeArquivo, que é o nome do arquivo aonde será escrito a mensagem por parâmetro.
 * @param {*} mensagem, que é a mensagem que será inserida no arquivo passado por parâmetro.
 */
export function escreveLOG(nomeArquivo, mensagem) {
    const caminhoArquivo = `logs/${nomeArquivo}.log`;
    const conteudo = `[${getHoraAtual()}] ${mensagem}\n`;
    fs.writeFileSync(caminhoArquivo, conteudo, { flag: 'a' });
}

/**
 * A função leLOG, retorna o conteúdo do nome do arquivo que foi passado por parâmetro.
 * @param {*} nomeArquivo, que é o nome do arquivo a qual se deseja extrair o conteúdo.
 * @return string, que é o conteúdo do arquivo que foi passado por parâmetro.
 */
export function leLOG(nomeArquivo) {
    const caminhoArquivo = `logs/${nomeArquivo}.log`;
    return fs.readFileSync(caminhoArquivo, 'utf8');
}

/**
 * A função transformaLog, pega o conteúdo do log recebido por parâmetro e
 * adequada todo ele para o formato JSON, para ele ser enviado ao front end
 * e ser exibido ao usuário. Um detalhe que vale a pena ressaltar é que o 'g'
 * presente está relacionado a expressão regular na qual será procurado
 * todo conteúdo que se encaixe com a expressão regular.
 * @param {*} conteudo, que é o conteúdo do log que será adequado para o formato JSON.
 * @return JSON, com o conteúdo do log no formato JSON.
 */
export function transformaLog(conteudo) {
    const transformacaoUm = conteudo.replace(/\[/g, ' "[');
    const transformacaoDois = transformacaoUm.replace(/\./g, '." ,');
    const transformacaoTres = transformacaoDois.substring(0, transformacaoDois.lastIndexOf(','));
    const transformacaoQuatro = `{ "log": [ ${transformacaoTres} ] }`;
    return JSON.parse(transformacaoQuatro);
}

/**
 * A função trocaCaractere, ela substitui um determinado caractere em uma posição
 * específica pelo caractere que foi passado por parâmetro, e no final retorna
 * o texto com esse novo caractere.
 * @param {*} texto, que é o texto na qual se deseja substituir um caractere
 * em uma posição específica.
 * @param {*} indice, é um inteiro com a posição do caractere na qual se deseja
 * trocar por um outro caractere.
 * @param {*} novoValor, é o novo caractere que substituíra o caractere antigo.
 * @return string, com o texto com o novo caractere que foi passado por parâmetro.
 */
export function trocaCaractere(texto, indice, novoValor) {
    return texto.substring(0, indice) + novoValor + texto.substring(indice + 1, texto.length);
}

/**
 * A função processaNomeLog, transforma o nome log substituindo alguns caracteres
 * para um formato mais adequado, então substitui as barras '/' das datas por
 * hífen '-' e também os dois pontos ':' por hífen ':'.
 * Exemplo:
 * Antes: 15/03/2019-19:56:10
 * Depois: 15-03-2019-19-56-10
 * @param {*} nomeLog, é o nome do log na qual será formatado em um formato específico.
 * @return string, com o nome do log com os caracteres substituídos.
 */
export function processaNomeLog(nomeLog) {
    const transformacaoUm = trocaCaractere(nomeLog, 2, '-');
    const transformacaoDois = trocaCaractere(transformacaoUm, 5, '-');
    const transformacaoTres = trocaCaractere(transformacaoDois, 13, '-');
    return trocaCaractere(transformacaoTres, 16, '-');
}

/**
 * A função getHoraFim, é uma função que lê o conteúdo do log e retorna a data
 * em que se acabou o processo de atualização.
 * @param {*} conteudoLog, é o conteúdo do log na qual será procurado que a data que
 * acabou o processo de comparação.
 * @return {*} string, que é a data que se encerrou o processo de atualização.
 */
export function getHoraFim(conteudoLog) {
    const inicio = conteudoLog.lastIndexOf('[');
    const fim = conteudoLog.lastIndexOf(']');
    return conteudoLog.substring(inicio + 1, fim);
}

/**
 * A função transformaNomeLog, transforma o parâmetro recebido que é
 * o nome de um arquivo do log que é uma data (dia, mês, ano)
 * e horas (horas, minutos, segundos) trocando alguns caracteres
 * que são '-' por '/' quando é data, e quando é horas, substitui '-' por ':'.
 * @param {*} nomeArquivo, transforma o nome do arquivo que será formatado no padrão esperado.
 * @return {*} string, que é o nome do arquivo no formato esperado.
 */
export function transformaNomeLog(nomeArquivo) {
    const processoUm = nomeArquivo.replace('.log', '');
    const processoDois = trocaCaractere(processoUm, 2, '/');
    const processoTres = trocaCaractere(processoDois, 5, '/');
    const processoQuatro = trocaCaractere(processoTres, 10, ' ');
    const processoCinco = trocaCaractere(processoQuatro, 13, ':');
    return trocaCaractere(processoCinco, 16, ':');
}

/**
 * A função tempoGastoLog, calcula o tempo que foi gasto para executar o processo do Reflora.
 * @param {*} conteudoLog, é conteúdo do último log na qual será calculado o tempo que demorou
 * para executar o processo do Reflora.
 * @return {*} string, que é o tempo gasto para executar o processo do Reflora.
 */
export function tempoGastoLog(conteudoLog) {
    const mensagemFinal = conteudoLog.substring(conteudoLog.lastIndexOf(']') + 1, conteudoLog.lastIndexOf('\n'));
    if (!mensagemFinal.includes(' Falha na requisição do código de barra ')) {
        const dataInicial = conteudoLog.substring(conteudoLog.indexOf('[') + 1, conteudoLog.indexOf(']'));
        const dataFinal = conteudoLog.substring(conteudoLog.lastIndexOf('[') + 1, conteudoLog.lastIndexOf(']'));
        const diferenca = moment(dataFinal, 'DD/MM/YYYY-HH:mm:ss').diff(moment(dataInicial, 'DD/MM/YYYY-HH:mm:ss'));
        const duracao = moment.duration(diferenca);
        return Math.floor(duracao.asHours()) + moment.utc(diferenca).format(':mm:ss');
    }
    return '';
}
