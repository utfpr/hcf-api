import chai, { expect } from 'chai';

export default app => (email, senha) => new Promise((resolve, reject) => {
    chai.request(app)
        .post('/api/login')
        .send({ email, senha })
        .then(response => {
            expect(response)
                .to.have.status(200);

            const { token } = response.body;
            resolve(token);
        })
        .catch(reject);
});
