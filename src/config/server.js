const {
    NODE_ENV,
    PORT,
} = process.env;

export const env = NODE_ENV || 'development';
export const port = PORT || 3003;
