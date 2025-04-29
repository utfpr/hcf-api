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

export const formatarDadosParaRelatorioDeColetaPorLocalEIntervaloDeData = dados => {
    const dadosFormatados = dados.map(dado => ({
        local: dado.locais_coletum?.complemento ?
            `${dado.locais_coletum.descricao} ${dado.locais_coletum.complemento}` :
            dado.locais_coletum.descricao,
        data: `${String(dado.data_coleta_dia).padStart(2, '0')}/${String(dado.data_coleta_mes).padStart(2, '0')}/${dado.data_coleta_ano}`,
        tombo: dado?.hcf,
        numeroColeta: dado.numero_coleta || '-',
        especie: dado.especy.nome,
        familia: dado.especy.familia.nome,
        autor: dado.coletore?.nome || 'Não Informado',

    }));

    dadosFormatados.sort((a, b) => {
        const dataA = new Date(`${a.data.split('/')[2]}-${a.data.split('/')[1]}-${a.data.split('/')[0]}`);
        const dataB = new Date(`${b.data.split('/')[2]}-${b.data.split('/')[1]}-${b.data.split('/')[0]}`);

        return dataA - dataB; // Ordena de forma crescente (do mais antigo para o mais recente)
    });

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
