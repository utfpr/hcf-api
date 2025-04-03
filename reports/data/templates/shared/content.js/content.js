function nowLocalStr() {
    return new Date().toLocaleDateString('pt-BR');
}

function toJSON(data) {
    return JSON.stringify(data);
}

function not(bool) {
    return !bool;
}

function join(arr = []) {
    return arr.join(', ');
}

function ifDiff(arg1, arg2, options) {
    return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
}
