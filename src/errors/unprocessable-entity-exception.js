import HttpException from './http-exception';

export default class UnprocessableEntityException extends HttpException {

    constructor(report) {
        super(422, 50);

        this.report = report;
    }

}
