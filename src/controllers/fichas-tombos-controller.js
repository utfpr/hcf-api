import moment from 'moment-timezone';
import path from 'path';

import { converteDecimalParaGMSSinal } from '~/helpers/coordenadas';
// import identificador from '~/routes/identificador';

import formataColunasSeparadas from '../helpers/formata-colunas-separadas';
import renderizaArquivoHtml from '../helpers/renderiza-arquivo-html';
import models from '../models';

const {
    Tombo,
    TomboFoto,
    Coletor,
    Familia,
    Especie,
    Subfamilia,

    Subespecie,
    Variedade,
    Genero,
    Solo,
    Relevo,
    Vegetacao,
    FaseSucessional,
    Autor,
    Identificador,

    Usuario,
    Alteracao,
    LocalColeta,
    Cidade,
    Estado,
    Pais,
    ColetorComplementar,
} = models;

function formataDataSaida(data) {
    return moment(data)
        .format('D/M/YYYY');
}

function formataDataIdentificacao(dia, mes, ano, arrayRomanos) {
    // Se não tiver ano, não mostra nada
    if (!ano) {
        return '';
    }

    // Se tiver mês e ano mas não tiver dia, mostra mês/ano
    if (!dia && mes && ano) {
        return `${arrayRomanos[mes - 1]}/${ano}`;
    }

    // Se não tiver mês mas tiver ano, mostra só o ano
    if (!mes && ano) {
        return `${ano}`;
    }

    // Se tiver dia, mês e ano, mostra tudo
    return `${dia}/${arrayRomanos[mes - 1]}/${ano}`;
}

export default function fichaTomboController(request, response, next) {
    const { tombo_id: tomboId } = request.params;
    const { qtd, code } = request.query;

    if (qtd < 1) {
        Promise.reject(new Error('Quantidade inválida'));
    } else if (qtd > 3) {
        Promise.reject(new Error('Quantidade máxima de 3 itens excedida'));
    }

    Promise.resolve()
        .then(() => {
            const include = [
                {
                    model: Coletor,
                },
                {
                    model: Identificador,
                    as: 'identificadores',
                },
                {
                    model: Familia,
                },
                {
                    as: 'especie',
                    model: Especie,
                    include: {
                        model: Autor,
                        as: 'autor',
                    },
                },
                {
                    model: Subespecie,
                    include: {
                        model: Autor,
                        as: 'autor',
                    },
                },
                {
                    model: Subfamilia,
                },
                {
                    model: Variedade,
                    include: {
                        model: Autor,
                        as: 'autor',
                    },
                },
                {
                    model: Genero,
                },
                {
                    model: Solo,
                },
                {
                    model: Relevo,
                },
                {
                    model: Vegetacao,
                },
                {
                    as: 'local_coleta',
                    model: LocalColeta,
                    include: [
                        {
                            required: false,
                            model: Cidade,
                            include: {
                                model: Estado,
                                attributes: ['id', 'nome', 'sigla', 'codigo_telefone', 'pais_id'],
                                include: {
                                    as: 'pais',
                                    model: Pais,
                                },
                            },
                        },
                        {
                            model: FaseSucessional,
                        },
                    ],
                },
                {
                    model: ColetorComplementar,
                    as: 'coletor_complementar',
                },
            ];

            const where = {
                ativo: true,
                hcf: parseInt(tomboId),
            };

            const tombo = Tombo.findOne({ include, where });
            return tombo;
        })
        .then(tombo => {
            if (!tombo) {
                throw new Error('Tombo não encontrado');
            }

            const include = {
                required: true,
                model: Usuario,
            };

            const where = {
                identificacao: true,
                status: 'APROVADO',
                tombo_hcf: tombo.hcf,
            };

            const options = {
                order: [['id', 'desc']],
                limit: 1,
            };

            return Alteracao.findAll({ include, where, ...options })
                .then(alteracoes => {
                    if (alteracoes.length < 1) {
                        return {
                            tombo: tombo.toJSON(),
                            identificacao: {},
                        };
                    }

                    const [identificacao] = alteracoes;
                    return {
                        tombo: tombo.toJSON(),
                        identificacao: identificacao.toJSON(),
                    };
                });
        })
        .then(resultado => {
            const { tombo } = resultado;

            const attributes = [
                'id',
                'codigo_barra',
                'num_barra',
                'em_vivo',
                'sequencia',
            ];

            const where = {
                ativo: true,
                tombo_hcf: tombo.hcf,
            };

            const options = {
                order: [['id', 'desc']],
            };

            return TomboFoto.findAll({ attributes, where, ...options })
                .then(registros => {
                    const fotos = registros.map(foto => foto.toJSON());
                    return { ...resultado, fotos };
                });
        })
        .then(async resultado => {
            const { tombo, identificacao, fotos } = resultado;

            // await Subfamilia.findAll({
            //     where: {
            //         familia_id: dadosTombo.familia?.id,
            //     },
            //     include: [
            //         {
            //             model: Autor,
            //             attributes: ['id', 'nome'],
            //             as: 'autor',
            //         },
            //     ],
            // });

            // eslint-disable-next-line max-len
            const coletores = `${!!tombo?.coletore?.nome !== false ? tombo?.coletore?.nome?.concat(' ') : ''}${tombo?.coletor_complementar ? tombo.coletor_complementar?.complementares : ''}`;

            const localColeta = tombo.local_coleta;
            const cidade = localColeta.cidade || '';
            const estado = cidade?.estado || '';
            const pais = estado?.pais || '';

            const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            const dataTombo = new Date(tombo.data_tombo);
            const romanoDataTombo = (`${dataTombo.getDate()}/${romanos[dataTombo.getMonth()]}/${dataTombo.getFullYear()}`);

            const identificador = tombo.identificadores?.[0]?.nome &&
              tombo.identificadores?.[0]?.nome.toLowerCase() !== 'não-identificado' ?
                tombo.identificadores?.[0]?.nome : '' || '';

            const romanoDataIdentificacao = formataDataIdentificacao(
                tombo?.data_identificacao_dia,
                tombo?.data_identificacao_mes,
                tombo?.data_identificacao_ano,
                romanos
            );

            // eslint-disable-next-line max-len
            const romanoDataColeta = (`${tombo.data_coleta_dia}/${romanos[tombo.data_coleta_mes - 1]}/${tombo.data_coleta_ano}`);

            const parametros = {
                // Se não tem fotos, cria um array de 1 posição com um objeto vazio
                // para poder iterar pelo array e criar pelo menos 1 ficha
                fotos: fotos.length < 1 ? [{}] : fotos,
                tombo: {
                    ...tombo,
                    coletores,
                    latitude: converteDecimalParaGMSSinal(tombo.latitude, true),
                    longitude: converteDecimalParaGMSSinal(tombo.longitude, true),
                    data_tombo: formataDataSaida(tombo.data_tombo),
                    data_coleta: formataColunasSeparadas(tombo.data_coleta_dia, tombo.data_coleta_mes, tombo.data_coleta_ano),
                },

                genero: tombo.genero,
                solo: tombo.solo,
                especie: tombo.especie,
                variedade: tombo.variedade,
                subespecie: tombo.sub_especy,
                subfamilia: tombo.sub_familia,

                relevo: tombo?.relevo?.nome || '',
                vegetacao: tombo?.vegetaco?.nome || '',

                familia: tombo.familia,
                imprimir: request.params.imprimir_cod,

                identificador,
                identificacao: {
                    ...identificacao,
                    data_identificacao: formataColunasSeparadas(
                        identificacao.data_identificacao_dia,
                        identificacao.data_identificacao_mes,
                        identificacao.data_identificacao_ano
                    ),
                },

                localColeta,
                romano_data_coleta: romanoDataColeta,

                cidade,
                estado,
                estado_sigla: estado.sigla,
                pais,

                romano_data_tombo: romanoDataTombo,

                romano_data_identificacao: romanoDataIdentificacao, // Data de identificação. Se não existir, será uma string vazia

                numero_copias: qtd || 1,
                codigo_barras_selecionado: code,
            };

            const caminhoArquivoHtml = path.resolve(__dirname, '../views/ficha-tombo.ejs');
            return renderizaArquivoHtml(caminhoArquivoHtml, parametros, response)
                .then(html => {
                    response.status(200).send(html);
                });
        })
        .catch(next);
}
