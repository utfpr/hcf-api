/**
 * Obtem um novo objeto com os atributos especificados
 * @param {object} object Objeto para obter os atributos
 * @param {string[]} attributes Atributos para obter do objeto
 */
export default function pick(object, attributes = []) {
    if (!Array.isArray(attributes) || attributes.length < 1) {
        return {};
    }

    function reducer(output, key) {
        if (!(key in object)) {
            return output;
        }

        const value = object[key];
        return { ...output, [key]: value };
    }


    return attributes.reduce(reducer, {});
}
