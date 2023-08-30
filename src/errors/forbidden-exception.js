import HttpException from './http-exception';

export default class ForbiddenException extends HttpException {

    constructor(errorCode, usuario) {
        super(403, errorCode);
        this.usuario = usuario;
    }

}
