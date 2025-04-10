import codigosHttp from '~/resources/codigos-http';

import models from '../models';

const {
    Sequelize: { Op }, Familia, Especie, Genero, Tombo,
} = models;

const agruparPorNomeCientifico = dados => dados.reduce((acc, obj) => {
    const { especy } = obj;
    const { genero, nome } = especy;
    const nomeCientifico = genero ? `${genero.nome} ${nome}` : nome;

    const grupoExistente = acc.find(item => item.especie === nomeCientifico);

    if (grupoExistente) {
        grupoExistente.tombos.push(obj.hcf);
    } else {
        acc.push({
            especie: nomeCientifico,
            tombos: [obj.hcf],
        });
    }

    return acc;
}, []).map(item => ({
    ...item,
    tombos: item.tombos.join(', '),
}));

const formatarDadosParaRealtorioDeInventarioDeEspecies = dados => {
    const dadosFormatados = dados.map(dado => ({
        familia: dado.familia,
        especies: agruparPorNomeCientifico(dado.itens).sort((a, b) => a.especie.localeCompare(b.especie)),
    }));
    return dadosFormatados;
};

const agruparPorFamilia = dados => dados.reduce((acc, obj) => {
    const { familia } = obj.especy;
    const { nome } = familia;

    const grupoExistente = acc.find(item => item.familia === nome);

    if (grupoExistente) {
        grupoExistente.itens.push(obj);
    } else {
        acc.push({
            familia: nome,
            itens: [obj],
        });
    }

    return acc;
}, []);

export const obtemDadosDoRelatorioDeInventarioDeEspeciesParaTabela = async (req, res, next) => {
    const { query, paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { familia } = query;

    let where = {};
    if (familia) {
        where = {
            nome: { [Op.like]: `%${familia}%` },
        };
    }

    try {
        const especiesFiltradas = await Especie.findAndCountAll({
            attributes: ['id'],
            include: [
                {
                    model: Familia,
                    attributes: [],
                    where, // Aplica o filtro da família
                    required: true,
                },
            ],
            offset,
        });

        const especieIds = especiesFiltradas.rows.map(e => e.id);

        const tombos = await Tombo.findAll({
            attributes: ['hcf', 'numero_coleta', 'nome_cientifico'],
            include: [
                {
                    model: Especie,
                    attributes: ['id', 'nome'],
                    where: {
                        id: especieIds, // Filtra apenas pelas espécies que atendem ao critério da família
                    },
                    include: [
                        {
                            model: Genero,
                            attributes: ['id', 'nome'],
                        },
                        {
                            model: Familia,
                            attributes: ['id', 'nome'],
                        },
                    ],
                },
            ],
        });

        const agrupamentoPorFamilia = agruparPorFamilia(tombos);
        const dados = formatarDadosParaRealtorioDeInventarioDeEspecies(agrupamentoPorFamilia);

        res.status(codigosHttp.LISTAGEM).json({
            metadados: {
                total: especiesFiltradas.count,
                pagina,
                limite,
            },
            resultado: dados,
        });
    } catch (e) {
        next(e);
    }
};

export const obtemDadosDoRelatorioDeInventarioDeEspecies = async (req, res, next) => {
    const { query } = req;
    const { familia, paraTabela } = query;

    let where = {};
    if (familia) {
        where = {
            nome: { [Op.like]: `%${familia}%` },
        };
    }

    if (paraTabela) {
        await obtemDadosDoRelatorioDeInventarioDeEspeciesParaTabela(req, res, next);
        return;
    }

    try {
        const tombos = await Tombo.findAll({
            attributes: ['hcf', 'numero_coleta', 'nome_cientifico'],
            include: [
                {
                    model: Especie,
                    attributes: ['id', 'nome'],
                    required: true,
                    include: [
                        {
                            model: Genero,
                            attributes: ['id', 'nome'],
                        },
                        {
                            model: Familia,
                            attributes: ['id', 'nome'],
                            where,
                            required: true,
                        },
                    ],
                },
            ],
        });

        const agrupamentoPorFamilia = agruparPorFamilia(tombos);
        const dados = formatarDadosParaRealtorioDeInventarioDeEspecies(agrupamentoPorFamilia);

        res.json({
            dados,
        });
    } catch (e) {
        next(e);
    }
};
