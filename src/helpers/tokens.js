import jwt from 'jsonwebtoken';
import { env } from '../config/server';
import { secret, expires } from '../config/security';

export const geraTokenUsuario = json => {
    const token = jwt.sign(json, secret, {
        expiresIn: expires,
    });

    return token;
};

export const decodificaTokenUsuario = token => jwt.verify(token, secret, {
    ignoreExpiration: env === 'development',
});

export const constroiPayloadUsuario = usuario => {
    const {
        id,
        nome,
        email,
        tipo_usuario_id: tipoUsuarioId,
    } = usuario;

    return {
        id,
        nome,
        email,
        tipo_usuario_id: tipoUsuarioId,
    };
};

export default {};
