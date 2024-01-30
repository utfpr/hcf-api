export class UserRegistrationDTO {

    ativo;
    id;
    email;
    nome;
    tipo_usuario_id;
    herbario_id;
    updated_at;
    created_at;

    constructor(userRegistration) {
        this.ativo = userRegistration.ativo;
        this.id = userRegistration.id;
        this.email = userRegistration.email;
        this.nome = userRegistration.nome;
        this.tipo_usuario_id = userRegistration.tipo_usuario_id;
        this.herbario_id = userRegistration.herbario_id;
        this.updated_at = userRegistration.updated_at;
        this.created_at = userRegistration.created_at;
    }

}

export default {};
