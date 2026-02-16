import { format } from 'date-fns';

import models from '../models';

const {
    Cidade,
    Estado,
    Pais,
    FaseSucessional,
    Tipo,
    LocalColeta,
    Reino,
    Familia,
    Genero,
    Identificador,
    Autor,
    Coletor,
    Especie,
    Tombo,
    TomboFoto,
} = models;

function obtemNomeArquivoTxt() {
    const data = format(new Date(), 'yyyy-MM-dd');

    return `hcf_${data}.txt`;
}

const obterModeloSPlinkerLotes = async (limit, offset, request, response) => {
    const tombos = await Tombo.findAll({
        limit,
        offset,
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
        ],
        include: [
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
                ],
            },
            {
                model: TomboFoto,
            },
            {
                model: Familia,
                include: [
                    {
                        model: Reino,
                    },
                ],
            },
            {
                model: Genero,
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
                model: Coletor,
            },
            {
                model: Identificador,
                as: 'identificadores',
                attributes: {
                    exclude: ['updated_at', 'created_at'],
                },
            },
            {
                model: Tipo,
                attributes: ['id', 'nome'],
            },
        ],
    });

    tombos.forEach(tombo => {
        const kingdom = tombo.familia?.reino?.nome || '  ';
        const family = tombo.familia?.nome || ' ';
        const genus = tombo.genero?.nome || ' ';
        const species = tombo.especy?.nome || ' ';
        const scientificNameAuthor = tombo.especy?.autor?.nome || '  ';
        const commonName = tombo.nomes_populares || ' ';
        const catalogNumber = tombo.hcf || '  ';
        const basisOfRecord = 'PreservedSpecimen';
        const typeStatus = tombo.tipo ? tombo.tipo?.nome : '  ';
        const collectionDate = [
            tombo.data_coleta_ano,
            tombo.data_coleta_mes?.toString().padStart(2, '0'),
            tombo.data_coleta_dia?.toString().padStart(2, '0'),
        ]
            .filter(Boolean)
            .join('-');
        const collectorName = tombo.coletore?.nome || '  ';
        const collectorNumber = tombo.numero_coleta || '  ';
        const country = tombo.locais_coletum?.cidade?.estado?.paise?.nome || '  ';
        const stateOrProvince = tombo.locais_coletum?.cidade?.estado?.sigla || '  ';
        const city = tombo.locais_coletum?.cidade?.nome || ' ';
        const locality = tombo.locais_coletum?.descricao || '  ';
        const latitude = tombo.latitude || '  ';
        const longitude = tombo.longitude || '  ';
        const elevation = tombo.altitude || ' ';
        const identificationDate = [
            tombo.data_identificacao_ano,
            tombo.data_identificacao_mes?.toString().padStart(2, '0'),
            tombo.data_identificacao_dia?.toString().padStart(2, '0'),
        ]
            .filter(Boolean)
            .join('-');
        const identifierName = tombo.identificadores
            ? tombo.identificadores.map(i => i.nome).join(', ')
            : ' ';
        const notes = tombo.tombos_fotos?.length > 0
            ? `${tombo.tombos_fotos.map(foto => `[BARCODE=${foto.codigo_barra}]`).join(' , ')} ${tombo.observacao || ' '}`
            : tombo.observacao || ' ';

        const linha = [
            kingdom,
            ' ', // Phylum
            ' ', // Class
            ' ', // Order
            family,
            genus,
            species,
            ' ', // Subspecies
            scientificNameAuthor,
            commonName,
            ' ', // Field number
            catalogNumber,
            ' ', // Previous catalog number
            basisOfRecord,
            typeStatus,
            ' ', // Preparation type
            ' ', // Individual count
            ' ', // Specimen sex
            ' ', // Specimen life stage
            collectionDate,
            collectorName,
            collectorNumber,
            ' ', // Continent or Ocean
            country,
            stateOrProvince,
            city,
            locality,
            latitude,
            longitude,
            elevation,
            ' ', // Depth
            identificationDate,
            identifierName,
            ' ', // Related catalog item
            ' ', // Relationship type
            notes,
        ].join('|');

        response.write(`${linha}\n`);
    });
};

export const obterModeloSPLinker = async (request, response, next) => {

    const limit = request.query.limit > 1000 ? 1000 : request.query.limit || 1000;

    const quantidadeTombos = await Tombo.count({ col: 'hcf' });

    response.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment;filename=${obtemNomeArquivoTxt()}`,
    });

    const quantidadeLotes = Math.ceil(quantidadeTombos / limit);

    try {
        const precessarLotes = async loteIndex => {
            const offset = loteIndex * limit;
            const limite = Math.min(limit, quantidadeTombos - offset);

            await obterModeloSPlinkerLotes(limite, offset, request, response, next);

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
