const {
    PG_DATABASE, PG_USERNAME, PG_PASSWORD, PG_HOST, PG_PORT,
} = process.env;

export const database = PG_DATABASE;
export const username = PG_USERNAME;
export const password = PG_PASSWORD;

export const options = {
    dialect: 'postgres',
    host: PG_HOST,
    port: parseInt(PG_PORT) || 3306,
    logging: true,

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
