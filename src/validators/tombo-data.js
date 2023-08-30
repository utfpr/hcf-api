export default ({ dia, mes, ano }) => {

    if (dia || mes || ano) {
        return true;
    }

    return false;
};
