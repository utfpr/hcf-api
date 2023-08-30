export default (request, response, next) => {
    const { query } = request;
    let limite = parseInt(query.limite);
    let pagina = parseInt(query.pagina);

    if (isNaN(limite) || typeof limite !== 'number') { // eslint-disable-line
        limite = 20;
    }

    if (isNaN(pagina) || typeof pagina !== 'number') { // eslint-disable-line
        pagina = 1;
    }

    const offset = (pagina * limite) - limite;

    request.paginacao = {
        limite,
        pagina,
        offset,
    };

    next();
};
