function associate() {

}

export default (Sequelize, DataTypes) => {

    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        tipo: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    };

    const Model = Sequelize.define('tipos_usuarios', attributes);

    Model.associate = associate;

    return Model;
};
