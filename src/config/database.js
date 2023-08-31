const {
    DB_NAME,
    DB_USER,
    DB_PASS,
    DB_HOST,
    DB_PORT,
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
