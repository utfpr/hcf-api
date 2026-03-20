export default value => {
    if (!value) {
        return true;
    }

    const { dia, mes, ano } = value;

    // Tudo vazio é válido
    if (!dia && !mes && !ano) {
        return true;
    }

    // Se tiver dia, PRECISA ter mês e ano
    if (dia && (!mes || !ano)) {
        return false;
    }

    // Se tiver mês, PRECISA ter ano
    if (mes && !ano) {
        return false;
    }

    // Resto é válido: só ano, mês+ano, dia+mês+ano
    return true;
};
