import HttpException from '../errors/http-exception';
import errors from '../resources/errors';

function handleHttpException(error, request, response) {
    const code = error.errorCode;
    const message = errors[code];
    const { report } = error;

    response.status(error.statusCode)
        .json({
            error: {
                code,
                message,
                report,
            },
        });
}


// eslint-disable-next-line
export default (error, request, response, next) => {
    console.error(error); // eslint-disable-line

    if (error instanceof HttpException) {
        handleHttpException(error, request, response);
        return;
    }

    response.status(500)
        .json({
            error: {
                code: 0,
                message: 'Internal Server Error',
            },
        });
};
