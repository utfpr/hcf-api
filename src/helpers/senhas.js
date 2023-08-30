import bcrypt from 'bcrypt-nodejs';

export function comparaSenha(texto, hash) {
    return bcrypt.compareSync(texto, hash);
}

export function gerarSenha(texto) {
    return bcrypt.hashSync(texto);
}

export default {};
