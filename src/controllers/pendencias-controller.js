import BadRequestExeption from '../errors/bad-request-exception';
import { converteParaDecimal } from '../helpers/coordenadas';
import models from '../models';
import codigos from '../resources/codigos-http';
import subespecie from '../validators/subespecie';

const {
    Alteracao,
    Autor,
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
    TomboColetor,
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
    if (tombo.cor !== tomboAlterado.cor) {
        parametros.push({
            key: '19',
            campo: 'Cor - Localização',
            antigo: tombo.cor,
            novo: tomboAlterado.cor,
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
    parametros.push({
        key: '19',
        campo: 'Cor',
        antigo: '',
        novo: tombo.cor,
    });
    if (tombo.variedade) {
        parametros.push({
            key: '20',
            campo: 'Variedade',
            antigo: '',
            novo: tombo.variedade.nome,
        });
    }
    if (tombo.tipo) {
        parametros.push({
            key: '21',
            campo: 'Tipo',
            antigo: '',
            novo: tombo.tipo.nome,
        });
    }
    if (tombo.especy) {
        parametros.push({
            key: '22',
            campo: 'Espécie',
            antigo: '',
            novo: tombo.especy.nome,
        });
    }
    if (tombo.genero) {
        parametros.push({
            key: '23',
            campo: 'Genero',
            antigo: '',
            novo: tombo.genero.nome,
        });
    }
    if (tombo.familia) {
        parametros.push({
            key: '24',
            campo: 'Família',
            antigo: '',
            novo: tombo.familia.nome,
        });
    }
    if (tombo.sub_familia) {
        parametros.push({
            key: '25',
            campo: 'Subfamília',
            antigo: '',
            novo: tombo.sub_familia.nome,
        });
    }
    if (tombo.sub_especy) {
        parametros.push({
            key: '26',
            campo: 'Subespécie',
            antigo: '',
            novo: tombo.sub_especy.nome,
        });
    }
    if (tombo.colecoes_anexa) {
        parametros.push({
            key: '27',
            campo: 'Observações - Coleção Anexa',
            antigo: '',
            novo: tombo.colecoes_anexa.observacoes,
        });
    }
    if (tombo.colecoes_anexa) {
        parametros.push({
            key: '28',
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
                ativo: true,
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
            // eslint-disable-next-line
              parametros.push(
                    insereNoParametro(
                        '2',
                        'Coleções anexas observacoes',
                        tombo.colecoes_anexa.observacoes,
                        tomboAlterado.colecoes_anexas.observacoes
                    )
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
        for (let i = 0; i < colAlt.length; i++) { // eslint-disable-line
            coletoresAlt += ` ${colAlt[i].nome} `;
        }
        novo = coletoresAlt;
    }
    if (tombo.coletores) {
        const colOrig = tombo.coletores;
        for (let i = 0; i < colOrig.length; i++) { // eslint-disable-line
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
            cor, data_coleta: dataColeta, entidade,
            nome_popular: nomePopular, numero_coleta: numColeta, tipo,
        } = tomboAlterado.principal;

        if (cor) {
            if (tombo.cor !== cor) {
                parametros.push(insereNoParametro('15', 'Cor', '', tombo.cor));
            }
        }
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
                ativo: true,
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

async function atualizarIdentificadoresDeTombo(tomboHcf, novosIdentificadores) {
    return sequelize.transaction(async transaction => {
        await TomboIdentificador.destroy({
            where: {
                tombo_hcf: tomboHcf,
            },
            transaction,
        });

        const novosIdentificadoresPromise = novosIdentificadores.map((identificadorId, index) =>
            TomboIdentificador.create(
                {
                    tombo_hcf: tomboHcf,
                    identificador_id: identificadorId,
                    ordem: index + 1,
                },
                {
                    transaction,
                }
            )
        );

        await Promise.all(novosIdentificadoresPromise);
    });
}

export const aprovarComJson = async (changes, hcf, response, next) => {
    const alteracao = changes;

    if (alteracao.identificadores) {
        // identificadoresObjeto.usuario_id = alteracao.identificadores;
        await atualizarIdentificadoresDeTombo(hcf, alteracao.identificadores);
    }

    return Promise.resolve()
        .then(() => {
            if (alteracao.familia_id) {
                if (!alteracao.sub_familia_id) {
                    alteracao.sub_familia_id = null;
                }
                if (!alteracao.genero_id) {
                    alteracao.genero_id = null;
                }
                if (!alteracao.especie_id) {
                    alteracao.especie_id = null;
                }
                if (!alteracao.sub_especie_id) {
                    alteracao.sub_especie_id = null;
                }
                if (!alteracao.variedade_id) {
                    alteracao.variedade_id = null;
                }
            }

            if (alteracao.genero_id) {
                if (!alteracao.especie_id) {
                    alteracao.especie_id = null;
                }
                if (!alteracao.sub_especie_id) {
                    alteracao.sub_especie_id = null;
                }
                if (!alteracao.variedade_id) {
                    alteracao.variedade_id = null;
                }
            }

            if (alteracao.especie_id) {
                if (!alteracao.sub_especie_id) {
                    alteracao.sub_especie_id = null;
                }
                if (!alteracao.variedade_id) {
                    alteracao.variedade_id = null;
                }
            }

            if (alteracao.data_coleta) {
                if (alteracao.data_coleta.dia) {
                    alteracao.data_coleta_dia = alteracao.data_coleta.dia;
                }
                if (alteracao.data_coleta.mes) {
                    alteracao.data_coleta_mes = alteracao.data_coleta.mes;
                }
                if (alteracao.data_coleta.ano) {
                    alteracao.data_coleta_ano = alteracao.data_coleta.ano;
                }
            }

            if (alteracao.cidade_id || alteracao.complemento || alteracao.solo_id || alteracao.descricao || alteracao.relevo_id
            || alteracao.vegetacao_id || alteracao.fase_sucessional_id) {
                const tomboColetaAlteracao = {};

                if (alteracao.cidade_id) {
                    tomboColetaAlteracao.cidade_id = alteracao.cidade_id;
                }

                if (alteracao.complemento) {
                    tomboColetaAlteracao.complemento = alteracao.complemento;
                }

                if (alteracao.solo_id) {
                    tomboColetaAlteracao.solo_id = alteracao.solo_id;
                }

                if (alteracao.descricao) {
                    tomboColetaAlteracao.descricao = alteracao.descricao;
                }

                if (alteracao.relevo_id) {
                    tomboColetaAlteracao.relevo_id = alteracao.relevo_id;
                }

                if (alteracao.vegetacao_id) {
                    tomboColetaAlteracao.vegetacao_id = alteracao.vegetacao_id;
                }

                if (alteracao.fase_sucessional_id) {
                    tomboColetaAlteracao.fase_sucessional_id = alteracao.fase_sucessional_id;
                }

                Tombo.findOne({
                    where: {
                        hcf,
                        ativo: true,
                    },
                }).then(tombo => {
                    LocalColeta.update(tomboColetaAlteracao, {
                        where: {
                            id: tombo.dataValues.local_coleta_id,
                        },
                    });
                });
            }

            if (alteracao.coletores) {
                for (let i = 0; i < alteracao.coletores.length; i += 1) {
                    TomboColetor.findOrCreate({
                        where: {
                            tombo_hcf: hcf,
                            coletor_id: alteracao.coletores[i],
                        },
                    }).spread((userResult, created) => {
                        // userResult is the user instance

                        if (created) {
                            console.warn(userResult);
                        }
                    });
                }
            }

            if (alteracao.colecoes_anexas_tipo || alteracao.colecoes_anexas_observacoes) {
                const colecoesObjeto = {};

                if (alteracao.colecoes_anexas_tipo) {
                    colecoesObjeto.tipo = alteracao.colecoes_anexas_tipo;
                }

                if (alteracao.colecoes_anexas_observacoes) {
                    colecoesObjeto.observacoes = alteracao.colecoes_anexas_observacoes;
                }
                Tombo.findOne({
                    where: {
                        hcf,
                    },
                }).then(tombo => {
                    ColecaoAnexa.update(colecoesObjeto, {
                        where: {
                            id: tombo.dataValues.colecao_anexa_id,
                        },
                    });
                });
            }

            if (alteracao.identificadores || alteracao.data_identificacao) {
                const identificadoresObjeto = {};

                if (alteracao.data_identificacao) {
                    if (alteracao.data_identificacao.dia) {
                        identificadoresObjeto.data_identificacao_dia = alteracao.data_identificacao.dia;
                    }

                    if (alteracao.data_identificacao.mes) {
                        identificadoresObjeto.data_identificacao_mes = alteracao.data_identificacao.mes;
                    }

                    if (alteracao.data_identificacao.ano) {
                        identificadoresObjeto.data_identificacao_ano = alteracao.data_identificacao.ano;
                    }
                }
                Alteracao.update(identificadoresObjeto, {
                    where: {
                        tombo_hcf: hcf,
                    },
                });
            }
            Tombo.update(alteracao, {
                where: {
                    hcf,
                    ativo: true,
                },
            }).then(updateResponse => {
                response.status(codigos.BUSCAR_UM_ITEM)
                    .json(updateResponse);
            })
                .catch(next);
        });

    // );
};

export const aprovarComJsonId = (alteracao, hcf, transaction) => {
    const parametros = {};

    return Tombo.findOne({
        where: {
            hcf,
        },
        transaction,
    })
        .then(tombo => {
            parametros.tombo = tombo;
        })
        .then(() => {
            if (alteracao.genero_nome) {
                return Genero.findOrCreate({
                    where: {
                        nome: alteracao.genero_nome,
                    },
                    defaults: {
                        nome: alteracao.genero_nome,
                        familia_id: parametros.tombo.dataValues.familia_id,
                        ativo: true,
                    },
                    attributes: ['id', 'nome'],
                    transaction,
                })
                    .then(([genero]) => {
                        parametros.genero = genero;
                    });
            }
            return undefined;
        })
        .then(() => {
            if (alteracao.especie_nome) {
                const iniciais = alteracao.autor.match(/([A-Z])/g).join('.');
                return Autor.findOrCreate({
                    where: {
                        nome: alteracao.autor,
                    },
                    defaults: {
                        nome: alteracao.autor,
                        iniciais,
                        ativo: true,
                    },
                    attributes: ['id', 'nome', 'iniciais'],
                    transaction,
                })
                    .then(([autor]) => Especie.findOrCreate({
                        where: {
                            nome: alteracao.especie_nome,
                        },
                        defaults: {
                            nome: alteracao.especie_nome,
                            genero_id: parametros.tombo.dataValues.genero_id,
                            familia_id: parametros.tombo.dataValues.familia_id,
                            autor_id: autor.id,
                            ativo: true,
                        },
                        attributes: ['id', 'nome'],
                        transaction,
                    })
                        .then(([especie]) => {
                            parametros.especie = especie;
                        }));
            }
            return undefined;
        })
        .then(() => {
            if (alteracao.subfamilia_nome) {
                return Subfamilia.findOne({
                    where: {
                        nome: alteracao.subfamilia_nome,
                    },
                    attributes: ['id', 'nome'],
                    transaction,
                })
                    .then(subfamilia => {
                        parametros.subfamilia = subfamilia;
                    });
            }
            return undefined;
        })
        .then(() => {
            if (alteracao.subespecie_nome) {
                return Subespecie.findOne({
                    where: {
                        nome: alteracao.subespecie_nome,
                    },
                    attributes: ['id', 'nome'],
                    transaction,
                })
                    .then(subEspecie => {
                        parametros.subespecie = subEspecie;
                    });
            }
            return undefined;
        })
        .then(() => {
            if (alteracao.variedade_nome) {
                return Variedade.findOne({
                    where: {
                        nome: alteracao.variedade_nome,
                    },
                    attributes: ['id', 'nome'],
                    transaction,
                })
                    .then(variedade => {
                        parametros.variedade = variedade;
                    });
            }
            return undefined;
        })
        .then(() => parametros.tombo.update({
            especie_id: parametros.especie ? parametros.especie.id : parametros.tombo.especie_id,
            genero_id: parametros.genero ? parametros.genero.id : parametros.tombo.genero_id,
            subfamilia_id: parametros.subfamilia ? parametros.subfamilia.id : parametros.tombo.subfamilia_id,
            subespecie_id: parametros.subespecie ? parametros.subespecie.id : parametros.tombo.subespecie_id,
            variedade_id: parametros.variedade ? parametros.variedade.id : parametros.tombo.variedade_id,
        }, {
            transaction,
        }))
        .then(() =>
            Promise.all([
                Genero.findOne({
                    where: {
                        id: parametros.tombo.genero_id,
                    },
                    attributes: ['nome'],
                    transaction,
                }),
                Especie.findOne({
                    where: {
                        id: parametros.tombo.especie_id,
                    },
                    attributes: ['nome'],
                    transaction,
                }),
            ])
        )
        .then(([genero, especie]) =>
            parametros.tombo.update({
                nome_cientifico: `${genero.nome} ${especie.nome}`,
            }, {
                transaction,
            })
        );
};

export const aprovarComJsonNome = (alteracao, hcf, transaction) => {
    const parametros = {};

    return Familia.findOne({
        where: {
            nome: { [Op.like]: `%${alteracao.familia_nome}%` },
        },
        transaction,
    })
        .then(familia => {
            if (familia) {
                return familia;
            }
            return Familia.create({ nome: alteracao.familia_nome }, transaction);
        })
        .then(familia => {
            if (familia) {
                parametros.familia = familia;
            }
            if (alteracao.subfamilia_nome) {
                return Subfamilia.findOne({
                    where: {
                        nome: { [Op.like]: `%${alteracao.subfamilia_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(subfamilia => {
            if (subfamilia) {
                parametros.subfamilia = subfamilia;
            } else if (alteracao.subfamilia_nome) {
                return Subfamilia.create({ nome: alteracao.subfamilia_nome }, transaction);
            }
            return undefined;
        })
        .then(subfamilia => {
            if (subfamilia) {
                parametros.subfamilia = subfamilia;
            }
            if (alteracao.genero_nome) {
                return Genero.findOne({
                    where: {
                        nome: { [Op.like]: `%${alteracao.genero_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(genero => {
            if (genero) {
                parametros.genero = genero;
            } else if (alteracao.genero_nome) {
                return Genero.create({
                    where: {
                        nome: { [Op.like]: `%${alteracao.genero_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(genero => {
            if (alteracao.genero_nome) {
                parametros.genero = genero;
            }
            if (alteracao.especie_nome) {
                return Especie.findOne({
                    where: {
                        nome: { [Op.like]: `%${alteracao.especie_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(especie => {
            if (especie) {
                parametros.especie = especie;
            } else if (alteracao.especie_nome) {
                return Especie.create({
                    where: {
                        nome: { [Op.like]: `%${alteracao.especie_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(especie => {
            if (alteracao.especie_nome) {
                parametros.especie = especie;
            }
            if (alteracao.subespecie_nome) {
                return Subespecie.findOne({
                    where: {
                        nome: { [Op.like]: `%${alteracao.subespecie_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(subspecie => {
            if (subspecie) {
                parametros.subespecie = subspecie;
            } else if (alteracao.subespecie_nome) {
                return Subespecie.create({
                    where: {
                        nome: { [Op.like]: `%${alteracao.subespecie_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(subspecie => {
            if (alteracao.subespecie_nome) {
                parametros.subespecie = subspecie;
            }
            if (alteracao.variedade_nome) {
                return Variedade.findOne({
                    where: {
                        nome: { [Op.like]: `%${alteracao.variedade_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(variedade => {
            if (variedade) {
                parametros.variedade = variedade;
            } else if (alteracao.variedade_nome) {
                return Variedade.create({
                    where: {
                        nome: { [Op.like]: `%${alteracao.variedade_nome}%` },
                    },
                    transaction,
                });
            }
            return undefined;
        })
        .then(variedade => {
            if (alteracao.variedade_nome) {
                parametros.variedade = variedade;
            }
            const update = {};
            if (parametros.familia) {
                update.familia_id = parametros.familia.id;
                update.nome_cientifico = `${parametros.familia.nome} `;
            }
            if (parametros.subfamilia) {
                update.sub_familia_id = parametros.subfamilia.id;
                update.nome_cientifico += `${parametros.subfamilia.nome} `;
            }
            if (parametros.genero) {
                update.genero_id = parametros.genero.id;
                update.nome_cientifico += `${parametros.genero.nome} `;
            }
            if (parametros.especie) {
                update.especie_id = parametros.especie.id;
                update.nome_cientifico += `${parametros.especie.nome} `;
            }
            if (parametros.subespecie) {
                update.sub_especie_id = parametros.subespecie.id;
                update.nome_cientifico += `${parametros.subespecie.nome} `;
            }
            if (parametros.variedade) {
                update.variedade_id = parametros.variedade.id;
                update.nome_cientifico += `${parametros.variedade.nome}`;
            }
            return Tombo.update(update, {
                where: {
                    hcf,
                    ativo: true,
                },
                transaction,
            });
        })
        .then(() => true);
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
            // eslint-disable-next-line
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

export function visualizar(request, response, next) {
    const id = request.params.pendencia_id;
    // let retorno = {};
    //   let status = '';
    //   let tombo = -1;
    // const tombosBuscarFoto = [];
    // let fotosOriginaisFormatas = [];
    // let fotosInseridasFinal = [];
    // let fotosRemovidasFinal = [];
    let objetoAlterado = {};
    let jsonRender = {};

    // const callback = transaction => Promise.resolve()
    Alteracao.findOne({
        where: {
            ativo: true,
            id,
        },
        // transaction,
    })
        .then(alteracao => {
            // eslint-disable-next-line no-console
            // console.log("esta e minha alteracao \n\n\n\n\n\n", alteracao);
            if (!alteracao) {
                throw new BadRequestExeption(800);
            }
            // tombo = alteracao.tombo_hcf;
            // eslint-disable-next-line prefer-destructuring
            //     status = alteracao.status;
            objetoAlterado = JSON.parse(alteracao.tombo_json);
            // const objetoAlterado = JSON.parse(alteracao.tombo_json);
            const parametros = {};
            // const tombos = {};

            Tombo.findOne({
                where: {
                    hcf: alteracao.dataValues.tombo_hcf,
                },
            })
                .then(tombo => {
                    console.warn(tombo);
                    // parametros.tombo = tombo;

                    if (objetoAlterado.nomes_populares) {
                        parametros.nome_popular = objetoAlterado.nomes_populares;
                    }
                    if (objetoAlterado.numero_coleta) {
                        parametros.numero_coleta = objetoAlterado.numero_coleta;
                    }
                    if (objetoAlterado.data_coleta) {

                        if (objetoAlterado.data_coleta.dia) {
                            parametros.data_coleta_dia = objetoAlterado.data_coleta.dia;
                        }
                        if (objetoAlterado.data_coleta.mes) {
                            parametros.data_coleta_mes = objetoAlterado.data_coleta.mes;
                        }
                        if (objetoAlterado.data_coleta.ano) {
                            parametros.data_coleta_ano = objetoAlterado.data_coleta.ano;
                        }

                    }
                    if (objetoAlterado.cor) {
                        parametros.cor = objetoAlterado.cor;
                    }
                    if (objetoAlterado.altitude) {
                        parametros.altitude = objetoAlterado.altitude;
                    }
                    if (objetoAlterado.complemento) {
                        parametros.complemento = objetoAlterado.complemento;
                    }
                    if (objetoAlterado.descricao) {
                        parametros.descricao = objetoAlterado.descricao;
                    }
                    if (objetoAlterado.data_identificacao) {

                        if (objetoAlterado.data_identificacao.dia) {
                            parametros.data_identificacao_dia = objetoAlterado.data_identificacao.dia;
                        }
                        if (objetoAlterado.data_identificacao.mes) {
                            parametros.data_identificacao_mes = objetoAlterado.data_identificacao.mes;
                        }
                        if (objetoAlterado.data_identificacao.ano) {
                            parametros.data_identificacao_ano = objetoAlterado.data_identificacao.ano;
                        }

                    }
                    if (objetoAlterado.colecoes_anexas_observacoes) {
                        parametros.colecoes_anexas_observacoes = objetoAlterado.colecoes_anexas_observacoes;
                    }
                    if (objetoAlterado.observacoes) {
                        parametros.observacoes = objetoAlterado.observacoes;
                    }

                })
                .then(() => {
                    if (objetoAlterado.identificadores) {
                        Usuario.findOne({
                            where: {
                                id: objetoAlterado.identificadores,
                            },
                        }).then(identificador => {
                            if (identificador) {
                                parametros.identificador = identificador;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.fase_sucessional_id) {
                        FaseSucessional.findOne({
                            where: {
                                numero: objetoAlterado.fase_sucessional_id,
                            },
                        }).then(faseSucessional => {
                            if (faseSucessional) {
                                parametros.faseSucessional = faseSucessional;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.vegetacao_id) {
                        Vegetacao.findOne({
                            where: {
                                id: objetoAlterado.vegetacao_id,
                            },
                        }).then(vegetacao => {
                            if (vegetacao) {
                                parametros.vegetacao = vegetacao;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.relevo_id) {
                        Relevo.findOne({
                            where: {
                                id: objetoAlterado.relevo_id,
                            },
                        }).then(relevo => {
                            if (relevo) {
                                parametros.relevo = relevo;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.solo_id) {
                        Solo.findOne({
                            where: {
                                id: objetoAlterado.solo_id,
                            },
                        }).then(solo => {
                            if (solo) {
                                parametros.solo = solo;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.cidade_id) {
                        Cidade.findOne({
                            where: {
                                id: objetoAlterado.cidade_id,
                            },
                        }).then(cidade => {
                            if (cidade) {
                                parametros.cidade = cidade;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.tipo_id) {
                        Tipo.findOne({
                            where: {
                                id: objetoAlterado.tipo_id,
                            },
                        }).then(tipo => {
                            if (tipo) {
                                parametros.tipo = tipo;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.entidade_id) {
                        Herbario.findOne({
                            where: {
                                id: objetoAlterado.entidade_id,
                            },
                        }).then(entidade => {
                            if (entidade) {
                                parametros.entidade = entidade;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.familia_nome) {
                        parametros.familia = objetoAlterado.familia_nome;
                    }
                })
                .then(() => {
                    if (objetoAlterado.sub_familia_nome) {
                        parametros.subfamilia = objetoAlterado.sub_familia_nome;

                    }
                })
                .then(() => {
                    if (objetoAlterado.genero_nome) {
                        parametros.genero = objetoAlterado.genero_nome;

                    }
                })
                .then(() => {
                    if (objetoAlterado.especie_nome) {
                        parametros.especie = objetoAlterado.especie_nome;
                    }
                })
                .then(() => {
                    if (objetoAlterado.variedade_id) {
                        Variedade.findOne({
                            where: {
                                id: objetoAlterado.variedade_id,
                            },
                        }).then(variedade => {
                            if (variedade) {
                                parametros.variedade = variedade;
                            }
                        });
                    }
                })
                .then(() => {
                    if (objetoAlterado.sub_especie_id) {
                        Subespecie.findOne({
                            where: {
                                id: objetoAlterado.sub_especie_id,
                            },
                        }).then(subesp => {
                            if (subesp) {
                                parametros.subespecie = subespecie;
                            }
                        });
                    }
                })
                .then(() => {
                    Tombo.findOne({
                        where: {
                            hcf: alteracao.dataValues.tombo_hcf,
                            ativo: true,
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
                            {
                                model: Herbario,
                            },
                            {
                                model: Tipo,
                            },
                            {
                                model: LocalColeta,
                            },
                            {
                                model: Usuario,
                            },
                        ],
                    })
                        .then(tombo => {
                            const tombos = tombo;
                            LocalColeta.findOne({
                                where: {
                                    id: tombos.dataValues.local_coleta_id,
                                },
                                include: [
                                    {
                                        model: Cidade,
                                    },
                                    {
                                        model: FaseSucessional,
                                    },
                                ],
                            })
                                .then(localColeta => {

                                    // console.log("\n\n\n\neste e meu local de coleta\n\n\n\n\n\n\n", localColeta);
                                    // eslint-disable-next-line

                                    // console.log("este o tombo da vizualizacao \n\n\n\n\n\n", tombos);
                                    // console.log("\n\n\n\n\n\n meus parametros \n\n\n\n\n\n\n\n", parametros);
                                    const jsonRetorno = [];
                                    if (parametros.nome_popular) {
                                        if (tombos.dataValues.nomes_populares !== parametros.nome_popular) {
                                            jsonRetorno.push({
                                                key: '1',
                                                campo: 'Nome popular',
                                                antigo: tombos.dataValues.nomes_populares,
                                                novo: parametros.nome_popular,
                                            });
                                        }
                                    }

                                    if (parametros.entidade) {
                                        if (tombos.dataValues.entidade_id !== parametros.entidade.id) {
                                            jsonRetorno.push({
                                                key: '2',
                                                campo: 'Herbario',
                                                antigo: tombos.herbario.nome,
                                                novo: parametros.entidade.nome,
                                            });
                                        }
                                    }

                                    if (parametros.numero_coleta) {
                                        if (tombos.dataValues.numero_coleta !== parametros.numero_coleta) {
                                            jsonRetorno.push({
                                                key: '3',
                                                campo: 'Número da coleta',
                                                antigo: tombos.dataValues.numero_coleta,
                                                novo: parametros.numero_coleta,
                                            });
                                        }
                                    }

                                    if (parametros.data_coleta_dia) {
                                        if (tombos.dataValues.data_coleta_dia !== parametros.data_coleta_dia) {
                                            jsonRetorno.push({
                                                key: '4',
                                                campo: 'Data de coleta dia',
                                                antigo: tombos.dataValues.data_coleta_dia,
                                                novo: parametros.data_coleta_dia,
                                            });
                                        }
                                    }

                                    if (parametros.data_coleta_mes) {
                                        if (tombos.dataValues.data_coleta_mes !== parametros.data_coleta_mes) {
                                            jsonRetorno.push({
                                                key: '5',
                                                campo: 'Data de coleta mes',
                                                antigo: tombos.dataValues.data_coleta_mes,
                                                novo: parametros.data_coleta_mes,
                                            });
                                        }
                                    }

                                    if (parametros.data_coleta_ano) {
                                        if (tombos.dataValues.data_coleta_ano !== parametros.data_coleta_ano) {
                                            jsonRetorno.push({
                                                key: '6',
                                                campo: 'Data de coleta ano',
                                                antigo: tombos.dataValues.data_coleta_ano,
                                                novo: parametros.data_coleta_ano,
                                            });
                                        }
                                    }

                                    if (parametros.tipo) {
                                        if (tombos.tipo.nome !== parametros.tipo.nome) {
                                            jsonRetorno.push({
                                                key: '7',
                                                campo: 'Tipo',
                                                antigo: tombos.tipo.nome,
                                                novo: parametros.tipo.nome,
                                            });
                                        }
                                    }

                                    if (parametros.cor) {
                                        if (tombos.dataValues.cor !== parametros.cor) {
                                            jsonRetorno.push({
                                                key: '8',
                                                campo: 'Localidade cor',
                                                antigo: tombos.dataValues.cor,
                                                novo: parametros.cor,
                                            });
                                        }
                                    }

                                    if (parametros.familia) {
                                        if (tombos.familia === null && parametros.familia !== null) {
                                            jsonRetorno.push({
                                                key: '9',
                                                campo: 'Familia',
                                                antigo: ' ',
                                                novo: parametros.familia,
                                            });
                                        } else if (tombos.familia.nome !== parametros.familia) {
                                            jsonRetorno.push({
                                                key: '9',
                                                campo: 'Familia',
                                                antigo: tombos.familia.nome,
                                                novo: parametros.familia,
                                            });
                                        }
                                    }

                                    if (parametros.genero) {
                                        if (tombos.genero === null && parametros.genero !== null) {
                                            jsonRetorno.push({
                                                key: '10',
                                                campo: 'Gênero',
                                                antigo: ' ',
                                                novo: parametros.genero,
                                            });
                                        } else if (tombos.genero.nome !== parametros.genero) {
                                            jsonRetorno.push({
                                                key: '10',
                                                campo: 'Gênero',
                                                antigo: tombos.genero.nome,
                                                novo: parametros.genero,
                                            });
                                        }
                                    }

                                    if (parametros.subfamilia) {
                                        if (tombos.sub_familia === null && parametros.subfamilia !== null) {
                                            jsonRetorno.push({
                                                key: '11',
                                                campo: 'Subfamilia',
                                                antigo: ' ',
                                                novo: parametros.subfamilia,
                                            });
                                        } else if (tombos.sub_familia.nome !== parametros.subfamilia) {
                                            jsonRetorno.push({
                                                key: '11',
                                                campo: 'Subfamilia',
                                                antigo: tombos.sub_familia.nome,
                                                novo: parametros.subfamilia,
                                            });
                                        }
                                    }

                                    if (parametros.especie) {
                                        if (tombos.especy === null && parametros.especie !== null) {
                                            jsonRetorno.push({
                                                key: '12',
                                                campo: 'Especie',
                                                antigo: ' ',
                                                novo: parametros.especie,
                                            });
                                        } else if (tombos.especy.nome !== parametros.especie) {
                                            jsonRetorno.push({
                                                key: '12',
                                                campo: 'Especie',
                                                antigo: tombos.especy.nome,
                                                novo: parametros.especie,
                                            });
                                        }
                                    }

                                    if (parametros.subespecie) {
                                        if (tombos.sub_especy === null && parametros.subespecie !== null) {
                                            jsonRetorno.push({
                                                key: '13',
                                                campo: 'Subespecie',
                                                antigo: ' ',
                                                novo: parametros.subespecie.nome,
                                            });
                                        } else if (tombos.sub_especy.id !== parametros.subespecie.id) {
                                            jsonRetorno.push({
                                                key: '13',
                                                campo: 'Subespecie',
                                                antigo: tombos.sub_especy.nome,
                                                novo: parametros.subespecie.nome,
                                            });
                                        }
                                    }

                                    if (parametros.altitude) {
                                        if (tombos.dataValues.altitude !== parametros.altitude) {
                                            jsonRetorno.push({
                                                key: '14',
                                                campo: 'Altitude',
                                                antigo: tombos.dataValues.altitude,
                                                novo: parametros.altitude,
                                            });
                                        }
                                    }

                                    if (parametros.cidade) {
                                        if (localColeta.cidade.id !== parametros.cidade.id) {
                                            jsonRetorno.push({
                                                key: '15',
                                                campo: 'Cidade',
                                                antigo: localColeta.cidade.nome,
                                                novo: parametros.cidade.nome,
                                            });
                                        }
                                    }

                                    if (parametros.complemento) {
                                        if (localColeta.dataValues.complemento !== parametros.complemento) {
                                            jsonRetorno.push({
                                                key: '16',
                                                campo: 'Complemento',
                                                antigo: localColeta.dataValues.complemento,
                                                novo: parametros.complemento,
                                            });
                                        }
                                    }

                                    if (parametros.solo) {
                                        if (localColeta.solo.id !== parametros.solo.id) {
                                            jsonRetorno.push({
                                                key: '17',
                                                campo: 'Solo',
                                                antigo: localColeta.solo.nome,
                                                novo: parametros.solo.nome,
                                            });
                                        }
                                    }

                                    if (parametros.descricao) {
                                        if (localColeta.dataValues.descricao !== parametros.descricao) {
                                            jsonRetorno.push({
                                                key: '18',
                                                campo: 'Descrição do relevo',
                                                antigo: localColeta.dataValues.descricao,
                                                novo: parametros.descricao,
                                            });
                                        }
                                    }

                                    if (parametros.relevo) {
                                        if (localColeta.relevo.id !== parametros.relevo.id) {
                                            jsonRetorno.push({
                                                key: '19',
                                                campo: 'Relevo',
                                                antigo: localColeta.relevo.nome,
                                                novo: parametros.relevo.nome,
                                            });
                                        }
                                    }

                                    if (parametros.vegetacao) {
                                        if (localColeta.vegetaco.id !== parametros.vegetacao.id) {
                                            jsonRetorno.push({
                                                key: '20',
                                                campo: 'Vegetação',
                                                antigo: localColeta.vegetaco.nome,
                                                novo: parametros.vegetacao.nome,
                                            });
                                        }
                                    }

                                    if (parametros.faseSucessional) {
                                        if (localColeta.fase_sucessional.numero !== parametros.faseSucessional.id) {
                                            jsonRetorno.push({
                                                key: '21',
                                                campo: 'Fase sucessional',
                                                antigo: localColeta.fase_sucessional.nome,
                                                novo: parametros.faseSucessional.nome,
                                            });
                                        }
                                    }

                                    if (parametros.identificador) {
                                        if (tombos.usuarios[1].id !== parametros.identificador.id) {
                                            jsonRetorno.push({
                                                key: '22',
                                                campo: 'Identificador',
                                                antigo: tombos.usuarios[1].nome,
                                                novo: parametros.identificador.nome,
                                            });
                                        }
                                    }

                                    if (parametros.data_identificacao_dia) {
                                        if (tombos.dataValues.data_identificacao_dia !== parametros.data_identificacao_dia) {
                                            jsonRetorno.push({
                                                key: '23',
                                                campo: 'Data de identificação dia',
                                                antigo: tombos.dataValues.data_identificacao_dia,
                                                novo: parametros.data_identificacao_dia,
                                            });
                                        }
                                    }

                                    if (parametros.data_identificacao_mes) {
                                        if (tombos.dataValues.data_identificacao_mes !== parametros.data_identificacao_mes) {
                                            jsonRetorno.push({
                                                key: '24',
                                                campo: 'Data de identificação mes',
                                                antigo: tombos.dataValues.data_identificacao_mes,
                                                novo: parametros.data_identificacao_mes,
                                            });
                                        }
                                    }

                                    if (parametros.data_identificacao_ano) {
                                        if (tombos.dataValues.data_identificacao_ano !== parametros.data_identificacao_ano) {
                                            jsonRetorno.push({
                                                key: '25',
                                                campo: 'Data de identificação ano',
                                                antigo: tombos.dataValues.data_identificacao_ano,
                                                novo: parametros.data_identificacao_ano,
                                            });
                                        }
                                    }
                                    jsonRender = {
                                        fotos: {
                                            novas: [],
                                            antigas: [],
                                        },
                                        status: null,
                                        // eslint-disable-next-line no-underscore-dangle
                                        tabela: jsonRetorno._rejectionHandler0 || jsonRetorno,
                                    };
                                })
                                .then(() => {
                                    // eslint-disable-next-line no-underscore-dangle
                                    response.status(codigos.LISTAGEM)
                                        .json(jsonRender);
                                })
                                .catch(next);
                        });
                });
        });
    // sequelize.transaction(callback)
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
                retorno = aprovarComJsonId(objetoAlterado, alt.tombo_hcf, transaction);
            }
            return retorno;
        });
    sequelize.transaction(callback)
        .then(() => {
            // eslint-disable-next-line no-underscore-dangle
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
