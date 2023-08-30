import HttpException from './http-exception';

export default class PreconditionFailedException extends HttpException {

    constructor(errorCode) {
        super(412, errorCode);
    }

}
