/**
 * @param {string[]} campos Lista de campos para fazer o "JSON.parse";
 */
export default function criaMiddleware(campos) {

    function redutor(objeto, entrada) {
        const [campo, valor] = entrada;

        if (!campos.includes(campo)) {
            return {
                ...objeto,
                [campo]: valor,
            };
        }

        try {
            return {
                ...objeto,
                [campo]: JSON.parse(valor),
            };

        } catch (err) {
            console.error(err); // eslint-disable-line no-console
            return {
                ...objeto,
                [campo]: undefined,
            };
        }
    }

    return (request, response, next) => {
        request.query = Object
            .entries(request.query)
            .reduce(redutor, {});

        next();
    };
}
