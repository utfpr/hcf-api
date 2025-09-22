export default data => {
    if (typeof data !== 'string') {
        return false;
    }

    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(data)) {
        return false;
    }

    const [, mesStr, diaStr] = data.split('-');
    const mes = Number(mesStr);
    const dia = Number(diaStr);

    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;

    return true;
};
