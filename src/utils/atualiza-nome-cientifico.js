import models from '../models';

const { sequelize } = models;

/**
 * Atualiza o nome_cientifico de todos os tombos que possuem o genero_id informado.
 * Deve ser chamado quando o nome de um gênero for alterado.
 */
export async function atualizarNomeCientificoPorGenero(generoId, transaction) {
    // Tombos com genero e especie
    await sequelize.query(`
        UPDATE tombos t
        SET nome_cientifico = CONCAT(g.nome, ' ', e.nome)
        FROM generos g, especies e
        WHERE t.genero_id = g.id
          AND t.especie_id = e.id
          AND t.genero_id = :generoId
          AND t.nome_cientifico IS DISTINCT FROM CONCAT(g.nome, ' ', e.nome)
    `, { replacements: { generoId }, transaction });

    // Tombos com apenas genero (sem especie)
    await sequelize.query(`
        UPDATE tombos t
        SET nome_cientifico = g.nome
        FROM generos g
        WHERE t.genero_id = g.id
          AND t.especie_id IS NULL
          AND t.genero_id = :generoId
          AND t.nome_cientifico IS DISTINCT FROM g.nome
    `, { replacements: { generoId }, transaction });
}

/**
 * Atualiza o nome_cientifico de todos os tombos que possuem o especie_id informado.
 * Deve ser chamado quando o nome de uma espécie for alterado.
 */
export async function atualizarNomeCientificoPorEspecie(especieId, transaction) {
    await sequelize.query(`
        UPDATE tombos t
        SET nome_cientifico = CONCAT(g.nome, ' ', e.nome)
        FROM generos g, especies e
        WHERE t.genero_id = g.id
          AND t.especie_id = e.id
          AND t.especie_id = :especieId
          AND t.nome_cientifico IS DISTINCT FROM CONCAT(g.nome, ' ', e.nome)
    `, { replacements: { especieId }, transaction });
}
