import { checkSchema, validationResult } from 'express-validator/check';
import UnprocessableEntityException from '../errors/unprocessable-entity-exception';


export default esquema => [
    checkSchema(esquema),
    (request, response, next) => {
        const result = validationResult(request);
        if (result.isEmpty()) {
            next();
            return;
        }

        const report = result
            .formatWith(e => e.msg)
            .mapped();

        next(new UnprocessableEntityException(report));
    },
];
