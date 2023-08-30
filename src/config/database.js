const {
    DB_NAME = 'hcf',
    DB_USER = 'hcf',
    DB_PASS = 'masterkey',
    DB_HOST = 'mysql995.umbler.com',
    DB_PORT = '41890',
} = process.env;


export const database = DB_NAME;
export const username = DB_USER;
export const password = DB_PASS;

export const options = {
    dialect: 'mysql',
    host: DB_HOST,
    port: parseInt(DB_PORT) || 41890,

    define: {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        paranoid: false,
    },

    operatorsAliases: false,
    dialectOptions: {
        charset: 'utf8mb4',
        multipleStatements: true,
    },

    pool: {
        max: 25,
        acquire: 180000,
    },
};
