import fs from 'fs';
import path from 'path';

// eslint-disable-next-line
const __basename = path.basename(__filename);

const files = fs.readdirSync(__dirname)
    .filter(file => file !== __basename && /\.js$/.test(file));

const resources = files.map(file => {
    // eslint-disable-next-line
    const mod = require(`./${file}`);
    return mod.default || mod;
});

export default Object.assign.apply({}, resources);
