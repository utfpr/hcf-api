/* eslint-disable quotes */
// @ts-nocheck
import BadRequestExeption from '../errors/bad-request-exception';
import NotFoundException from '../errors/not-found-exception';
import models from '../models';
import codigos from '../resources/codigos-http';
import pick from '../helpers/pick';
import {
    converteParaDecimal, converteDecimalParaGraus, converteDecimalParaGMSGrau, converteDecimalParaGMSMinutos, converteDecimalParaGMSSegundos,
} from '../helpers/coordenadas';
import { selecionaObjetoCompletoTomboPorId } from '../services/tombos-service';
import { converteInteiroParaRomano } from '../helpers/tombo';


const {
    Solo, Relevo, Cidade, Estado, Vegetacao, FaseSucessional, Pais, Tipo, LocalColeta, Familia, sequelize,
    Genero, Subfamilia, Autor, Coletor, Variedade, Subespecie, Usuario, TomboFoto,
    ColecaoAnexa, Especie, Herbario, Tombo, Alteracao, TomboColetor, Sequelize: { Op },
} = models;

export const cadastro = (request, response, next) => {
    const {
        principal, taxonomia, localidade,
        paisagem, identificacao, coletores,
        colecoes_anexas: colecoesAnexas, observacoes,
    } = request.body.json;
    let tomboCriado = null;
    let nomeFamilia = "";
    let nomeGenero = "";
    let nomeSubfamilia = "";
    let nomeEspecie = "";
    let nomeSubespecie = "";
    let nomeVariedade = "";

    const callback = transaction => Promise.resolve()
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
            let json = {};
            // /////////CRIA LOCAL DE COLETA////////////
            if (paisagem) {
                json = pick(paisagem, ['descricao', 'solo_id', 'relevo_id', 'vegetacao_id', 'fase_sucessional_id']);
            }
            if (localidade.complemento) {
                json.complemento = localidade.complemento;
            }
            json.cidade_id = localidade.cidade_id;
            return LocalColeta.create(json, { transaction });
        })
        .then(localColeta => {
            if (!localColeta) {
                throw new BadRequestExeption(400);
            }
            principal.local_coleta_id = localColeta.id;
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
                taxonomia.nome_cientifico = familia.nome;
                nomeFamilia = familia.nome;
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
                taxonomia.nome_cientifico += ` ${subfamilia.nome}`;
                nomeSubfamilia = subfamilia.nome;
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
                taxonomia.nome_cientifico += ` ${genero.nome}`;
                nomeGenero = genero.nome;
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
                nomeEspecie = especie.nome;
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
                taxonomia.nome_cientifico += ` ${subespecie.nome}`;
                nomeSubespecie = subespecie.nome;
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
                taxonomia.nome_cientifico += ` ${variedade.nome}`;
                nomeVariedade = variedade.nome;
            }
            return undefined;
        })
        // /////////// CADASTRA TOMBO /////////////
        .then(() => {
            let jsonTombo = { // eslint-disable-line
                data_coleta_dia: principal.data_coleta.dia, // dia mes ano
                data_coleta_mes: principal.data_coleta.mes,
                data_coleta_ano: principal.data_coleta.ano,
                numero_coleta: principal.numero_coleta, // sim
                local_coleta_id: principal.local_coleta_id, // sim
                cor: principal.cor, // sim
            };
            if (observacoes) {
                jsonTombo.observacao = observacoes;
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
            jsonTombo = {
                ...jsonTombo,
                ...pick(principal, ['entidade_id', 'tipo_id', 'taxon_id']),
            };
            if (taxonomia) {
                jsonTombo = {
                    ...jsonTombo,
                    ...pick(taxonomia, [
                        'nome_cientifico',
                        'variedade_id',
                        'especie_id',
                        'genero_id',
                        'familia_id',
                        'sub_familia_id',
                        'sub_especie_id',
                    ]),
                };
            }
            if (colecoesAnexas && colecoesAnexas.id) { // is
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
            // eslint-disable-next-line
            console.log('ID ENVIADOOOOOOO0OOOOO 1')
            // eslint-disable-next-line
            console.log(request.usuario.tipo_usuario_id)
            if (request.usuario.tipo_usuario_id === 1) {
                status = 'APROVADO';
            }
            const dados = {
                tombo_hcf: tombo.hcf,
                usuario_id: request.usuario.id,
                status,
                tombo_json: JSON.stringify(tombo),
                ativo: true,
                identificacao: 0,
            };
            tomboCriado = tombo;
            // eslint-disable-next-line
            console.log(dados)
            return Alteracao.create(dados, { transaction });
        })
        // /////////////// CADASTRA O INDETIFICADOR ///////////////
        .then(alteracaoTomboCriado => {
            if (!alteracaoTomboCriado) {
                throw new BadRequestExeption(409);
            }
            if (tomboCriado !== null) {
                if (identificacao && identificacao.identificador_id) {
                    let status = 'ESPERANDO';
                    const jsonTaxonomia = {};
                    const dados = {
                        tombo_hcf: tomboCriado.hcf,
                        usuario_id: identificacao.identificador_id,
                        status,
                        ativo: true,
                        identificacao: 1,
                    };

                    principal.hcf = tomboCriado.hcf;
                    // eslint-disable-next-line
                    console.log('ID ENVIADOOOOOOO0OOOOO 2')
                    // eslint-disable-next-line
                    console.log(request.usuario.tipo_usuario_id)
                    if (request.usuario.tipo_usuario_id === 1) {
                        status = 'APROVADO';
                    }
                    dados.status = status;
                    if (nomeFamilia !== "") {
                        jsonTaxonomia.familia_nome = nomeFamilia;
                    }
                    if (nomeSubfamilia !== "") {
                        jsonTaxonomia.subfamilia_nome = nomeSubfamilia;
                    }
                    if (nomeGenero !== "") {
                        jsonTaxonomia.genero_nome = nomeGenero;
                    }
                    if (nomeEspecie !== "") {
                        jsonTaxonomia.especie_nome = nomeEspecie;
                    }
                    if (nomeSubespecie !== "") {
                        jsonTaxonomia.subespecie_nome = nomeSubespecie;
                    }
                    if (nomeVariedade !== "") {
                        jsonTaxonomia.variedade_nome = nomeVariedade;
                    }
                    dados.tombo_json = JSON.stringify(jsonTaxonomia);

                    if (identificacao && identificacao.data_identificacao) {
                        if (identificacao.data_identificacao.dia) {
                            dados.data_identificacao_dia = identificacao.data_identificacao.dia;
                        }
                        if (identificacao.data_identificacao.mes) {
                            dados.data_identificacao_mes = identificacao.data_identificacao.mes;
                        }
                        if (identificacao.data_identificacao.ano) {
                            dados.data_identificacao_ano = identificacao.data_identificacao.ano;
                        }
                    }
                    return Alteracao.create(dados, { transaction });
                }
            }
            return undefined;
        })
        // /////////////// CADASTRA O COLETOR ///////////////
        .then(ident => {
            let jsonColetores = []; // eslint-disable-line
            for (let i = 0; i < coletores.length; i++) { // eslint-disable-line
                jsonColetores.push({
                    tombo_hcf: principal.hcf,
                    coletor_id: coletores[i],
                });
            }
            return TomboColetor.bulkCreate(jsonColetores, { transaction });
        })
        .then(coletoresCad => {
            if (!coletoresCad) {
                throw new BadRequestExeption(410);
            }
        });

    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.CADASTRO_RETORNO).json({
                hcf: principal.hcf,
            });
        })
        .catch(next);
};

function converteLocalColetaEnviado(corpo) {
    const { localidade, paisagem } = corpo;

    return {
        descricao: paisagem.descricao,
        complemento: localidade.complemento,
        cidade_id: localidade.cidade_id,
        solo_id: paisagem.solo_id,
        relevo_id: paisagem.relevo_id,
        vegetacao_id: paisagem.vegetacao_id,
        fase_sucessional: paisagem.fase_sucessional,
    };
}

function converteLocalColetaSelecionado(tombo) {
    const { local_coleta: localColeta } = tombo;

    return {
        descricao: localColeta.descricao,
        complemento: localColeta.complemento,
        cidade_id: localColeta.cidade.id,
        solo_id: localColeta.solo_id,
        relevo_id: localColeta.relevo_id,
        vegetacao_id: localColeta.vegetacao_id,
        fase_sucessional: localColeta.fase_sucessional,
    };
}

function criaLocalColetaSeNecessario(tombo, localColetaAtual, localColetaEnviado, transacaoSequelize) {
    const atributos = [
        'descricao',
        'complemento',
        'cidade_id',
        'solo_id',
        'relevo_id',
        'vegetacao_id',
        'fase_sucessional',
    ];

    function comparaAtributos(atributo) {
        return localColetaAtual[atributo] === localColetaEnviado[atributo];
    }

    const diferentes = atributos.map(comparaAtributos)
        .filter(a => a === false);

    if (diferentes.length < 1) {
        return {
            ...tombo,
            local_coleta_id: localColetaAtual.id,
        };
    }

    return LocalColeta.create(localColetaEnviado, { transaction: transacaoSequelize })
        .then(localColetaCriado => {
            const { id } = localColetaCriado;
            return {
                ...tombo,
                local_coleta_id: id,
            };
        });
}

function alteracaoIdentificador(request, transaction) {
    const {
        familia_id: familiaId, subfamilia_id: subfamiliaId, genero_id: generoId,
        especie_id: especieId, subespecie_id: subespecieId, variedade_id: variedadeId,
    } = request.body;
    const { tombo_id: tomboId } = request.params;
    const update = {};

    if (familiaId) {
        update.familia_id = familiaId;
    }
    if (subfamiliaId) {
        update.subfamilia_id = subfamiliaId;
    }
    if (generoId) {
        update.genero_id = generoId;
    }
    if (especieId) {
        update.especie_id = especieId;
    }
    if (subespecieId) {
        update.subespecie_id = subespecieId;
    }
    if (variedadeId) {
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

export function alteracao(request, response, next) {
    const callback = transaction => {
        if (request.usuario.tipo_usuario_id === 3) {
            return alteracaoIdentificador(request, transaction);
        }
        return Promise.reject(new BadRequestExeption(421));
    };
    sequelize.transaction(callback)
        .then(() => {
            response.status(codigos.LISTAGEM).send();
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

        }).catch(next);
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
            transaction,
        ));
    sequelize.transaction(callback)
        .then(tipo => {
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
                numero: request.body.numero,
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
            numero: request.body.numero,
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

export const buscarProximoNumeroColetor = (request, response, next) => {
    Promise.resolve()
        .then(() => Coletor.findAndCountAll({
            attributes: ['id', 'nome', 'email', 'numero'],
            order: [['numero', 'DESC']],
        }))
        .then(coletores => {
            if (!coletores) {
                throw new BadRequestExeption(214);
            }
            response.status(codigos.LISTAGEM).json({
                numero: coletores.rows[0].numero + 1,
            });
        })
        .catch(next);
};

export const obterTombo = (request, response, next) => {
    const id = request.params.tombo_id;
    let resposta = {};
    let dadosTombo = {};
    // eslint-disable-next-line
    // console.error(id);
    Promise.resolve()
        .then(() => Tombo.findOne({
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
            ],
            include: [
                {
                    model: Herbario,
                },
                {
                    as: 'identificadores',
                    model: Usuario,
                    order: [['id', 'DESC']],
                },
                {
                    model: LocalColeta,
                    include: [
                        {
                            model: Cidade,
                            include: [{
                                model: Estado,
                                include: [{
                                    model: Pais,
                                }],
                            }],
                        },
                        {
                            model: FaseSucessional,
                            attributes: {
                                exclude: ['updated_at', 'created_at'],
                            },
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
                    ],
                },
                {
                    model: Variedade,
                    include: {
                        model: Autor,
                        attributes: {
                            exclude: ['updated_at', 'created_at', 'ativo'],
                        },
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
                    },
                },
            ],
        }))
        // .then(tombo => {
        //     response.status(codigos.BUSCAR_UM_ITEM).json(tombo);
        // })
        .then(tombo => {
            // eslint-disable-next-line

            if (!tombo) {
                throw new BadRequestExeption(416);
            }

            dadosTombo = tombo;
            // eslint-disable-next-line
            // console.log(tombo.locais_coletum)
            resposta = {
                herbarioInicial: tombo.herbario !== null ? tombo.herbario.id : '',
                localidadeInicial: tombo.cor !== null ? tombo.cor : '',
                tipoInicial: tombo.tipo !== null ? tombo.tipo.id : '',
                paisInicial: tombo.locais_coletum.cidade.estado.paise !== null ? tombo.locais_coletum.cidade.estado.paise.id : '',
                estadoInicial: tombo.locais_coletum.cidade.estado !== null ? tombo.locais_coletum.cidade.estado.id : '',
                cidadeInicial: tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade.id : '',
                familiaInicial: tombo.familia !== null ? tombo.familia.id : '',
                subfamiliaInicial: tombo.sub_familia !== null ? tombo.sub_familia.id : '',
                generoInicial: tombo.genero !== null ? tombo.genero.id : '',
                especieInicial: tombo.especy !== null ? tombo.especy.id : '',
                subespecieInicial: tombo.sub_especy !== null ? tombo.sub_especy.id : '',
                variedadeInicial: tombo.variedade !== null ? tombo.variedade.id : '',
                soloInicial: tombo.locais_coletum !== null && tombo.locais_coletum.solo !== null ? tombo.locais_coletum.solo.id : '',
                relevoInicial: tombo.locais_coletum !== null && tombo.locais_coletum.relevo !== null ? tombo.locais_coletum.relevo.id : '',
                vegetacaoInicial: tombo.locais_coletum !== null && tombo.locais_coletum.vegetaco !== null ? tombo.locais_coletum.vegetaco.id : '',
                faseInicial: tombo.locais_coletum !== null && tombo.locais_coletum.fase_sucessional !== null ? tombo.locais_coletum.fase_sucessional.numero : '',
                coletoresInicial: tombo.coletores.map(coletor => ({
                    key: `${coletor.id}`,
                    label: coletor.nome,
                })),
                colecaoInicial: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa.tipo : '',
                complementoInicial: tombo.localizacao !== null && tombo.localizacao !== undefined ? tombo.localizacao.complemento : '',
                hcf: tombo.hcf,
                situacao: tombo.situacao,
                data_tombo: tombo.data_tombo,
                observacao: tombo.observacao !== null ? tombo.observacao : '',
                tipo: tombo.tipo !== null ? tombo.tipo.nome : '',
                numero_coleta: tombo.numero_coleta,
                herbario: tombo.herbario !== null ? `${tombo.herbario.sigla} - ${tombo.herbario.nome}` : '',
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
                    cidade: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade.nome : '',
                    estado: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade.estado.nome : '',
                    pais: tombo.locais_coletum !== null && tombo.locais_coletum.cidade !== null ? tombo.locais_coletum.cidade.estado.paise.nome : '',
                    cor: tombo.cor !== null ? tombo.cor : '',
                    complemento: tombo.locais_coletum.complemento !== null ? tombo.locais_coletum.complemento : '',
                },
                local_coleta: {
                    descricao: tombo.locais_coletum !== null && tombo.locais_coletum.descricao !== null ? tombo.locais_coletum.descricao : '',
                    solo: tombo.locais_coletum !== null && tombo.locais_coletum.solo !== null ? tombo.locais_coletum.solo.nome : '',
                    relevo: tombo.locais_coletum !== null && tombo.locais_coletum.relevo !== null ? tombo.locais_coletum.relevo.nome : '',
                    vegetacao: tombo.locais_coletum !== null && tombo.locais_coletum.vegetaco !== null ? tombo.locais_coletum.vegetaco.nome : '',
                    fase_sucessional: tombo.locais_coletum !== null && tombo.locais_coletum.fase_sucessional !== null ? tombo.locais_coletum.fase_sucessional : '',
                },
                taxonomia: {
                    nome_cientifico: tombo.nome_cientifico !== null ? tombo.nome_cientifico : '',
                    nome_popular: tombo.nomes_populares !== null ? tombo.nomes_populares : '',
                    familia: tombo.familia !== null ? tombo.familia.nome : '',
                    sub_familia: tombo.sub_familia !== null ? tombo.sub_familia.nome : '',
                    genero: tombo.genero !== null ? tombo.genero.nome : '',
                    especie: {
                        nome: tombo.especy !== null ? tombo.especy.nome : '',
                        autor: tombo.especy !== null && tombo.especy.autore !== null ? tombo.especy.autore.nome : '',
                    },
                    sub_especie: {
                        nome: tombo.sub_especy !== null ? tombo.sub_especy.nome : '',
                        autor: tombo.sub_especy !== null && tombo.sub_especy.autore !== null ? tombo.sub_especy.autore.nome : '',
                    },
                    variedade: {
                        nome: tombo.variedade !== null ? tombo.variedade.nome : '',
                        autor: tombo.variedade !== null && tombo.variedade.autore !== null ? tombo.variedade.autore.nome : '',
                    },
                },
                colecao_anexa: {
                    tipo: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa.tipo : '',
                    observacao: tombo.colecoes_anexa !== null ? tombo.colecoes_anexa.observacoes : '',
                },
            };
            let dataCol = '';
            let dataIdent = '';

            const [tomboUsuario] = tombo.identificadores;

            if (tomboUsuario && tomboUsuario.alteracoes.identificacao !== false) {
                if (tomboUsuario.alteracoes.data_identificacao_dia !== null) {
                    dataIdent = `${tomboUsuario.alteracoes.data_identificacao_dia}/`;
                    resposta.data_identificacao_dia = tomboUsuario.alteracoes.data_identificacao_dia;
                }
                if (tomboUsuario.alteracoes.data_identificacao_mes !== null) {
                    dataIdent += `${converteInteiroParaRomano(tomboUsuario.alteracoes.data_identificacao_mes)}/`;
                    resposta.data_identificacao_mes = tomboUsuario.alteracoes.data_identificacao_mes;
                }
                if (tomboUsuario.alteracoes.data_identificacao_ano !== null) {
                    dataIdent += `${tomboUsuario.alteracoes.data_identificacao_ano}`;
                    resposta.data_identificacao_ano = tomboUsuario.alteracoes.data_identificacao_ano;
                }
                resposta.identificador_nome = tomboUsuario.nome;
                resposta.identificadorInicial = `${tomboUsuario.id}`;
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
            resposta.data_identificacao = dataIdent === 'undefined' ? "" : dataIdent;

            if (tombo.coletores != null) {
                // coletores = tombo.coletores.map(coletor => `${coletores}${coletor.nome},`).toString();
                resposta.coletores = tombo.coletores;
            }
            resposta.retorno = tombo;
            return resposta;
        })
        .then(() => Estado.findAll({
            where: {
                pais_id: dadosTombo.locais_coletum.cidade.estado.paise.id,
            },
        }))
        // eslint-disable-next-line no-return-assign
        .then(estados => resposta.estados = estados)
        .then(() => Cidade.findAll({
            where: {
                estado_id: dadosTombo.locais_coletum.cidade.estado.id,
            },
        }))
        // eslint-disable-next-line no-return-assign
        .then(cidades => resposta.cidades = cidades)
        .then(() => {
            if (dadosTombo.familia) {
                return Subfamilia.findAll({
                    where: {
                        familia_id: dadosTombo.familia.id,
                    },
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
                        familia_id: dadosTombo.familia.id,
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
                        genero_id: dadosTombo.genero.id,
                    },
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
                        especie_id: dadosTombo.especy.id,
                    },
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
                        especie_id: dadosTombo.especy.id,
                    },
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
        .then(() => Alteracao.findOne({
            where: {
                tombo_hcf: dadosTombo.hcf,
                status: 'APROVADO',
                identificacao: true,
            },
            order: [['created_at', 'DESC']],
        }))
        .then(alter => {
            if (alter) {
                resposta.identificacao = alter;
            }
        })
        .then(() => TomboFoto.findAll({
            where: {
                tombo_hcf: id,
                ativo: 1,
            },
            attributes: ['id', 'caminho_foto', 'em_vivo'],
        }))
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
            fotos.map(foto => formatoFotos.push({
                id: foto.id,
                original: foto.caminho_foto,
                thumbnail: foto.caminho_foto,
            }));
            resposta.fotos = formatoFotos;
            response.status(codigos.BUSCAR_UM_ITEM)
                .json(resposta);
        })
        .catch(next);
};

export const getNumeroTombo = (request, response, next) => {
    const { id } = request.params;
    console.log(id); // eslint-disable-line
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

export default {};
