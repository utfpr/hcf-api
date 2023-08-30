import { renderFile } from 'ejs';
import path from 'path';
import moment from 'moment-timezone';

import formataColunasSeparadas from '../helpers/formata-colunas-separadas';
import renderizaArquivoHtml from '../helpers/renderiza-arquivo-html';
import models from '../models';

const {
    Tombo,
    TomboFoto,
    Coletor,
    Familia,
    Especie,
    Usuario,
    Alteracao,
    LocalColeta,
    Cidade,
    Estado,
    Pais,
} = models;


function formataDataSaida(data) {
    return moment(data)
        .format('D/M/YYYY');
}

export default function fichaTomboController(request, response, next) {
    const { tombo_id: tomboId } = request.params;

    Promise.resolve()
        .then(_ => {
            const include = [
                {
                    required: true,
                    model: Coletor,
                },
                {
                    model: Familia,
                },
                {
                    as: 'especie',
                    model: Especie,
                },
                {
                    as: 'local_coleta',
                    required: true,
                    model: LocalColeta,
                    include: {
                        required: true,
                        model: Cidade,
                        include: {
                            required: true,
                            model: Estado,
                            include: {
                                as: 'pais',
                                required: true,
                                model: Pais,
                            },
                        },
                    },
                },
            ];

            const where = {
                ativo: true,
                hcf: tomboId,
            };

            return Tombo.findOne({ include, where });
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

            const coletores = tombo.coletores
                .map(coletor => coletor.nome)
                .join(', ');

            const localColeta = tombo.local_coleta;
            const { cidade } = localColeta;
            const { estado } = cidade;
            const { pais } = estado;

            const parametros = {
                // Se não tem fotos, cria um array de 1 posição com um objeto vazio
                // para poder iterar pelo array e criar pelo menos 1 ficha
                fotos: (fotos.length < 1 ? [{}] : fotos),
                tombo: {
                    ...tombo,
                    coletores,
                    data_tombo: formataDataSaida(tombo.data_tombo),
                    data_coleta: formataColunasSeparadas(
                        tombo.data_coleta_dia,
                        tombo.data_coleta_mes,
                        tombo.data_coleta_ano
                    ),
                },

                familia: tombo.familia,
                especie: tombo.especie,
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
                pais,
            };

            const caminhoArquivoHtml = path.resolve(__dirname, '../views/ficha-tombo.ejs');
            return renderizaArquivoHtml(caminhoArquivoHtml, parametros, response)
                .then(html => {
                    response.status(200).send(html);
                });
        })
        .catch(next);
}
