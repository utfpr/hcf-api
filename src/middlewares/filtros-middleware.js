export default (request, response, next) => {
    const { filtros = '{}' } = request;

    try {
        request.query.filtros = JSON.parse(filtros);

    } catch (err) {
        // console.error(err); // eslint-disable-line no-console
        request.query.filtros = {};

    } finally {
        next();
    }
};
