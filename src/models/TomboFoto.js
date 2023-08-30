function associate(modelos) {
    const {
        Tombo,
        TomboFoto,
    } = modelos;

    TomboFoto.belongsTo(Tombo, {
        foreignKey: 'tombo_hcf',
    });
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
        tombo_hcf: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        codigo_barra: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        num_barra: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        caminho_foto: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        em_vivo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('tombos_fotos', attributes, options);

    Model.associate = associate;

    return Model;
};
