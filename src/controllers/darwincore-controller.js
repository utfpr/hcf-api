import { format } from 'date-fns';

import { padronizarNomeDarwincore } from '~/helpers/padroniza-nome-darwincore';
import { colunasComoLinhaUnica } from '~/resources/darwincore/cabecalho';
import { license } from '~/resources/darwincore/licenca';

import models from '../models';

const {
    Cidade,
    Estado,
    Pais,
    FaseSucessional,
    Tipo,
    LocalColeta,
    Familia,
    Genero,
    Identificador,
    Subfamilia,
    Autor,
    Coletor,
    ColetorComplementar,
    Variedade,
    Subespecie,
    ColecaoAnexa,
    Especie,
    Herbario,
    Tombo,
    TomboFoto,
    Solo,
    Relevo,
    Vegetacao,
} = models;

export const nomeParaIniciais = nomeSobrenome => {
    let nomeCompleto = nomeSobrenome;
    nomeCompleto = nomeCompleto.replace(/\s(de|da|dos|das)\s/g, ' '); // Remove os de,da, dos,das.
    const iniciais = nomeCompleto.match(/\b(\w)/gi); // Iniciais de cada parte do nome.
    const nome = nomeCompleto.split(' ')[0].toLowerCase(); // Primeiro nome.
    const sobrenomes = iniciais.splice(1, iniciais.length - 1).join('')
        .toLowerCase(); // Iniciais
    return sobrenomes + nome;
};

function obtemNomeArquivoCsv() {
    const data = format(new Date(), 'yyyy-MM-dd');

    return `hcf_${data}.csv`;
}

function csvEscape(valor) {
    if (valor === null || valor === undefined) {
        return '';
    }
    const str = String(valor);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function csvLinha(campos) {
    return campos.map(csvEscape).join(',');
}

const obterModeloDarwinCoreLotes = async (limit, offset, request, response) => {
    const entidadeTombo = await Tombo.findAll({
        limit,
        offset,
        where: {
            rascunho: false,
        },
        attributes: [
            'data_coleta_mes',
            'data_coleta_ano',
            'situacao',
            'nome_cientifico',
            'hcf',
            'data_tombo',
            'data_identificacao_dia',
            'data_identificacao_mes',
            'data_identificacao_ano',
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
            'vegetacao_id',
            'relevo_id',
            'solo_id',
            'coletor_id',
            'cidade_id',
        ],
        include: [
            {
                model: Identificador,
                as: 'identificadores',
                attributes: {
                    exclude: ['updated_at', 'created_at'],
                },
            },
            {
                model: Herbario,
            },
            {
                model: TomboFoto,
            },
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
                model: LocalColeta,
                include: [
                    {
                        model: FaseSucessional,
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
                    as: 'autor',
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'ativo'],
                    },
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
            {
                model: Tipo,
                attributes: ['id', 'nome'],
            },
            {
                model: Especie,
                include: {
                    model: Autor,
                    as: 'autor',
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
            },
            {
                model: ColetorComplementar,
                as: 'coletor_complementar',
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
                    as: 'autor',
                    attributes: {
                        exclude: ['updated_at', 'created_at', 'ativo'],
                    },
                },
            },
        ],
    });

    entidadeTombo.forEach(tombo => {
        let autores = '';
        let coletores = '';
        let dataColeta = '';
        let dataIdentificacao = '';
        let identificationQualifier = '';
        let nomeIdentificador = '';
        const paisNome = tombo?.cidade?.estado?.paise?.nome ?? '';
        const paisCodigo = tombo?.cidade?.estado?.paise?.sigla ?? '';
        const paranaNome = tombo?.cidade?.estado?.nome ?? '';
        const cidadeNome = tombo?.cidade?.nome ?? '';
        const vegetacao = tombo.vegetaco ? tombo.vegetaco.nome : '';
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
        if (tombo.especy && tombo.especy.autor) {
            autores = tombo.especy.autor.nome;
        }
        if (tombo.sub_especy && tombo.sub_especy.autor) {
            autores += `| ${tombo.sub_especy.autor.nome}`;
        }
        if (tombo.variedade && tombo.variedade.autor) {
            autores += `| ${tombo.variedade.autor.nome}`;
        }
        if (tombo.coletore) {
            coletores = padronizarNomeDarwincore(tombo.coletore.nome);
            if (tombo.coletor_complementar?.complementares) {
                coletores += ` | ${tombo.coletor_complementar.complementares}`;
            }
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
            const mesFormatado = tombo.data_identificacao_mes.toString().padStart(2, '0');
            if (dataIdentificacao !== '') {
                dataIdentificacao += `-${mesFormatado}`;
            }
        }
        if (tombo.data_identificacao_dia) {
            const diaFormatado = tombo.data_identificacao_dia.toString().padStart(2, '0');
            if (dataIdentificacao !== '') {
                dataIdentificacao += `-${diaFormatado}`;
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

        if (tombo.identificadores?.length > 0) {
            nomeIdentificador = tombo.identificadores.map(identificador => padronizarNomeDarwincore(identificador.nome)).join(' | ');
        }

        const linhasProcessadas = [];
        if (tombo.tombos_fotos && tombo.tombos_fotos.length > 0) {
            tombo.tombos_fotos.forEach(foto => {
                const dataAtualizacao = format(tombo.updated_at, 'yyyy-MM-dd');

                const campos = [
                    'PreservedSpecimen', 'Colecao', 'pt', dataAtualizacao, '02.032.297/0005-26',
                    'UTFPR', 'Herbario da Universidade Tecnologica Federal do Parana – Campus Campo Mourao – HCF',
                    license, 'UTFPR', `{"barcode":"${foto.codigo_barra}"}`, `Br:UTFPR:HCF:${tombo.hcf}`,
                    tombo.hcf, coletores,
                    tombo.numero_coleta, '', tombo.observacao, dataColeta,
                    tombo.data_coleta_ano, tombo.data_coleta_mes, tombo.data_coleta_dia,
                    vegetacao, 'América do Sul', paisNome, paisCodigo, paranaNome,
                    cidadeNome, tombo.altitude, tombo.altitude, '', '', tombo.latitude,
                    tombo.longitude, 'WGS84', 'GPS', 'Plantae', familiaNome, generoNome,
                    especieNome, menorNomeCientifico, tombo.nome_cientifico, autores, tombo.taxon,
                    tombo.nomes_populares, '', nomeTipo, nomeIdentificador, dataIdentificacao,
                    identificationQualifier,
                ];
                let linha = csvLinha(campos);
                linha = linha.replace(/(null|undefined)/g, '');

                linhasProcessadas.push(`${linha.replace(/[\r\n]/g, '')}\n`);
            });
        } else {
            const dataAtualizacao = format(tombo.updated_at, 'yyyy-MM-dd');

            const campos = [
                'PreservedSpecimen', 'Colecao', 'pt', dataAtualizacao, '02.032.297/0005-26',
                'UTFPR', 'Herbario da Universidade Tecnologica Federal do Parana – Campus Campo Mourao – HCF',
                license, 'UTFPR', '{"barcode":""}', `Br:UTFPR:HCF:${tombo.hcf}`,
                tombo.hcf, coletores,
                tombo.numero_coleta, '', tombo.observacao, dataColeta,
                tombo.data_coleta_ano, tombo.data_coleta_mes, tombo.data_coleta_dia,
                vegetacao, 'América do Sul', paisNome, paisCodigo, paranaNome,
                cidadeNome, tombo.altitude, tombo.altitude, '', '', tombo.latitude,
                tombo.longitude, 'WGS84', 'GPS', 'Plantae', familiaNome, generoNome,
                especieNome, menorNomeCientifico, tombo.nome_cientifico, autores, tombo.taxon,
                tombo.nomes_populares, '', nomeTipo, nomeIdentificador, dataIdentificacao,
                identificationQualifier,
            ];
            let linha = csvLinha(campos);

            linha = linha.replace(/null|undefined/g, '');

            linhasProcessadas.push(`${linha.replace(/[\r\n]/g, '')}\n`);
        }

        response.write(`${linhasProcessadas}`);
    });
};

export const obterModeloDarwinCore = async (request, response, next) => {

    const limit = request.query.limit > 1000 ? 1000 : request.query.limit || 1000;

    const quantidadeTombos = await Tombo.count({ col: 'hcf' });

    const cabecalho = colunasComoLinhaUnica();

    response.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment;filename=${obtemNomeArquivoCsv()}`,
    });

    response.write(cabecalho);

    const quantidadeLotes = Math.ceil(quantidadeTombos / limit);

    try {
        const precessarLotes = async loteIndex => {
            const offset = loteIndex * limit;
            const limite = Math.min(limit, quantidadeTombos - offset);

            await obterModeloDarwinCoreLotes(limite, offset, request, response, next);

            if (loteIndex < quantidadeLotes - 1) {
                await precessarLotes(loteIndex + 1);
            }
        };

        await precessarLotes(0);
    } catch (error) {
        next(error);
    }

    response.end();
};

export default {};
