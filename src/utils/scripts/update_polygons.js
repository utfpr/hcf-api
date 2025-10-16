/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const wkx = require('wkx');

const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASS || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'hcf';

const connectionString = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const API_IBGE_MUNICIPIOS =
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const API_IBGE_POLYGON =
  'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{codigo_ibge}?formato=application/vnd.geo+json&qualidade=minima';

function removerAcentos(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function carregarListaMunicipios() {
    const resp = await axios.get(API_IBGE_MUNICIPIOS, { timeout: 30000 });
    return resp.data.map(m => ({
        id: m.id,
        nome: m.nome,
        nome_normalizado: removerAcentos(m.nome.toLowerCase()),
    }));
}

function obterCodigoIbge(nome, municipios) {
    const nomeNorm = removerAcentos(nome.toLowerCase());
    const m = municipios.find(x => x.nome_normalizado === nomeNorm);
    return m ? parseInt(m.id, 10) : null;
}

async function obterPoligonoIbge(codigoIbge) {
    const url = API_IBGE_POLYGON.replace('{codigo_ibge}', codigoIbge);
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    const geojson = JSON.parse(resp.data.toString('utf-8'));

    if (!geojson?.features?.length) throw new Error('GeoJSON vazio');

    const { geometry } = geojson.features[0];
    if (!geometry) throw new Error('Sem geometria no GeoJSON');

    const geom = wkx.Geometry.parseGeoJSON(geometry);
    return geom.toWkb();
}

async function processarCidade(client, municipios, cidade) {
    const { id, nome, pol_wkb: polWkb } = cidade;

    if (nome === 'Não Informado') return { inserido: 0, atualizado: 0, erro: 0 };

    const codigoIbge = obterCodigoIbge(nome, municipios);
    if (!codigoIbge) return { inserido: 0, atualizado: 0, erro: 1 };

    let polBytes;
    try {
        polBytes = await obterPoligonoIbge(codigoIbge);
    } catch {
        return { inserido: 0, atualizado: 0, erro: 1 };
    }

    const sql = `
    WITH newgeom AS (
      SELECT ST_Multi(ST_SetSRID(ST_GeomFromWKB($1::bytea, 4674), 4674)) AS g
    )
    UPDATE cidades
    SET poligono = (SELECT g FROM newgeom), updated_at = NOW()
    WHERE id = $2
    AND (poligono IS NULL OR NOT ST_Equals(poligono, (SELECT g FROM newgeom)));
  `;

    try {
        const result = await client.query(sql, [polBytes, id]);
        if (result.rowCount > 0) {
            return polWkb ? { inserido: 0, atualizado: 1, erro: 0 } : { inserido: 1, atualizado: 0, erro: 0 };
        }
        return { inserido: 0, atualizado: 0, erro: 0 };
    } catch {
        return { inserido: 0, atualizado: 0, erro: 1 };
    }
}

async function main() {
    const municipios = await carregarListaMunicipios();
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const { rows: cidades } = await client.query(
            'SELECT id, nome, ST_AsBinary(poligono) AS pol_wkb FROM cidades;'
        );

        const resultados = await Promise.all(
            cidades.map(c => processarCidade(client, municipios, c))
        );

        const total = resultados.reduce(
            (acc, r) => ({
                inseridos: acc.inseridos + r.inserido,
                atualizados: acc.atualizados + r.atualizado,
                erros: acc.erros + r.erro,
            }),
            { inseridos: 0, atualizados: 0, erros: 0 }
        );

        console.log('Resumo:', total);
    } finally {
        await client.end();
    }
}

main().catch(err => {
    console.error('Erro no processamento:', err);
});
