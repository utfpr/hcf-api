import { format, isBefore } from 'date-fns';

import {
    agruparPorFamilia,
    formatarDadosParaRealtorioDeInventarioDeEspecies,
    formataTextFilter,
    formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData,
} from '~/helpers/formata-dados-relatorio';
import { gerarRelatorioPDF } from '~/helpers/gerador-relatorio';
import codigosHttp from '~/resources/codigos-http';

import models from '../models';

const {
    Sequelize: { Op, literal }, Familia, Especie, Genero, Tombo, LocalColeta, Coletor, Sequelize, sequelize,
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

export const obtemDadosDoRelatorioDeEspeciesReturn = async req => {
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

    return {
        where,
        dados,
        results,
        familia,
    };
};

export const obtemDadosDoRelatorioDeInventarioDeEspecies = async (req, res, next) => {
    const { where, dados, results, familia } = await obtemDadosDoRelatorioDeEspeciesReturn(req);

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
    const { local, dataInicio, dataFim, toPdf } = req.query;

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
                },
                {
                    model: Coletor,
                    attributes: ['id', 'nome'],
                },
            ],
            offset,
        });

        if (toPdf) {
            gerarRelatorioPDF(res, {
                tipoDoRelatorio: 'Coleta por Local e Intervalo de Data',
                textoFiltro: formataTextFilter(local, dataInicio, dataFim || new Date()),
                data: format(new Date(), 'dd/MM/yyyy'),
                dados: formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows),
                tableFormato: 1,
            });
        } else {
            res.json({
                metadados: {
                    total: tombos.count,
                    pagina,
                    limite,
                },
                resultado: formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData(tombos.rows),
                filtro: formataTextFilter(local, dataInicio, dataFim || new Date()),
            });
        }

    } catch (e) {
        next(e);
    }
};
