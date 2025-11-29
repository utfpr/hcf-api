import BadRequestExeption from '../errors/bad-request-exception';
import { converteParaDecimal } from '../helpers/coordenadas';
import models from '../models';
import codigos from '../resources/codigos-http';

const {
    Alteracao,
    Usuario,
    Herbario,
    Solo,
    Relevo,
    Vegetacao,
    Cidade,
    FaseSucessional,
    LocalColeta,
    sequelize,
    Sequelize: { Op },
    Tombo,
    Especie,
    Variedade,
    Coletor,
    Tipo,
    Familia,
    Subfamilia,
    Genero,
    Subespecie,
    ColecaoAnexa,
    TomboIdentificador,
    Identificador,
    ColetorComplementar,
} = models;

export const listagem = (request, response, next) => {
    const { limite, pagina, offset } = request.paginacao;
    const { status, nome_usuario: nomeUsuario } = request.query;
    const retorno = {
        metadados: {
            total: 0,
            pagina,
            limite,
        },
        resultado: {},
    };
    let where = {
        ativo: 1,
    };
    let whereUsuario = {};
    if (status) {
        where = {
            ...where,
            status,
        };
    } else {
        where = {
            ...where,
            status: { [Op.ne]: 'APROVADO' },
        };
    }
    if (nomeUsuario) {
        whereUsuario = {
            nome: { [Op.like]: `%${nomeUsuario}%` },
        };
    }
    const callback = transaction => Promise.resolve()
        .then(() => Alteracao.findAndCountAll({
            include: [
                {
                    model: Usuario,
                    whereUsuario,
                },
            ],
            limit: limite,
            offset,
            where,
            order: [['id', 'DESC']],
            transaction,
        }))
        .then(alteracoes => {
            retorno.metadados.total = alteracoes.count;
            // const alteracoesValidas = alteracoes.rows.filter(item => {
            //     if (item.usuario.tipo_usuario_id === 1) {
            //         return false;
            //     }
            //     if (item.identificacao) {
            //         if (item.usuario.tipo_usuario_id === 3) {
            //             return true;
            //         }
            //         return false;
            //     }
            //     return true;
            // });
            retorno.resultado = alteracoes.rows.map(item => ({
                id: item.id,
                nome_usuario: item.usuario.nome,
                numero_tombo: item.tombo_hcf,
                json: JSON.parse(item.tombo_json),
                data_criacao: item.created_at,
                status: item.status,
                observacao: item.observacao || '',
            }));
            return retorno;
        });
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.LISTAGEM).json(retorno);
        })
        .catch(next);
};

export const desativar = (request, response, next) => {
    const id = request.params.pendencia_id;

    const callback = transaction => Promise.resolve()
        .then(() => Alteracao.findOne({
            where: {
                ativo: true,
                id,
            },
            transaction,
        }))
        .then(alteracao => {
            if (!alteracao) {
                throw new BadRequestExeption(800);
            }
            return Alteracao.update({
                ativo: false,
            }, {
                where: {
                    id,
                },
                transaction,
            });
        });
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.DESATIVAR).send();
        })
        .catch(next);
};

const comparaDoisTombos = (tombo, tomboAlterado) => {
    const parametros = [];
    if (tombo.data_coleta_dia !== tomboAlterado.data_coleta_dia) {
        parametros.push({
            key: '1',
            campo: 'Dia da coleta',
            antigo: tombo.data_coleta_dia,
            novo: tomboAlterado.data_coleta_dia,
        });
    }
    if (tombo.data_coleta_mes !== tomboAlterado.data_coleta_mes) {
        parametros.push({
            key: '2',
            campo: 'Mes da coleta',
            antigo: tombo.data_coleta_mes,
            novo: tomboAlterado.data_coleta_mes,
        });
    }
    if (tombo.data_coleta_ano !== tomboAlterado.data_coleta_ano) {
        parametros.push({
            key: '3',
            campo: 'Ano da coleta',
            antigo: tombo.data_coleta_ano,
            novo: tomboAlterado.data_coleta_ano,
        });
    }
    if (tombo.observacao !== tomboAlterado.observacao) {
        parametros.push({
            key: '4',
            campo: 'Observação',
            antigo: tombo.observacao,
            novo: tomboAlterado.observacao,
        });
    }
    if (tombo.nomes_populares !== tomboAlterado.nomes_populares) {
        parametros.push({
            key: '5',
            campo: 'Nomes populares',
            antigo: tombo.nomes_populares,
            novo: tomboAlterado.nomes_populares,
        });
    }
    if (tombo.numero_coleta !== tomboAlterado.numero_coleta) {
        parametros.push({
            key: '6',
            campo: 'Numero de coleta',
            antigo: tombo.numero_coleta,
            novo: tomboAlterado.numero_coleta,
        });
    }
    if (tombo.latitude !== tomboAlterado.latitude) {
        parametros.push({
            key: '7',
            campo: 'Latitude',
            antigo: tombo.latitude,
            novo: tomboAlterado.latitude,
        });
    }
    if (tombo.longitude !== tomboAlterado.longitude) {
        parametros.push({
            key: '8',
            campo: 'Longitude',
            antigo: tombo.longitude,
            novo: tomboAlterado.longitude,
        });
    }
    if (tombo.altitude !== tomboAlterado.altitude) {
        parametros.push({
            key: '9',
            campo: 'Altitude',
            antigo: tombo.altitude,
            novo: tomboAlterado.altitude,
        });
    }
    if (tombo.herbario && tomboAlterado.herbario
        && (tombo.herbario.nome !== tomboAlterado.herbario.nome)) {
        parametros.push({
            key: '10',
            campo: 'Herbário',
            antigo: tombo.herbario.nome,
            novo: tomboAlterado.herbario.nome,
        });
    }
    if (tombo.locais_coletum && tomboAlterado.locais_coletum
        && tombo.locais_coletum.descricao !== tomboAlterado.locais_coletum.descricao) {
        parametros.push({
            key: '11',
            campo: 'Descrição do local de coleta',
            antigo: tombo.locais_coletum.descricao,
            novo: tomboAlterado.locais_coletum.descricao,
        });
    }
    if (tombo.locais_coletum && tombo.locais_coletum.solo
        && tomboAlterado.locais_coletum && tomboAlterado.locais_coletum.solo
        && tombo.locais_coletum.solo.nome !== tomboAlterado.locais_coletum.solo.nome) {
        parametros.push({
            key: '12',
            campo: 'Solo',
            antigo: tombo.locais_coletum.solo.nome,
            novo: tomboAlterado.locais_coletum.solo.nome,
        });
    }
    if (tombo.locais_coletum && tombo.locais_coletum.relevo
        && tombo.locais_coletum && tombo.locais_coletum.relevo
        && tombo.locais_coletum.relevo.nome !== tomboAlterado.locais_coletum.relevo.nome) {
        parametros.push({
            key: '13',
            campo: 'Relevo',
            antigo: tombo.locais_coletum.relevo.nome,
            novo: tomboAlterado.locais_coletum.relevo.nome,
        });
    }
    if (tombo.locais_coletum && tombo.locais_coletum.vegetaco
        && tomboAlterado.locais_coletum && tomboAlterado.locais_coletum.vegetaco
        && tombo.locais_coletum.vegetaco.nome !== tomboAlterado.locais_coletum.vegetaco.nome) {
        parametros.push({
            key: '14',
            campo: 'Vegetação',
            antigo: tombo.locais_coletum.vegetaco.nome,
            novo: tomboAlterado.locais_coletum.vegetaco.nome,
        });
    }
    if (tombo.locais_coletum && tombo.locais_coletum.cidade
        && tomboAlterado.locais_coletum && tomboAlterado.locais_coletum.cidade
        && tombo.locais_coletum.cidade.nome !== tomboAlterado.locais_coletum.cidade.nome) {
        parametros.push({
            key: '15',
            campo: 'Cidade',
            antigo: tombo.locais_coletum.cidade.nome,
            novo: tomboAlterado.locais_coletum.cidade.nome,
        });
    }
    if (tombo.locais_coletum && tomboAlterado.locais_coletum
        && tombo.locais_coletum.fase_sucessional !== tomboAlterado.locais_coletum.fase_sucessional) {
        parametros.push({
            key: '16',
            campo: 'Fase Sucessional',
            antigo: tombo.locais_coletum.fase_sucessional,
            novo: tomboAlterado.locais_coletum.fase_sucessional,
        });
    }
    if (tombo.situacao !== tomboAlterado.situacao) {
        parametros.push({
            key: '17',
            campo: 'Situação',
            antigo: tombo.situacao,
            novo: tomboAlterado.situacao,
        });
    }
    if (tombo.nome_cientifico !== tomboAlterado.nome_cientifico) {
        parametros.push({
            key: '18',
            campo: 'Nome Científico',
            antigo: tombo.nome_cientifico,
            novo: tomboAlterado.nome_cientifico,
        });
    }
    if (tombo.variedade && tomboAlterado.variedade
        && tombo.variedade.nome !== tomboAlterado.variedade.nome) {
        parametros.push({
            key: '20',
            campo: 'Variedade',
            antigo: tombo.variedade.nome,
            novo: tomboAlterado.variedade.nome,
        });
    }
    if (tombo.tipo && tomboAlterado.tipo
        && tombo.tipo.nome !== tomboAlterado.tipo.nome) {
        parametros.push({
            key: '21',
            campo: 'Tipo',
            antigo: tombo.tipo.nome,
            novo: tomboAlterado.tipo.nome,
        });
    }
    if (tombo.especy && tomboAlterado.especy
        && tombo.especy.nome !== tomboAlterado.especy.nome) {
        parametros.push({
            key: '22',
            campo: 'Espécie',
            antigo: tombo.especy.nome,
            novo: tomboAlterado.especy.nome,
        });
    }
    if (tombo.genero && tomboAlterado.genero
        && tombo.genero.nome !== tomboAlterado.genero.nome) {
        parametros.push({
            key: '23',
            campo: 'Género',
            antigo: tombo.genero.nome,
            novo: tomboAlterado.genero.nome,
        });
    }
    if (tombo.familia && tomboAlterado.familia
        && tombo.familia.nome !== tomboAlterado.familia.nome) {
        parametros.push({
            key: '24',
            campo: 'Família',
            antigo: tombo.familia.nome,
            novo: tomboAlterado.familia.nome,
        });
    }
    if (tombo.sub_familia && tomboAlterado.sub_familia
        && tombo.sub_familia.nome !== tomboAlterado.sub_familia.nome) {
        parametros.push({
            key: '25',
            campo: 'Subfamília',
            antigo: tombo.sub_familia.nome,
            novo: tomboAlterado.sub_familia.nome,
        });
    }
    if (tombo.sub_especy && tomboAlterado.sub_especy
        && tombo.sub_especy.nome !== tomboAlterado.sub_especy.nome) {
        parametros.push({
            key: '26',
            campo: 'Subespécie',
            antigo: tombo.sub_especy.nome,
            novo: tomboAlterado.sub_especy.nome,
        });
    }
    if (tombo.colecoes_anexa && tomboAlterado.colecoes_anexa
        && tombo.colecoes_anexa.observacoes !== tomboAlterado.colecoes_anexa.observacoes) {
        parametros.push({
            key: '27',
            campo: 'Observações - Coleção Anexa',
            antigo: tombo.colecoes_anexa.observacoes,
            novo: tomboAlterado.colecoes_anexa.observacoes,
        });
    }
    if (tombo.colecoes_anexa && tomboAlterado.colecoes_anexa
        && tombo.colecoes_anexa.tipo !== tomboAlterado.colecoes_anexa.tipo) {
        parametros.push({
            key: '28',
            campo: 'Tipo - Coleção Anexa',
            antigo: tombo.colecoes_anexa.tipo,
            novo: tomboAlterado.colecoes_anexa.tipo,
        });
    }

    return parametros;
};

export const formatarTomboNovo = tombo => {
    const parametros = [];
    parametros.push({
        key: '1',
        campo: 'Dia da coleta',
        antigo: '',
        novo: tombo.data_coleta_dia,
    });
    parametros.push({
        key: '2',
        campo: 'Mes da coleta',
        antigo: '',
        novo: tombo.data_coleta_mes,
    });
    parametros.push({
        key: '3',
        campo: 'Ano da coleta',
        antigo: '',
        novo: tombo.data_coleta_ano,
    });
    parametros.push({
        key: '4',
        campo: 'Observação',
        antigo: '',
        novo: tombo.observacao,
    });
    parametros.push({
        key: '5',
        campo: 'Nomes populares',
        antigo: '',
        novo: tombo.nomes_populares,
    });
    parametros.push({
        key: '6',
        campo: 'Numero de coleta',
        antigo: '',
        novo: tombo.numero_coleta,
    });
    parametros.push({
        key: '7',
        campo: 'Latitude',
        antigo: '',
        novo: tombo.latitude,
    });
    parametros.push({
        key: '8',
        campo: 'Longitude',
        antigo: '',
        novo: tombo.longitude,
    });
    parametros.push({
        key: '9',
        campo: 'Altitude',
        antigo: '',
        novo: tombo.altitude,
    });
    if (tombo.herbario) {
        parametros.push({
            key: '10',
            campo: 'Herbário',
            antigo: '',
            novo: tombo.herbario.nome,
        });
    }
    if (tombo.locais_coletum) {
        parametros.push({
            key: '11',
            campo: 'Descrição do local de coleta',
            antigo: '',
            novo: tombo.locais_coletum.descricao,
        });
        if (tombo.locais_coletum.solo) {
            parametros.push({
                key: '12',
                campo: 'Solo',
                antigo: '',
                novo: tombo.locais_coletum.solo.nome,
            });
        }
        if (tombo.locais_coletum.relevo) {
            parametros.push({
                key: '13',
                campo: 'Relevo',
                antigo: '',
                novo: tombo.locais_coletum.relevo.nome,
            });
        }
        if (tombo.locais_coletum.vegetaco) {
            parametros.push({
                key: '14',
                campo: 'Vegetação',
                antigo: '',
                novo: tombo.locais_coletum.vegetaco.nome,
            });
        }
        if (tombo.locais_coletum.cidade) {
            parametros.push({
                key: '15',
                campo: 'Cidade',
                antigo: '',
                novo: tombo.locais_coletum.cidade.nome,
            });
        }
        if (tombo.locais_coletum.fase_sucessional) {
            parametros.push({
                key: '16',
                campo: 'Fase Sucessional',
                antigo: '',
                novo: tombo.locais_coletum.fase_sucessional.nome,
            });
        }
    }
    parametros.push({
        key: '17',
        campo: 'Situação',
        antigo: '',
        novo: tombo.situacao,
    });
    parametros.push({
        key: '18',
        campo: 'Nome Científico',
        antigo: '',
        novo: tombo.nome_cientifico,
    });
    if (tombo.variedade) {
        parametros.push({
            key: '19',
            campo: 'Variedade',
            antigo: '',
            novo: tombo.variedade.nome,
        });
    }
    if (tombo.tipo) {
        parametros.push({
            key: '20',
            campo: 'Tipo',
            antigo: '',
            novo: tombo.tipo.nome,
        });
    }
    if (tombo.especy) {
        parametros.push({
            key: '21',
            campo: 'Espécie',
            antigo: '',
            novo: tombo.especy.nome,
        });
    }
    if (tombo.genero) {
        parametros.push({
            key: '22',
            campo: 'Genero',
            antigo: '',
            novo: tombo.genero.nome,
        });
    }
    if (tombo.familia) {
        parametros.push({
            key: '23',
            campo: 'Família',
            antigo: '',
            novo: tombo.familia.nome,
        });
    }
    if (tombo.sub_familia) {
        parametros.push({
            key: '24',
            campo: 'Subfamília',
            antigo: '',
            novo: tombo.sub_familia.nome,
        });
    }
    if (tombo.sub_especy) {
        parametros.push({
            key: '25',
            campo: 'Subespécie',
            antigo: '',
            novo: tombo.sub_especy.nome,
        });
    }
    if (tombo.colecoes_anexa) {
        parametros.push({
            key: '26',
            campo: 'Observações - Coleção Anexa',
            antigo: '',
            novo: tombo.colecoes_anexa.observacoes,
        });
    }
    if (tombo.colecoes_anexa) {
        parametros.push({
            key: '27',
            campo: 'Tipo - Coleção Anexa',
            antigo: '',
            novo: tombo.colecoes_anexa.tipo,
        });
    }
    return parametros;
};

export const visualizarComCadastro = (alteracao, transaction) => {
    let parametros = {};

    return new Promise((resolve, reject) => {

        parametros = {
            ...parametros,
            numero_tombo: alteracao.tombo_hcf,
            numero_tombo_alteracao: JSON.parse(alteracao.tombo_json).hcf,
        };
        Tombo.findAll({
            where: {
                hcf: {
                    [Op.in]: [alteracao.tombo_hcf, parametros.numero_tombo_alteracao],
                },
            },
            include: [
                {
                    model: Herbario,
                },
                {
                    model: Variedade,
                },
                {
                    model: Tipo,
                },
                {
                    model: Especie,
                },
                {
                    model: Familia,
                },
                {
                    model: Subfamilia,
                },
                {
                    model: Genero,
                },
                {
                    model: Subespecie,
                },
                {
                    model: ColecaoAnexa,
                },
                {
                    model: LocalColeta,
                    include: [
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
                            model: Cidade,
                        },
                        {
                            model: FaseSucessional,
                        },
                    ],
                },
            ],
            transaction,
        })
            .then(tombos => {
                parametros = {
                    ...parametros,
                    retorno: [],
                };
                if (tombos.length === 2) {
                    if (tombos[0].hcf === parametros.numero_tombo) {
                        parametros = {
                            ...parametros,
                            tombo: tombos[0],
                            tombo_alterado: tombos[1],
                        };
                    } else {
                        parametros = {
                            ...parametros,
                            tombo: tombos[1],
                            tombo_alterado: tombos[0],
                        };
                    }
                    parametros = comparaDoisTombos(parametros.tombo, parametros.tombo_alterado);
                } else {
                    parametros = formatarTomboNovo(tombos[0]);
                }
                resolve(parametros);
            })
            .catch(reject);
    });
};

const insereNoParametro = (key, campo, antigo, novo) => ({
    key, campo, antigo, novo,
});

const comparaDoisTombosOperador = (tombo, tomboAlterado) => {
    const parametros = [];
    // / colecoes anexas
    if (tomboAlterado.colecoes_anexas) {
        if (tombo.colecoes_anexa) {
            if (tombo.colecoes_anexa.tipo !== tomboAlterado.colecoes_anexas.tipo) {
                parametros.push(insereNoParametro('1', 'Coleções anexas tipo', tombo.colecoes_anexa.tipo, tomboAlterado.colecoes_anexas.tipo));
            }
            if (tombo.colecoes_anexa.observacoes !== tomboAlterado.colecoes_anexas.observacoes) {

                parametros.push(
                    insereNoParametro(
                        '2',
                        'Coleções anexas observacoes',
                        tombo.colecoes_anexa.observacoes,
                        tomboAlterado.colecoes_anexas.observacoes,
                    ),
                );
            }
        } else {
            if (tomboAlterado.colecoes_anexas.tipo) {
                parametros.push(insereNoParametro('1', 'Coleções anexas tipo', '', tomboAlterado.colecoes_anexas.tipo));
            }
            if (tomboAlterado.colecoes_anexas.observacoes) {
                parametros.push(insereNoParametro('2', 'Coleções anexas observacoes', '', tomboAlterado.colecoes_anexas.observacoes));
            }
        }
    }
    // / coletores
    let coletorPrincipalOrig = {};
    let coletoresOrig = '';
    let coletoresAlt = '';
    let novo = '';
    let antigo = '';

    if (tomboAlterado.coletores) {
        const colAlt = tomboAlterado.coletores;
        for (let i = 0; i < colAlt.length; i++) {
            coletoresAlt += ` ${colAlt[i].nome} `;
        }
        novo = coletoresAlt;
    }
    if (tombo.coletores) {
        const colOrig = tombo.coletores;
        for (let i = 0; i < colOrig.length; i++) {
            if (colOrig[i].tombos_coletores.principal) {
                coletorPrincipalOrig = {
                    id: colOrig[i].id,
                    nome: colOrig[i].nome,
                };
            } else {
                coletoresOrig += ` ${colOrig[i].nome} `;
            }
        }
        antigo = coletoresOrig;
    }
    parametros.push(insereNoParametro('3', 'Coletores', antigo, novo));
    if (coletorPrincipalOrig.id) {
        if (tomboAlterado.coletor_principal.id) {
            if (coletorPrincipalOrig.id !== tomboAlterado.coletor_principal.id) {
                parametros.push(insereNoParametro('4', 'Coletor principal', coletorPrincipalOrig.nome, tomboAlterado.coletor_principal.nome));
            }
        }
    } else if (tomboAlterado.coletor_principal.id) {
        parametros.push(insereNoParametro('4', 'Coletor principal', '', tomboAlterado.coletor_principal.nome));
    }
    // /////local de coleta
    if (tomboAlterado.localidade) {
        if (tomboAlterado.localidade.altitude) {
            if (tombo.altitude) {
                if (tombo.altitude !== tomboAlterado.localidade.altitude) {
                    parametros.push(insereNoParametro('5', 'Altitude', tombo.altitude, tomboAlterado.localidade.altitude));
                }
            } else {
                parametros.push(insereNoParametro('5', 'Altitude', '', tomboAlterado.localidade.altitude));
            }
        }
        if (tomboAlterado.localidade.cidade) {
            if (tomboAlterado.localidade.cidade.id) {
                if (tombo.locais_coletum && tombo.locais_coletum.cidade) {
                    if (tombo.locais_coletum.cidade.id !== tomboAlterado.localidade.cidade.id) {
                        parametros.push(insereNoParametro('6', 'Cidade', tombo.locais_coletum.cidade.nome, tomboAlterado.localidade.cidade.nome));
                    }
                } else {
                    parametros.push(insereNoParametro('6', 'Cidade', '', tomboAlterado.localidade.cidade.nome));
                }
            }
        }
        if (tomboAlterado.localidade.latitude) {
            if (tombo.latitude) {
                if (converteParaDecimal(tomboAlterado.localidade.latitude) !== tombo.latitude) {
                    parametros.push(insereNoParametro('7', 'Latitude', tombo.latitude, tomboAlterado.localidade.latitude));
                }
            } else {
                parametros.push(insereNoParametro('7', 'Latitude', '', tomboAlterado.localidade.latitude));
            }
        }
        if (tomboAlterado.localidade.longitude) {
            if (tombo.longitude) {
                if (converteParaDecimal(tomboAlterado.localidade.longitude) !== tombo.longitude) {
                    parametros.push(insereNoParametro('8', 'Longitude', tombo.longitude, tomboAlterado.localidade.longitude));
                }
            } else {
                parametros.push(insereNoParametro('8', 'Longitude', '', tomboAlterado.localidade.longitude));
            }
        }
    }

    if (tomboAlterado.observacoes) {
        if (tombo.observacoes) {
            parametros.push(insereNoParametro('9', 'Observações', tombo.observacoes, tomboAlterado.observacoes));
        } else {
            parametros.push(insereNoParametro('9', 'Observações', '', tomboAlterado.observacoes));
        }
    }

    if (tomboAlterado.paisagem) {
        const {
            descricao, fase_sucessional: faseSucessional, relevo, solo, vegetacao,
        } = tomboAlterado.paisagem;
        if (descricao) {
            if (tombo.locais_coletum && tombo.locais_coletum.descricao) {
                if (descricao !== tombo.locais_coletum.descricao) {
                    parametros.push(insereNoParametro('10', 'Descrição do local de coleta', tombo.locais_coletum.descricao, descricao));
                }
            } else {
                parametros.push(insereNoParametro('10', 'Descrição do local de coleta', '', descricao));
            }
        }
        if (faseSucessional) {
            if (tombo.locais_coletum && tombo.locais_coletum.fase_sucessional) {
                if (tombo.locais_coletum.fase_sucessional.nome !== faseSucessional.nome) {
                    parametros.push(insereNoParametro('11', 'Fase sucessional', tombo.locais_coletum.nome, faseSucessional.nome));
                }
            } else {
                parametros.push(insereNoParametro('11', 'Fase sucessional', '', faseSucessional.nome));
            }
        }
        if (relevo) {
            if (tombo.locais_coletum && tombo.locais_coletum.relevo) {
                if (tombo.locais_coletum.relevo.nome !== relevo.nome) {
                    parametros.push(insereNoParametro('12', 'Relevo', tombo.locais_coletum.relevo.nome, relevo.nome));
                }
            } else {
                parametros.push(insereNoParametro('12', 'Relevo', '', relevo.nome));
            }
        }
        if (solo) {
            if (tombo.locais_coletum && tombo.locais_coletum.solo) {
                if (tombo.locais_coletum.solo.nome !== solo.nome) {
                    parametros.push(insereNoParametro('13', 'Solo', tombo.locais_coletum.solo.nome, solo.nome));
                }
            } else {
                parametros.push(insereNoParametro('13', 'Solo', '', solo.nome));
            }
        }
        if (vegetacao) {
            if (tombo.locais_coletum && tombo.locais_coletum.vegetaco) {
                if (tombo.locais_coletum.vegetaco.nome !== solo.nome) {
                    parametros.push(insereNoParametro('14', 'Vegetação', tombo.locais_coletum.vegetaco.nome, vegetacao.nome));
                }
            } else {
                parametros.push(insereNoParametro('14', 'Vegetação', '', vegetacao.nome));
            }
        }
    }

    if (tomboAlterado.principal) {
        const {
            data_coleta: dataColeta, entidade,
            nome_popular: nomePopular, numero_coleta: numColeta, tipo,
        } = tomboAlterado.principal;

        if (dataColeta) {
            if (dataColeta.dia) {
                if (tombo.data_coleta_dia) {
                    if (dataColeta.dia !== tombo.data_coleta_dia) {
                        parametros.push(insereNoParametro('16', 'Data coleta dia', tombo.data_coleta_dia, dataColeta.dia));
                    }
                } else {
                    parametros.push(insereNoParametro('16', 'Data coleta dia', '', dataColeta.dia));
                }
            }
            if (dataColeta.mes) {
                if (tombo.data_coleta_mes) {
                    if (dataColeta.mes !== tombo.data_coleta_mes) {
                        parametros.push(insereNoParametro('17', 'Data coleta mes', tombo.data_coleta_mes, dataColeta.mes));
                    }
                } else {
                    parametros.push(insereNoParametro('17', 'Data coleta mes', '', dataColeta.mes));
                }
            }
            if (dataColeta.ano) {
                if (tombo.data_coleta_ano) {
                    if (dataColeta.ano !== tombo.data_coleta_ano) {
                        parametros.push(insereNoParametro('18', 'Data coleta ano', tombo.data_coleta_ano, dataColeta.ano));
                    }
                } else {
                    parametros.push(insereNoParametro('18', 'Data coleta ano', '', dataColeta.ano));
                }
            }
        }

        if (entidade) {
            if (tombo.herbario) {
                if (entidade.id !== tombo.herbario.id) {
                    parametros.push(insereNoParametro('19', 'Herbário', tombo.herbario.nome, entidade.nome));
                }
            } else {
                parametros.push(insereNoParametro('19', 'Herbário', '', entidade.nome));
            }
        }

        if (nomePopular) {
            if (tombo.nome_populares) {
                if (nomePopular !== tombo.nome_populares) {
                    parametros.push(insereNoParametro('20', 'Nomes populares', tombo.nome_populares, nomePopular));
                }
            } else {
                parametros.push(insereNoParametro('20', 'Nomes populares', '', nomePopular));
            }
        }

        if (numColeta) {
            if (tombo.numero_coleta) {
                if (numColeta !== tombo.numero_coleta) {
                    parametros.push(insereNoParametro('21', 'Numero de coleta', numColeta, tombo.numero_coleta));
                }
            } else {
                parametros.push(insereNoParametro('21', 'Numero de coleta', '', tombo.numero_coleta));
            }
        }

        if (tipo) {
            if (tombo.tipo) {
                if (tipo.id !== tombo.tipo.id) {
                    parametros.push(insereNoParametro('22', 'Tipo', tombo.tipo.nome, tipo.nome));
                }
            } else {
                parametros.push(insereNoParametro('22', 'Tipo', '', tipo.nome));
            }
        }
    }

    if (tomboAlterado.taxonomia) {
        const {
            especie, familia, genero, sub_especie: subEspecie, sub_familia: subFamilia, variedade,
        } = tomboAlterado.taxonomia;

        if (especie) {
            if (tombo.especy) {
                if (especie.nome !== tombo.especy.nome) {
                    parametros.push(insereNoParametro('23', 'Especie', especie, tombo.especy.nome));
                }
            } else {
                parametros.push(insereNoParametro('23', 'Especie', '', especie.nome));
            }
        }

        if (familia) {
            if (tombo.familia) {
                if (familia.nome !== tombo.familia.nome) {
                    parametros.push(insereNoParametro('24', 'Familia', familia, tombo.familia.nome));
                }
            } else {
                parametros.push(insereNoParametro('24', 'Familia', '', familia.nome));
            }
        }

        if (genero) {
            if (tombo.genero) {
                if (genero.nome !== tombo.genero.nome) {
                    parametros.push(insereNoParametro('25', 'Genero', genero, tombo.genero.nome));
                }
            } else {
                parametros.push(insereNoParametro('25', 'Genero', '', genero.nome));
            }
        }

        if (subEspecie) {
            if (tombo.sub_especy) {
                if (subEspecie.nome !== tombo.sub_especy) {
                    parametros.push(insereNoParametro('26', 'Subespecie', subEspecie, tombo.sub_especy.nome));
                }
            } else {
                parametros.push(insereNoParametro('26', 'Subespecie', '', subEspecie.nome));
            }
        }

        if (subFamilia) {
            if (tombo.sub_familia) {
                if (subFamilia.nome !== tombo.sub_familia) {
                    parametros.push(insereNoParametro('27', 'Subfamilia', subFamilia, tombo.sub_familia.nome));
                }
            } else {
                parametros.push(insereNoParametro('27', 'Subfamilia', '', subFamilia.nome));
            }
        }

        if (variedade) {
            if (tombo.variedade) {
                if (variedade.nome !== tombo.variedade) {
                    parametros.push(insereNoParametro('28', 'Variedade', variedade, tombo.variedade.nome));
                }
            } else {
                parametros.push(insereNoParametro('28', 'Variedade', '', variedade.nome));
            }
        }
    }
    return parametros;

};

export const visualizarAlteracaoOperador = (json, alteracao, transaction) => {
    let parametros = {};

    return new Promise((resolve, reject) => {

        parametros = {
            ...parametros,
            numero_tombo: alteracao.tombo_hcf,
        };
        Tombo.findAll({
            where: {
                hcf: alteracao.tombo_hcf,
            },
            include: [
                {
                    model: Coletor,
                },
                {
                    model: Herbario,
                },
                {
                    model: Variedade,
                },
                {
                    model: Tipo,
                },
                {
                    model: Especie,
                },
                {
                    model: Familia,
                },
                {
                    model: Subfamilia,
                },
                {
                    model: Genero,
                },
                {
                    model: Subespecie,
                },
                {
                    model: ColecaoAnexa,
                },
                {
                    model: LocalColeta,
                    include: [
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
                            model: Cidade,
                        },
                        {
                            model: FaseSucessional,
                        },
                    ],
                },
            ],
            transaction,
        })
            .then(tombo => {
                parametros = {
                    ...parametros,
                    tombo_original: tombo,
                };
                const visualizacaoFormatada = comparaDoisTombosOperador(tombo, json);
                parametros = {
                    ...parametros,
                    retorno: visualizacaoFormatada,
                };
                resolve(visualizacaoFormatada);
            })
            .catch(reject);
    });
};

export const aprovarPendencia = async (alteracao, hcf, transaction) => {
    if (!alteracao || !hcf) {
        throw new BadRequestExeption(404);
    }

    const tomboAtual = await Tombo.findOne({
        where: { hcf },
        transaction,
        raw: true,
        nest: true,
    });

    if (!tomboAtual) {
        throw new BadRequestExeption(404);
    }

    const updateTombo = {};
    const nomesCientificosPartes = [];

    if (alteracao.nomes_populares !== undefined) {
        updateTombo.nomes_populares = alteracao.nomes_populares;
    }

    if (alteracao.unicata !== undefined) {
        updateTombo.unicata = alteracao.unicata;
    }

    if (alteracao.numero_coleta !== undefined) {
        updateTombo.numero_coleta = alteracao.numero_coleta;
    }

    if (alteracao.observacao !== undefined) {
        updateTombo.observacao = alteracao.observacao;
    }

    if (alteracao.data_tombo !== undefined) {
        updateTombo.data_tombo = alteracao.data_tombo;
    }

    if (alteracao.data_coleta_dia !== undefined) {
        updateTombo.data_coleta_dia = alteracao.data_coleta_dia;
    }

    if (alteracao.data_coleta_mes !== undefined) {
        updateTombo.data_coleta_mes = alteracao.data_coleta_mes;
    }

    if (alteracao.data_coleta_ano !== undefined) {
        updateTombo.data_coleta_ano = alteracao.data_coleta_ano;
    }

    if (alteracao.data_identificacao_dia !== undefined) {
        updateTombo.data_identificacao_dia = alteracao.data_identificacao_dia;
    }

    if (alteracao.data_identificacao_mes !== undefined) {
        updateTombo.data_identificacao_mes = alteracao.data_identificacao_mes;
    }

    if (alteracao.data_identificacao_ano !== undefined) {
        updateTombo.data_identificacao_ano = alteracao.data_identificacao_ano;
    }

    if (alteracao.latitude !== undefined) {
        let latitudeValue = null;
        if (alteracao.latitude !== null) {
            if (typeof alteracao.latitude === 'string') {
                latitudeValue = converteParaDecimal(alteracao.latitude);
            } else {
                latitudeValue = alteracao.latitude;
            }
        }
        updateTombo.latitude = latitudeValue;
    }

    if (alteracao.longitude !== undefined) {
        let longitudeValue = null;
        if (alteracao.longitude !== null) {
            if (typeof alteracao.longitude === 'string') {
                longitudeValue = converteParaDecimal(alteracao.longitude);
            } else {
                longitudeValue = alteracao.longitude;
            }
        }
        updateTombo.longitude = longitudeValue;
    }

    if (alteracao.altitude !== undefined) {
        updateTombo.altitude = alteracao.altitude;
    }

    if (alteracao.entidade_id !== undefined) {
        if (alteracao.entidade_id !== null) {
            const herbario = await Herbario.findOne({
                where: { id: alteracao.entidade_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!herbario) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.entidade_id = alteracao.entidade_id;
    }

    if (alteracao.tipo_id !== undefined) {
        if (alteracao.tipo_id !== null) {
            const tipo = await Tipo.findOne({
                where: { id: alteracao.tipo_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!tipo) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.tipo_id = alteracao.tipo_id;
    }

    if (alteracao.familia_id !== undefined) {
        if (alteracao.familia_id !== null) {
            const familia = await Familia.findOne({
                where: { id: alteracao.familia_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!familia) {
                throw new BadRequestExeption(404);
            }
        }

        updateTombo.familia_id = alteracao.familia_id;

        if (alteracao.familia_id === null) {
            updateTombo.sub_familia_id = null;
            updateTombo.genero_id = null;
            updateTombo.especie_id = null;
            updateTombo.sub_especie_id = null;
            updateTombo.variedade_id = null;
        }
    }

    if (alteracao.sub_familia_id !== undefined) {
        if (alteracao.sub_familia_id !== null) {
            const subfamilia = await Subfamilia.findOne({
                where: {
                    id: alteracao.sub_familia_id,
                    familia_id: updateTombo.familia_id || tomboAtual.familia_id,
                },
                transaction,
                raw: true,
                nest: true,
            });

            if (!subfamilia) {
                throw new BadRequestExeption(404);
            }
        }

        updateTombo.sub_familia_id = alteracao.sub_familia_id;

        if (alteracao.sub_familia_id === null) {
            updateTombo.genero_id = null;
            updateTombo.especie_id = null;
            updateTombo.sub_especie_id = null;
            updateTombo.variedade_id = null;
        }
    }

    if (alteracao.genero_id !== undefined) {
        if (alteracao.genero_id !== null) {
            const genero = await Genero.findOne({
                where: {
                    id: alteracao.genero_id,
                    familia_id: updateTombo.familia_id || tomboAtual.familia_id,
                },
                transaction,
                raw: true,
                nest: true,
            });

            if (!genero) {
                throw new BadRequestExeption(404);
            }
            nomesCientificosPartes.push(genero.nome);
        }

        updateTombo.genero_id = alteracao.genero_id;

        if (alteracao.genero_id === null) {
            updateTombo.especie_id = null;
            updateTombo.sub_especie_id = null;
            updateTombo.variedade_id = null;
        }
    }

    if (alteracao.especie_id !== undefined) {
        if (alteracao.especie_id !== null) {
            const especie = await Especie.findOne({
                where: {
                    id: alteracao.especie_id,
                    genero_id: updateTombo.genero_id || tomboAtual.genero_id,
                },
                transaction,
                raw: true,
                nest: true,
            });

            if (!especie) {
                throw new BadRequestExeption(404);
            }
            nomesCientificosPartes.push(especie.nome);
        }

        updateTombo.especie_id = alteracao.especie_id;

        if (alteracao.especie_id === null) {
            updateTombo.sub_especie_id = null;
            updateTombo.variedade_id = null;
        }
    }

    if (alteracao.sub_especie_id !== undefined) {
        if (alteracao.sub_especie_id !== null) {
            const subespecie = await Subespecie.findOne({
                where: {
                    id: alteracao.sub_especie_id,
                    especie_id: updateTombo.especie_id || tomboAtual.especie_id,
                },
                transaction,
                raw: true,
                nest: true,
            });

            if (!subespecie) {
                throw new BadRequestExeption(404);
            }
        }

        updateTombo.sub_especie_id = alteracao.sub_especie_id;

        if (alteracao.sub_especie_id === null) {
            updateTombo.variedade_id = null;
        }
    }

    if (alteracao.variedade_id !== undefined) {
        if (alteracao.variedade_id !== null) {
            const variedade = await Variedade.findOne({
                where: {
                    id: alteracao.variedade_id,
                    especie_id: updateTombo.especie_id || tomboAtual.especie_id,
                },
                transaction,
                raw: true,
                nest: true,
            });

            if (!variedade) {
                throw new BadRequestExeption(404);
            }
        }

        updateTombo.variedade_id = alteracao.variedade_id;
    }

    if (nomesCientificosPartes.length > 0) {
        updateTombo.nome_cientifico = nomesCientificosPartes.join(' ');
    } else if (Object.keys(updateTombo).some(key => key.includes('genero_id') || key.includes('especie_id'))) {
        updateTombo.nome_cientifico = null;
    }

    if (alteracao.local_coleta_id !== undefined) {
        if (alteracao.local_coleta_id !== null) {
            const localColeta = await LocalColeta.findOne({
                where: { id: alteracao.local_coleta_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!localColeta) {
                throw new BadRequestExeption(404);
            }

            const cidadeRefId = (alteracao.cidade_id !== undefined)
                ? alteracao.cidade_id
                : tomboAtual.cidade_id;

            if (cidadeRefId !== undefined && cidadeRefId !== null) {
                if (localColeta.cidade_id !== cidadeRefId) {
                    throw new BadRequestExeption(535);
                }
            }
        }
        updateTombo.local_coleta_id = alteracao.local_coleta_id;
    }

    if (alteracao.cidade_id !== undefined) {
        if (alteracao.cidade_id !== null) {
            const cidade = await Cidade.findOne({
                where: { id: alteracao.cidade_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!cidade) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.cidade_id = alteracao.cidade_id;
    }

    if (alteracao.descricao !== undefined) {
        updateTombo.descricao = alteracao.descricao;
    }

    if (alteracao.solo_id !== undefined) {
        if (alteracao.solo_id !== null) {
            const solo = await Solo.findOne({
                where: { id: alteracao.solo_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!solo) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.solo_id = alteracao.solo_id;
    }

    if (alteracao.relevo_id !== undefined) {
        if (alteracao.relevo_id !== null) {
            const relevo = await Relevo.findOne({
                where: { id: alteracao.relevo_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!relevo) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.relevo_id = alteracao.relevo_id;
    }

    if (alteracao.vegetacao_id !== undefined) {
        if (alteracao.vegetacao_id !== null) {
            const vegetacao = await Vegetacao.findOne({
                where: { id: alteracao.vegetacao_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!vegetacao) {
                throw new BadRequestExeption(404);
            }
        }
        updateTombo.vegetacao_id = alteracao.vegetacao_id;
    }

    if (alteracao.coletor_id !== undefined) {
        if (alteracao.coletor_id !== null) {
            const coletor = await Coletor.findOne({
                where: { id: alteracao.coletor_id },
                transaction,
                raw: true,
                nest: true,
            });

            if (!coletor) {
                throw new BadRequestExeption(404);
            }

        }
        updateTombo.coletor_id = alteracao.coletor_id;
    }

    updateTombo.rascunho = false;

    if (Object.keys(updateTombo).length > 0) {
        await Tombo.update(updateTombo, {
            where: { hcf },
            transaction,
        });
    }

    if (alteracao.identificadores !== undefined) {
        await TomboIdentificador.destroy({
            where: { tombo_hcf: hcf },
            transaction,
        });

        if (Array.isArray(alteracao.identificadores) && alteracao.identificadores.length > 0) {
            const identificadoresPromises = alteracao.identificadores.map(async (identificadorId, index) => {
                const identificador = await Identificador.findOne({
                    where: { id: identificadorId },
                    transaction,
                    raw: true,
                    nest: true,
                });

                if (!identificador) {
                    throw new BadRequestExeption(404);
                }

                return TomboIdentificador.create({
                    tombo_hcf: hcf,
                    identificador_id: identificadorId,
                    ordem: index + 1,
                }, { transaction });
            });

            await Promise.all(identificadoresPromises);
        }
    }

    if (alteracao.complementares !== undefined) {
        await ColetorComplementar.destroy({
            where: { hcf },
            transaction,
        });

        if (alteracao.complementares) {
            await ColetorComplementar.create({
                hcf,
                complementares: alteracao.complementares,
            }, { transaction });
        }
    }

    if (alteracao.colecoes_anexas_tipo !== undefined || alteracao.colecoes_anexas_observacoes !== undefined) {
        const tomboAtualizado = await Tombo.findOne({
            where: { hcf },
            transaction,
            raw: true,
            nest: true,
        });

        if (tomboAtualizado.colecao_anexa_id) {
            const updateColecao = {};

            if (alteracao.colecoes_anexas_tipo !== undefined) {
                updateColecao.tipo = alteracao.colecoes_anexas_tipo;
            }

            if (alteracao.colecoes_anexas_observacoes !== undefined) {
                updateColecao.observacoes = alteracao.colecoes_anexas_observacoes;
            }

            if (Object.keys(updateColecao).length > 0) {
                await ColecaoAnexa.update(updateColecao, {
                    where: { id: tomboAtualizado.colecao_anexa_id },
                    transaction,
                });
            }
        } else if (alteracao.colecoes_anexas_tipo || alteracao.colecoes_anexas_observacoes) {
            const novaColecao = await ColecaoAnexa.create({
                tipo: alteracao.colecoes_anexas_tipo,
                observacoes: alteracao.colecoes_anexas_observacoes,
            }, { transaction });

            await Tombo.update({
                colecao_anexa_id: novaColecao.id,
            }, {
                where: { hcf },
                transaction,
            });
        }
    }

    const tomboFinal = await Tombo.findOne({
        where: { hcf, ativo: true },
        transaction,
        raw: true,
        nest: true,
    });

    return {
        success: true,
        message: 'Pendência aprovada com sucesso',
        tombo: tomboFinal,
    };
};

export const visualizarComJsonNome = (alteracao, hcf, transaction) => new Promise((resolve, reject) => {
    Tombo.findOne({
        where: {
            hcf,
        },
        include: [
            {
                model: Variedade,
            },
            {
                model: Especie,
            },
            {
                model: Familia,
            },
            {
                model: Subfamilia,
            },
            {
                model: Genero,
            },
            {
                model: Subespecie,
            },
        ],
        transaction,
    })
        .then(tombos => {

            var jsonRetorno = [];
            if (tombos.especy) {
                if (alteracao.especie_nome) {
                    if (tombos.especy.nome !== alteracao.especie_nome || tombos.rascunho) {
                        jsonRetorno.push({
                            key: '1',
                            campo: 'Especie',
                            antigo: tombos.especy.nome,
                            novo: alteracao.especie_nome,
                        });
                    }
                }
            } else if (alteracao.especie_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '1',
                    campo: 'Especie',
                    antigo: '',
                    novo: alteracao.especie_nome,
                });
            }
            if (tombos.familia) {
                if (alteracao.familia_nome) {
                    if (tombos.familia.nome !== alteracao.familia_nome || tombos.rascunho) {
                        jsonRetorno.push({
                            key: '2',
                            campo: 'Familia',
                            antigo: tombos.familia.nome,
                            novo: alteracao.familia_nome,
                        });
                    }
                }
            } else if (alteracao.familia_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '2',
                    campo: 'Familia',
                    antigo: '',
                    novo: alteracao.familia_nome,
                });
            }
            if (tombos.genero) {
                if (alteracao.genero_nome) {
                    if (tombos.genero.nome !== alteracao.genero_nome || tombos.rascunho) {
                        jsonRetorno.push({
                            key: '3',
                            campo: 'Gênero',
                            antigo: tombos.genero.nome,
                            novo: alteracao.genero_nome,
                        });
                    }
                }
            } else if (alteracao.genero_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '3',
                    campo: 'Gênero',
                    antigo: '',
                    novo: alteracao.genero_nome,
                });
            }
            if (tombos.variedade) {
                if (alteracao.variedade_nome) {
                    if (tombos.variedade.nome !== alteracao.variedade_nome || tombos.rascunho) {
                        jsonRetorno.push({
                            key: '4',
                            campo: 'Variedade',
                            antigo: tombos.variedade.nome,
                            novo: alteracao.variedade_nome,
                        });
                    }
                }
            } else if (alteracao.variedade_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '4',
                    campo: 'Variedade',
                    antigo: '',
                    novo: alteracao.variedade_nome,
                });
            }
            if (tombos.sub_especy) {
                if (alteracao.subespecie_nome) {
                    if (tombos.sub_especy.nome !== alteracao.subespecie_nome || tombos.rascunho) {
                        jsonRetorno.push({
                            key: '5',
                            campo: 'Subespecie',
                            antigo: tombos.sub_especy.nome,
                            novo: alteracao.subespecie_nome,
                        });
                    }
                }
            } else if (alteracao.subespecie_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '5',
                    campo: 'Subespecie',
                    antigo: '',
                    novo: alteracao.subespecie_nome,
                });
            }
            if (tombos.sub_familia || tombos.rascunho) {
                if (alteracao.subfamilia_nome) {
                    if (tombos.sub_familia.nome !== alteracao.subfamilia_nome) {
                        jsonRetorno.push({
                            key: '6',
                            campo: 'Subfamilia',
                            antigo: tombos.sub_familia.nome,
                            novo: alteracao.subfamilia_nome,
                        });
                    }
                }
            } else if (alteracao.subfamilia_nome || tombos.rascunho) {
                jsonRetorno.push({
                    key: '6',
                    campo: 'Subfamilia',
                    antigo: '',
                    novo: alteracao.subfamilia_nome,
                });
            }
            resolve(jsonRetorno);
        })
        .catch(reject);
});

export async function visualizar(request, response, next) {
    try {
        const id = request.params.pendencia_id;
        const alteracao = await Alteracao.findOne({
            where: { ativo: true, id },
        });

        if (!alteracao) {
            throw new BadRequestExeption(800);
        }

        const objetoAlterado = JSON.parse(alteracao.tombo_json);
        const parametros = {};
        const alteracaoAprovada = alteracao.status === 'APROVADO';

        if (objetoAlterado.nomes_populares !== undefined) {
            parametros.nome_popular = objetoAlterado.nomes_populares;
        }

        if (objetoAlterado.numero_coleta !== undefined) {
            parametros.numero_coleta = objetoAlterado.numero_coleta;
        }

        if (objetoAlterado.data_coleta_dia !== undefined) {
            parametros.data_coleta_dia = objetoAlterado.data_coleta_dia;
        }

        if (objetoAlterado.data_coleta_mes !== undefined) {
            parametros.data_coleta_mes = objetoAlterado.data_coleta_mes;
        }

        if (objetoAlterado.data_coleta_ano !== undefined) {
            parametros.data_coleta_ano = objetoAlterado.data_coleta_ano;
        }

        if (objetoAlterado.altitude !== undefined) {
            parametros.altitude = objetoAlterado.altitude;
        }

        if (objetoAlterado.local_coleta_id !== undefined) {
            parametros.localColeta = await LocalColeta.findOne({ where: { id: objetoAlterado.local_coleta_id }, raw: true, nest: true });
        }

        if (objetoAlterado.descricao !== undefined) {
            parametros.descricao = objetoAlterado.descricao;
        }

        if (objetoAlterado.data_identificacao_dia !== undefined) {
            parametros.data_identificacao_dia = objetoAlterado.data_identificacao_dia;
        }

        if (objetoAlterado.data_identificacao_mes !== undefined) {
            parametros.data_identificacao_mes = objetoAlterado.data_identificacao_mes;
        }

        if (objetoAlterado.data_identificacao_ano !== undefined) {
            parametros.data_identificacao_ano = objetoAlterado.data_identificacao_ano;
        }

        if (objetoAlterado.colecoes_anexas_observacoes !== undefined) {
            parametros.colecoes_anexas_observacoes = objetoAlterado.colecoes_anexas_observacoes;
        }

        if (objetoAlterado.observacao !== undefined) {
            parametros.observacoes = objetoAlterado.observacao;
        }

        if (objetoAlterado.unicata !== undefined) {
            parametros.unicata = objetoAlterado.unicata;
        }

        if (objetoAlterado.latitude !== undefined) {
            parametros.latitude = objetoAlterado.latitude;
        }

        if (objetoAlterado.longitude !== undefined) {
            parametros.longitude = objetoAlterado.longitude;
        }

        if (objetoAlterado.coletor_id !== undefined) {
            parametros.coletor = await Coletor.findOne({ where: { id: objetoAlterado.coletor_id }, raw: true, nest: true });
        }

        if (objetoAlterado.complementares !== undefined) {
            parametros.complementares = objetoAlterado.complementares;
        }

        if (objetoAlterado.familia_id !== undefined) {
            parametros.familia = await Familia.findOne({ where: { id: objetoAlterado.familia_id }, raw: true, nest: true });
        }

        if (objetoAlterado.subfamilia_id !== undefined) {
            parametros.subfamilia = await Subfamilia.findOne({ where: { id: objetoAlterado.subfamilia_id }, raw: true, nest: true });
        }

        if (objetoAlterado.genero_id !== undefined) {
            parametros.genero = await Genero.findOne({ where: { id: objetoAlterado.genero_id }, raw: true, nest: true });
        }

        if (objetoAlterado.especie_id !== undefined) {
            parametros.especie = await Especie.findOne({ where: { id: objetoAlterado.especie_id }, raw: true, nest: true });
        }

        if (objetoAlterado.identificadores !== undefined) {
            const idsIdent = Array.isArray(objetoAlterado.identificadores)
                ? objetoAlterado.identificadores
                : [objetoAlterado.identificadores];
            parametros.identificadores = await Identificador.findAll({
                where: { id: { [Op.in]: idsIdent } },
                raw: true,
                nest: true,
            });
        }

        if (objetoAlterado.fase_sucessional_id !== undefined) {
            parametros.faseSucessional = await FaseSucessional.findOne({ where: { numero: objetoAlterado.fase_sucessional_id }, raw: true, nest: true });
        }

        if (objetoAlterado.vegetacao_id !== undefined) {
            parametros.vegetacao = await Vegetacao.findOne({ where: { id: objetoAlterado.vegetacao_id }, raw: true, nest: true });
        }

        if (objetoAlterado.relevo_id !== undefined) {
            parametros.relevo = await Relevo.findOne({ where: { id: objetoAlterado.relevo_id }, raw: true, nest: true });
        }

        if (objetoAlterado.solo_id !== undefined) {
            parametros.solo = await Solo.findOne({ where: { id: objetoAlterado.solo_id }, raw: true, nest: true });
        }

        if (objetoAlterado.cidade_id !== undefined) {
            parametros.cidade = await Cidade.findOne({ where: { id: objetoAlterado.cidade_id }, raw: true, nest: true });
        }

        if (objetoAlterado.tipo_id !== undefined) {
            parametros.tipo = await Tipo.findOne({ where: { id: objetoAlterado.tipo_id }, raw: true, nest: true });
        }

        if (objetoAlterado.entidade_id !== undefined) {
            parametros.entidade = await Herbario.findOne({ where: { id: objetoAlterado.entidade_id }, raw: true, nest: true });
        }

        if (objetoAlterado.variedade_id !== undefined) {
            parametros.variedade = await Variedade.findOne({ where: { id: objetoAlterado.variedade_id }, raw: true, nest: true });
        }

        if (objetoAlterado.sub_especie_id !== undefined) {
            parametros.subespecie = await Subespecie.findOne({ where: { id: objetoAlterado.sub_especie_id }, raw: true, nest: true });
        }

        const tombo = await Tombo.findOne({
            where: { hcf: alteracao.dataValues.tombo_hcf },
            include: [
                { model: Variedade }, { model: Especie }, { model: Familia },
                { model: Subfamilia }, { model: Genero }, { model: Subespecie },
                { model: Herbario }, { model: Tipo }, { model: Coletor }, { model: ColetorComplementar, as: 'coletor_complementar' },
                { model: Solo }, { model: Relevo }, { model: Vegetacao }, { model: ColecaoAnexa },
                {
                    model: LocalColeta,
                    as: 'locais_coletum',
                    include: [{ model: Cidade }, { model: FaseSucessional }],
                },
                { model: Usuario },
            ],
            raw: true,
            nest: true,
        });

        if (!tombo) {
            throw new BadRequestExeption(801, 'Tombo não encontrado');
        }

        const jsonRetorno = [];
        const ehRascunho = tombo?.rascunho === 1;

        const converteDecimalParaDMS = (decimal, isLatitude = true) => {
            if (decimal === null || decimal === undefined || decimal === '') {
                return '';
            }

            const abs = Math.abs(decimal);
            const graus = Math.floor(abs);
            const minutosDecimal = (abs - graus) * 60;
            const minutos = Math.floor(minutosDecimal);
            const segundos = ((minutosDecimal - minutos) * 60).toFixed(2);

            let hemisferio;
            if (isLatitude) {
                hemisferio = decimal >= 0 ? 'N' : 'S';
            } else {
                hemisferio = decimal >= 0 ? 'E' : 'W';
            }

            return `${graus}° ${minutos}' ${segundos}" ${hemisferio}`;
        };

        const addRetorno = (key, campo, antigo, novo) => {
            const antigoStr = String(antigo || '').trim();
            const novoStr = String(novo || '').trim();

            if (antigoStr === '' && novoStr === '') {
                return;
            }
            if (antigoStr !== novoStr) {
                jsonRetorno.push({ key, campo, antigo: antigoStr, novo: novoStr });
            }
        };

        if (parametros.familia !== undefined) {
            const nomeFamilia = typeof parametros.familia === 'string' ? parametros.familia : parametros.familia?.nome || '';
            const antigoFamilia = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.familia?.nome || '');
            addRetorno('1', 'Família', antigoFamilia, nomeFamilia);
        }

        if (parametros.subfamilia !== undefined) {
            const nomeSubfamilia = typeof parametros.subfamilia === 'string' ? parametros.subfamilia : parametros.subfamilia?.nome || '';
            const antigoSubfamilia = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.sub_familia?.nome || '');
            addRetorno('2', 'Subfamília', antigoSubfamilia, nomeSubfamilia);
        }

        if (parametros.genero !== undefined) {
            const nomeGenero = typeof parametros.genero === 'string' ? parametros.genero : parametros.genero?.nome || '';
            const antigoGenero = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.genero?.nome || '');
            addRetorno('3', 'Gênero', antigoGenero, nomeGenero);
        }

        if (parametros.especie !== undefined) {
            const nomeEspecie = typeof parametros.especie === 'string' ? parametros.especie : parametros.especie?.nome || '';
            const antigoEspecie = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.especy?.nome || '');
            addRetorno('4', 'Espécie', antigoEspecie, nomeEspecie);
        }

        if (parametros.subespecie !== undefined) {
            const antigoSubespecie = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.sub_especy?.nome || '');
            addRetorno('5', 'Subespécie', antigoSubespecie, parametros.subespecie?.nome || '');
        }

        if (parametros.variedade !== undefined) {
            const antigoVariedade = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.variedade?.nome || '');
            addRetorno('6', 'Variedade', antigoVariedade, parametros.variedade?.nome || '');
        }

        if (parametros.coletor !== undefined) {
            const antigoColetor = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.coletore?.nome || '');
            addRetorno('7', 'Coletor', antigoColetor, parametros.coletor?.nome || '');
        }

        if (parametros.complementares !== undefined) {
            const complementaresAtuais = tombo?.coletor_complementar?.complementares || '';
            const complementaresNovos = parametros.complementares === null ? '' : parametros.complementares;
            const antigoComplementares = (alteracaoAprovada || ehRascunho) ? '' : complementaresAtuais;
            addRetorno('8', 'Coletores complementares', antigoComplementares, complementaresNovos);
        }

        if (parametros.numero_coleta !== undefined) {
            const antigoNumeroColeta = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.numero_coleta || '');
            addRetorno('9', 'Número da coleta', antigoNumeroColeta, parametros.numero_coleta);
        }

        if (parametros.data_coleta_dia !== undefined) {
            const antigoDataDia = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_coleta_dia || '');
            addRetorno('10', 'Data de coleta dia', antigoDataDia, parametros.data_coleta_dia);
        }

        if (parametros.data_coleta_mes !== undefined) {
            const antigoDataMes = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_coleta_mes || '');
            addRetorno('11', 'Data de coleta mês', antigoDataMes, parametros.data_coleta_mes);
        }

        if (parametros.data_coleta_ano !== undefined) {
            const antigoDataAno = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_coleta_ano || '');
            addRetorno('12', 'Data de coleta ano', antigoDataAno, parametros.data_coleta_ano);
        }

        if (parametros.nome_popular !== undefined) {
            const antigoNomePopular = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.nomes_populares || '');
            addRetorno('13', 'Nome popular', antigoNomePopular, parametros.nome_popular);
        }

        if (parametros.entidade !== undefined) {
            const antigoHerbario = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.herbario?.nome || '');
            addRetorno('14', 'Herbário', antigoHerbario, parametros.entidade?.nome || '');
        }

        if (parametros.tipo !== undefined) {
            const antigoTipo = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.tipo?.nome || '');
            addRetorno('15', 'Tipo', antigoTipo, parametros.tipo?.nome || '');
        }

        if (parametros.latitude !== undefined) {
            const antigoLatitude = (alteracaoAprovada || ehRascunho) ? '' : converteDecimalParaDMS(tombo?.latitude, true);
            const novoLatitude = converteDecimalParaDMS(parametros.latitude, true);
            addRetorno('16', 'Latitude', antigoLatitude, novoLatitude);
        }

        if (parametros.longitude !== undefined) {
            const antigoLongitude = (alteracaoAprovada || ehRascunho) ? '' : converteDecimalParaDMS(tombo?.longitude, false);
            const novoLongitude = converteDecimalParaDMS(parametros.longitude, false);
            addRetorno('17', 'Longitude', antigoLongitude, novoLongitude);
        }

        if (parametros.altitude !== undefined) {
            const antigoAltitude = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.altitude || '');
            addRetorno('18', 'Altitude', antigoAltitude, parametros.altitude);
        }

        if (parametros.localColeta !== undefined) {
            const antigoLocalColeta = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.locais_coletum?.descricao || '');
            addRetorno('19', 'Local de Coleta', antigoLocalColeta, parametros.localColeta?.descricao || '');
        }

        if (parametros.descricao !== undefined) {
            const antigoDescricao = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.descricao || '');
            addRetorno('20', 'Descrição do relevo', antigoDescricao, parametros.descricao);
        }

        if (parametros.solo !== undefined) {
            const antigoSolo = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.solo?.nome || '');
            addRetorno('21', 'Solo', antigoSolo, parametros.solo?.nome || '');
        }

        if (parametros.relevo !== undefined) {
            const antigoRelevo = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.relevo?.nome || '');
            addRetorno('22', 'Relevo', antigoRelevo, parametros.relevo?.nome || '');
        }

        if (parametros.vegetacao !== undefined) {
            const antigoVegetacao = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.vegetaco?.nome || '');
            addRetorno('23', 'Vegetação', antigoVegetacao, parametros.vegetacao?.nome || '');
        }

        if (parametros.identificadores !== undefined) {
            const identificadoresAtuais = await TomboIdentificador.findAll({
                attributes: ['tombo_hcf', 'identificador_id', 'ordem'],
                where: { tombo_hcf: tombo?.hcf },
                include: [{ model: Identificador }],
                order: [['ordem', 'ASC']],
                raw: true,
                nest: true,
            });

            const nomesNovos = parametros.identificadores.map(ident => ident.nome).join(', ');
            const nomesAntigos = identificadoresAtuais.map(ident => ident.identificadore?.nome || '').join(', ');
            const antigoIdentificadores = (alteracaoAprovada || ehRascunho) ? '' : nomesAntigos;

            addRetorno('24', 'Identificadores', antigoIdentificadores, nomesNovos);
        }

        if (parametros.data_identificacao_dia !== undefined) {
            const antigoDataIdentDia = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_identificacao_dia || '');
            addRetorno('25', 'Data de identificação dia', antigoDataIdentDia, parametros.data_identificacao_dia);
        }

        if (parametros.data_identificacao_mes !== undefined) {
            const antigoDataIdentMes = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_identificacao_mes || '');
            addRetorno('26', 'Data de identificação mês', antigoDataIdentMes, parametros.data_identificacao_mes);
        }

        if (parametros.data_identificacao_ano !== undefined) {
            const antigoDataIdentAno = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.data_identificacao_ano || '');
            addRetorno('27', 'Data de identificação ano', antigoDataIdentAno, parametros.data_identificacao_ano);
        }

        if (objetoAlterado.colecoes_anexas_tipo !== undefined) {
            const antigoTipoColecao = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.colecoes_anexa?.tipo || '');
            addRetorno('28', 'Tipo - Coleção Anexa', antigoTipoColecao, objetoAlterado.colecoes_anexas_tipo);
        }

        if (parametros.colecoes_anexas_observacoes !== undefined) {
            const antigoObsColecao = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.colecoes_anexa?.observacoes || '');
            addRetorno('29', 'Observações - Coleção Anexa', antigoObsColecao, parametros.colecoes_anexas_observacoes);
        }

        if (parametros.observacoes !== undefined) {
            const antigoObservacoes = (alteracaoAprovada || ehRascunho) ? '' : (tombo?.observacao || '');
            addRetorno('30', 'Observações', antigoObservacoes, parametros.observacoes);
        }

        if (parametros.unicata !== undefined) {
            let unicataAntigo;
            if (alteracaoAprovada || ehRascunho) {
                unicataAntigo = '';
            } else {
                unicataAntigo = tombo?.unicata ? 'Unicata' : 'Duplicata';
            }

            const unicataNovo = parametros.unicata ? 'Unicata' : 'Duplicata';
            addRetorno('31', 'Tipo de Exsicata', unicataAntigo, unicataNovo);
        }

        const jsonRender = {
            fotos: { novas: [], antigas: [] },
            status: null,
            tabela: jsonRetorno,
        };

        response.status(codigos.LISTAGEM).json(jsonRender);
    } catch (error) {
        next(error);
    }
}

export function aceitarPendencia(request, response, next) {
    const id = request.params.pendencia_id;
    const { observacao, status } = request.body;
    let retorno = {};
    const callback = transaction => Promise.resolve()
        .then(() => Alteracao.update({
            observacao,
            status,
        }, {
            where: {
                ativo: true,
                id,
            },
            transaction,
        }))
        .then(() => Alteracao.findOne({
            where: {
                ativo: true,
                id,
            },
            transaction,
        }))
        .then(alt => {
            if (status === 'APROVADO') {
                const objetoAlterado = JSON.parse(alt.tombo_json);
                retorno = aprovarPendencia(objetoAlterado, alt.tombo_hcf, transaction);
            }
            return retorno;
        });
    sequelize.transaction(callback)
        .then(() => {

            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);

}

export function avaliaPendencia(request, response, next) {
    const { pendencia_id: pendenciaId } = request.params;
    const { observacao, status } = request.body;

    return Promise.resolve()
        .then(() => {
            Alteracao.update({
                status,
                observacao,
            }, {
                where: {
                    id: pendenciaId,
                },
            }).then(pendencias => {
                response.status(codigos.BUSCAR_UM_ITEM)
                    .json(pendencias);
            });
        })
        .catch(next);
}

export function verificaAlteracao(request, response, next) {
    const { tombo_id: tomboId } = request.params;
    const callback = transaction => Promise.resolve()
        .then(() => Alteracao.findOne({
            where: {
                status: 'ESPERANDO',
                tombo_hcf: tomboId,
            },
            transaction,
        }))
        .then(retorno => retorno);
    sequelize.transaction(callback)
        .then(retorno => {
            response.status(codigos.BUSCAR_VARIOS_ITENS)
                .json(retorno);

        })
        .catch(next);

}
