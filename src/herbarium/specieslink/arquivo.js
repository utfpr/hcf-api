import fs from 'fs';

/**
 * A função getArquivoSpeciesLink, lê o conteúdo do arquivo converte
 * ele no formato de string, e quebra esse conteúdo quando encontrado
 * uma quebra de linha, e assim retorna em cada posição uma linha
 * do arquivo.
 * @param {*} nomeArquivo, nome do arquivo na qual o seu conteúdo será retornado.
 * @return string, vetor de string em que cada posição desse vetor é uma linha do arquivo.
 */
export function getArquivoSpeciesLink(nomeArquivo) {
    const conteudo = fs.readFileSync(nomeArquivo, 'utf8');
    return conteudo.toString().split('\n');
}

/**
 * A função getColunasArquivoSpeciesLink, pega a linha do arquivo e quebra esse conteúdo
 * dessa linha quando encontrado um 'tab' e retorna um vetor em que cada posição
 * está relacionada a uma coluna.
 * @param {*} linhaArquivo, linha do arquivo do species Link que será colocado em um vetor,
 * em que cada posição representa uma coluna.
 * @return string, vetor de string em que cada posição desse vetor representa uma coluna,
 * em que cada coluna é uma informação.
 */
export function getColunasArquivoSpeciesLink(linhaArquivo) {
    return linhaArquivo.split('\t');
}

/**
 * A função processaArquivo, ela pega o conteúdo desse arquivo que foi feito
 * o upload pelo usuário e remove a primeira e a última linha (A primeira linha
 * é aquele cabeçalho com os nomes das colunas, e a última coluna é uma linha vazia).
 * Após remover esse conteúdo desnecessário pegamos as linhas processamos ela
 * separando por coluna, e adicionamos em uma nova lista e retornamos a mesma.
 */
export function processaArquivo(nomeArquivo) {
    const conteudoArquivo = getArquivoSpeciesLink(`./public/uploads/${nomeArquivo}`);
    const listaConteudoArquivo = [];
    conteudoArquivo.shift();
    conteudoArquivo.pop();
    conteudoArquivo.forEach(linha => {
        listaConteudoArquivo.push(getColunasArquivoSpeciesLink(linha));
    });
    return listaConteudoArquivo;
}

export default { };
