export default (Sequelize, DataTypes) => {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        complementares: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    };

    const options = {
        defaultScope: {
            attributes: { exclude: ['created_at', 'updated_at'] },
        },
        timestamps: true,
        underscored: true,
    };

    const ColetorComplementar = Sequelize.define('ColetorComplementar', attributes, options);

    ColetorComplementar.associate = models => {
        const { Tombo } = models;

        ColetorComplementar.hasMany(Tombo, {
            foreignKey: 'coletor_complementar_id',
        });
    };

    return ColetorComplementar;
};
