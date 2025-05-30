import { format, isBefore } from 'date-fns';
import { Readable } from 'stream';

import {
    agruparPorFamilia,
    formatarDadosParaRealtorioDeInventarioDeEspecies,
    formataTextFilter,
    formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData,
} from '~/helpers/formata-dados-relatorio';
import { generateReport } from '~/reports/reports';
import ReportInevntarioEspeciesTemplate from '~/reports/templates/InventarioEspecies';
import ReportColetaPorLocalIntervaloDeData from '~/reports/templates/RelacaoTombos';
import codigosHttp from '~/resources/codigos-http';

import models from '../models';

const {
    Sequelize: { Op, literal }, Familia, Especie, Genero, Tombo, LocalColeta, Autor, Sequelize, sequelize,
} = models;

export const obtemDadosDoRelatorioDeInventarioDeEspeciesParaTabela = async (req, res, next, where, dados, qtd) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;

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

        res.status(codigosHttp.LISTAGEM).json({
            metadados: {
                total: especiesFiltradas.count,
                pagina,
                limite,
            },
            resultado: dados,
            quantidadeDeTombos: qtd,
        });
    } catch (e) {
        next(e);
    }
};

export const obtemDadosDoRelatorioDeInventarioDeEspecies = async (req, res, next) => {
    const { familia } = req.query;

    let replacements = {};
    let where = {};
    let query = `
        SELECT 
            t.hcf,
            t.numero_coleta,
            t.nome_cientifico,
            f.nome AS nome_familia,
            g.nome AS nome_genero,
            e.nome AS nome_especie 
        FROM tombos t 
            LEFT JOIN especies e ON t.especie_id = e.id 
            LEFT JOIN generos g ON t.genero_id = g.id
            LEFT JOIN familias f ON t.familia_id = f.id
    `;
    if (familia) {
        query += ' WHERE f.nome LIKE :nomeFamilia';
        replacements = {
            nomeFamilia: `%${familia}%`,
        };
        where = {
            nome: { [Op.like]: `%${familia}%` },
        };
    }

    const [results] = await sequelize.query(query, {
        replacements,
    });

    const agrupamentoPorFamilia = agruparPorFamilia(results);
    const dados = formatarDadosParaRealtorioDeInventarioDeEspecies(agrupamentoPorFamilia);

    if (req.method === 'GET') {
        await obtemDadosDoRelatorioDeInventarioDeEspeciesParaTabela(req, res, next, where, dados, results.length);
        return;
    }

    try {
        gerarRelatorioPDF(res, {
            tipoDoRelatorio: 'Inventário de Espécies',
            textoFiltro: familia ? `Espécies da Família ${familia}` : 'Todos os dados',
            data: format(new Date(), 'dd/MM/yyyy'),
            dados,
            tableFormato: 2,
        });
    } catch (e) {
        next(e);
    }
};

export const obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData = async (req, res, next) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { local, dataInicio, dataFim, variante } = req.query;

    let whereLocal = {};
    let whereData = {};
    if (local) {
        whereLocal = {
            descricao: { [Op.like]: `%${local}%` },
        };
    }
    if (dataInicio) {
        if (dataFim && isBefore(new Date(dataFim), new Date(dataInicio))) {
            res.status(codigosHttp.BAD_REQUEST).json({
                mensagem: 'A data de fim não pode ser anterior à data de início.',
            });
        }
        if (isBefore(new Date(), new Date(dataInicio))) {
            res.status(codigosHttp.BAD_REQUEST).json({
                mensagem: 'A data de início não pode ser maior que a data atual.',
            });
        }
        whereData = {
            [Op.and]: [
                // Transforma os valores em uma data e compara com o intervalo
                Sequelize.where(
                    literal(
                        "STR_TO_DATE(CONCAT(data_coleta_ano, '-', LPAD(data_coleta_mes, 2, '0'), '-', LPAD(data_coleta_dia, 2, '0')), '%Y-%m-%d')"
                    ),
                    { [Op.between]: [dataInicio, dataFim || new Date()] }
                ),
            ],
        };
    }

    try {
        const tombos = await Tombo.findAndCountAll({
            attributes: ['hcf', 'numero_coleta', 'nome_cientifico', 'data_coleta_ano', 'data_coleta_mes', 'data_coleta_dia'],
            where: whereData,
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
                            required: true,
                        },
                        {
                            model: Autor,
                            attributes: ['id', 'nome'],
                            as: 'autor',
                        },
                    ],
                },
                {
                    model: LocalColeta,
                    attributes: ['id', 'descricao', 'complemento'],
                    where: whereLocal,
                    required: true,
                },
            ],
            offset,
        });

        if (req.method === 'GET') {
            res.json({
                metadados: {
                    total: tombos.count,
                    pagina,
                    limite,
                },
                resultado: formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows),
                filtro: formataTextFilter(local, dataInicio, dataFim || new Date()),
            });
            return;
        }

        try {
            const dadosFormatados = formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows);
            const buffer = await generateReport(
                ReportColetaPorLocalIntervaloDeData, {
                    dados: dadosFormatados,
                    total: variante === 'analitico' ? tombos.count : undefined,
                    textoFiltro: formataTextFilter(local, dataInicio, dataFim || new Date()),
                });
            const readable = new Readable();
            // eslint-disable-next-line no-underscore-dangle
            readable._read = () => {}; // Implementa o método _read (obrigatório)
            readable.push(buffer); // Empurrar os dados binários para o stream
            readable.push(null); // Indica o fim do fluxo de dados
            res.setHeader('Content-Type', 'application/pdf');
            readable.pipe(res);
        } catch (e) {
            next(e);
        }

    } catch (e) {
        next(e);
    }
};

export const obtemDadosDoRelatorioDeColetaIntervaloDeData = async (req, res, next) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { dataInicio, dataFim, variante } = req.query;

    let whereData = {};
    if (dataInicio) {
        if (dataFim && isBefore(new Date(dataFim), new Date(dataInicio))) {
            res.status(codigosHttp.BAD_REQUEST).json({
                mensagem: 'A data de fim não pode ser anterior à data de início.',
            });
        }
        if (isBefore(new Date(), new Date(dataInicio))) {
            res.status(codigosHttp.BAD_REQUEST).json({
                mensagem: 'A data de início não pode ser maior que a data atual.',
            });
        }
        whereData = {
            [Op.and]: [
                // Transforma os valores em uma data e compara com o intervalo
                Sequelize.where(
                    literal(
                        "STR_TO_DATE(CONCAT(data_coleta_ano, '-', LPAD(data_coleta_mes, 2, '0'), '-', LPAD(data_coleta_dia, 2, '0')), '%Y-%m-%d')"
                    ),
                    { [Op.between]: [dataInicio, dataFim || new Date()] }
                ),
            ],
        };
    }

    try {
        const tombos = await Tombo.findAndCountAll({
            attributes: ['hcf', 'numero_coleta', 'nome_cientifico', 'data_coleta_ano', 'data_coleta_mes', 'data_coleta_dia'],
            where: whereData,
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
                            required: true,
                        },
                        {
                            model: Autor,
                            attributes: ['id', 'nome'],
                            as: 'autor',
                        },
                    ],
                },
            ],
            offset,
        });

        if (req.method === 'GET') {
            res.json({
                metadados: {
                    total: tombos.count,
                    pagina,
                    limite,
                },
                resultado: formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows),
                filtro: formataTextFilter(null, dataInicio, dataFim || new Date()),
            });
            return;
        }

        try {
            const dadosFormatados = formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows);
            const buffer = await generateReport(
                ReportColetaPorLocalIntervaloDeData, {
                    dados: dadosFormatados,
                    total: variante === 'analitico' ? tombos.count : undefined,
                    textoFiltro: formataTextFilter(null, dataInicio, dataFim || new Date()),
                });
            const readable = new Readable();
            // eslint-disable-next-line no-underscore-dangle
            readable._read = () => { }; // Implementa o método _read (obrigatório)
            readable.push(buffer); // Empurrar os dados binários para o stream
            readable.push(null); // Indica o fim do fluxo de dados
            res.setHeader('Content-Type', 'application/pdf');
            readable.pipe(res);
        } catch (e) {
            next(e);
        }

    } catch (e) {
        next(e);
    }
};
