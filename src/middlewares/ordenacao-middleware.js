import models from '../models';

const {
    Familia,
    Genero,
    Subfamilia,
    Especie,
    Reino,
    Variedade,
    Subespecie,
    Autor,
} = models;

const criaListagemMiddleware = (allowedColumns, defaultSort = 'nome', defaultDirection = 'asc') => (request, response, next) => {
    const { query } = request;
    const order = query.order || `${defaultSort}:${defaultDirection}`;

    const [column, direction] = order.split(':');

    if (column !== defaultSort && !allowedColumns.includes(column)) {
        return response.status(400).json({ error: 'Coluna inválida' });
    }

    if (!(direction === defaultDirection) && !['asc', 'desc'].includes(direction)) {
        return response.status(400).json({ error: 'Direção inválida' });
    }

    let orderClause = [[defaultSort, defaultDirection.toUpperCase()]];

    if (column === 'autor') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (!request.path.includes('/autores')) orderClause = [[{ model: Autor, as: 'autor' }, 'nome', direction.toUpperCase()]];
    } else if (column === 'reino') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (!request.path.includes('/reinos')) orderClause = [[{ model: Reino }, 'nome', direction.toUpperCase()]];
    } else if (column === 'familia') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (request.path.includes('/variedades') || request.path.includes('/subespecies')) {
            orderClause = [[{ model: Especie, as: 'especie' }, { model: Genero }, { model: Familia }, 'nome', direction.toUpperCase()]];
        } else if (request.path.includes('/especies')) {
            orderClause = [[{ model: Genero }, { model: Familia }, 'nome', direction.toUpperCase()]];
        } else if (request.path.includes('/generos') || request.path.includes('/subfamilias')) {
            orderClause = [[{ model: Familia }, 'nome', direction.toUpperCase()]];
        }
    } else if (column === 'subfamilia') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (!request.path.includes('/subfamilias')) orderClause = [[{ model: Subfamilia }, 'nome', direction.toUpperCase()]];
    } else if (column === 'genero') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (request.path.includes('/variedades') || request.path.includes('/subespecies')) {
            orderClause = [[{ model: Especie, as: 'especie' }, { model: Genero }, 'nome', direction.toUpperCase()]];
        } else if (request.path.includes('/especies')) {
            orderClause = [[{ model: Genero }, 'nome', direction.toUpperCase()]];
        }
    } else if (column === 'especie') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (request.path.includes('/variedades') || request.path.includes('/subespecies')) {
            orderClause = [[{ model: Especie, as: 'especie' }, 'nome', direction.toUpperCase()]];
        }
    } else if (column === 'subespecie') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (!request.path.includes('/subespecies')) orderClause = [[{ model: Subespecie }, 'nome', direction.toUpperCase()]];
    } else if (column === 'variedade') {
        orderClause = [['nome', direction.toUpperCase()]];

        if (!request.path.includes('/variedades')) orderClause = [[{ model: Variedade }, 'nome', direction.toUpperCase()]];
    } else {
        orderClause = [[column, direction.toUpperCase()]];
    }

    request.ordenacao = {
        orderClause,
    };

    return next();
};

export default criaListagemMiddleware;
