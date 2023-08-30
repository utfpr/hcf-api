import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import nomeEsquema from '../validators/nome-obrigatorio';
import generoEsquema from '../validators/genero';
import especieEsquema from '../validators/especie';
import subespecieEsquema from '../validators/subespecie';
import listagemFamiliaEsquema from '../validators/familia-listagem';
import atualizaFamiliaEsquema from '../validators/familia-atualiza';
import desativarFamiliaEsquema from '../validators/desativar-familia';
import subfamiliaListagemEsquema from '../validators/subfamilia-listagem';
import subfamiliaAtualizaEsquema from '../validators/subfamilia-atualiza';
import subfamiliaDesativarEsquema from '../validators/subfamilia-desativar';
import generoListagemEsquema from '../validators/genero-listagem';
import generoAtualizaEsquema from '../validators/genero-atualiza';
import generoDesativarEsquema from '../validators/genero-desativar';
import especieListagemEsquema from '../validators/especie-listagem';
import especieAtualizaEsquema from '../validators/especie-atualiza';
import especieDesativaEsquema from '../validators/especie-desativa';
import subespecieListagemEsquema from '../validators/subespecie-listagem';
import subespecieAtualizaEsquema from '../validators/subespecie-atualiza';
import variedadeListagemEsquema from '../validators/variedade-listagem';
import variedadeAtualizaEsquema from '../validators/variedade-atualiza';
import variedadeDesativaEsquema from '../validators/variedade-desativa';
import autorCadastroEsquema from '../validators/autor-cadastro';
import autorListagemEsquema from '../validators/autor-listagem';
import autorAtualizaEsquema from '../validators/autor-atualiza';
import autorDesativaEsquema from '../validators/autor-desativa';

const controller = require('../controllers/taxonomias-controller');

export default app => {

    app.route('/taxonomias')
        .get([
            listagensMiddleware,
            controller.listagem,
        ]);

    app.route('/familias')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarFamilia,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(listagemFamiliaEsquema),
            controller.buscarFamilias,
        ]);

    app.route('/familias/:familia_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizaFamiliaEsquema),
            controller.editarFamilia,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(desativarFamiliaEsquema),
            controller.excluirFamilia,
        ]);

    app.route('/generos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoEsquema),
            controller.cadastrarGenero,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(generoListagemEsquema),
            controller.buscarGeneros,
        ]);

    app.route('/generos/:genero_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoAtualizaEsquema),
            controller.editarGenero,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(generoDesativarEsquema),
            controller.excluirGeneros,
        ]);

    app.route('/subfamilias')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoEsquema),
            controller.cadastrarSubfamilia,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(subfamiliaListagemEsquema),
            controller.buscarSubfamilia,
        ]);

    app.route('/subfamilias/:subfamilia_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subfamiliaAtualizaEsquema),
            controller.editarSubfamilia,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(subfamiliaDesativarEsquema),
            controller.excluirSubfamilia,
        ]);

    app.route('/especies')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(especieEsquema),
            controller.cadastrarEspecie,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(especieListagemEsquema),
            controller.buscarEspecies,
        ]);

    app.route('/especies/:especie_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(especieAtualizaEsquema),
            controller.editarEspecie,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(especieDesativaEsquema),
            controller.excluirEspecies,
        ]);

    app.route('/subespecies')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieEsquema),
            controller.cadastrarSubespecie,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(subespecieListagemEsquema),
            controller.buscarSubespecies,
        ]);

    app.route('/subespecies/:subespecie_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieAtualizaEsquema),
            controller.editarSubespecie,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.excluirSubespecies,
        ]);

    app.route('/variedades')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieEsquema),
            controller.cadastrarVariedade,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(variedadeListagemEsquema),
            controller.buscarVariedades,
        ]);

    app.route('/variedades/:variedade_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(variedadeAtualizaEsquema),
            controller.editarVariedade,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(variedadeDesativaEsquema),
            controller.excluirVariedades,
        ]);

    app.route('/autores')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(autorCadastroEsquema),
            controller.cadastrarAutores,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(autorListagemEsquema),
            controller.buscarAutores,
        ]);

    app.route('/autores/:autor_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(autorAtualizaEsquema),
            controller.editarAutores,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(autorDesativaEsquema),
            controller.excluirAutores,
        ]);
};
