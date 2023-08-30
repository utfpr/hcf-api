import { renderFile } from 'ejs';


export default (caminho, parametros) => new Promise((resolve, reject) => {

    function onRenderCompleted(err, html) {
        if (err) {
            reject(err);
            return;
        }

        resolve(html);
    }

    renderFile(caminho, parametros, {}, onRenderCompleted);
});
