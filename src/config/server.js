const {
    NODE_ENV,
    PORT,
} = process.env;

const environment = NODE_ENV || 'development';
const port = PORT || 3003;

export default { environment, port };
