import HttpException from './http-exception';

export default class NotFoundException extends HttpException {

    constructor(errorCode) {
        super(404, errorCode);
    }

}
