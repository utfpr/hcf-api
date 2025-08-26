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

export default function fichaTomboController(request, response, next) {
    const { tombo_id: tomboId } = request.params;
    const { qtd } = request.query;

    if (qtd < 1) {
        Promise.reject(new Error('Quantidade inválida'));
    } else if (qtd > 3) {
        Promise.reject(new Error('Quantidade máxima de 3 itens excedida'));
    }

    Promise.resolve()
        .then(() => {
            const include = [
                {
                    required: true,
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
                    required: true,
                    model: LocalColeta,
                    include: [
                        {
                            required: false,
                            model: Cidade,
                            include: {
                                required: true,
                                model: Estado,
                                attributes: ['id', 'nome', 'sigla', 'codigo_telefone', 'pais_id'],
                                include: {
                                    as: 'pais',
                                    required: true,
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
        .then(resultado => {
            const { tombo, identificacao, fotos } = resultado;

            const coletores = `${tombo.coletore.nome}${tombo.coletor_complementar ? tombo.coletor_complementar.complementares : ''}`;

            const localColeta = tombo.local_coleta;
            const cidade = localColeta.cidade || '';
            const estado = cidade?.estado || '';
            const pais = estado?.pais || '';

            const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            const dataTombo = new Date(tombo.data_tombo);
            const romanoDataTombo = (`${dataTombo.getDate()}/${romanos[dataTombo.getMonth()]}/${dataTombo.getFullYear()}`);
            // eslint-disable-next-line max-len
            const romanoDataIdentificacao = (`${identificacao.data_identificacao_dia}/${romanos[identificacao.data_identificacao_mes - 1]}/${identificacao.data_identificacao_ano}`);
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

                relevo: tombo.relevo?.nome || '',
                vegetacao: tombo.vegetaco?.nome || '',

                familia: tombo.familia,
                imprimir: request.params.imprimir_cod,

                identificador: tombo.identificadores[0].nome,
                identificacao: {
                    ...identificacao,
                    data_identificacao: formataColunasSeparadas(
                        identificacao.data_identificacao_dia,
                        identificacao.data_identificacao_mes,
                        identificacao.data_identificacao_ano
                    ),
                },

                localColeta,
                cidade,
                estado,
                estado_sigla: estado.sigla,
                pais,
                romano_data_tombo: romanoDataTombo,
                romano_data_identificacao: romanoDataIdentificacao,
                romano_data_coleta: romanoDataColeta,
                numero_copias: qtd || 1,
            };

            const caminhoArquivoHtml = path.resolve(__dirname, '../views/ficha-tombo.ejs');
            return renderizaArquivoHtml(caminhoArquivoHtml, parametros, response)
                .then(html => {
                    response.status(200).send(html);
                });
        })
        .catch(next);
}
