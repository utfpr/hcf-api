import knex from 'knex';
import {
    database,
    username,
    password,
    options,
} from '../config/database';


const instance = knex({
    client: 'mysql2',
    connection: {
        port: options.port,
        host: options.host,
        user: username,
        password,
        database,
    },
});

export default instance;
