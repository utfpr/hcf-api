import { converteParaDecimal } from './coordenadas';


export default {};

export function converteInteiroParaRomano(numero) {
    if (numero === 1) {
        return 'I';
    } if (numero === 2) {
        return 'II';
    } if (numero === 3) {
        return 'III';
    } if (numero === 4) {
        return 'IV';
    } if (numero === 5) {
        return 'V';
    } if (numero === 6) {
        return 'VI';
    } if (numero === 7) {
        return 'VII';
    } if (numero === 8) {
        return 'VIII';
    } if (numero === 9) {
        return 'IX';
    } if (numero === 10) {
        return 'X';
    } if (numero === 11) {
        return 'XI';
    }
    return 'XII';
}

export function converteRequisicaoParaTombo(requisicao) {
    const {
        principal,
        identificacao,
        localidade,
        taxonomia,
    } = requisicao;

    const { data_coleta: dataColeta } = principal;
    const { data_identificacao: dataIdentificacao } = identificacao;


    return {
        hcf: null,
        nome_popular: principal.nome_popular,
        numero_coleta: principal.numero_coleta,

        latitude: converteParaDecimal(localidade.latitude),
        longitude: converteParaDecimal(localidade.longitude),
        altitude: localidade.altitude,

        data_coleta_dia: dataColeta.dia,
        data_coleta_mes: dataColeta.mes,
        data_coleta_ano: dataColeta.ano,

        data_identificacao_dia: dataIdentificacao.dia,
        data_identificacao_mes: dataIdentificacao.mes,
        data_identificacao_ano: dataIdentificacao.ano,

        cor: principal.cor,
        tipo: {
            id: principal.tipo_id,
        },
        entidade: {
            id: principal.entidade_id,
        },
        familia: {
            id: taxonomia.familia_id,
        },
        sub_familia: {
            id: taxonomia.sub_familia_id,
        },
        genero: {
            id: taxonomia.genero_id,
        },
        especie: {
            id: taxonomia.especie_id,
        },
        sub_especie: {
            id: taxonomia.sub_especie_id,
        },
        variedade: {
            id: taxonomia.variedade_id,
        },
    };
}
