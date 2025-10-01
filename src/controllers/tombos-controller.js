/* eslint-disable quotes */
// @ts-nocheck
import { ForeignKeyConstraintError } from 'sequelize';

import { padronizarNomeDarwincore } from '~/helpers/padroniza-nome-darwincore';

import BadRequestExeption from '../errors/bad-request-exception';
import NotFoundException from '../errors/not-found-exception';
import {
    converteParaDecimal, converteDecimalParaGraus, converteDecimalParaGMSGrau, converteDecimalParaGMSMinutos, converteDecimalParaGMSSegundos,
} from '../helpers/coordenadas';
import pick from '../helpers/pick';
import { converteInteiroParaRomano } from '../helpers/tombo';
import models from '../models';
import codigos from '../resources/codigos-http';
import verifyRecaptcha from '../utils/verify-recaptcha';
import { aprovarPendencia } from './pendencias-controller';

const {
    Solo, Relevo, Cidade, Estado, Vegetacao, FaseSucessional, Pais, Tipo, LocalColeta, Familia, sequelize,
    Genero, Subfamilia, Autor, Coletor, Variedade, Subespecie, TomboFoto, Identificador,
    ColecaoAnexa, Especie, Herbario, Tombo, Alteracao, TomboIdentificador, ColetorComplementar, Sequelize: { Op },
} = models;

function parseDataTombo(valor) {
    const partes = valor.split(/[-]/).map(p => p.trim());
    if (partes.length >= 3) {
        const [anoStr, mesStr, diaStr] = partes;
        const dia = parseInt(diaStr, 10);
        const mes = parseInt(mesStr, 10) - 1;
        const ano = parseInt(anoStr, 10);
        if (!Number.isNaN(dia) && !Number.isNaN(mes) && !Number.isNaN(ano)) {
            return new Date(ano, mes, dia, 12, 0, 0, 0);
        }
        return null;
    }
    return null;
}

export const cadastro = (request, response, next) => {
    const {
        principal,
        taxonomia,
        localidade,
        paisagem,
        identificacao,
        coletor,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        coletor_complementar,
        colecoes_anexas: colecoesAnexas,
        observacoes,
        unicata,
    } = request.body.json;
    let tomboCriado = null;

    const callback = transaction =>
        Promise.resolve()
            .then(() => {
                if (!paisagem || !paisagem.solo_id) {
                    return undefined;
                }

                const where = {
                    id: paisagem.solo_id,
                };

                return Solo.findOne({ where, transaction });
            })
            .then(solo => {
                if (paisagem && paisagem.solo_id) {
                    if (!solo) {
                        throw new BadRequestExeption(528);
                    }
                }
                if (paisagem && paisagem.relevo_id) {
                    return Relevo.findOne({
                        where: {
                            id: paisagem.relevo_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(relevo => {
                if (paisagem && paisagem.relevo_id) {
                    if (!relevo) {
                        throw new BadRequestExeption(529);
                    }
                }
                if (paisagem && paisagem.vegetacao_id) {
                    return Vegetacao.findOne({
                        where: {
                            id: paisagem.vegetacao_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(vegetacao => {
                if (paisagem && paisagem.vegetacao_id) {
                    if (!vegetacao) {
                        throw new BadRequestExeption(530);
                    }
                }
                if (paisagem && paisagem.fase_sucessional_id) {
                    return FaseSucessional.findOne({
                        where: {
                            numero: paisagem.fase_sucessional_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(fase => {
                if (paisagem && paisagem.fase_sucessional_id) {
                    if (!fase) {
                        throw new BadRequestExeption(531);
                    }
                }
                return undefined;
            })
            .then(() => {
                if (!localidade?.local_coleta_id) {
                    throw new BadRequestExeption(400);
                }
                return LocalColeta.findOne({
                    where: {
                        id: localidade.local_coleta_id,
                    },
                    transaction,
                });
            })
            .then(localColeta => {
                if (!localColeta) {
                    throw new BadRequestExeption(533);
                }
                return undefined;
            })
        // //////////////CRIA COLECOES ANEXAS///////////
            .then(() => {
                if (colecoesAnexas) {
                    const object = pick(colecoesAnexas, ['tipo', 'observacoes']);
                    return ColecaoAnexa.create(object, { transaction });
                }
                return undefined;
            })
            .then(colecao => {
                if (colecoesAnexas) {
                    if (!colecao) {
                        throw new BadRequestExeption(401);
                    }
                    colecoesAnexas.id = colecao.id;
                }
                return undefined;
            })
        // ///////// VALIDA A TAXONOMIA E A INSERE NO NOME CIENTIFICO //////////
            .then(() => {
                if (taxonomia && taxonomia.familia_id) {
                    return Familia.findOne({
                        where: {
                            id: taxonomia.familia_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(familia => {
                if (taxonomia && taxonomia.familia_id) {
                    if (!familia) {
                        throw new BadRequestExeption(402);
                    }
                }
                return undefined;
            })
            .then(() => {
                if (taxonomia && taxonomia.sub_familia_id) {
                    return Subfamilia.findOne({
                        where: {
                            id: taxonomia.sub_familia_id,
                            familia_id: taxonomia.familia_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(subfamilia => {
                if (taxonomia && taxonomia.sub_familia_id) {
                    if (!subfamilia) {
                        throw new BadRequestExeption(403);
                    }
                }
                return undefined;
            })
            .then(() => {
                if (taxonomia && taxonomia.genero_id) {
                    return Genero.findOne({
                        where: {
                            id: taxonomia.genero_id,
                            familia_id: taxonomia.familia_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(genero => {
                if (taxonomia && taxonomia.genero_id) {
                    if (!genero) {
                        throw new BadRequestExeption(404);
                    }
                    taxonomia.nome_cientifico = genero.nome;
                }
                return undefined;
            })
            .then(() => {
                if (taxonomia && taxonomia.especie_id) {
                    return Especie.findOne({
                        where: {
                            id: taxonomia.especie_id,
                            genero_id: taxonomia.genero_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(especie => {
                if (taxonomia && taxonomia.especie_id) {
                    if (!especie) {
                        throw new BadRequestExeption(405);
                    }
                    taxonomia.nome_cientifico += ` ${especie.nome}`;
                }
                return undefined;
            })
            .then(() => {
                if (taxonomia && taxonomia.sub_especie_id) {
                    return Subespecie.findOne({
                        where: {
                            id: taxonomia.sub_especie_id,
                            especie_id: taxonomia.especie_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(subespecie => {
                if (taxonomia && taxonomia.sub_especie_id) {
                    if (!subespecie) {
                        throw new BadRequestExeption(406);
                    }
                }
                return undefined;
            })
            .then(() => {
                if (taxonomia && taxonomia.variedade_id) {
                    return Variedade.findOne({
                        where: {
                            id: taxonomia.variedade_id,
                            especie_id: taxonomia.especie_id,
                        },
                        transaction,
                    });
                }
                return undefined;
            })
            .then(variedade => {
                if (taxonomia && taxonomia.variedade_id) {
                    if (!variedade) {
                        throw new BadRequestExeption(407);
                    }
                }
                return undefined;
            })
        // /////////// CADASTRA TOMBO /////////////
            .then(() => {
                let jsonTombo = {
                    data_coleta_dia: principal.data_coleta.dia,
                    data_coleta_mes: principal.data_coleta.mes,
                    data_coleta_ano: principal.data_coleta.ano,
                    numero_coleta: principal.numero_coleta,
                    local_coleta_id: localidade.local_coleta_id,
                    cor: principal.cor,
                    coletor_id: coletor,
                    data_tombo: parseDataTombo(principal.data_tombo),
                };

                if (paisagem?.descricao) {
                    jsonTombo.descricao = paisagem.descricao;
                }

                if (observacoes) {
                    jsonTombo.observacao = observacoes;
                }
                if (unicata !== undefined) {
                    jsonTombo.unicata = unicata;
                }
                if (principal.nome_popular) {
                    jsonTombo.nomes_populares = principal.nome_popular;
                }
                if (localidade.latitude) {
                    jsonTombo.latitude = converteParaDecimal(localidade.latitude);
                }
                if (localidade.longitude) {
                    jsonTombo.longitude = converteParaDecimal(localidade.longitude);
                }
                if (localidade.altitude) {
                    jsonTombo.altitude = localidade.altitude;
                }
                if (identificacao) {
                    jsonTombo.data_identificacao_dia = identificacao.data_identificacao?.dia;
                    jsonTombo.data_identificacao_mes = identificacao.data_identificacao?.mes;
                    jsonTombo.data_identificacao_ano = identificacao.data_identificacao?.ano;
                }
                if (paisagem) {
                    jsonTombo.solo_id = paisagem.solo_id;
                    jsonTombo.relevo_id = paisagem.relevo_id;
                    jsonTombo.vegetacao_id = paisagem.vegetacao_id;
                }
                jsonTombo = {
                    ...jsonTombo,
                    ...pick(principal, ['entidade_id', 'tipo_id', 'taxon_id']),
                };
                if (taxonomia) {
                    jsonTombo = {
                        ...jsonTombo,
                        // eslint-disable-next-line max-len
                        ...pick(taxonomia, ['nome_cientifico', 'variedade_id', 'especie_id', 'genero_id', 'familia_id', 'sub_familia_id', 'sub_especie_id']),
                    };
                }
                if (colecoesAnexas && colecoesAnexas.id) {
                    jsonTombo.colecao_anexa_id = colecoesAnexas.id;
                }
                if (request.usuario.tipo_usuario_id === 2 || request.usuario.tipo_usuario_id === 3) {
                    jsonTombo.rascunho = true;
                }
                return Tombo.create(jsonTombo, { transaction });
            })
        // //////////// CADASTRA A ALTERACAO ///////////
            .then(tombo => {
                if (!tombo) {
                    throw new BadRequestExeption(408);
                }
                let status = 'ESPERANDO';
                principal.hcf = tombo.hcf;
                if (request.usuario.tipo_usuario_id === 1) {
                    status = 'APROVADO';
                }

                const dadosComplementares = coletor_complementar?.complementares
                    ? {
                        hcf: tombo.hcf,
                        complementares: coletor_complementar.complementares,
                    }
                    : {};

                const dados = {
                    tombo_hcf: tombo.hcf,
                    usuario_id: request.usuario.id,
                    status,
                    tombo_json: JSON.stringify({ ...tombo.toJSON(), complementares: dadosComplementares }),
                    ativo: true,
                    identificacao: 0,
                };
                tomboCriado = tombo;

                return Alteracao.create(dados, { transaction }).then(alteracaoTomboCriado => {
                    if (!alteracaoTomboCriado) {
                        throw new BadRequestExeption(409);
                    }

                    if (coletor_complementar && coletor_complementar.complementares) {
                        const jsonColetorComplementar = {
                            hcf: principal.hcf,
                            complementares: coletor_complementar.complementares,
                        };

                        return ColetorComplementar.create(jsonColetorComplementar, { transaction });
                    }

                    return alteracaoTomboCriado;
                });
            })
        // /////////////// CADASTRA O INDETIFICADOR ///////////////
            .then(alteracaoTomboCriado => {
                if (!alteracaoTomboCriado) {
                    throw new BadRequestExeption(409);
                }
                if (tomboCriado !== null) {
                    if (identificacao && identificacao.identificadores && identificacao.identificadores.length > 0) {
                        const promises = identificacao.identificadores.map((identificador_id, index) => {
                            const isPrincipal = index === 0;
                            const dadosIdentificadores = {
                                identificador_id,
                                tombo_hcf: tomboCriado.hcf,
                                ordem: index + 1,
                                principal: isPrincipal,
                            };
                            return TomboIdentificador.create(dadosIdentificadores, {
                                transaction,
                            });
                        });
                        return Promise.all(promises);
                    }
                }
                return undefined;
            });

    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.CADASTRO_RETORNO).json({
                hcf: principal.hcf,
            });
        })
        .catch(next);
};

function alteracaoIdentificador(request, transaction) {
    const {
        familia_id: familiaId, subfamilia_id: subfamiliaId, genero_id: generoId,
        especie_id: especieId, subespecie_id: subespecieId, variedade_id: variedadeId,
    } = request.body;
    const { tombo_id: tomboId } = request.params;
    const update = {};

    if (familiaId !== undefined) {
        update.familia_id = familiaId;
    }
    if (subfamiliaId !== undefined) {
        update.subfamilia_id = subfamiliaId;
    }
    if (generoId !== undefined) {
        update.genero_id = generoId;
    }
    if (especieId !== undefined) {
        update.especie_id = especieId;
    }
    if (subespecieId !== undefined) {
        update.subespecie_id = subespecieId;
    }
    if (variedadeId !== undefined) {
        update.variedade_id = variedadeId;
    }

    return Promise.resolve()
        .then(() => Alteracao.create({
            tombo_hcf: tomboId,
            usuario_id: request.usuario.id,
            status: 'ESPERANDO',
            tombo_json: JSON.stringify(update),
            ativo: true,
            identificacao: 1,
        }, { transaction }))
        .then(alteracaoIdent => {
            if (request.usuario.tipo_usuario_id === 3) {
                if (!alteracaoIdent) {
                    throw new BadRequestExeption(421);
                }
            }
        });
}

function alteracaoCuradorouOperador(request, response, transaction) {
    const { body } = request;
    const update = {};

    const nomePopular = body?.principal?.nome_popular;
    if (nomePopular !== undefined) update.nomes_populares = nomePopular;

    const entidadeId = body?.principal?.entidade_id;
    if (entidadeId !== undefined) update.entidade_id = entidadeId;

    const numeroColeta = body?.principal?.numero_coleta;
    if (numeroColeta !== undefined) update.numero_coleta = numeroColeta;

    const dataColeta = body?.principal?.data_coleta;
    if (dataColeta?.dia !== undefined) update.data_coleta_dia = dataColeta.dia;
    if (dataColeta?.mes !== undefined) update.data_coleta_mes = dataColeta.mes;
    if (dataColeta?.ano !== undefined) update.data_coleta_ano = dataColeta.ano;

    const tipoId = body?.principal?.tipo_id;
    if (tipoId !== undefined) update.tipo_id = tipoId;

    const { cor } = body.principal || {};
    if (cor !== undefined) update.cor = cor;

    const dataTombo = body?.principal?.data_tombo;
    if (dataTombo !== undefined) update.data_tombo = parseDataTombo(dataTombo);

    const familiaId = body?.taxonomia?.familia_id;
    if (familiaId !== undefined) update.familia_id = familiaId;

    const subfamiliaId = body?.taxonomia?.sub_familia_id;
    if (subfamiliaId !== undefined) update.sub_familia_id = subfamiliaId;

    const generoId = body?.taxonomia?.genero_id;
    if (generoId !== undefined) update.genero_id = generoId;

    const especieId = body?.taxonomia?.especie_id;
    if (especieId !== undefined) update.especie_id = especieId;

    const subespecieId = body?.taxonomia?.sub_especie_id;
    if (subespecieId !== undefined) update.sub_especie_id = subespecieId;

    const variedadeId = body?.taxonomia?.variedade_id;
    if (variedadeId !== undefined) update.variedade_id = variedadeId;

    const latitude = body?.localidade?.latitude;
    if (latitude !== undefined) {
        update.latitude = latitude ? converteParaDecimal(latitude) : null;
    }

    const longitude = body?.localidade?.longitude;
    if (longitude !== undefined) {
        update.longitude = longitude ? converteParaDecimal(longitude) : null;
    }

    const altitude = body?.localidade?.altitude;
    if (altitude !== undefined) update.altitude = altitude;

    const localColeta = body?.localidade?.local_coleta_id;
    if (localColeta !== undefined) update.local_coleta_id = localColeta;

    const soloId = body?.paisagem?.solo_id;
    if (soloId !== undefined) update.solo_id = soloId;

    const relevoId = body?.paisagem?.relevo_id;
    if (relevoId !== undefined) update.relevo_id = relevoId;

    const vegetacaoId = body?.paisagem?.vegetacao_id;
    if (vegetacaoId !== undefined) update.vegetacao_id = vegetacaoId;

    const descricao = body?.paisagem?.descricao;
    if (descricao !== undefined) update.descricao = descricao;

    const unicata = body?.unicata;
    if (unicata !== undefined) update.unicata = unicata;

    const faseSucessionalId = body?.paisagem?.fase_sucessional_id;
    if (faseSucessionalId !== undefined) update.fase_sucessional_id = faseSucessionalId;

    const identificadores = body?.identificacao?.identificadores;
    if (identificadores !== undefined) update.identificadores = identificadores;

    const dataIdentificacao = body?.identificacao?.data_identificacao;
    if (dataIdentificacao?.dia !== undefined) update.data_identificacao_dia = dataIdentificacao.dia;
    if (dataIdentificacao?.mes !== undefined) update.data_identificacao_mes = dataIdentificacao.mes;
    if (dataIdentificacao?.ano !== undefined) update.data_identificacao_ano = dataIdentificacao.ano;
    if (dataIdentificacao === null) {
        update.data_identificacao_dia = null;
        update.data_identificacao_mes = null;
        update.data_identificacao_ano = null;
    }

    const coletor = body?.coletor;
    if (coletor !== undefined) update.coletor_id = coletor;

    const complementares = body?.coletor_complementar?.complementares;
    if (complementares !== undefined) update.complementares = complementares;

    const colecoesAnexasTipo = body?.colecoes_anexas?.tipo;
    if (colecoesAnexasTipo !== undefined) update.colecoes_anexas_tipo = colecoesAnexasTipo;

    const colecoesAnexasObservacoes = body?.colecoes_anexas?.observacoes;
    if (colecoesAnexasObservacoes !== undefined) update.colecoes_anexas_observacoes = colecoesAnexasObservacoes;

    const { observacoes } = body || {};
    if (observacoes !== undefined) update.observacao = observacoes;

    const { tombo_id: tomboId } = request.params;

    return Alteracao.create({
        tombo_hcf: tomboId,
        usuario_id: request.usuario.id,
        status: 'ESPERANDO',
        tombo_json: JSON.stringify(update),
        ativo: true,
        identificacao: 1,
    }, { transaction })
        .then(alteracaoCriada => {
            if (request.usuario.tipo_usuario_id === 1) {
                return aprovarPendencia(update, tomboId, transaction)
                    .then(() => Alteracao.update({ status: 'APROVADO' }, {
                        where: { id: alteracaoCriada.id },
                        transaction,
                    }))
                    .then(() => alteracaoCriada.toJSON());
            } if (request.usuario.tipo_usuario_id !== 2) {
                throw new BadRequestExeption(421);
            }
            return alteracaoCriada.toJSON();
        });
}

export function alteracao(request, response, next) {
    return sequelize.transaction(transaction => {
        if (request.usuario.tipo_usuario_id === 3) {
            return alteracaoIdentificador(request, transaction);
        } if (request.usuario.tipo_usuario_id === 1 || request.usuario.tipo_usuario_id === 2) {
            return alteracaoCuradorouOperador(request, response, transaction);
        }
        throw new BadRequestExeption(421);

    })
        .then(() => {
            response.status(codigos.EDITAR_SEM_RETORNO).send();
        })
        .catch(next);
}

export const desativar = (request, response, next) => {
    const { params } = request;

    Promise.resolve()
        .then(() => {
            const where = {
                ativo: true,
                hcf: params.tombo_id,
            };

            return Tombo.findOne({ where });
        })
        .then(tombo => {
            if (!tombo) {
                throw new NotFoundException(416);
            }

            const where = {
                ativo: true,
                hcf: params.tombo_id,
            };

            return Tombo.update({ ativo: false }, { where });
        })
        .then(() => {
            response.status(204)
                .send();
        })
        .catch(next);
};

export const listagem = (request, response, next) => {
    const { pagina, limite, offset } = request.paginacao;
    const {
        nome_cientifico: nomeCientifico, hcf, tipo, nome_popular: nomePopular, situacao,
    } = request.query;
    let where = {
        ativo: true,
        rascunho: 0,
    };

    if (nomeCientifico) {
        where = {
            ...where,
            nome_cientifico: { [Op.like]: `%${nomeCientifico}%` },
        };
    }

    if (hcf) {
        where = {
            ...where,
            hcf,
        };
    }

    if (tipo) {
        where = {
            ...where,
            tipo_id: tipo,
        };
    }

    if (nomePopular) {
        where = {
            ...where,
            nomes_populares: { [Op.like]: `%${nomePopular}%` },
        };
    }

    if (situacao) {
        where = {
            ...where,
            situacao,
        };
    }

    let retorno = {  // eslint-disable-line
        metadados: {
            total: 0,
            pagina,
            limite,
        },
        tombos: [],
    };
    Promise.resolve()
        .then(() => Tombo.count({ where }))
        .then(total => {
            retorno.metadados.total = total;
        })
        .then(() => Tombo.findAndCountAll({
            attributes: [
                'hcf',
                'nomes_populares',
                'nome_cientifico',
                'data_coleta_dia',
                'data_coleta_mes',
                'data_coleta_ano',
                'created_at',
            ],
            include: {
                // required: true,
                model: Coletor,
                attributes: ['id', 'nome'],
            },
            where,
            order: [['hcf', 'DESC']],
            limit: limite,
            offset,
        }))
        .then(listaTombos => {
            retorno.tombos = listaTombos.rows;
            response.status(codigos.LISTAGEM)
                .json(retorno);
        })
        .catch(next);
};

export const getDadosCadTombo = (request, response, next) => {
    const retorno = {};
    const callback = transaction => Promise.resolve()
        .then(() => Tombo.findAndCountAll({
            attributes: ['hcf', 'numero_coleta'],
            order: [['numero_coleta', 'DESC']],
            transaction,
        }))
        .then(tombos => {
            if (!tombos) {
                throw new BadRequestExeption(202);
            }
            retorno.numero_coleta = (tombos.rows[0].numero_coleta) + 1;
        })
        .then(() => Herbario.findAndCountAll({
            attributes: ['id', 'nome', 'sigla'],
            where: {
                ativo: true,
            },
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(herbario => {
            if (!herbario) {
                throw new BadRequestExeption(203);
            }
            retorno.herbarios = herbario.rows;
        })
        .then(() => Tipo.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(tipos => {
            if (!tipos) {
                throw new BadRequestExeption(204);
            }
            retorno.tipos = tipos.rows;
        })
        .then(() => Pais.findAndCountAll({
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(paises => {
            if (!paises) {
                throw new BadRequestExeption(205);
            }
            retorno.paises = paises.rows;
        })
        .then(() => Familia.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            where: {
                ativo: true,
            },
            transaction,
        }))
        .then(familias => {
            if (!familias) {
                throw new BadRequestExeption(206);
            }
            retorno.familias = familias.rows;
        })
        .then(() => Solo.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(solos => {
            if (!solos) {
                throw new BadRequestExeption(207);
            }
            retorno.solos = solos.rows;
        })
        .then(() => Relevo.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(relevos => {
            if (!relevos) {
                throw new BadRequestExeption(208);
            }
            retorno.relevos = relevos.rows;
        })
        .then(() => Vegetacao.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(vegetacoes => {
            if (!vegetacoes) {
                throw new BadRequestExeption(209);
            }
            retorno.vegetacoes = vegetacoes.rows;
        })
        .then(() => FaseSucessional.findAndCountAll({
            attributes: ['numero', 'nome'],
            order: [['nome', 'ASC']],
            transaction,
        }))
        .then(fases => {
            if (!fases) {
                throw new BadRequestExeption(210);
            }
            retorno.fases = fases.rows;
        })
        .then(() => Autor.findAndCountAll({
            attributes: ['id', 'nome'],
            order: [['nome', 'ASC']],
            where: {
                ativo: true,
            },
            transaction,
        }))
        .then(autores => {
            if (!autores) {
                throw new BadRequestExeption(213);
            }
            retorno.autores = autores.rows;
            return retorno;
        });
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.BUSCAR_VARIOS_ITENS)
                .json(retorno);

        })
        .catch(next);
};

export const cadastrarTipo = (request, response, next) => {
    const callback = transaction => Promise.resolve()
        .then(() => Tipo.findOne({
            where: {
                nome: request.body.nome,
            },
            transaction,
        }))
        .then(tipoEncontrado => {
            if (tipoEncontrado) {
                throw new BadRequestExeption(412);
            }
        })
        .then(() => Tipo.create(
            {
                nome: request.body.nome,
            },
            transaction
        ));
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarTipos = (request, response, next) => {
    Promise.resolve()
        .then(() => Tipo.findAndCountAll({
            attributes: ['id', 'nome'],
        }))
        .then(tipos => {
            response.status(codigos.LISTAGEM).json(tipos.rows);
        })
        .catch(next);
};

export const cadastrarColetores = (request, response, next) => {
    const callback = transaction => Promise.resolve()
        .then(() => Coletor.findOne({
            where: {
                nome: request.body.nome,
                email: request.body.email,
            },
            transaction,
        }))
        .then(coletorEncontrado => {
            if (coletorEncontrado) {
                throw new BadRequestExeption(413);
            }
        })
        .then(() => Coletor.create({
            nome: request.body.nome,
            email: request.body.email,
        }, transaction));
    sequelize.transaction(callback)
        .then(coletor => {
            if (!coletor) {
                throw new BadRequestExeption(414);
            }
            response.status(codigos.CADASTRO_SEM_RETORNO).send();
        })
        .catch(next);
};

export const buscarColetores = (request, response, next) => {
    let where = {
        ativo: 1,
    };
    let limit = 10;
    const { limite, nome } = request.query;

    if (limite) {
        limit = parseInt(limite);
    }

    if (nome) {
        where = {
            ...where,
            nome: { [Op.like]: `%${nome}%` },
        };
    }

    Promise.resolve()
        .then(() => Coletor.findAndCountAll({
            attributes: ['id', 'nome', 'email', 'numero'],
            where,
            limit,
        }))
        .then(coletores => {
            if (!coletores) {
                throw new BadRequestExeption(415);
            }
            response.status(codigos.LISTAGEM).json(coletores.rows);
        })
        .catch(next);
};

export const obterTombo = async (request, response, next) => {
    try {
        if (request.query.recaptchaToken) {
            await verifyRecaptcha(request);
        }
        const id = request.params.tombo_id;

        let resposta = {};
        let dadosTombo = {};
        Promise.resolve()
            .then(() =>
                Tombo.findOne({
                    where: {
                        hcf: id,
                        ativo: true,
                        rascunho: 0,
                    },
                    attributes: [
                        'cor',
                        'data_coleta_mes',
                        'data_coleta_ano',
                        'situacao',
                        'nome_cientifico',
                        'hcf',
                        'data_tombo',
                        'data_coleta_dia',
                        'observacao',
                        'nomes_populares',
                        'numero_coleta',
                        'latitude',
                        'longitude',
                        'altitude',
                        'ativo',
                        'rascunho',
                        'data_identificacao_dia',
                        'data_identificacao_mes',
                        'data_identificacao_ano',
                        'descricao',
                        'unicata',
                    ],
                    include: [
                        {
                            model: Herbario,
                        },
                        {
                            as: 'identificadores',
                            model: Identificador,
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
                            model: LocalColeta,
                            include: [
                                {
                                    model: Cidade,
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
                            model: Variedade,
                            include: {
                                model: Autor,
                                attributes: {
                                    exclude: ['updated_at', 'created_at', 'ativo'],
                                },
                                as: 'autor',
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
                                attributes: {
                                    exclude: ['updated_at', 'created_at', 'ativo'],
                                },
                                as: 'autor',
                            },
                        },
                        {
                            model: ColecaoAnexa,
                        },
                        {
                            model: Coletor,
                            attributes: ['id', 'nome'],
                        },
                        {
                            model: ColetorComplementar,
                            as: 'coletor_complementar',
                            attributes: ['complementares'],
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
                                attributes: {
                                    exclude: ['updated_at', 'created_at', 'ativo'],
                                },
                                as: 'autor',
                            },
                        },
                    ],
                })
            )
            .then(tombo => {
                if (!tombo) {
                    throw new BadRequestExeption(416);
                }

                dadosTombo = tombo;

                resposta = {
                    herbarioInicial: tombo.herbario !== null ? tombo.herbario?.id : '',
                    localidadeInicial: tombo.cor !== null ? tombo?.cor : '',
                    tipoInicial: tombo.tipo !== null ? tombo.tipo?.id : '',
                    paisInicial: tombo.locais_coletum.cidade?.estado?.paise !== null ? tombo.locais_coletum.cidade?.estado?.paise?.id : '',
                    estadoInicial: tombo.locais_coletum.cidade?.estado !== null ? tombo.locais_coletum.cidade?.estado?.id : '',
                    cidadeInicial: tombo.locais_coletum.cidade !== null ? tombo.locais_coletum?.cidade?.id : '',
                    reinoInicial: tombo.reino !== null ? tombo.reino?.id : '',
                    familiaInicial: tombo.familia !== null ? tombo.familia?.id : '',
                    subfamiliaInicial: tombo.sub_familia !== null ? tombo.sub_familia?.id : '',
                    generoInicial: tombo.genero !== null ? tombo.genero?.id : '',
                    especieInicial: tombo.especy !== null ? tombo.especy?.id : '',
                    subespecieInicial: tombo.sub_especy !== null ? tombo.sub_especy?.id : '',
                    variedadeInicial: tombo.variedade !== null ? tombo.variedade?.id : '',
                    idSoloInicial: tombo.solo !== null ? tombo.solo?.id : '',
                    soloInicial: tombo.solo !== null ? tombo.solo?.nome : '',
                    idRelevoInicial: tombo.relevo !== null ? tombo.relevo?.id : '',
                    relevoInicial: tombo.relevo !== null ? tombo.relevo?.nome : '',
                    idVegetacaoInicial: tombo.vegetaco !== null ? tombo.vegetaco?.id : '',
                    vegetacaoInicial: tombo.vegetaco !== null ? tombo.vegetaco?.nome : '',
                    faseInicial:
            tombo.locais_coletum !== null && tombo.locais_coletum?.fase_sucessional !== null ? tombo.locais_coletum?.fase_sucessional?.numero : '',
                    coletor: tombo.coletore
                        ? {
                            id: tombo.coletore?.id,
                            nome: tombo.coletore?.nome,
                        }
                        : null,
                    colecaoInicial: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa?.tipo : '',
                    complementoInicial: tombo.localizacao !== null && tombo.localizacao !== undefined ? tombo.localizacao?.complemento : '',
                    hcf: tombo.hcf,
                    situacao: tombo.situacao,
                    data_tombo: tombo.data_tombo,
                    observacao: tombo.observacao !== null ? tombo.observacao : '',
                    tipo: tombo.tipo !== null ? tombo.tipo?.nome : '',
                    numero_coleta: tombo.numero_coleta,
                    descricao: tombo.descricao !== null ? tombo.descricao : '',
                    herbario: tombo.herbario !== null ? `${tombo.herbario?.sigla} - ${tombo.herbario?.nome}` : '',
                    localizacao: {
                        latitude: tombo.latitude !== null ? tombo.latitude : '',
                        longitude: tombo.longitude !== null ? tombo.longitude : '',
                        latitude_graus: tombo.latitude !== null ? converteDecimalParaGraus(tombo.latitude, true).replace('.', ',') : '',
                        lat_grau: tombo.latitude !== null ? converteDecimalParaGMSGrau(tombo.latitude, true) : '',
                        latitude_min: tombo.latitude !== null ? converteDecimalParaGMSMinutos(tombo.latitude, true) : '',
                        latitude_sec: tombo.latitude !== null ? converteDecimalParaGMSSegundos(tombo.latitude, true) : '',
                        longitude_graus: tombo.longitude !== null ? converteDecimalParaGraus(tombo.longitude, false).replace('.', ',') : '',
                        long_graus: tombo.longitude !== null ? converteDecimalParaGMSGrau(tombo.longitude, false) : '',
                        long_min: tombo.longitude !== null ? converteDecimalParaGMSMinutos(tombo.longitude, false) : '',
                        long_sec: tombo.longitude !== null ? converteDecimalParaGMSSegundos(tombo.longitude, false) : '',
                        altitude: tombo.altitude !== null ? tombo.altitude : '',
                        cidade: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum?.cidade?.nome : '',
                        estado: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade?.estado?.nome : '',
                        pais: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade.estado?.paise?.nome : '',
                        cor: tombo.cor !== null ? tombo.cor : '',
                        complemento: tombo.locais_coletum?.complemento !== null ? tombo.locais_coletum?.complemento : '',
                    },
                    local_coleta: {
                        id: tombo.locais_coletum !== null ? tombo.locais_coletum?.id : '',
                        descricao: tombo.locais_coletum !== null && tombo.locais_coletum?.descricao !== null ? tombo.locais_coletum.descricao : '',
                        solo: tombo.solo !== null ? tombo.solo?.nome : '',
                        relevo: tombo.relevo !== null ? tombo.relevo?.nome : '',
                        vegetacao: tombo.vegetaco !== null ? tombo.vegetaco?.nome : '',
                        fase_sucessional:
                  tombo.locais_coletum !== null && tombo.locais_coletum?.fase_sucessional !== null ? tombo.locais_coletum?.fase_sucessional : '',
                    },
                    taxonomia: {
                        nome_cientifico: tombo.nome_cientifico !== null ? tombo.nome_cientifico : '',
                        nome_popular: tombo.nomes_populares !== null ? tombo.nomes_populares : '',
                        reino: tombo.reino !== null ? tombo.reino?.nome : '',
                        familia: tombo.familia !== null ? tombo.familia?.nome : '',
                        sub_familia: tombo.sub_familia !== null ? tombo.sub_familia?.nome : '',
                        genero: tombo.genero !== null ? tombo.genero?.nome : '',
                        especie: {
                            nome: tombo.especy !== null ? tombo.especy?.nome : '',
                            autor: tombo.especy !== null && tombo.especy?.autor !== null ? tombo.especy?.autor?.nome : '',
                        },
                        sub_especie: {
                            nome: tombo.sub_especy !== null ? tombo.sub_especy?.nome : '',
                            autor: tombo.sub_especy !== null && tombo.sub_especy?.autor !== null ? tombo.sub_especy?.autor?.nome : '',
                        },
                        variedade: {
                            nome: tombo.variedade !== null ? tombo.variedade?.nome : '',
                            autor: tombo.variedade !== null && tombo.variedade?.autor !== null ? tombo.variedade?.autor?.nome : '',
                        },
                    },
                    colecao_anexa: {
                        tipo: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa?.tipo : '',
                        observacao: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa?.observacoes : '',
                    },
                    unicata: tombo.unicata ?? null,
                };
                let dataCol = '';
                let dataIdent = '';

                const [tomboIdentificador] = tombo.identificadores;

                if (tombo.data_identificacao_dia !== null) {
                    dataIdent = `${tombo.data_identificacao_dia}/`;
                    resposta.data_identificacao_dia = tombo.data_identificacao_dia;
                }
                if (tombo.data_identificacao_mes !== null) {
                    dataIdent += `${converteInteiroParaRomano(tombo.data_identificacao_mes)}/`;
                    resposta.data_identificacao_mes = tombo.data_identificacao_mes;
                }
                if (tombo.data_identificacao_ano !== null) {
                    dataIdent += `${tombo.data_identificacao_ano}`;
                    resposta.data_identificacao_ano = tombo.data_identificacao_ano;
                }

                if (tomboIdentificador) {
                    resposta.identificador_nome = padronizarNomeDarwincore(tomboIdentificador?.nome);
                    resposta.identificadorInicial = `${tomboIdentificador.id}`;
                } else {
                    resposta.identificadorInicial = '';
                }

                if (tombo.data_coleta_dia !== null) {
                    dataCol = tombo.data_coleta_dia;
                    resposta.data_coleta_dia = tombo.data_coleta_dia;
                }
                if (tombo.data_coleta_mes !== null) {
                    dataCol += `/${converteInteiroParaRomano(tombo.data_coleta_mes)}`;
                    resposta.data_coleta_mes = tombo.data_coleta_mes;
                }
                if (tombo.data_coleta_ano !== null) {
                    dataCol += `/${tombo.data_coleta_ano}`;
                    resposta.data_coleta_ano = tombo.data_coleta_ano;
                }

                resposta.data_coleta = dataCol;
                resposta.data_identificacao = dataIdent === 'undefined' ? '' : dataIdent;

                if (tombo.coletores != null) {
                    resposta.coletores = tombo.coletores;
                }
                resposta.retorno = tombo;
                return resposta;
            })
            .then(() =>
                Estado.findAll({
                    where: {
                        pais_id: dadosTombo.locais_coletum.cidade?.estado?.paise?.id,
                    },
                })
            )
        // eslint-disable-next-line no-return-assign
            .then(estados => (resposta.estados = estados))
            .then(() =>
                Cidade.findAll({
                    where: {
                        estado_id: dadosTombo.locais_coletum.cidade?.estado?.id,
                    },
                })
            )
        // eslint-disable-next-line no-return-assign
            .then(cidades => (resposta.cidades = cidades))
            .then(() =>
                Familia.findAll({
                    where: {
                        id: dadosTombo.familia?.id,
                    },
                })
            )
            .then(familias => {
                resposta.familias = familias;
            })
            .then(() => {
                if (dadosTombo.familia) {
                    return Subfamilia.findAll({
                        where: {
                            familia_id: dadosTombo.familia?.id,
                        },
                        include: [
                            {
                                model: Autor,
                                attributes: ['id', 'nome'],
                                as: 'autor',
                            },
                        ],
                    });
                }
                return undefined;
            })
            .then(subfamilias => {
                if (subfamilias) {
                    resposta.subfamilias = subfamilias;
                } else {
                    resposta.subfamilias = [];
                }
            })
            .then(() => {
                if (dadosTombo.familia) {
                    return Genero.findAll({
                        where: {
                            familia_id: dadosTombo.familia?.id,
                        },
                    });
                }
                return undefined;
            })
            .then(generos => {
                if (generos) {
                    resposta.generos = generos;
                } else {
                    resposta.generos = [];
                }
            })
            .then(() => {
                if (dadosTombo.genero) {
                    return Especie.findAll({
                        where: {
                            genero_id: dadosTombo.genero?.id,
                        },
                        include: [
                            {
                                model: Autor,
                                attributes: ['id', 'nome'],
                                as: 'autor',
                            },
                        ],
                    });
                }
                return undefined;
            })
            .then(especies => {
                if (especies) {
                    resposta.especies = especies;
                } else {
                    resposta.especies = [];
                }
            })
            .then(() => {
                if (dadosTombo.especy) {
                    return Subespecie.findAll({
                        where: {
                            especie_id: dadosTombo.especy?.id,
                        },
                        include: [
                            {
                                model: Autor,
                                attributes: ['id', 'nome'],
                                as: 'autor',
                            },
                        ],
                    });
                }
                return undefined;
            })
            .then(subespecies => {
                if (subespecies) {
                    resposta.subespecies = subespecies;
                } else {
                    resposta.subespecies = [];
                }
            })
            .then(() => {
                if (dadosTombo.especy) {
                    return Variedade.findAll({
                        where: {
                            especie_id: dadosTombo.especy?.id,
                        },
                        include: [
                            {
                                model: Autor,
                                attributes: ['id', 'nome'],
                                as: 'autor',
                            },
                        ],
                    });
                }
                return undefined;
            })
            .then(variedades => {
                if (variedades) {
                    resposta.variedades = variedades;
                } else {
                    resposta.variedades = [];
                }
            })
            .then(() =>
                Alteracao.findOne({
                    where: {
                        tombo_hcf: dadosTombo.hcf,
                        status: 'APROVADO',
                        identificacao: true,
                    },
                    order: [['created_at', 'DESC']],
                })
            )
            .then(alter => {
                if (alter) {
                    resposta.identificacao = alter;
                }
            })
            .then(() =>
                TomboFoto.findAll({
                    where: {
                        tombo_hcf: id,
                        ativo: 1,
                    },
                    attributes: ['id', 'caminho_foto', 'em_vivo'],
                })
            )
            .then(fotos => {
                const formatoFotos = [];
                const fotosExsicata = [];
                const fotosEmVivo = [];

                // eslint-disable-next-line no-plusplus
                for (let i = 0; i < fotos.length; i++) {
                    if (!fotos[i].em_vivo) {
                        fotosExsicata.push({
                            id: fotos[i].id,
                            original: fotos[i].caminho_foto,
                            thumbnail: fotos[i].caminho_foto,
                        });
                    } else {
                        fotosEmVivo.push({
                            id: fotos[i].id,
                            original: fotos[i].caminho_foto,
                            thumbnail: fotos[i].caminho_foto,
                        });
                    }
                }
                resposta.fotos_exsicata = fotosExsicata;
                resposta.fotos_vivo = fotosEmVivo;
                fotos.map(foto =>
                    formatoFotos.push({
                        id: foto.id,
                        original: foto.caminho_foto,
                        thumbnail: foto.caminho_foto,
                    })
                );
                resposta.fotos = formatoFotos;
                response.status(codigos.BUSCAR_UM_ITEM).json(resposta);
            })
            .catch(next);
    } catch (err) {
        next(err);
    }
};

export const getNumeroTombo = (request, response, next) => {
    const { id } = request.params;
    Promise.resolve()
        .then(() => Tombo.findAll({
            where: {
                hcf: { [Op.like]: `%${id}%` },
            },
            attributes: [
                'hcf',
            ],
        }))
        .then(tombos => {
            response.status(codigos.BUSCAR_UM_ITEM)
                .json(tombos);
        })
        .catch(next);
};

export const getNumeroColetor = (request, response, next) => {
    const { idColetor } = request.params;

    Promise.resolve()
        .then(() =>
            Tombo.findAll({
                where: {
                    coletor_id: idColetor,
                },
                attributes: ['hcf', 'numero_coleta'],
            })
        )
        .then(tombos => {
            response.status(codigos.BUSCAR_UM_ITEM).json(tombos);
        })
        .catch(next);
};

export const getUltimoNumeroTombo = (request, response, next) => {
    Promise.resolve()
        .then(() => Tombo.findAll({
            attributes: [
                'hcf',
            ],
        }))
        .then(tombos => {
            const maximo = Math.max(...tombos.map(e => e.hcf));
            const tombo = {};
            tombo.hcf = maximo;
            Tombo.findOne({
                where: {
                    hcf: maximo,
                },
                attributes: [
                    'hcf',
                    'data_tombo',
                ],
            }).then(tomboDate => {
                response.status(codigos.BUSCAR_UM_ITEM)
                    .json(tomboDate);
            });
        })
        .catch(next);
};

export async function deletarCodigoBarras(request, response, next) {
    try {
        const count = await TomboFoto.destroy({
            where: { num_barra: request.params.codigo },
        });

        if (count === 0) {
            return response.status(404).json({ error: 'Código de barras não encontrado' });
        }
        return response.status(204).end();
    } catch (err) {
        return next(err);
    }
}

export const getUltimoCodigoBarra = async (req, res, next) => {
    try {
        const row = await TomboFoto.findOne({
            attributes: ['id', 'codigo_barra', 'num_barra', 'caminho_foto'],
            order: [
                ['tombo_hcf', 'DESC'],
                ['num_barra', 'DESC'],
                ['id', 'DESC'],
            ],
        });
        return res.status(codigos.BUSCAR_UM_ITEM).json(row || null);
    } catch (err) {
        return next(err);
    }
};

const toHCFFormat = codigo => {
    const codigoStr = String(codigo || '').padStart(9, '0');
    return `HCF${codigoStr}`;
};

export const postCodigoBarraTombo = (request, response, next) => {
    const criarTransacaoCodigoBarra = transaction =>
        Promise.resolve().then(() => {
            const { hcf, codigo_barra: codigoBarra } = request.body || {};

            const formattedCodigoBarra = toHCFFormat(codigoBarra);
            if (!formattedCodigoBarra) {
                throw new BadRequestExeption(417);
            }

            const payload = {
                tombo_hcf: hcf,
                em_vivo: true,
                codigo_barra: formattedCodigoBarra,
                num_barra: codigoBarra,
                caminho_foto: null,
            };

            return TomboFoto.create(payload, { transaction });
        });

    return sequelize
        .transaction(criarTransacaoCodigoBarra)
        .then(foto => response.status(201).json(foto))
        .catch(err => {
            if (err instanceof ForeignKeyConstraintError) {
                return response.status(400).json({ error: 'Violação de chave estrangeira.' });
            }
            return next(err);
        });
};

export const getUltimoNumeroCodigoBarras = (request, response, next) => {
    const { emVivo } = request.params;
    Promise.resolve()
        .then(() => TomboFoto.findAll({
            where: {
                em_vivo: emVivo,
            },
            attributes: [
                'id',
                'codigo_barra',
                'num_barra',
                'caminho_foto',
            ],
        }))
        .then(codBarras => {
            const maximoCodBarras = Math.max(...codBarras.map(e => e.id));
            response.status(codigos.BUSCAR_UM_ITEM)
                .json(maximoCodBarras);
        })
        .catch(next);
};

export const getCodigoBarraTombo = (request, response, next) => {
    const { idTombo } = request.params;
    Promise.resolve()
        .then(() => TomboFoto.findAll({
            where: {
                tombo_hcf: idTombo,
            },
            attributes: [
                'id',
                'codigo_barra',
                'num_barra',
                'caminho_foto',
            ],
        }))
        .then(tombos => {
            response.status(codigos.BUSCAR_UM_ITEM)
                .json(tombos);
        })
        .catch(next);
};

export const atualizaCodigoBarra = (codBarra, novoCod) => TomboFoto.update({
    num_barra: novoCod.numBarra,
    codigo_barra: novoCod.codBarra,
}, {
    where: {
        codigo_barra: codBarra,
    },
});

export const editarCodigoBarra = (request, response, next) => {
    const { body } = request;
    Promise.resolve()
        .then(() => atualizaCodigoBarra(body.codBarra, body.novoCod))
        .then(retorno => {
            if (!retorno) {
                throw new BadRequestExeption(111);
            }
            response.status(codigos.EDITAR_SEM_RETORNO).send();
        })
        .catch(next);
};

export default {};
