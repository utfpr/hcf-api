import usuarios from './100-usuarios.js';
import herbarios from './200-herbarios.js';
import locaisColeta from './300-locais-coleta.js';
import tombo from './400-tombo.js';
import taxonomias from './500-taxonomias.js';
import cidades from './600-cidades.js';
import remessa from './700-remessa.js';
import pendencias from './800-pendencias.js';
import outros from './outros.js';

export default Object.assign(
    {},
    usuarios,
    herbarios,
    locaisColeta,
    tombo,
    taxonomias,
    cidades,
    remessa,
    pendencias,
    outros,
);
