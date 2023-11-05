const { MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT } = process.env;

export const database = MYSQL_DATABASE;
export const username = MYSQL_USERNAME;
export const password = MYSQL_PASSWORD;

export const options = {
    dialect: 'mysql',
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT) || 3306,
    logging: false,

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
