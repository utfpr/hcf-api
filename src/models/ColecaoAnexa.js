function associate(modelos) {
}

export const defaultScope = {
    attributes: {
        exclude: [
            'created_at',
            'updated_at',
        ],
    },
};

export default (Sequelize, DataTypes) => {

    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tipo: {
            type: DataTypes.ENUM('CARPOTECA', 'XILOTECA', 'VIA LIQUIDA'),
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('colecoes_anexas', attributes, options);

    Model.associate = associate;

    return Model;
};
