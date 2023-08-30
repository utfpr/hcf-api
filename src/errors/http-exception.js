export default class HttpException extends Error {

    constructor(statusCode, errorCode, message = 'Invalid request') {
        super(message);
        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

}
