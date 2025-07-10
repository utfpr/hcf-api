import axios from 'axios';

import { recaptchaSecret } from '../config/security';
import BadRequestException from '../errors/bad-request-exception';

export default async function verifyRecaptcha(request) {
    const token = request.query.recaptchaToken;
    if (!token) {
        throw new BadRequestException(400, 'reCAPTCHA token ausente');
    }

    const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        { params: { secret: recaptchaSecret, response: token } }
    );
    const { data } = response;

    if (!data.success || (data.score !== undefined && data.score < 0.5)) {
        throw new BadRequestException(400, 'Falha na verificação do reCAPTCHA');
    }

    return true;
}
