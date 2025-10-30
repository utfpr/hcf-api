export default (request, response, next) => {
    const { query } = request;
    let limite = parseInt(query.limite);
    let pagina = parseInt(query.pagina);

    if (isNaN(limite) || typeof limite !== 'number') {
        limite = 20;
    }

    if (isNaN(pagina) || typeof pagina !== 'number') {
        pagina = 1;
    }

    const offset = pagina * limite - limite;

    request.paginacao = {
        limite,
        pagina,
        offset,
    };

    return next();
};
