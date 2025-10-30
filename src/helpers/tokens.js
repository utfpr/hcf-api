import jwt from 'jsonwebtoken';

import { secret, expires } from '../config/security';
import UnauthorizedException from '../errors/unauthorized-exception';

export const geraTokenUsuario = json => {
    const token = jwt.sign(json, secret, {
        expiresIn: expires,
    });

    return token;
};
export const decodificaTokenUsuario = token => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw err;
        }
        throw new UnauthorizedException(401);
    }
};

export const constroiPayloadUsuario = usuario => {
    const { id, nome, email, tipo_usuario_id: tipoUsuarioId } = usuario;

    return {
        id,
        nome,
        email,
        tipo_usuario_id: tipoUsuarioId,
    };
};

export default {};
