function associate(modelos) {
}

export const defaultScope = {
    attributes: {
        exclude: [
            'ativo',
            'created_at',
            'updated_at',
        ],
    },
};

export default (Sequelize, DataTypes) => {

    const attributes = {
        retirada_exsiccata_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        tombo_hcf: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        data_vencimento: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        tipo: {
            type: DataTypes.ENUM('DOACAO', 'EMPRESTIMO', 'PERMUTA'),
            allowNull: false,
        },
        devolvido: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('retirada_exsiccata_tombos', attributes, options);

    Model.associate = associate;

    return Model;
};
