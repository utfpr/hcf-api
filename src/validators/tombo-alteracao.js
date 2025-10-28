import validaColecoesAnexas from './tombo-colecoes-anexas';
import validaData from './tombo-data';
import validaDataTombo from './tombo-data-tombo';

const validaColetores = coletores => {
    if (!Array.isArray(coletores) || coletores.length < 1) {
        return false;
    }

    const naoInteiros = coletores.filter(Number.isInteger);
    return naoInteiros.length === coletores.length;
};

export default {
    'principal.nome_popular': {
        in: 'body',
        isString: true,
        optional: {
            options: { nullable: true },
        },
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'json.principal.entidade_id': {
        in: 'body',
        isEmpty: false,
        isInt: true,
    },
    'json.principal.numero_coleta': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.principal.data_tombo': {
        in: 'body',
        custom: {
            options: validaDataTombo,
        },
    },
    'json.principal.data_coleta': {
        in: 'body',
        custom: {
            options: validaData,
        },
    },
    'json.principal.tipo_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.familia_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.genero_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.subfamilia_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.especie_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.variedade_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.taxonomia.subespecie_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.localidade.latitude': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isString: true,
    },
    'json.localidade.longitude': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isString: true,
    },
    'json.localidade.altitude': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.localidade.cidade_id': {
        in: 'body',
        isEmpty: false,
        isInt: true,
    },
    'json.localidade.local_coleta_id': {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'json.paisagem.solo_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.paisagem.relevo_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.paisagem.vegetacao_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.paisagem.fase_sucessional': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.paisagem.descricao': {
        in: 'body',
        isString: true,
        optional: {
            options: { nullable: true },
        },
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'json.identificacao.identificador_id': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isInt: true,
    },
    'json.identificacao.data_identificacao': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        custom: {
            options: validaData,
        },
    },
    'json.coletores': {
        in: 'body',
        isEmpty: false,
        custom: {
            options: validaColetores,
        },
    },
    'json.colecoes_anexas.tipo': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        custom: {
            options: validaColecoesAnexas,
        },
    },
    'json.colecoes_anexas.observacoes': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isString: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'json.observacoes': {
        in: 'body',
        isString: true,
        optional: {
            options: { nullable: true },
        },
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'json.unicata': {
        in: 'body',
        optional: {
            options: { nullable: true },
        },
        isBoolean: true,
    },
};
