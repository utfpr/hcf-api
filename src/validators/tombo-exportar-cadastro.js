const validaCampos = campos => {
    if (campos === undefined || (campos.length > 5 || campos.length === 0)) {
        return false;
    }
    return true;
};

const validaTombos = tombos => {
    if (!Array.isArray(tombos)) {
        return false;
    }

    for (let i = 0; i < tombos.length; i += 1) {
        if (!Number.isInteger(tombos[i])) {
            return false;
        }
    }
    return true;
};

export default {
    campos: {
        in: 'query',
        isString: true,
        optional: false,
        custom: {
            options: validaCampos,
        },
    },
    de: {
        in: 'query',
        optional: true,
        isInt: true,
    },
    ate: {
        in: 'query',
        optional: true,
        isInt: true,
    },
    tombos: {
        in: 'query',
        optional: true,
        custom: {
            options: validaTombos,
        },
    },
};
