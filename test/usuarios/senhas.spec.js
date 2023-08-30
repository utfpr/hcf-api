import { expect } from 'chai';
import { comparaSenha, gerarSenha } from '../../src/helpers/senhas';


const HASH_SENHA_123456 = '$2a$10$x0101wtzcpm81ArnUyM3LuUAFET12gKOqNcPD5qUn7Uj5NZ3xUQpm';

describe('comparaSenha', () => {

    it('deveria indicar senha correta', () => {
        const isCorrectPassword = comparaSenha('123456', HASH_SENHA_123456);
        expect(isCorrectPassword)
            .to.be.equal(true);
    });

    it('deveria indicar senha incorreta', () => {
        const isCorrentPassword = comparaSenha('654321', HASH_SENHA_123456);
        expect(isCorrentPassword)
            .to.be.equal(false);
    });
});

describe('gerarSenha', () => {

    it('deveria gerar uma senha', () => {
        const hash = gerarSenha('1234567890');
        expect(comparaSenha('1234567890', hash))
            .to.be.equal(true);
    });
});
