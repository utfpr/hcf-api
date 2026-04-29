import { renderFile } from 'ejs';
import { promisify } from 'util';

const renderFileAsync = promisify(renderFile);

export default (caminho, parametros) => renderFileAsync(caminho, parametros, {
    // Keep whitespace behavior stable across EJS major versions.
    rmWhitespace: false,
});
