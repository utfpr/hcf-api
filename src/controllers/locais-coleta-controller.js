import models from '../models';
import BadRequestExeption from '../errors/bad-request-exception';
import codigos from '../resources/codigos-http';

const {
    Relevo, Solo, Vegetacao, sequelize,
} = models;

export const cadastrarSolo = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Solo.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(soloEncontrado => {
            if (soloEncontrado) {
                throw new BadRequestExeption(300);
            }
        })
        .then(() => Solo.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(soloCriado => {
            if (!soloCriado) {
                throw new BadRequestExeption(301);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const cadastrarRelevo = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Relevo.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(relevoEncontrado => {
            if (relevoEncontrado) {
                throw new BadRequestExeption(302);
            }
        })
        .then(() => Relevo.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(relevoCriado => {
            if (!relevoCriado) {
                throw new BadRequestExeption(303);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const cadastrarVegetacao = (request, response, next) => {
    const { nome } = request.body;

    const callback = transaction => Promise.resolve()
        .then(() => Vegetacao.findOne({
            where: {
                nome,
            },
            transaction,
        }))
        .then(vegetacaoEncontrada => {
            if (vegetacaoEncontrada) {
                throw new BadRequestExeption(304);
            }
        })
        .then(() => Vegetacao.create({ nome }, transaction));
    sequelize.transaction(callback)
        .then(vegetacaoCriada => {
            if (!vegetacaoCriada) {
                throw new BadRequestExeption(305);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarRelevos = (request, response, next) => {
    Promise.resolve()
        .then(() => Relevo.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
        }))
        .then(relevos => {
            response.status(codigos.LISTAGEM).json(relevos.rows);
        })
        .catch(next);
};

export const buscarSolos = (request, response, next) => {
    Promise.resolve()
        .then(() => Solo.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
        }))
        .then(solos => {
            response.status(codigos.LISTAGEM).json(solos.rows);
        })
        .catch(next);
};

export const buscarVegetacoes = (request, response, next) => {
    Promise.resolve()
        .then(() => Vegetacao.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
        }))
        .then(vegetacoes => {
            response.status(codigos.LISTAGEM).json(vegetacoes.rows);
        })
        .catch(next);
};

export default {};
