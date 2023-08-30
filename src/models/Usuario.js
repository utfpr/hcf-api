function associate(modelos) {
    const {
        Usuario,
        TipoUsuario,
        Herbario,
        Tombo,
        Alteracao,
    } = modelos;

    Usuario.belongsToMany(Tombo, {
        through: Alteracao,
        foreignKey: 'usuario_id',
    });

    // Usuario.hasMany(Alteracao, {
    //     as: 'alteracoes',
    //     foreignKey: 'usuario_id',
    // });

    Usuario.belongsTo(Herbario, {
        foreignKey: 'herbario_id',
    });

    Usuario.belongsTo(TipoUsuario, {
        foreignKey: 'tipo_usuario_id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: [
            'senha',
            'ativo',
            'created_at',
            'updated_at',
            'tipo_usuario_id',
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
        nome: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        telefone: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ra: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        senha: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('usuarios', attributes, options);

    Model.associate = associate;

    return Model;
};
