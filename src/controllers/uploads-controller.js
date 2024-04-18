import { renameSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

import { storage } from '../config/directory';
import BadRequestExeption from '../errors/bad-request-exception';
import pick from '../helpers/pick';
import models from '../models';

const {
    sequelize,
    Sequelize: { ForeignKeyConstraintError },
    TomboFoto,
} = models;

const catchForeignKeyConstraintError = err => {
    if (err.fields.includes('tombo_hcf')) {
        throw new BadRequestExeption(416);
    }

    throw err;
};

function apenasNumeros(string) {
    const numsStr = string.replace(/[^0-9]/g, '');
    return parseInt(numsStr);
}

export const post = (request, response, next) => {
    const { file } = request;

    let maximoGlobalCodBarras = '';
    const isTrueSet = (request.body.em_vivo === 'true');
    const fn = transaction => Promise.resolve()
        .then(() => TomboFoto.findAll({
            where: {
                em_vivo: isTrueSet,
            },
            attributes: [
                'id',
                'codigo_barra',
            ],
        }))
        .then(codBarras => {
            // const maximoCodBarras = Math.max(... codBarras.map(e => e.id));
            if (codBarras.length > 0) {
                let maximoCodBarras = codBarras[0];
                for (let i = 0; i < codBarras.length; i += 1) {
                    if (codBarras[i].id > maximoCodBarras.id) {
                        maximoCodBarras = codBarras[i];
                    }
                }
                maximoGlobalCodBarras = maximoCodBarras.dataValues.codigo_barra;
            }
        })
        .then(() => {
            const body = pick(request.body, [
                'tombo_hcf',
                'em_vivo',
            ]);

            return TomboFoto.create(body, { transaction });
        })
        .then(foto => {
            if (!existsSync(storage)) {
                // @ts-ignore
                mkdirSync(storage, { recursive: true });
            }

            let nomeArquivo;
            // @ts-ignore
            maximoGlobalCodBarras = apenasNumeros(maximoGlobalCodBarras);
            if (foto.em_vivo) {
                nomeArquivo = `HCFV${String(maximoGlobalCodBarras + 1).padStart(8, '0')}`;
            } else {
                nomeArquivo = `HCF${String(maximoGlobalCodBarras + 1).padStart(9, '0')}`;
            }

            const numeroBarra = `${maximoGlobalCodBarras + 1}.${''.padEnd(6, '0')}`;

            const extensao = extname(file.originalname);
            const caminho = `${nomeArquivo}${extensao}`;

            const atualizacao = {
                ...foto,
                codigo_barra: nomeArquivo,
                num_barra: numeroBarra,
                caminho_foto: caminho,
            };

            return foto.update(atualizacao, { transaction });
        })
        .then(foto => {
            renameSync(file.path, join(storage, foto.caminho_foto));
            return foto;
        });

    sequelize.transaction(fn)
        .then(imagem => {
            response.status(201)
                .json(imagem);
        })
        .catch(ForeignKeyConstraintError, catchForeignKeyConstraintError)
        .catch(next);
};

export const put = (request, response, next) => {
    const { file } = request;

    const fn = transaction => Promise.resolve()
        .then(() => {
            const body = pick(request.body, [
                'tombo_codBarr',
            ]);
            return TomboFoto.findOne({
                where: {
                    codigo_barra: body.tombo_codBarr,
                },
            });
        })
        .then(foto => {
            if (!existsSync(storage)) {
                // @ts-ignore
                mkdirSync(storage, { recursive: true });
            }

            let nomeArquivo;
            // @ts-ignore
            if (foto.em_vivo) {
                nomeArquivo = `HCFV${String(foto.id).padStart(8, '0')}`;
            } else {
                nomeArquivo = `HCF${String(foto.id).padStart(9, '0')}`;
            }

            // const numeroBarra = `${foto.id}.${''.padEnd(6, '0')}`;

            const extensao = extname(file.originalname);
            const caminho = `${nomeArquivo}${extensao}`;

            const atualizacao = {
                ...foto,
                caminho_foto: caminho,
            };

            return foto.update(atualizacao, { transaction });
        })
        .then(foto => {
            renameSync(file.path, join(storage, foto.caminho_foto));
            return foto;
        });

    sequelize.transaction(fn)
        .then(imagem => {
            response.status(201)
                .json(imagem);
        })
        .catch(ForeignKeyConstraintError, catchForeignKeyConstraintError)
        .catch(next);

};

export const postBarrSemFotos = (request, response, next) => {
    let maximoGlobalCodBarras = '';
    const isTrueSet = request.body.em_vivo === 'true' ? 1 : 0;
    const fn = transaction => Promise.resolve()
        .then(() => TomboFoto.findAll({
            where: {
                em_vivo: isTrueSet,
            },
            attributes: [
                'id',
                'codigo_barra',
            ],
        }))
        .then(codBarras => {
            if (codBarras.length > 0) {
                let maximoCodBarras = codBarras[0];
                for (let i = 0; i < codBarras.length; i += 1) {
                    if (codBarras[i].id > maximoCodBarras.id) {
                        maximoCodBarras = codBarras[i];
                    }
                }
                maximoGlobalCodBarras = maximoCodBarras.dataValues.codigo_barra;
            }
        })
        .then(() => {
            const body = pick(request.body, [
                'tombo_hcf',
                'em_vivo',
            ]);

            return TomboFoto.create(body, { transaction });

        })
        .then(foto => {
            let nomeArquivo;
            // @ts-ignore
            maximoGlobalCodBarras = apenasNumeros(maximoGlobalCodBarras);

            if (foto.em_vivo) {
                nomeArquivo = `HCFV${String(maximoGlobalCodBarras + 1).padStart(8, '0')}`;
            } else {
                nomeArquivo = `HCF${String(maximoGlobalCodBarras + 1).padStart(9, '0')}`;
            }

            const numeroBarra = `${maximoGlobalCodBarras + 1}.${''.padEnd(6, '0')}`;

            const caminho = 'semFoto.png';

            const atualizacao = {
                ...foto,
                codigo_barra: nomeArquivo,
                num_barra: numeroBarra,
                caminho_foto: caminho,
            };

            return foto.update(atualizacao, { transaction });
        });

    sequelize.transaction(fn)
        .then(imagem => {
            response.status(201)
                .json(imagem);
        })
        .catch(ForeignKeyConstraintError, catchForeignKeyConstraintError)
        .catch(next);
};

export default {};
