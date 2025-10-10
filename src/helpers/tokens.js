import jwt from 'jsonwebtoken';

import { secret, expires } from '../config/security';
import serverConfig from '../config/server';

export const geraTokenUsuario = json => {
    const token = jwt.sign(json, secret, {
        expiresIn: expires,
    });

    return token;
};

export const decodificaTokenUsuario = token => jwt.verify(token, secret, {
    ignoreExpiration: serverConfig.environment === 'development',
});

export const constroiPayloadUsuario = usuario => {
    const { id, nome, email, tipo_usuario_id: tipoUsuarioId } = usuario;

    return {
        id,
        nome,
        email,
        tipo_usuario_id: tipoUsuarioId,
    };
};

export const geraTokenResetSenha = usuarioId => {
    const payload = { id: usuarioId };
    const secretReset = secret + '-reset';
    const token = jwt.sign(payload, secretReset, {
        expiresIn: '45m',
    });

    return token;
};

export default {};
