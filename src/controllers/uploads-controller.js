import { renameSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { join, parse } from 'path';

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

const isValidImageType = file => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/tiff',
        'image/svg+xml',
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return false;
    }

    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
        return false;
    }

    return true;
};

export const post = (request, response, next) => {
    const { file, body } = request;

    if (!file) {
        return response.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    if (!isValidImageType(file)) {
        if (existsSync(file.path)) {
            unlinkSync(file.path);
        }
        return response.status(400).json({
            error: 'Apenas arquivos de imagem são permitidos (PNG, JPEG, JPG, GIF, BMP, WEBP, TIFF, SVG)',
        });
    }

    if (!body.codigo_foto) {
        return response.status(400).json({ error: 'Código da foto é obrigatório' });
    }

    let fotoExistente = null;

    const fn = transaction => Promise.resolve()
        .then(() => TomboFoto.findOne({
            where: {
                num_barra: body.codigo_foto,
            },
            transaction,
        }))
        .then(foto => {
            fotoExistente = foto;
            const fileName = body.codigo_foto;
            const filePath = join(storage, fileName);

            const existingFiles = readdirSync(storage);
            const existingFile = existingFiles.find(f => {
                const nameWithoutExt = parse(f).name;
                return nameWithoutExt === body.codigo_foto || f === body.codigo_foto;
            });

            if (existingFile) {
                const existingFilePath = join(storage, existingFile);
                if (existsSync(existingFilePath)) {
                    unlinkSync(existingFilePath);
                }
            }

            renameSync(file.path, filePath);

            if (fotoExistente) {
                return fotoExistente.update({
                    caminho_foto: fileName,
                }, { transaction });
            }

            const bodyData = pick(request.body, [
                'tombo_hcf',
                'em_vivo',
            ]);

            return TomboFoto.create({
                ...bodyData,
                num_barra: body.codigo_foto,
                codigo_barra: body.codigo_foto,
                caminho_foto: fileName,
            }, { transaction });
        });

    return sequelize.transaction(fn)
        .then(imagem => {
            response.status(201).json({
                url: `/uploads/${imagem.caminho_foto}`,
                codigo: body.codigo_foto,
                message: fotoExistente ? 'Imagem atualizada com sucesso' : 'Imagem criada com sucesso',
            });
        })
        .catch(err => {
            if (existsSync(file.path)) {
                unlinkSync(file.path);
            }
            next(err);
        });
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
