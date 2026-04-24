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
  await knex.raw(`DROP VIEW IF EXISTS vw_splinker`)
  await knex.raw(`
    CREATE VIEW vw_splinker AS
    SELECT
      'Plantae' AS "Kingdom",
      '' AS "Phylum",
      '' AS "Class",
      '' AS "Ordem",
      CASE
        WHEN LOWER(f.nome) = 'indeterminada' THEN ''
        ELSE COALESCE(f.nome, '')
      END AS "Family",
      COALESCE(g.nome, '') AS "Genus",
      COALESCE(e.nome, '') AS "Species",
      '' AS "Subspeceis",
      COALESCE(a.nome, '') AS "ScientificNameAuthor",
      COALESCE(t.nomes_populares, '') AS "CommonName",
      '' AS "FieldNumber",
      t.hcf AS "CatalogNumber",
      '' AS "PreviousCatalogNumber",
      'PreservedSpecimen' AS "BasisOfRecord",
      COALESCE(tp.nome, '') AS "TypeStatus",
      '' AS "PreparationType",
      '' AS "IndividualCount",
      '' AS "Sex",
      '' AS "LifeStage",
      COALESCE(t.data_coleta_dia::text, '') AS "DayCollected",
      COALESCE(t.data_coleta_mes::text, '') AS "MonthCollected",
      COALESCE(t.data_coleta_ano::text, '') AS "YearCollected",
      COALESCE(col.nome, '') AS "Collector",
      COALESCE(t.numero_coleta::text, '') AS "CollectorNumber",
      '' AS "Continent",
      COALESCE(p.nome, '') AS "Country",
      COALESCE(TRIM(est.sigla), '') AS "StateProvice",
      COALESCE(c.nome, '') AS "County",
      COALESCE(lc.descricao, '') AS "Locality",
      t.latitude AS "VerbatimLatitude",
      t.longitude AS "VerbatimLongitude",
      CASE
        WHEN t.altitude IS NOT NULL THEN t.altitude::text || ' m'
        ELSE ''
      END AS "VerbatimElevation",
      '' AS "VerbatimDepth",
      COALESCE(t.data_identificacao_dia::text, '') AS "DayIdentified",
      COALESCE(t.data_identificacao_mes::text, '') AS "MonthIdentified",
      COALESCE(t.data_identificacao_ano::text, '') AS "YearIdentified",
      COALESCE(
        (SELECT string_agg(ident.nome, ';')
         FROM tombos_identificadores ti
         JOIN identificadores ident ON ti.identificador_id = ident.id
         WHERE ti.tombo_hcf = t.hcf),
        ''
      ) AS "IdentifiedBy",
      '' AS "RelatedCatalogItem",
      '' AS "RelationShipType",
      CONCAT_WS(' ',
        fn_barcodes_tombo(t.hcf),
        t.descricao
      ) AS "Notes"
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
