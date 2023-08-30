/**
 * A função geraListaAleatorio, seleciona uma certa quantidade de itens
 * que serão utilizados para serem realizados as suas requisições,
 * no caso do Herbário Virtual Reflora e comparações de seus dados.
 * Essa função é somente utilizada em teste.
 * @param {*} listaConteudo, é uma lista com o conteúdo do arquivo.
 * @param {*} quantidadeAleatorios, quantidade de itens da lista que devem ser selecionados.
 * @return listaConteudo ou novaListaConteudo, é uma lista de conteúdo selecionados
 * que quando a quantidade de aleatórios é zero é retornando listaConteudo,
 * caso contrário é retorna a novaListaConteudo.
 */
export function geraListaAleatorio(listaConteudo, quantidadeAleatorios) {
    if ((quantidadeAleatorios === 0) || (quantidadeAleatorios < -1)) {
        return listaConteudo;
    }
    let aleatorio = 0;
    const novaListaConteudo = [];
    for (let i = 0; i < quantidadeAleatorios; i += 1) {
        aleatorio = Math.floor((Math.random() * listaConteudo.length) + 0);
        novaListaConteudo.push(listaConteudo[aleatorio]);
        // Remove o elemento dá posição aleatório e somente um elemento
        listaConteudo.splice(aleatorio, 1);
    }
    return novaListaConteudo;
}

export default {};
