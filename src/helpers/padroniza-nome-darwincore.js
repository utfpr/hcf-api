export const padronizarNomeDarwincore = nomeSobrenome => {
    const nomePadraoDarwincore = nomeSobrenome
        .split(' ')
        .filter(nome => !nome.toLowerCase().match(/(de|da|dos|das)/g))
        .map((nome, index, self) => {
            if (index === 0 || index === self.length - 1) {
                return nome;
            }
            return `${nome[0]}.`;
        })
        .join(' ');

    return nomePadraoDarwincore;
};

export default {};
