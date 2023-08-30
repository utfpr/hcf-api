import '../setup';
import chai, { expect } from 'chai';
import app from '../../src/app';
// import login from '../login';

jest.setTimeout(15000);

let request;

beforeEach(() => {
    request = chai.request(app);
});

describe('USUÁRIO', () => {

    test('Deveria fazer login e retornar o token corretamente.', done => {
        request.post('/api/login')
            .send({
                email: 'e.nani92@gmail.com',
                senha: '123456',
            })
            .then(response => {
                expect(response)
                    .to.has.status(200);

                const body = expect(response)
                    .to.has.property('body')
                    .that.is.a('object');

                body.to.have.property('token')
                    .that.is.a('string');
                body.to.have.property('usuario')
                    .that.is.a('object');

                return null;
            })
            .then(done)
            .catch(done);
    });

    test('Deveria retornar erro de credenciais inválidas ao fazer login com senha inválida.', done => {
        request.post('/api/login')
            .send({
                email: 'e.nani92@gmail.com',
                senha: '112233',
            })
            .then(response => {
                expect(response)
                    .to.has.status(400);

                expect(response)
                    .to.have.nested.property('body.error.code')
                    .that.is.a('number')
                    .and.equals(100);

                return null;
            })
            .then(done)
            .catch(done);
    });

    test('Deveria retornar erro de credenciais inválidas ao fazer login com e-mail inválido.', done => {
        request.post('/api/login')
            .send({
                email: 'edmundosan@gmail.com',
                senha: '123456',
            })
            .then(response => {
                expect(response)
                    .to.has.status(400);

                expect(response)
                    .to.have.nested.property('body.error.code')
                    .that.is.a('number')
                    .and.equals(100);

                return null;
            })
            .then(done)
            .catch(done);
    });

    // test('Cadastrar um usuário com todos os dados corretos.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundosalazarte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.CADASTRO_RETORNO)
    //         .then(({ body }) => {
    //             idCriado = body.id;
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário com um email ja cadastrado.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundosalazarte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.BAD_REQUEST)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário faltando o nome.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário faltando o email.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário faltando o tipo_usuario_id.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário faltando a senha.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Cadastrar um usuário faltando o herbario_id.', done => {
    //     request.post('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário com todos os dados corretos.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.CADASTRO_SEM_RETORNO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário com um email ja cadastrado.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'e.nani92@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.BAD_REQUEST)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário faltando o nome.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário faltando o email.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário faltando o tipo_usuario_id.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário faltando a senha.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             herbario_id: 1,
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Alterar um usuário faltando o herbario_id.', done => {
    //     request.put(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .send({
    //             nome: 'Edmundo Salazarte',
    //             email: 'edmundoasffrte@gmail.com',
    //             tipo_usuario_id: 1,
    //             ra: '998405',
    //             telefone: '+5544999322413',
    //             senha: '123456',
    //         })
    //         .expect(codigos.FALTANDO_DADO)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Listagem dos usuários ativos cadastrados.', done => {
    //     request.get('/usuarios')
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .expect(codigos.LISTAGEM)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Listagem do usuário cadastrado.', done => {
    //     request.get(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .expect(codigos.LISTAGEM)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Desativar um usuário que existe.', done => {
    //     request.delete(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .expect(codigos.DESATIVAR)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });

    // test('Desativar um usuário que não existe.', done => {
    //     request.delete(`/usuarios/${idCriado}`)
    //         .set('Content-Type', 'application/json')
    //         .set('token', tokenRoot)
    //         .expect(codigos.BAD_REQUEST)
    //         .then(({ body }) => {
    //             done();
    //         })
    //         .catch(done);
    // });
});
