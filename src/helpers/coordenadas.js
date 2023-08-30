export default {};

export const converteParaDecimal = coordenada => {
    const regex = /^(\d+)\D+(\d+)\D+(\d+(?:[.,]\d+)?)\W+([NSWE])$/;
    const matches = coordenada.match(regex);

    if (matches.length < 5) {
        throw new Error('Coordenada inválida');
    }

    const graus = parseInt(matches[1]);
    const minutos = parseInt(matches[2]);
    const segundos = parseFloat(matches[3].replace(',', '.'));
    const hemisferio = matches[4];

    const sinal = (['S', 'W'].includes(hemisferio)) ? -1 : 1;

    return sinal * (graus + (minutos / 60) + (segundos / 3600));
};

export const converteDecimalParaGraus = (decimal, isLat) => {
    let max = 180;
    const CHAR_DEG = '\u00B0';
    const CHAR_MIN = '\u0027';
    const CHAR_SEC = '\u0022';
    const CHAR_SEP = '\u0020';

    if (isLat) {
        max = 90;
    }
    const sign = decimal < 0 ? -1 : 1;

    const abs = Math.abs(Math.round(decimal * 1000000));

    if (abs > (max * 1000000)) {
        return NaN;
    }

    // eslint-disable-next-line no-mixed-operators
    const dec = abs % 1000000 / 1000000;
    const deg = Math.floor(abs / 1000000) * sign;
    const min = Math.floor(dec * 60);
    const sec = (dec - min / 60) * 3600;

    let result = '';

    result += deg;
    result += CHAR_DEG;
    result += CHAR_SEP;
    result += min;
    result += CHAR_MIN;
    result += CHAR_SEP;
    result += sec.toFixed(2);
    result += CHAR_SEC;

    return result;
};

export const converteDecimalParaGMSGrau = (decimal, isLat) => {
    let max = 180;
    const sign = decimal < 0 ? -1 : 1;

    if (isLat) {
        max = 90;
    }
    const abs = Math.abs(Math.round(decimal * 1000000));

    if (abs > (max * 1000000)) {
        return NaN;
    }

    const deg = Math.floor(abs / 1000000);

    return deg;
};

export const converteDecimalParaGMSMinutos = (decimal, isLat) => {
    let max = 180;

    if (isLat) {
        max = 90;
    }

    const abs = Math.abs(Math.round(decimal * 1000000));

    if (abs > (max * 1000000)) {
        return NaN;
    }

    // eslint-disable-next-line no-mixed-operators
    const dec = abs % 1000000 / 1000000;
    const min = Math.floor(dec * 60);

    return min;
};

export const converteDecimalParaGMSSegundos = (decimal, isLat) => {
    let max = 180;

    if (isLat) {
        max = 90;
    }

    const abs = Math.abs(Math.round(decimal * 1000000));

    if (abs > (max * 1000000)) {
        return NaN;
    }

    // eslint-disable-next-line no-mixed-operators
    const dec = abs % 1000000 / 1000000;
    const min = Math.floor(dec * 60);
    const sec = (dec - min / 60) * 3600;

    return sec.toFixed(2);
};

export const converteDecimalParaGMSSinal = (decimal, isLat) => {
    let max = 180;

    if (isLat) {
        max = 90;
    }
    const sign = decimal < 0 ? -1 : 1;

    const abs = Math.abs(Math.round(decimal * 1000000));

    if (abs > (max * 1000000)) {
        return NaN;
    }

    // eslint-disable-next-line no-mixed-operators
    const dec = abs % 1000000 / 1000000;
    const deg = Math.floor(abs / 1000000) * sign;
    const min = Math.floor(dec * 60);
    const sec = (dec - min / 60) * 3600;

    let result = '';

    result += deg;
    result += CHAR_DEG;
    result += CHAR_SEP;
    result += min;
    result += CHAR_MIN;
    result += CHAR_SEP;
    result += sec.toFixed(2);
    result += CHAR_SEC;

    return result;
};
