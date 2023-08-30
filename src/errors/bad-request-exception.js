import HttpException from './http-exception';

export default class BadRequestException extends HttpException {

    constructor(errorCode) {
        super(400, errorCode);
    }

}
