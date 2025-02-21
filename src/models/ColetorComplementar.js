// ColetorComplementar.js
export default (Sequelize, DataTypes) => {
    const attributes = {
        hcf: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'tombos',
                key: 'hcf',
            },
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

    const ColetorComplementar = Sequelize.define('coletores_complementares', attributes, options);

    ColetorComplementar.associate = models => {
        const { Tombo } = models;

        ColetorComplementar.belongsTo(Tombo, {
            foreignKey: 'hcf',
            targetKey: 'hcf',
            as: 'tombo',
        });
    };

    return ColetorComplementar;
};
