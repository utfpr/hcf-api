import parser from 'body-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { assets, upload } from './config/directory';
import swaggerSpec from './config/swagger';
import errors from './middlewares/erros-middleware';
import { generatePreview, reportPreview } from './reports/controller';
import routes from './routes';

const app = express();

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for file uploads
}));

// // CORS configuration
// const corsOptions = {
//     origin(origin, callback) {
//         // Allow requests with no origin (mobile apps, curl, etc.)
//         if (!origin) return callback(null, true);

//         const allowedOrigins = [
//             'http://localhost:3000',
//             'http://localhost:3001',
//             'http://localhost:5173',
//             'https://hcf.cm.utfpr.edu.br',
//             'https://dev.hcf.cm.utfpr.edu.br',
//             'https://api.dev.hcf.cm.utfpr.edu.br',
//         ];

//         if (allowedOrigins.includes(origin)) {
//             return callback(null, true);
//         }
//         return callback(new Error('Not allowed by CORS'));

//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// };
// app.use(cors(corsOptions));

app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 100 requests per windowMs
    message: {
        error: {
            code: 429,
            message: 'Muitas requisições. Tente novamente em 15 minutos.',
        },
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(parser.json());
app.use(morgan('dev'));

app.use('/fotos', express.static(upload));
app.use('/assets', express.static(assets));

app.get('/reports/:fileName', reportPreview);
app.post('/reports/:fileName', generatePreview);

app.use(
    '/uploads',
    express.static(upload, {
        index: false,
        redirect: false,
        setHeaders: res => {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
    })
);

app.use('/api', routes);

app.use(errors);

export default app;
