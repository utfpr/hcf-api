import { format } from 'date-fns';

import { converteDecimalParaGrausMinutosSegundos } from '~/helpers/coordenadas';

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
        order: [['hcf', 'ASC']],
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
            'descricao',
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
        const kingdom = tombo.familia?.reino?.nome || '\t';
        const familyName = tombo.familia?.nome;
        const family = (familyName && familyName !== 'Indeterminada') ? familyName : '\t';
        const genus = tombo.genero?.nome || '\t';
        const species = tombo.especy?.nome || '\t';
        const scientificNameAuthor = tombo.especy?.autor?.nome || '\t';
        const commonName = tombo.nomes_populares || '\t';
        const catalogNumber = tombo.hcf || '\t';
        const basisOfRecord = 'PreservedSpecimen';
        const typeStatus = tombo.tipo ? tombo.tipo?.nome : '\t';
        const collectionDate = [
            tombo.data_coleta_ano,
            tombo.data_coleta_mes?.toString().padStart(2, '0'),
            tombo.data_coleta_dia?.toString().padStart(2, '0'),
        ]
            .filter(Boolean)
            .join('-');
        const collectorName = tombo.coletore?.nome || '\t';
        const collectorNumber = tombo.numero_coleta || '\t';
        const country = tombo.locais_coletum?.cidade?.estado?.paise?.nome || '\t';
        const stateOrProvince = tombo.locais_coletum?.cidade?.estado?.sigla?.trim() || '\t';
        const city = tombo.locais_coletum?.cidade?.nome || '\t';
        const locality = tombo.locais_coletum?.descricao || '\t';
        const latitude = tombo.latitude
            ? converteDecimalParaGrausMinutosSegundos(tombo.latitude, false, true)
            : '\t';
        const longitude = tombo.longitude
            ? converteDecimalParaGrausMinutosSegundos(tombo.longitude, true, true)
            : '\t';
        const elevation = tombo.altitude ? `${tombo.altitude} m` : '\t';
        const identificationDate = [
            tombo.data_identificacao_ano,
            tombo.data_identificacao_mes?.toString().padStart(2, '0'),
            tombo.data_identificacao_dia?.toString().padStart(2, '0'),
        ]
            .filter(Boolean)
            .join('-');
        const identifierName = tombo.identificadores
            ? tombo.identificadores.map(i => i.nome).join(';')
            : '\t';
        const notes = tombo.tombos_fotos?.length > 0
            ? `${tombo.tombos_fotos.map(foto => `[BARCODE=${foto.codigo_barra}]`).join(' , ')} ${tombo.descricao || '\t'}`
            : tombo.descricao || '\t';

        const linha = [
            kingdom,
            '\t', // Phylum
            '\t', // Class
            '\t', // Order
            family,
            genus,
            species,
            '\t', // Subspecies
            scientificNameAuthor,
            commonName,
            '\t', // Field number
            catalogNumber,
            '\t', // Previous catalog number
            basisOfRecord,
            typeStatus,
            '\t', // Preparation type
            '\t', // Individual count
            '\t', // Specimen sex
            '\t', // Specimen life stage
            collectionDate,
            collectorName,
            collectorNumber,
            '\t', // Continent or Ocean
            country,
            stateOrProvince,
            city,
            locality,
            latitude,
            longitude,
            elevation,
            '\t', // Depth
            identificationDate,
            identifierName,
            '\t', // Related catalog item
            '\t', // Relationship type
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
