import { Op, Sequelize } from 'sequelize';

import models from '../models/index.js';

const { Tombo, Especie, Coletor, Cidade, Familia, Genero, Herbario, TomboFoto } = models;

const calcularPorcentagem = (atual, passado) => {
    if (passado > 0) return parseFloat((((atual - passado) / passado) * 100).toFixed(1));
    if (atual > 0) return 100.0;
    return 0.0;
};

const formatarRanking = (dadosQuery, aliasTabela) => {
    return dadosQuery.map(item => {
        const info = item[aliasTabela] || item[aliasTabela.charAt(0).toUpperCase() + aliasTabela.slice(1)];
        let nome = info?.nome || info?.sigla || 'N/A';

        if (aliasTabela === 'especie') {
            const generoInfo = item.genero || item.Genero;

            if (generoInfo?.nome) {
                nome = `${generoInfo.nome} ${nome}`;
            }
        }

        return {
            nome: nome,
            total: parseInt(item.get('quantidade'), 10) || 0,
        };
    });
};

const formatarAno = array => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return array.map((total, index) => ({ mes: meses[index], total }));
};

export const tomboInfo = async (request, response, next) => {
    try {
        const ID_HCF = 2;

        const condicaoBase = {
            rascunho: false,
            ativo: true,
        };

        const [
            totaisGerais,
            distintos,
            rankEspecies,
            rankFamilias,
            rankGeneros,
            rankMunicipios,
            rankColetores,
            rankHerbarios,
            totalImagens,
        ] = await Promise.all([
            Tombo.findOne({
                attributes: [
                    [Sequelize.literal('COUNT(*)'), 'total'],
                    [Sequelize.literal(`COUNT(*) FILTER (WHERE entidade_id IS NULL OR entidade_id = ${ID_HCF})`), 'tombos_internos'],
                    [Sequelize.literal(`COUNT(*) FILTER (WHERE entidade_id IS NOT NULL AND entidade_id != ${ID_HCF})`), 'tombos_externos'],
                ],
                raw: true,
            }), // totaisGerais
            Tombo.findOne({
                where: condicaoBase,
                attributes: [
                    [Sequelize.literal('COUNT(DISTINCT especie_id)'), 'especies'],
                    [Sequelize.literal('COUNT(DISTINCT familia_id)'), 'familias'],
                    [Sequelize.literal('COUNT(DISTINCT genero_id)'), 'generos'],
                    [Sequelize.literal('COUNT(DISTINCT cidade_id)'), 'municipios'],
                    [Sequelize.literal('COUNT(DISTINCT coletor_id)'), 'coletores'],
                    [Sequelize.literal('COUNT(DISTINCT entidade_id)'), 'herbarios'],
                ],
                raw: true,
            }), // distintos
            Tombo.findAll({
                where: { ...condicaoBase, especie_id: { [Op.not]: null } },
                attributes: ['especie_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [
                    { model: Especie, as: 'especie', attributes: ['nome'] },
                    { model: Genero, as: 'genero', attributes: ['nome'] },
                ],
                group: ['especie_id', 'especie.id', 'genero.id', 'genero.nome'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankEspecies
            Tombo.findAll({
                where: { ...condicaoBase, familia_id: { [Op.not]: null } },
                attributes: ['familia_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Familia, as: 'familia', attributes: ['nome'] }],
                group: ['familia_id', 'familia.id', 'familia.nome'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankFamilias
            Tombo.findAll({
                where: { ...condicaoBase, genero_id: { [Op.not]: null } },
                attributes: ['genero_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Genero, as: 'genero', attributes: ['nome'] }],
                group: ['genero_id', 'genero.id', 'genero.nome'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankGeneros
            Tombo.findAll({
                where: { ...condicaoBase, cidade_id: { [Op.not]: null } },
                attributes: ['cidade_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Cidade, attributes: ['nome'] }],
                group: ['cidade_id', 'cidade.id', 'cidade.nome'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankMunicipios
            Tombo.findAll({
                where: { ...condicaoBase, coletor_id: { [Op.not]: null } },
                attributes: ['coletor_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Coletor, as: 'coletor', attributes: ['nome'] }],
                group: ['coletor_id', 'coletor.id', 'coletor.nome'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankColetores
            Tombo.findAll({
                where: { ...condicaoBase, entidade_id: { [Op.not]: null } },
                attributes: ['entidade_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Herbario, attributes: ['nome', 'sigla'] }],
                group: ['entidade_id', 'herbario.id', 'herbario.nome', 'herbario.sigla'],
                order: [[Sequelize.literal('quantidade'), 'DESC']],
                limit: 5,
            }), // rankHerbarios
            TomboFoto.count(), // totalImagens
        ]);

        return response.status(200).json({
            dados: {
                tombos: {
                    total: parseInt(totaisGerais.total, 10) || 0,
                    internos: parseInt(totaisGerais.tombos_internos, 10) || 0,
                    externos: parseInt(totaisGerais.tombos_externos, 10) || 0,
                    fotos: totalImagens,
                },
                taxonomia: {
                    familias: { total: parseInt(distintos.familias, 10) || 0, ranking: formatarRanking(rankFamilias, 'familia') },
                    generos: { total: parseInt(distintos.generos, 10) || 0, ranking: formatarRanking(rankGeneros, 'genero') },
                    especies: { total: parseInt(distintos.especies, 10) || 0, ranking: formatarRanking(rankEspecies, 'especie') },
                },
                municipios: {
                    total: parseInt(distintos.municipios, 10) || 0,
                    ranking: formatarRanking(rankMunicipios, 'cidade'),
                },
                coletores: {
                    total: parseInt(distintos.coletores, 10) || 0,
                    ranking: formatarRanking(rankColetores, 'coletor'),
                },
                herbarios: {
                    total: parseInt(distintos.herbarios, 10) || 0,
                    ranking: formatarRanking(rankHerbarios, 'herbario'),
                },
            },
        });

    } catch (error) {
        next(error);
    }
};

export const tomboSerieTemporal = async (request, response, next) => {
    try {
        const anoBase = parseInt(request.query.ano, 10) || new Date().getFullYear();
        const anoAnterior = anoBase - 1;

        const inicioRange = new Date(anoAnterior, 0, 1);
        const fimRange = new Date(anoBase, 11, 31, 23, 59, 59, 999);

        const queryResult = await Tombo.findAll({
            where: {
                rascunho: false,
                ativo: true,
                data_tombo: { [Op.between]: [inicioRange, fimRange] },
            },
            attributes: [
                [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM data_tombo')), 'ano'],
                [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo')), 'mes'],
                [Sequelize.literal('COUNT(*)'), 'total'],
            ],
            group: [
                Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM data_tombo')),
                Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo')),
            ],
            raw: true,
        });

        const arrayAtual = Array(12).fill(0);
        const arrayPassado = Array(12).fill(0);
        let totalAtual = 0;
        let totalPassado = 0;

        queryResult.forEach(item => {
            const ano = parseInt(item.ano, 10);
            const idx = parseInt(item.mes, 10) - 1;
            const qtd = parseInt(item.total, 10) || 0;

            if (idx >= 0 && idx < 12) {
                if (ano === anoBase) {
                    arrayAtual[idx] = qtd;
                    totalAtual += qtd;
                } else if (ano === anoAnterior) {
                    arrayPassado[idx] = qtd;
                    totalPassado += qtd;
                }
            }
        });

        return response.status(200).json({
            meta: {
                ano_referencia: anoBase,
                ano_comparacao: anoAnterior,
            },
            serie_temporal: {
                dados: {
                    atual: formatarAno(arrayAtual),
                    passado: formatarAno(arrayPassado),
                },
                totais: {
                    atual: totalAtual,
                    passado: totalPassado,
                    porcentagem: calcularPorcentagem(totalAtual, totalPassado),
                },
            },
        });

    } catch (error) {
        next(error);
    }
};
