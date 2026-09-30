import HttpException from './http-exception';

export default class BadRequestException extends HttpException {

    constructor(errorCode, message = 'Invalid request') {
        super(400, errorCode, message);
    }

}
