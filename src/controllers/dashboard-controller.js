import { Op, Sequelize } from 'sequelize';
import models from '../models/index.js';

const { Tombo, Especie, Coletor, Cidade, Familia, Genero, Herbario } = models; 

const agruparPorIndice = (dados, tamanho, indice, offset = 0) => {
    const array = Array(tamanho).fill(0);
    let total = 0;

    dados.forEach(item => {
        const idx = parseInt(item.get(indice)) - offset;
        const qtd = parseInt(item.get('total'));

        if (idx >= 0 && idx < tamanho) {
            array[idx] += qtd;
            total += qtd;
        }
    });

    return { array, total };
};

const agruparMesPorSemana = (dados) => {
    const array = Array(5).fill(0); 
    let total = 0;
    
    dados.forEach(item => {
        const dia = parseInt(item.get('dia')); 
        const qtd = parseInt(item.get('total'));
        const semanaIdx = Math.floor((dia - 1) / 7);

        if (semanaIdx >= 0 && semanaIdx < 5) {
            array[semanaIdx] += qtd;
            total += qtd;
        }
    });

    return { array, total };
};

const calcularPorcentagem = (atual, passado) => {
    if (passado > 0) return parseFloat((((atual - passado) / passado) * 100).toFixed(1));
    if (atual > 0) return 100.0;
    return 0.0;
};

const formatarRanking = (dadosQuery, aliasTabela) => {
    return dadosQuery.map(item => {
        const info = item[aliasTabela] || item[aliasTabela.charAt(0).toUpperCase() + aliasTabela.slice(1)];

        return {
            nome: info?.nome || info?.sigla || 'N/A',
            total: parseInt(item.get('quantidade'), 10) || 0
        };
    });
};

const formatarSemana = (array) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return array.map((total, index) => ({ dia: dias[index], total }));
};

const formatarAno = (array) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return array.map((total, index) => ({ mes: meses[index], total }));
};

const formatarMes = (array, dataBase) => {
    const ano = dataBase.getFullYear();
    const mes = dataBase.getMonth();
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
    const formatoFinal = [];

    for (let i = 0; i < 5; i++) {
        const diaInicio = (i * 7) + 1;
        if (diaInicio > ultimoDiaDoMes) break; 
        
        const diaFim = Math.min((i + 1) * 7, ultimoDiaDoMes);
        const strInicio = `${String(diaInicio).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}`;
        const strFim = `${String(diaFim).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}`;
        
        formatoFinal.push({ semana: `${strInicio} - ${strFim}`, total: array[i] });
    }

    return formatoFinal;
};

export const tomboInfo = async (request, response, next) => {
    try {
        const ID_HCF = 2; 

        const condicaoBase = {
            rascunho: false,
            ativo: true
        };

        const hoje = new Date();
        
        const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
        const fimSemana = new Date(inicioSemana); fimSemana.setDate(fimSemana.getDate() + 6); fimSemana.setHours(23, 59, 59, 999);
        
        const inicioSemanaPassada = new Date(inicioSemana); inicioSemanaPassada.setDate(inicioSemanaPassada.getDate() - 7);
        const fimSemanaPassada = new Date(fimSemana); fimSemanaPassada.setDate(fimSemanaPassada.getDate() - 7);

        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);

        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        const inicioAnoPassado = new Date(hoje.getFullYear() - 1, 0, 1);
        const fimAnoPassado = new Date(hoje.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

        const [
            total, 
            totalTombados, 
            tombosInternos, 
            tombosExternos,
            totalEspecies, 
            totalFamilias, 
            totalGeneros, 
            totalMunicipios,
            totalColetores, 
            totalHerbarios,
            rankEspecies, 
            rankFamilias, 
            rankGeneros, 
            rankMunicipios, 
            rankColetores,
            rankHerbarios,
            querySemanaAtual, 
            querySemanaPassada,
            queryMesAtual, 
            queryMesPassado,
            queryAnoAtual, 
            queryAnoPassado

        ] = await Promise.all([
            Tombo.count(), // total
            Tombo.count({ where: condicaoBase }), // totalTombados
            Tombo.count({ where: { ...condicaoBase, [Op.or]: [{ entidade_id: null }, { entidade_id: ID_HCF }] } }), // tombosInternos
            Tombo.count({ where: { ...condicaoBase, entidade_id: { [Op.not]: null, [Op.ne]: ID_HCF } } }), // tombosExternos

            Tombo.count({ where: { ...condicaoBase, especie_id: { [Op.not]: null } }, col: 'especie_id', distinct: true }), // totalEspecies
            Tombo.count({ where: { ...condicaoBase, familia_id: { [Op.not]: null } }, col: 'familia_id', distinct: true }), // totalFamilias
            Tombo.count({ where: { ...condicaoBase, genero_id: { [Op.not]: null } }, col: 'genero_id', distinct: true }), // totalGeneros
            Tombo.count({ where: { ...condicaoBase, cidade_id: { [Op.not]: null } }, col: 'cidade_id', distinct: true }), // totalMunicipios
            Tombo.count({ where: { ...condicaoBase, coletor_id: { [Op.not]: null } }, col: 'coletor_id', distinct: true }), // totalColetores
            Tombo.count({ where: { ...condicaoBase, entidade_id: { [Op.not]: null } }, col: 'entidade_id', distinct: true }), // totalHerbarios

            Tombo.findAll({
                where: { ...condicaoBase, especie_id: { [Op.not]: null } },
                attributes: ['especie_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Especie, as: 'especie', attributes: ['nome'] }],
                group: ['especie_id', 'especie.id'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankEspecies
            Tombo.findAll({
                where: { ...condicaoBase, familia_id: { [Op.not]: null } },
                attributes: ['familia_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Familia, as: 'familia', attributes: ['nome'] }],
                group: ['familia_id', 'familia.id', 'familia.nome'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankFamilias
            Tombo.findAll({
                where: { ...condicaoBase, genero_id: { [Op.not]: null } },
                attributes: ['genero_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Genero, as: 'genero', attributes: ['nome'] }],
                group: ['genero_id', 'genero.id', 'genero.nome'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankGeneros
            Tombo.findAll({
                where: { ...condicaoBase, cidade_id: { [Op.not]: null } },
                attributes: ['cidade_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Cidade, attributes: ['nome'] }],
                group: ['cidade_id', 'cidade.id', 'cidade.nome'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankMunicipios
            Tombo.findAll({
                where: { ...condicaoBase, coletor_id: { [Op.not]: null } },
                attributes: ['coletor_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Coletor, as: 'coletor', attributes: ['nome'] }],
                group: ['coletor_id', 'coletor.id', 'coletor.nome'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankColetores
            Tombo.findAll({
                where: { ...condicaoBase, entidade_id: { [Op.not]: null } },
                attributes: ['entidade_id', [Sequelize.fn('COUNT', Sequelize.col('tombos.hcf')), 'quantidade']],
                include: [{ model: Herbario, attributes: ['nome', 'sigla'] }],
                group: ['entidade_id', 'herbario.id', 'herbario.nome', 'herbario.sigla'], order: [[Sequelize.literal('quantidade'), 'DESC']], limit: 5 
            }), // rankHerbarios

            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioSemana, fimSemana] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM data_tombo')), 'dia_semana'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM data_tombo'))]
            }), // querySemanaAtual
            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioSemanaPassada, fimSemanaPassada] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM data_tombo')), 'dia_semana'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM data_tombo'))]
            }), // querySemanaPassada
            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioMes, fimMes] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('DAY FROM data_tombo')), 'dia'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('DAY FROM data_tombo'))]
            }), // queryMesAtual
            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioMesPassado, fimMesPassado] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('DAY FROM data_tombo')), 'dia'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('DAY FROM data_tombo'))]
            }), // queryMesPassado
            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioAno, fimAno] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo')), 'mes'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo'))]
            }), // queryAnoAtual
            Tombo.findAll({
                where: { ...condicaoBase, data_tombo: { [Op.between]: [inicioAnoPassado, fimAnoPassado] } },
                attributes: [[Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo')), 'mes'], [Sequelize.fn('COUNT', Sequelize.col('hcf')), 'total']],
                group: [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_tombo'))]
            }) // queryAnoPassado
        ]);

        const semanaAtual = agruparPorIndice(querySemanaAtual, 7, 'dia_semana', 0);
        const semanaPass = agruparPorIndice(querySemanaPassada, 7, 'dia_semana', 0);
        const mesAtual = agruparMesPorSemana(queryMesAtual);
        const mesPass = agruparMesPorSemana(queryMesPassado);
        const anoAtual = agruparPorIndice(queryAnoAtual, 12, 'mes', 1);
        const anoPass = agruparPorIndice(queryAnoPassado, 12, 'mes', 1);

        return response.status(200).json({
            dados: {
                tombos: {
                    total: total,
                    tombados: totalTombados,
                    internos: tombosInternos,
                    externos: tombosExternos
                },
                taxonomia: {
                    familias: { 
                        total: totalFamilias, 
                        ranking: formatarRanking(rankFamilias, 'familia') 
                    },
                    generos: { 
                        total: totalGeneros, 
                        ranking: formatarRanking(rankGeneros, 'genero') 
                    },
                    especies: { 
                        total: totalEspecies, 
                        ranking: formatarRanking(rankEspecies, 'especie') 
                    }
                },
                municipios: {
                    total: totalMunicipios, 
                    ranking: formatarRanking(rankMunicipios, 'cidade') 
                },
                coletores: {
                    total: totalColetores,
                    ranking: formatarRanking(rankColetores, 'coletor')
                },
                herbarios: {
                    total: totalHerbarios,
                    ranking: formatarRanking(rankHerbarios, 'herbario')
                },
                serie_temporal: {
                    semana: {
                        dados: {
                            atual: formatarSemana(semanaAtual.array),
                            passada: formatarSemana(semanaPass.array),
                        },
                        totais: {
                            atual: semanaAtual.total,
                            passada: semanaPass.total,
                            porcentagem: calcularPorcentagem(semanaAtual.total, semanaPass.total)
                        }
                    },
                    mes: {
                        dados: {
                            atual: formatarMes(mesAtual.array, hoje),
                            passado: formatarMes(mesPass.array, inicioMesPassado),
                        },
                        totais: {
                            atual: mesAtual.total,
                            passado: mesPass.total,
                            porcentagem: calcularPorcentagem(mesAtual.total, mesPass.total)
                        }
                    },
                    ano: {
                        dados: {
                            atual: formatarAno(anoAtual.array),
                            passado: formatarAno(anoPass.array),
                        },
                        totais: {
                            atual: anoAtual.total,
                            passado: anoPass.total,
                            porcentagem: calcularPorcentagem(anoAtual.total, anoPass.total)
                        },
                    }
                }
            }
        });

    } catch (error) {
        next(error);
    }
};
