import listagensMiddleware from '../middlewares/listagens-middleware';
import criaOrdenacaoMiddleware from '../middlewares/ordenacao-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import autorAtualizaEsquema from '../validators/autor-atualiza';
import autorCadastroEsquema from '../validators/autor-cadastro';
import autorDesativaEsquema from '../validators/autor-desativa';
import autorListagemEsquema from '../validators/autor-listagem';
import desativarFamiliaEsquema from '../validators/desativar-familia';
import especieEsquema from '../validators/especie';
import especieAtualizaEsquema from '../validators/especie-atualiza';
import especieDesativaEsquema from '../validators/especie-desativa';
import especieListagemEsquema from '../validators/especie-listagem';
import atualizaFamiliaEsquema from '../validators/familia-atualiza';
import listagemFamiliaEsquema from '../validators/familia-listagem';
import generoEsquema from '../validators/genero';
import generoAtualizaEsquema from '../validators/genero-atualiza';
import generoDesativarEsquema from '../validators/genero-desativar';
import generoListagemEsquema from '../validators/genero-listagem';
import nomeEsquema from '../validators/nome-obrigatorio';
import atualizaReinoEsquema from '../validators/reino-atualiza';
import reinoListagemEsquema from '../validators/reino-listagem';
import subespecieEsquema from '../validators/subespecie';
import subespecieAtualizaEsquema from '../validators/subespecie-atualiza';
import subespecieListagemEsquema from '../validators/subespecie-listagem';
import subfamiliaAtualizaEsquema from '../validators/subfamilia-atualiza';
import subfamiliaDesativarEsquema from '../validators/subfamilia-desativar';
import subfamiliaListagemEsquema from '../validators/subfamilia-listagem';
import variedadeAtualizaEsquema from '../validators/variedade-atualiza';
import variedadeDesativaEsquema from '../validators/variedade-desativa';
import variedadeListagemEsquema from '../validators/variedade-listagem';

const controller = require('../controllers/taxonomias-controller');

const reinosOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino'], 'nome', 'asc');
const familiasOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino', 'familia'], 'nome', 'asc');
const subfamiliasOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino', 'subfamilia', 'familia', 'autor'], 'nome', 'asc');
const generosOrdenacaoMiddleware = criaOrdenacaoMiddleware(['genero', 'familia', 'reino'], 'nome', 'asc');
const especiesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['especie', 'reino', 'familia', 'genero', 'familia'], 'nome', 'asc');
const subEspeciesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['subespecie', 'reino', 'familia', 'genero', 'especie', 'autor'], 'nome', 'asc');
const variedadesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['variedade', 'reino', 'familia', 'genero', 'especie', 'autor'], 'nome', 'asc');

export default app => {

    app.route('/taxonomias')
        .get([
            listagensMiddleware,
            controller.listagem,
        ]);

    app
        .route('/reinos')
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarReino,
        ])
        .get([
            listagensMiddleware,
            reinosOrdenacaoMiddleware,
            validacoesMiddleware(reinoListagemEsquema),
            controller.buscarReinos,
        ]);

    app
        .route('/reinos/:reino_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizaReinoEsquema),
            controller.editarReino,
        ]);

    app
        .route('/familias')
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarFamilia,
        ])
        .get([
            listagensMiddleware,
            familiasOrdenacaoMiddleware,
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
            generosOrdenacaoMiddleware,
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
            subfamiliasOrdenacaoMiddleware,
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
            especiesOrdenacaoMiddleware,
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
            subEspeciesOrdenacaoMiddleware,
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
            variedadesOrdenacaoMiddleware,
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
