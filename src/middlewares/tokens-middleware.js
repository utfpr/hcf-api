// @ts-nocheck

import ForbiddenException from '../errors/forbidden-exception';
import { decodificaTokenUsuario } from '../helpers/tokens';

export const TIPOS_USUARIOS = {
    CURADOR: 1,
    OPERADOR: 2,
    IDENTIFICADOR: 3,
};

export default (tipoUsuarioPermitido = []) =>
    (request, response, next) => {
        // Extract token from Authorization header
        const authHeader = request.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        try {
            if (!token || typeof token !== 'string') {
                throw new ForbiddenException(101);
            }

            const usuario = decodificaTokenUsuario(token);

            const estaPermitido = !Array.isArray(tipoUsuarioPermitido) || tipoUsuarioPermitido.length < 1 || tipoUsuarioPermitido.includes(usuario.tipo_usuario_id);

            if (!estaPermitido) {
                throw new ForbiddenException(102);
            }

            request.usuario = usuario;
            next();
        } catch (err) {
            next(err);
        }
    };
