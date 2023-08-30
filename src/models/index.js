// @ts-ignore

import Sequelize from 'sequelize';
import { readdirSync } from 'fs';
import { basename } from 'path';
import {
    database,
    username,
    password,
    options,
} from '../config/database';

const __basename = basename(__filename); // eslint-disable-line
const sequelize = new Sequelize(database, username, password, options);


const isModelFile = file => file !== __basename && /\.[jt]s$/.test(file);


const reduceModels = (models, file) => ({
    ...models,
    [file.replace(/\.js$/, '')]: sequelize.import(`./${file}`),
});


const models = readdirSync(__dirname)
    .filter(isModelFile)
    .reduce(reduceModels, {});


const prepare = modelsMapped => {
    Object.keys(modelsMapped)
        .forEach(key => {
            const { associate } = modelsMapped[key];
            if (typeof associate === 'function') {
                associate(modelsMapped, sequelize);
            }
        });

    return modelsMapped;
};

const defaultExport = {
    ...prepare(models),
    Sequelize,
    sequelize,
    default: sequelize,
};

export default defaultExport;
