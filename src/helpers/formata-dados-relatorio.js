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
    const nomeGenero = dado?.genero?.nome;
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
        local: dado.locais_coletum?.complemento
            ? `${dado.locais_coletum.descricao} ${dado.locais_coletum.complemento}`
            : dado.locais_coletum?.descricao,
        data: `${String(dado.data_coleta_dia).padStart(2, '0')}/${romanos[dado.data_coleta_mes - 1]}/${dado.data_coleta_ano}`,
        tombo: dado?.hcf,
        numeroColeta: dado.numero_coleta || '-',
        especie: defineNomeCientifico(dado),
        familia: dado?.familia?.nome || 'Não Informada',
        autor: dado.especy?.autor?.nome || 'Não Informado',
    }));

    // Ordena os dados formatados por ordem alfabética
    dadosFormatados.sort((a, b) => a.familia.localeCompare(b.familia));

    return dadosFormatados;
};

export const formatarDadosParaRelatorioDeColetaPorColetorEIntervaloDeData = dados => {
    const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const dadosFormatados = dados.map(dado => {
        if (dado?.numero_coleta && dado?.numero_coleta !== null) {
            return {
                data: `${String(dado.data_coleta_dia).padStart(2, '0')}/${romanos[dado.data_coleta_mes - 1]}/${dado.data_coleta_ano}`,
                tombo: dado?.hcf,
                numeroColeta: dado.numero_coleta || '-',
                especie: defineNomeCientifico(dado),
                familia: dado.especy.familia.nome,
                autor: dado.especy?.autor?.nome || 'Não Informado',
            };
        }

        return null;
    }).filter(dado => dado !== null);

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

export const formataTextFilterColetor = (coletor, inicio, fim) => {
    let filtro = 'Coletados';
    if (inicio && fim) {
        filtro += ` no período ${format(new Date(inicio), 'dd/MM/yyyy')} à ${format(new Date(fim), 'dd/MM/yyyy')}`;
    }
    if (coletor) {
        filtro += ` por ${coletor}`;
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

export const agruparPorFamiliaComContadorECodigo = dados => dados.reduce((acc, obj) => {
    const nomeFamilia = obj?.especy?.familia?.nome || 'Não Informada';
    const grupoExistente = acc.find(item => item.familia === nomeFamilia);

    if (grupoExistente) {
        grupoExistente.itens.push(obj);
        grupoExistente.count += 1;
    } else {
        acc.push({
            familia: nomeFamilia,
            codigo: obj?.especy?.familia?.id || 'Não Informado',
            itens: [obj],
            count: 1,
        });
    }

    return acc;
}, []);

export function agruparResultadoPorFamilia(registros) {
    const familias = {};

    registros.forEach(({ familia, genero, especie, quantidade, totalFamilia, familiaCodigo }) => {
        if (!familias[familia]) {
            familias[familia] = {
                familia,
                familiaCodigo,
                total: totalFamilia,
                especies: [],
            };
        }

        familias[familia].especies.push({
            genero,
            especie,
            quantidade,
        });
    });

    // Converte para array
    return Object.values(familias);
}

export function agruparPorFamiliaGeneroEspecie(dados) {
    const resultado = [];

    dados.forEach(familiaObj => {
        const nomeFamilia = familiaObj.familia;
        const contagem = {};

        // Contar combinações genero + especie
        familiaObj.itens.forEach(item => {
            const genero = item.especy.genero.nome;
            const especie = item.especy.nome;
            const chave = `${genero}||${especie}`;

            if (!contagem[chave]) {
                contagem[chave] = { genero, especie, quantidade: 0 };
            }

            contagem[chave].quantidade += 1;
        });

        // Total da família
        const totalFamilia = Object.values(contagem).reduce((acc, curr) => acc + curr.quantidade, 0);

        // Monta o resultado por espécie
        Object.values(contagem).forEach(item => {
            resultado.push({
                familia: nomeFamilia,
                familiaCodigo: familiaObj.codigo,
                genero: item.genero,
                especie: item.especie,
                quantidade: item.quantidade,
                totalFamilia,
            });
        });
    });

    return resultado;
}

export function agruparPorLocal(dados) {
    const agrupado = {};
    let quantidadeTotal = 0;

    dados.sort((a, b) => {
        const familia = a?.familia?.nome.localeCompare(b?.familia?.nome);
        if (familia !== 0) return familia;

        const genero = a?.genero?.nome.localeCompare(b?.genero?.nome);
        if (genero !== 0) return genero;

        return a?.especy?.nome.localeCompare(b?.especy?.nome);
    }).forEach(entradaOriginal => {
        const locaisColetum = entradaOriginal.locais_coletum;
        const cidade = locaisColetum?.cidade;
        const estado = cidade?.estado?.nome || 'Desconhecido';
        const estadoSigla = cidade?.estado?.sigla || '-';
        const municipio = cidade?.nome || 'Desconhecido';
        const local = locaisColetum?.descricao?.trim() || 'Local não informado';

        const chave = `${estado} > ${municipio} > ${local}`;

        const entrada = {
            ...entradaOriginal,
            latitude: cidade?.latitude || null,
            longitude: cidade?.longitude || null,
            autor: entradaOriginal.especy?.autor?.nome || 'Não Informado',
        };

        if (!agrupado[chave]) {
            agrupado[chave] = {
                estado,
                estadoSigla,
                municipio,
                local,
                latitude: cidade?.latitude || null,
                longitude: cidade?.longitude || null,
                quantidadeRegistros: 0,
                registros: [],
            };
        }

        agrupado[chave].registros.push(entrada);
        agrupado[chave].quantidadeRegistros += 1;
        quantidadeTotal += 1;

    });

    // Transforma o objeto em um array
    const locais = Object.values(agrupado);

    const locaisComResumo = adicionarResumoTaxonomicoPorLocal(locais);

    return {
        locais: locaisComResumo,
        quantidadeTotal,
    };
}

export function adicionarResumoTaxonomicoPorLocal(locaisAgrupados) {
    return locaisAgrupados.map(local => {
        const familias = new Set();
        const generos = new Set();
        const especies = new Set();

        for (const reg of local.registros) {
            // família
            const familiaId = reg.familia_id ?? reg.familia?.id;
            if (familiaId != null) {
                familias.add(familiaId);
            }

            // gênero
            const generoId = reg.genero_id ?? reg.genero?.id;
            if (generoId != null) {
                generos.add(generoId);
            }

            // espécie
            const especieId = reg.especie_id ?? reg.especy?.id;
            if (especieId != null) {
                especies.add(especieId);
            }
        }

        return {
            ...local,
            quantidadeFamilias: familias.size,
            quantidadeGeneros: generos.size,
            quantidadeEspecies: especies.size,
        };
    });
}

export function agruparPorGenero(dados) {
    return dados.map(familia => {
        const generosMap = new Map();

        familia.itens.forEach(item => {
            const { genero } = item.especy;
            const key = genero.id;

            if (!generosMap.has(key)) {
                generosMap.set(key, {
                    id: genero.id,
                    nome: genero.nome,
                    quantidade: 0,
                });
            }

            generosMap.get(key).quantidade += 1;
        });

        return {
            familia: familia.familia,
            codigo: familia.codigo,
            generos: Array.from(generosMap.values()).sort((a, b) => b.quantidade - a.quantidade),
        };
    });
}
