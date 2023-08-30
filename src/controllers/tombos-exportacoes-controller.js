import path from 'path';
import knex from '../factories/knex';
import PreconditionFailedException from '../errors/precondition-failed-exception';
import BadRequestException from '../errors/bad-request-exception';
import renderizaArquivoHtml from '../helpers/renderiza-arquivo-html';


function adicionaColunaDataColeta(consulta, coluna) {
    const funcao = knex.raw('concat_ws(?, ??, ??, ??)', [
        '/',
        'tmb.data_coleta_dia',
        'tmb.data_coleta_mes',
        'tmb.data_coleta_ano',
    ]);

    consulta.column({ data_coleta: funcao });
}

function adicionaColunaFamilia(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('familias')
        .where('id', knex.ref('tmb.familia_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaSubfamilia(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('sub_familias')
        .where('id', knex.ref('tmb.sub_familia_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaGenero(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('generos')
        .where('id', knex.ref('tmb.genero_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaEspecie(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('especies')
        .where('id', knex.ref('tmb.especie_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaSubespecie(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('sub_especies')
        .where('id', knex.ref('tmb.sub_especie_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaVariedade(consulta, coluna) {
    const subconsulta = knex
        .select('nome')
        .from('sub_especies')
        .where('id', knex.ref('tmb.sub_especie_id'))
        .limit(1);

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunaColetores(consulta, coluna) {
    const nomes = knex.raw('group_concat(?? separator ?)', ['nome', ', ']);
    const subconsulta = knex
        .select(nomes)
        .from(['tombos_coletores', 'coletores'])
        .where('tombo_hcf', knex.ref('tmb.hcf'))
        .andWhere('coletor_id', knex.ref('id'));

    consulta.column({ [coluna]: subconsulta });
}

function adicionaColunasTombosFotos(consulta, coluna, juncoes) {
    if (!juncoes.tbf) {
        // Se a junção da tabela já foi feita, não faz de novo
        // pra não duplicar o INNER JOIN com a tabela
        consulta.leftJoin({ tbf: 'tombos_fotos' }, 'tbf.tombo_hcf', 'tmb.hcf');
        juncoes.tbf = true; // eslint-disable-line
    }

    consulta.columns(coluna);
}


const COLUNAS = {
    hcf: consulta => { consulta.column('hcf'); },
    numero_coleta: consulta => { consulta.column('numero_coleta'); },
    data_coleta: adicionaColunaDataColeta,
    latitude: consulta => { consulta.column('latitude'); },
    longitude: consulta => { consulta.column('longitude'); },
    altitude: consulta => { consulta.column('altitude'); },
    familia: adicionaColunaFamilia,
    subfamilia: adicionaColunaSubfamilia,
    genero: adicionaColunaGenero,
    especie: adicionaColunaEspecie,
    subespecie: adicionaColunaSubespecie,
    variedade: adicionaColunaVariedade,
    coletores: adicionaColunaColetores,
    sequencia: adicionaColunasTombosFotos,
    codigo_barra: adicionaColunasTombosFotos,
};

const COLUNAS_PERMITIDAS = Object.keys(COLUNAS);

const FILTROS = {
    de: (consulta, valor) => { consulta.where('tmb.hcf', '>=', valor); },
    ate: (consulta, valor) => { consulta.where('tmb.hcf', '<=', valor); },
    ids: (consulta, valor) => { consulta.whereIn('tmb.hcf', valor); },
    data_coleta: (consulta, valor) => {
        const [data1, data2] = valor;
        consulta.whereBetween('tmb.data_tombo', [`${data1} 00:00:00`, `${data2} 23:59:59`]);
    },
};

function criaConsultaTombos(colunas, filtros) {

    const consulta = knex
        .from({ tmb: 'tombos' });

    const juncoes = {};
    colunas.forEach(coluna => {
        const funcao = COLUNAS[coluna];
        funcao(consulta, coluna, juncoes);
    });

    Object.entries(filtros)
        .forEach(entrada => {
            const [chave, valor] = entrada;
            const funcao = FILTROS[chave];
            funcao(consulta, valor);
        });

    return consulta;
}

export default function exportacoes(request, response, next) {

    Promise.resolve({ query: request.query, paginacao: request.paginacao })
        .then(parametros => {
            const { query, paginacao } = parametros;
            if (!query.filtros) {
                throw new PreconditionFailedException(420);
            }

            const de = Number(query.filtros.de);
            const ate = Number(query.filtros.ate);
            if (de && ate && de >= ate) {
                throw new PreconditionFailedException(419);
            }

            const { ids } = query.filtros;
            if (de && ate && ids) {
                throw new PreconditionFailedException(422);
            }

            const campos = query.campos
                .filter(campo => COLUNAS_PERMITIDAS.includes(campo));

            const consulta = criaConsultaTombos(campos, query.filtros)
                .limit(paginacao.limite)
                .offset(paginacao.offset);

            return consulta.then(registros => registros);
        })
        .then(tombos => {

            if (tombos.length < 1) {
                throw new BadRequestException(423);
            }

            const colunas = Object.keys(tombos[0])
                // Ordena para deixar a coluna "codigo_barra" sempre no final da tabela
                .sort(a => a == 'codigo_barra' ? 1 : -1); // eslint-disable-line
            const parametros = { colunas, tombos };

            const caminhoArquivoHtml = path.resolve(__dirname, '../views/exportacao-tombos.ejs');
            return renderizaArquivoHtml(caminhoArquivoHtml, parametros, response)
                .then(html => {
                    response.status(200).send(html);
                });
        })
        .catch(next);
}
