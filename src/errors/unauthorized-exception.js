import HttpException from './http-exception';

export default class UnauthorizedException extends HttpException {

    constructor(errorCode, usuario) {
        super(401, errorCode);
        this.usuario = usuario;
    }

}
