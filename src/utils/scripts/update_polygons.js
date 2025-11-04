/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import wkx from 'wkx';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const projectRoot = path.resolve(currentDirname, '..', '..', '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const { Client } = pg;

const {
    PG_DATABASE, PG_USERNAME, PG_PASSWORD, PG_HOST, PG_PORT,
} = process.env;

export const database = PG_DATABASE;
export const username = PG_USERNAME;
export const password = PG_PASSWORD;
export const host = PG_HOST;
export const port = PG_PORT;

const connectionString = process.env.DATABASE_URL
  || `postgresql://${PG_USERNAME}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`;

function isValidConnectionString(cs) {
    return typeof cs === 'string' && cs.length > 0 && !/undefined/.test(cs);
}

if (!isValidConnectionString(connectionString)) {
    console.error('Connection string inválida. Verifique as variáveis de ambiente PG_* ou DATABASE_URL.');
    console.error('Arquivo .env carregado em:', path.join(projectRoot, '.env'));
    console.error('Valores atuais: PG_DATABASE=%s PG_USERNAME=%s PG_PASSWORD=%s PG_HOST=%s PG_PORT=%s',
        PG_DATABASE,
        PG_USERNAME,
        PG_PASSWORD ? '***' : undefined,
        PG_HOST,
        PG_PORT);
    process.exit(1);
}

console.log('Using connectionString:', connectionString);

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
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const txt = resp.data.toString('utf-8');
    const geojson = JSON.parse(txt);

    if (!geojson?.features?.length) {
        throw new Error(`GeoJSON vazio para codigo ${codigoIbge}`);
    }

    const { geometry } = geojson.features[0];
    if (!geometry) {
        throw new Error(`Sem geometria no GeoJSON para codigo ${codigoIbge}`);
    }

    const geom = wkx.Geometry.parseGeoJSON(geometry);
    return geom.toWkb();
}

async function processarCidade(client, municipios, cidade) {
    const { id, nome, pol_wkb: polWkb } = cidade;

    if (nome === 'Não Informado') {
        return { inserido: 0, atualizado: 0, erro: 0 };
    }

    const codigoIbge = obterCodigoIbge(nome, municipios);
    if (!codigoIbge) {
        return { inserido: 0, atualizado: 0, erro: 1 };
    }

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
    UPDATE public.cidades
    SET poligono = (SELECT g FROM newgeom), updated_at = NOW()
    WHERE id = $2
    AND (poligono IS NULL OR NOT ST_Equals(poligono, (SELECT g FROM newgeom)));
  `;

    try {
        const result = await client.query(sql, [polBytes, id]);
        if (result.rowCount > 0) {
            return polWkb
                ? { inserido: 0, atualizado: 1, erro: 0 }
                : { inserido: 1, atualizado: 0, erro: 0 };
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
            'SELECT id, nome, ST_AsBinary(poligono) AS pol_wkb FROM public.cidades;'
        );
        const totalCidades = cidades.length;
        let i = 0;

        const resultados = await Promise.all(
            cidades.map(async c => {
                i += 1;
                const percentual = ((i / totalCidades) * 100).toFixed(1);
                const restantes = totalCidades - i;
                process.stdout.write(`\rProgresso: ${i}/${totalCidades} (${percentual}%) - Restam ${restantes} cidades`);

                const res = await processarCidade(client, municipios, c);
                await new Promise((resolve) => { setTimeout(resolve, 100); });
                return res;
            })
        );

        process.stdout.write('\n');

        const total = resultados.reduce(
            (acc, r) => ({
                inseridos: acc.inseridos + r.inserido,
                atualizados: acc.atualizados + r.atualizado,
                erros: acc.erros + r.erro,
            }),
            { inseridos: 0, atualizados: 0, erros: 0 }
        );

        console.log('\nResumo:', total);
    } finally {
        await client.end();
    }
}

main().catch(err => {
    console.error('\nErro no processamento:', err);
    process.exit(1);
});
