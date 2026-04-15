import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  // 1. Remove function antiga (se existir com tipo integer)
  await knex.raw(`DROP FUNCTION IF EXISTS fn_barcodes_tombo(integer);`)

  // 2. Cria function que retorna os barcodes de um tombo
  await knex.raw(`
    CREATE OR REPLACE FUNCTION fn_barcodes_tombo(p_hcf bigint)
    RETURNS text AS $$
      SELECT string_agg('[BARCODE=' || codigo_barra || ']', ' , ')
      FROM tombos_fotos
      WHERE tombo_hcf = p_hcf;
    $$ LANGUAGE sql STABLE;
  `)

  // 2. Cria a view do splinker com todos os campos do map.dat
  await knex.raw(`
    CREATE OR REPLACE VIEW vw_splinker AS
    SELECT
      'Plantae' AS kingdom,
      '' AS phylum,
      '' AS class,
      '' AS "order",
      CASE
        WHEN LOWER(f.nome) = 'indeterminada' THEN ''
        ELSE COALESCE(f.nome, '')
      END AS family,
      COALESCE(g.nome, '') AS genus,
      COALESCE(e.nome, '') AS species,
      '' AS subspecies,
      COALESCE(a.nome, '') AS scientific_name_author,
      COALESCE(t.nomes_populares, '') AS common_name,
      '' AS field_number,
      t.hcf AS catalog_number,
      '' AS previous_catalog_number,
      'PreservedSpecimen' AS basis_of_record,
      COALESCE(tp.nome, '') AS type_status,
      '' AS preparation_type,
      '' AS individual_count,
      '' AS specimen_sex,
      '' AS specimen_life_stage,
      CONCAT_WS('-',
        t.data_coleta_ano::text,
        LPAD(t.data_coleta_mes::text, 2, '0'),
        LPAD(t.data_coleta_dia::text, 2, '0')
      ) AS collection_date,
      COALESCE(col.nome, '') AS collector_name,
      COALESCE(t.numero_coleta::text, '') AS collector_number,
      '' AS continent_or_ocean,
      COALESCE(p.nome, '') AS country,
      COALESCE(TRIM(est.sigla), '') AS state_or_province,
      COALESCE(c.nome, '') AS city,
      COALESCE(lc.descricao, '') AS locality,
      t.latitude,
      t.longitude,
      CASE
        WHEN t.altitude IS NOT NULL THEN t.altitude::text || ' m'
        ELSE ''
      END AS elevation,
      '' AS depth,
      CONCAT_WS('-',
        t.data_identificacao_ano::text,
        LPAD(t.data_identificacao_mes::text, 2, '0'),
        LPAD(t.data_identificacao_dia::text, 2, '0')
      ) AS identification_date,
      COALESCE(
        (SELECT string_agg(ident.nome, ';')
         FROM tombos_identificadores ti
         JOIN identificadores ident ON ti.identificador_id = ident.id
         WHERE ti.tombo_hcf = t.hcf),
        ''
      ) AS identifier_name,
      '' AS related_catalog_item,
      '' AS relationship_type,
      CONCAT_WS(' ',
        fn_barcodes_tombo(t.hcf),
        t.descricao
      ) AS notes
    FROM tombos t
    LEFT JOIN locais_coleta lc ON t.local_coleta_id = lc.id
    LEFT JOIN cidades c ON lc.cidade_id = c.id
    LEFT JOIN estados est ON c.estado_id = est.id
    LEFT JOIN paises p ON est.pais_id = p.id
    LEFT JOIN familias f ON t.familia_id = f.id
    LEFT JOIN reinos r ON f.reino_id = r.id
    LEFT JOIN generos g ON t.genero_id = g.id
    LEFT JOIN especies e ON t.especie_id = e.id
    LEFT JOIN autores a ON e.autor_id = a.id
    LEFT JOIN coletores col ON t.coletor_id = col.id
    LEFT JOIN tipos tp ON t.tipo_id = tp.id
  `)
}
