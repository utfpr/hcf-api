import express from 'express';
import { readdirSync } from 'fs';
import { basename } from 'path';

const __basename = basename(__filename);
const app = express();

const isRouteFile = file => file !== __basename && /\.js$/.test(file);

// eslint-disable-next-line
const loadRouteFile = file => require(`./${file}`);

readdirSync(__dirname)
    .filter(isRouteFile)
    .map(loadRouteFile)
    .forEach(mod => mod.default(app));

export default app;
