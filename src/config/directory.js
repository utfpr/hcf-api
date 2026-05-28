import { resolve } from 'node:path';

const { UPLOAD_PATH, STORAGE_PATH } = process.env;

export const assets = resolve('public');
export const upload = UPLOAD_PATH || resolve('uploads');
export const storage = STORAGE_PATH || resolve('storage');

export default {};
