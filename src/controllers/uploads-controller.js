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

export const post = (request, response, next) => {
    const { file } = request;

    const fn = transaction => Promise.resolve()
        .then(() => {
            const body = pick(request.body, [
                'tombo_hcf',
                'em_vivo',
            ]);

            return TomboFoto.create(body, { transaction });
        })
        .then(foto => {
            if (!existsSync(storage)) {
                mkdirSync(storage, { recursive: true });
            }

            const nomeArquivo = `HCF${String(foto.id).padStart(9, '0')}`;
            const numeroBarra = `${foto.id}.${''.padEnd(6, '0')}`;

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

export default {};
