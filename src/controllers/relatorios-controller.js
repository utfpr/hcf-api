import { isBefore } from 'date-fns';
import { Readable } from 'stream';

import {
    agruparPorFamilia,
    formatarDadosParaRealtorioDeInventarioDeEspecies,
    formataTextFilter,
    formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData,
    formatarDadosParaRelatorioDeColetaPorColetorEIntervaloDeData,
    formataTextFilterColetor,
    agruparPorLocal,
    agruparPorFamiliaGeneroEspecie,
    agruparPorFamilia2,
    agruparResultadoPorFamilia,
} from '~/helpers/formata-dados-relatorio';
import { generateReport } from '~/reports/reports';
import ReportInventario from '~/reports/templates/InventarioEspecies';
import ReportLocalColeta from '~/reports/templates/LocaisColeta';
import ReportFamiliasGeneros from '~/reports/templates/RelacaoFamiliasGenero';
import ReportColetaModelo1 from '~/reports/templates/RelacaoTombos';
import ReportColetaModelo2 from '~/reports/templates/RelacaoTombosComColeta';
import codigosHttp from '~/resources/codigos-http';

import models from '../models';

const {
    Sequelize: { Op, literal },
    Familia,
    Especie,
    Genero,
    Tombo,
    LocalColeta,
    Autor,
    Sequelize,
    sequelize,
    Coletor,
    Cidade,
    Estado,
    Pais,
} = models;

/// ////// Relatório de Inventário de Espécies //////////
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
        const dadosFormatados = dados;
        const buffer = await generateReport(
            ReportInventario, {
                dados: dadosFormatados,
            });
        const readable = new Readable();
        // eslint-disable-next-line no-underscore-dangle
        readable._read = () => { }; // Implementa o método _read (obrigatório)
        readable.push(buffer); // Empurrar os dados binários para o stream
        readable.push(null); // Indica o fim do fluxo de dados
        res.setHeader('Content-Type', 'application/pdf');
        readable.pipe(res);
    // gerarRelatorioPDF(res, {
    //     tipoDoRelatorio: 'Inventário de Espécies',
    //     textoFiltro: familia ? `Espécies da Família ${familia}` : 'Todos os dados',
    //     data: format(new Date(), 'dd/MM/yyyy'),
    //     dados,
    //     tableFormato: 2,
    // });
    } catch (e) {
        next(e);
    }
};

/// ////// Relatório de Coleta por Local e Intervalo de Data //////////
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
                ReportColetaModelo1, {
                    dados: dadosFormatados,
                    total: variante === 'analitico' ? tombos.count : undefined,
                    textoFiltro: formataTextFilter(local, dataInicio, dataFim || new Date()),
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

// ////// Relatório de Coleta por Intervalo de Data //////////
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
                ReportColetaModelo1, {
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

// ////// Relatório de Coleta por Coletor e Intervalo de Data //////////
export const obtemDadosDoRelatorioDeColetaPorColetorEIntervaloDeData = async (req, res, next) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { coletor, dataInicio, dataFim, variante, modelo } = req.query;

    let whereColetor = {};
    let whereData = {};
    if (coletor) {
        whereColetor = {
            nome: { [Op.like]: `%${coletor}%` },
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
                    model: Coletor,
                    where: whereColetor,
                    required: true,
                    attributes: ['id', 'nome'],
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
                resultado: formatarDadosParaRelatorioDeColetaPorColetorEIntervaloDeData(tombos.rows),
                filtro: formataTextFilterColetor(coletor, dataInicio, dataFim || new Date()),
            });
            return;
        }

        try {
            const dadosFormatados = formatarDadosParaRelatorioDeColetaPorColetorEIntervaloDeData(tombos.rows);
            const buffer = !modelo || modelo === '1' ? await generateReport(
                ReportColetaModelo1, {
                    dados: dadosFormatados,
                    total: variante === 'analitico' ? tombos.count : undefined,
                    textoFiltro: formataTextFilterColetor(coletor || null, dataInicio, dataFim || new Date()),
                }) : await generateReport(
                ReportColetaModelo2, {
                    dados: dadosFormatados,
                    total: variante === 'analitico' ? tombos.count : undefined,
                    textoFiltro: formataTextFilterColetor(coletor || null, dataInicio, dataFim || new Date()),
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

/// ////// Relatório de Locais de Coleta //////////
export const obtemDadosDoRelatorioDeLocalDeColeta = async (req, res, next) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { local, dataInicio, dataFim } = req.query;

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
                    ],
                },
                {
                    model: LocalColeta,
                    attributes: ['id', 'descricao', 'complemento'],
                    where: whereLocal,
                    required: true,
                    include: {
                        model: Cidade,
                        attributes: ['nome', 'latitude', 'longitude'],
                        include: [
                            {
                                model: Estado,
                                include: [
                                    {
                                        model: Pais,
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
            offset,
        });

        const dadosPuros = tombos.rows.map(registro => registro.get({ plain: true }));
        const dadosFormatados = agruparPorLocal(dadosPuros);

        if (req.method === 'GET') {
            res.json({
                metadados: {
                    total: tombos.count,
                    pagina,
                    limite,
                },
                resultado: dadosFormatados,
                filtro: formataTextFilter(local, dataInicio, dataFim || new Date()),
            });
            return;
        }

        try {
            // res.json({
            //   metadados: {
            //     total: tombos.count,
            //     pagina,
            //     limite,
            //   },
            //   resultado: dadosFormatados,
            //   filtro: formataTextFilter(local, dataInicio, dataFim || new Date()),
            // });
            const buffer = await generateReport(
                ReportLocalColeta, {
                    dados: dadosFormatados.locais,
                    total: dadosFormatados?.quantidadeTotal || 0,
                    textoFiltro: formataTextFilter(local, dataInicio, dataFim || new Date()),
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

/// ////// Relatório de Famílias e Gêneros //////////
export const obtemDadosDoRelatorioDeFamiliasEGeneros = async (req, res, next) => {
    const { paginacao } = req;
    const { limite, pagina, offset } = paginacao;
    const { familia } = req.query;

    let where = {};
    if (familia) {
        where = {
            nome: { [Op.like]: `%${familia}%` },
        };
    }

    try {
        const tombos = await Tombo.findAndCountAll({
            attributes: ['hcf'],
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
            offset,
        });

        const dadosPorFamilia1 = agruparPorFamilia2(tombos.rows.map(registro => registro.get({ plain: true })));
        const dadosPorFamilia = agruparPorFamiliaGeneroEspecie(dadosPorFamilia1);
        const dadosFormatados = agruparResultadoPorFamilia(dadosPorFamilia);

        if (req.method === 'GET') {
            res.json({
                metadados: {
                    total: tombos.count,
                    pagina,
                    limite,
                },
                resultado: dadosFormatados,
            });
            return;
        }

        try {
            const buffer = await generateReport(
                ReportFamiliasGeneros, {
                    dados: dadosFormatados,
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
