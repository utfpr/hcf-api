import { format } from 'date-fns';

export const agruparPorNomeCientifico = dados => dados.reduce((acc, obj) => {
    let nomeCientifico;
    if (obj?.nome_genero && obj?.nome_especie) {
        nomeCientifico = `${obj?.nome_genero} ${obj?.nome_especie}`;
    } else if (obj?.nome_genero) {
        nomeCientifico = obj?.nome_genero;
    } else if (obj?.nome_especie) {
        nomeCientifico = obj?.nome_especie;
    } else {
        nomeCientifico = 'Não Informada';
    }

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
    quantidadeDeTombos: item.tombos.length,
}));

export const formatarDadosParaRealtorioDeInventarioDeEspecies = dados => {
    const dadosFormatados = dados.map(dado => ({
        familia: dado.familia,
        especies: agruparPorNomeCientifico(dado.itens).sort((a, b) => a.especie?.localeCompare(b?.especie)),
    }));
    return dadosFormatados;
};

const defineNomeCientifico = dado => {
    let nomeCientifico;
    const nomeEspecie = dado?.especy?.nome;
    const nomeGenero = dado?.especy?.genero?.nome;
    if (nomeGenero && nomeEspecie) {
        nomeCientifico = `${nomeGenero} ${nomeEspecie}`;
    } else if (nomeGenero) {
        nomeCientifico = nomeGenero;
    } else if (nomeEspecie) {
        nomeCientifico = nomeEspecie;
    } else {
        nomeCientifico = 'Não Informada';
    }

    return nomeCientifico;
};

export const formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData = dados => {
    const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const dadosFormatados = dados.map(dado => ({
        local: dado.locais_coletum?.complemento ?
            `${dado.locais_coletum.descricao} ${dado.locais_coletum.complemento}` :
            dado.locais_coletum?.descricao,
        data: `${String(dado.data_coleta_dia).padStart(2, '0')}/${romanos[dado.data_coleta_mes - 1]}/${dado.data_coleta_ano}`,
        tombo: dado?.hcf,
        numeroColeta: dado.numero_coleta || '-',
        especie: defineNomeCientifico(dado),
        familia: dado.especy.familia.nome,
        autor: dado.coletore?.nome || 'Não Informado',

    }));

    // Ordena os dados formatados por ordem alfabética
    dadosFormatados.sort((a, b) => a.familia.localeCompare(b.familia));

    return dadosFormatados;
};

export const formataTextFilter = (local, inicio, fim) => {
    let filtro = 'Coletados';
    if (inicio && fim) {
        filtro += ` no período ${format(new Date(inicio), 'dd/MM/yyyy')} à ${format(new Date(fim), 'dd/MM/yyyy')}`;
    }
    if (local) {
        filtro += ` no local ${local}`;
    }
    return filtro;
};

export const agruparPorFamilia = dados => dados.reduce((acc, obj) => {
    const nomeFamilia = obj?.nome_familia || 'Não Informada';
    const grupoExistente = acc.find(item => item.familia === nomeFamilia);

    if (grupoExistente) {
        grupoExistente.itens.push(obj);
    } else {
        acc.push({
            familia: nomeFamilia,
            itens: [obj],
        });
    }

    return acc;
}, []);
