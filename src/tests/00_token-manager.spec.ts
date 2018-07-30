import { expect } from 'chai';
import { TokenManager } from '../token-manager';
import jwt from 'jsonwebtoken';

describe('TokenManager', () => {
    let manager : TokenManager;
    
    beforeEach(() => {
        manager = new TokenManager('123456');
    });
    
    it('should create a token', () => {
        expect(manager.create()).to.be.a('string');
    });
    
    it('should verify a valid token', () => {
        const token = manager.create();
    
        const decoded = manager.verify(token);
        expect(decoded).to.be.an('object').with.keys('iat', 'exp', 'aud', 'iss');
    });
    
    it('should refuse token with invalid secret', () => {
        const token = new TokenManager('654321').create();
    
        const decoded = manager.verify(token);
        expect(decoded).to.be.null;
    });
    
    it('should refuse token with invalid audiance', () => {
        const token = jwt.sign({}, '123456', { expiresIn: '30m', audience: 'urn:foobar' });
    
        const decoded = manager.verify(token);
        expect(decoded).to.be.null;
    });
    
    it('should refuse expired token', () => {
        const token = manager.create({}, { ttl: '-1m' });
    
        const decoded = manager.verify(token);
        expect(decoded).to.be.null;
    });
});
