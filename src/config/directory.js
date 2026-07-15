import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const { UPLOAD_PATH, STORAGE_PATH, SOURCE_ROOT } = process.env;

function getSourceRoot() {
    if (SOURCE_ROOT) {
        return SOURCE_ROOT;
    }

    if (!existsSync(resolve('src/views')) && existsSync(resolve('dist/views'))) {
        return 'dist';
    }

    return 'src';
}

export const resolveSource = (...parts) => resolve(getSourceRoot(), ...parts);
export const assets = resolve('public');
export const upload = UPLOAD_PATH || resolve('uploads');
export const storage = STORAGE_PATH || resolve('storage');

export default {};
