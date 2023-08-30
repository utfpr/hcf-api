// @ts-nocheck
import moment from 'moment-timezone';
import models from '../models';

const {
    Solo, Relevo, Cidade, Estado, Pais, Vegetacao, FaseSucessional, Tipo, LocalColeta, Familia,
    Genero, Subfamilia, Autor, Coletor, Variedade, Subespecie, Usuario,
    ColecaoAnexa, Especie, Herbario, Tombo, TomboFoto,
} = models;

export const nomeParaIniciais = nomeSobrenome => {
    let nomeCompleto = nomeSobrenome;
    nomeCompleto = nomeCompleto.replace(/\s(de|da|dos|das)\s/g, ' '); // Remove os de,da, dos,das.
    const iniciais = nomeCompleto.match(/\b(\w)/gi); // Iniciais de cada parte do nome.
    const nome = nomeCompleto.split(' ')[0].toLowerCase(); // Primeiro nome.
    const sobrenomes = iniciais.splice(1, iniciais.length - 1).join('').toLowerCase(); // Iniciais
    return sobrenomes + nome;
};


function obtemNomeArquivoCsv() {
    const data = moment()
        .format('YYYY-MM-DD');

    return `hcf_${data}.csv`;
}

export const obterModeloDarwinCore = (request, response, next) => {
    Promise.resolve()
        .then(() => Tombo.findAll({
            where: {
                ativo: true,
                rascunho: 0,
            },
            attributes: [
                'data_coleta_mes',
                'data_coleta_ano',
                'situacao',
                'nome_cientifico',
                'hcf',
                'data_tombo',
                'data_coleta_dia',
                'observacao',
                'nomes_populares',
                'numero_coleta',
                'updated_at',
                'latitude',
                'longitude',
                'altitude',
                'taxon',
                'entidade_id',
                'local_coleta_id',
                'variedade_id',
                'tipo_id',
                'especie_id',
                'genero_id',
                'familia_id',
                'sub_familia_id',
                'sub_especie_id',
                'colecao_anexa_id',
            ],
            include: [
                {
                    model: Herbario,
                },
                {
                    model: TomboFoto,
                },
                {
                    model: Usuario,
                },
                {
                    model: LocalColeta,
                    include: [
                        {
                            model: Cidade,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
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
                        {
                            model: FaseSucessional,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
                        },
                        {
                            model: Solo,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
                        },
                        {
                            model: Relevo,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
                        },
                        {
                            model: Vegetacao,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
                        },
                    ],
                },
                {
                    model: Variedade,
                    include: {
                        model: Autor,
                        attributes: {
                            exclude: ['updated_at', 'created_at', 'ativo'],
                        },
                    },
                },
                {
                    model: Tipo,
                    attributes: ['id', 'nome'],
                },
                {
                    model: Especie,
                    include: {
                        model: Autor,
                        attributes: {
                            exclude: ['updated_at', 'created_at', 'ativo'],
                        },
                    },
                },
                {
                    model: ColecaoAnexa,
                },
                {
                    model: Coletor,
                    attributes: ['id', 'nome'],
                },
                {
                    model: Genero,
                },
                {
                    model: Familia,
                },
                {
                    model: Subfamilia,
                },
                {
                    model: Subespecie,
                    include: {
                        model: Autor,
                        attributes: {
                            exclude: ['updated_at', 'created_at', 'ativo'],
                        },
                    },
                },
            ],

        }))
        .then(retorno => {
            const license = 'Os dados nao devem ser usados para fins comerciais.'
                + 'Qualquer uso dos dados de registros em análises ou publicações devem constar nos agradecimentos.'
                + 'não podem ser redistribuídos com a devida indicação de procedência dos dados originais.'
                + 'e o responsável pela coleção deverá ser notificado. os dados. mesmo parciais.'
                + 'sem explícita autorização escrita do responsável pela coleção.'
                + 'Uma cópia de qualquer publicação em que os dados sejam citados deve ser enviada ao Herbário HCF.'
                + 'Pesquisadores e suas instituições são responsáveis pelo uso adequado dos dados.'
                + 'Este herbário procura minimizar a entrada de erros dos dados. entretanto não garantimos que a base'
                + 'de dados esteja livre de erros. tanto na identificação quanto na transcrição dos dados'
                + 'de coleta das amostras.';

            const cabecalho = 'basisOfRecord\ttype\tlanguage\tmodified\tinstitutionID\tinstitutionCode\t'
                + 'collectionCode\tlicense\trightsHolder\tdynamicProperties\toccurrenceID\tcatalogNumber\t'
                + 'recordedBy\trecordNumber\tdisposition\toccurrenceRemarks\teventDate\tyear\tmonth\tday\t'
                + 'habitat\tcontinent\tcountry\tcountryCode\tstateProvince\tcounty\tminimumElevationInMeters\t'
                + 'maximumElevationInMeters\tverbatimLatitude\tverbatimLongitude\tdecimalLatitude\t'
                + 'decimalLongitude\tgeodeticDatum\tgeoreferenceProtocol\tkingdom\tfamily\tgenus\t'
                + 'specificEpithet\tinfraspecificEpithet\tscientificName\tscientificNameAuthorship\ttaxonRank\t'
                + 'vernacularName\ttaxonRemarks\ttypeStatus\tidentifiedBy\tdateIdentified\tidentificationQualifier\n';

            response.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment;filename=${obtemNomeArquivoCsv()}`,
            });

            response.write(cabecalho);

            retorno.forEach(tombo => {
                // eslint-disable-next-line
                let autores = '';
                let coletores = '';
                let dataColeta = '';
                let dataIdentificacao = '';
                let identificationQualifier = '';
                let nomeIdentificador = '';
                const paisNome = tombo.locais_coletum && tombo.locais_coletum.cidade ? tombo.locais_coletum.cidade.estado.paise.nome : '';
                const paisCodigo = tombo.locais_coletum && tombo.locais_coletum.cidade ? tombo.locais_coletum.cidade.estado.paise.sigla : '';
                const paranaNome = tombo.locais_coletum && tombo.locais_coletum.cidade ? tombo.locais_coletum.cidade.estado.nome : '';
                const cidadeNome = tombo.locais_coletum && tombo.locais_coletum.cidade ? tombo.locais_coletum.cidade.nome : '';
                const vegetacao = tombo.locais_coletum && tombo.locais_coletum.vegetaco ? tombo.locais_coletum.vegetaco.nome : '';
                const familiaNome = tombo.familia ? tombo.familia.nome : '';
                const generoNome = tombo.genero ? tombo.genero.nome : '';
                const especieNome = tombo.especy ? tombo.especy.nome : '';
                const nomeTipo = tombo.tipo ? tombo.tipo.nome : '';
                let menorNomeCientifico = '';
                if (tombo.sub_especy) {
                    menorNomeCientifico = tombo.sub_especy.nome;
                }
                if (tombo.variedade) {
                    menorNomeCientifico = tombo.variedade.nome;
                }
                if (tombo.especy && tombo.especy.autore) {
                    autores = tombo.especy.autore.nome;
                }
                if (tombo.sub_especy && tombo.sub_especy.autore) {
                    autores += `| ${tombo.sub_especy.autore.nome}`;
                }
                if (tombo.variedade && tombo.variedade.autore) {
                    autores += `| ${tombo.variedade.autore.nome}`;
                }
                if (tombo.coletores && tombo.coletores.length > 0) {
                    coletores += tombo.coletores.map(coletor => nomeParaIniciais(coletor.nome));
                }
                if (tombo.data_coleta_ano) {
                    dataColeta = tombo.data_coleta_ano;
                }
                if (tombo.data_coleta_mes) {
                    if (dataColeta !== '') {
                        dataColeta += `-${tombo.data_coleta_mes}`;
                    }
                }
                if (tombo.data_coleta_dia) {
                    if (dataColeta !== '') {
                        dataColeta += `-${tombo.data_coleta_dia}`;
                    }
                }
                if (tombo.data_identificacao_ano) {
                    dataIdentificacao = tombo.data_identificacao_ano;
                }
                if (tombo.data_identificacao_mes) {
                    if (dataIdentificacao !== '') {
                        dataIdentificacao += `-${tombo.data_identificacao_mes}`;
                    }
                }
                if (tombo.data_identificacao_dia) {
                    if (dataIdentificacao !== '') {
                        dataIdentificacao += `-${tombo.data_identificacao_dia}`;
                    }
                }
                if (tombo.especy) {
                    if (tombo.especy.nome.includes('cf.')) {
                        identificationQualifier = 'cf.';
                    }
                    if (tombo.especy.nome.includes('aff.')) {
                        identificationQualifier = 'aff.';
                    }
                }
                if (tombo.usuarios.length > 0) {
                    tombo.usuarios.map(usuario => {
                        if (usuario.alteracoes.ativo && usuario.alteracoes.identificacao) {
                            nomeIdentificador = nomeParaIniciais(usuario.nome);
                        }
                        return '';
                    });
                }
                if (tombo.tombos_fotos && tombo.tombos_fotos.length > 0) {
                    tombo.tombos_fotos.forEach(foto => {
                        const dataAtualizacao = moment(tombo.updated_at)
                            .format('YYYY-MM-DD');

                        let linha = [
                            `PreservedSpecimen\tColecao\tpt\t${dataAtualizacao}\t02.032.297/0005-26\t`,
                            'UTFPR\tHerbario da Universidade Tecnologica Federal do Parana – Campus Campo Mourao – HCF\t',
                            `${license}\tUTFPR\t{"barcode":${foto.codigo_barra}}\tBr:UTFPR:HCF:${tombo.hcf.toString()}`,
                            `${foto.id.toString()}\t${tombo.hcf.toString()}${foto.id.toString()}\t${coletores}\t`,
                            `${tombo.numero_coleta}\t\t${tombo.observacao}\t${dataColeta}\t`,
                            `${tombo.data_coleta_ano}\t${tombo.data_coleta_mes}\t${tombo.data_coleta_dia}\t`,
                            `${vegetacao}\t${'América do Sul'}\t${paisNome}\t${paisCodigo}\t${paranaNome}\t`,
                            `${cidadeNome}\t${tombo.altitude}\t${tombo.altitude}\t\t\t${tombo.latitude}\t`,
                            `${tombo.longitude}\t${'WGS84'}\t${'GPS'}\t${'Plantae'}\t${familiaNome}\t${generoNome}\t`,
                            `${especieNome}\t${menorNomeCientifico}\t${tombo.nome_cientifico}\t${autores}\t${tombo.taxon}`,
                            `\t${tombo.nomes_populares}\t\t${nomeTipo}\t${nomeIdentificador}\t${dataIdentificacao}`,
                            `\t${identificationQualifier}`,
                        ].join('');
                        linha = linha.replace(/(null|undefined)/g, '');
                        response.write(`${linha}\n`);
                    });
                } else {
                    const dataAtualizacao = moment(tombo.updated_at)
                        .format('YYYY-MM-DD');

                    let linha = [
                        `PreservedSpecimen\tColecao\tpt\t${dataAtualizacao}\t02.032.297/0005-26\t`,
                        'UTFPR\tHerbario da Universidade Tecnologica Federal do Parana – Campus Campo Mourao – HCF\t',
                        `${license}\tUTFPR\t{"barcode":}\tBr:UTFPR:HCF:${tombo.hcf.toString()}`,
                        `\t${tombo.hcf.toString()}\t${coletores}\t`,
                        `${tombo.numero_coleta}\t\t${tombo.observacao}\t${dataColeta}\t`,
                        `${tombo.data_coleta_ano}\t${tombo.data_coleta_mes}\t${tombo.data_coleta_dia}\t`,
                        `${vegetacao}\t${'América do Sul'}\t${paisNome}\t${paisCodigo}\t${paranaNome}\t`,
                        `${cidadeNome}\t${tombo.altitude}\t${tombo.altitude}\t\t\t${tombo.latitude}\t`,
                        `${tombo.longitude}\t${'WGS84'}\t${'GPS'}\t${'Plantae'}\t${familiaNome}\t${generoNome}\t`,
                        `${especieNome}\t${menorNomeCientifico}\t${tombo.nome_cientifico}\t${autores}\t${tombo.taxon}`,
                        `\t${tombo.nomes_populares}\t\t${nomeTipo}\t${nomeIdentificador}\t${dataIdentificacao}`,
                        `\t${identificationQualifier}`,
                    ].join('');

                    linha = linha.replace(/null|undefined/g, '');
                    response.write(`${linha}\n`);
                }
            });

            response.end();
        })
        .catch(next);
};

export default {};
