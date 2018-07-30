import express from 'express';
import { expect, request, use } from 'chai';
import { nem } from '@neoskop/nem';
import { TestModule } from './test.module';
import { getConnection, getConnectionManager } from 'typeorm';
import { TokenManager } from '../token-manager';

use(require('chai-http'));

describe('info', () => {
    let app : express.Application;
    let id : string;
    let manager : TokenManager;
    
    beforeEach(async () => {
        app = express();
        await nem().bootstrap(TestModule, { app });
        manager = new TokenManager('123456');
    
        const res = await request(app)
            .post('/')
            .set('Content-Type', 'text/plain')
            .set('Authorization', `Bearer ${manager.create()}`)
            .send(new Buffer('abcdefg'));
        
        id = res.text;
    });
    
    afterEach(() => {
        getConnection('default').close();
        (getConnectionManager() as any).connections.length = 0;
    });
    
    describe('PUT /:id/info', () => {
        it('should update info', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
            
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}/info`);
            
            expect(res2.body).to.be.eql({ foobar: 'baz' });
        });
        
        it('should throw on invalid json', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send('abc');
            
            expect(res).to.have.status(400);
        });
        
        it('should thrown on unknwon id', async () => {
            const res = await request(app)
                .put(`/00000000-0000-0000-0000-000000000000/info`)
                .set('Content-Type', 'application/javascript')
                .set('Authorization', `Bearer ${manager.create({ put: '00000000-0000-0000-0000-000000000000' })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
            
            expect(res).to.have.status(404);
        });
    
        it('should refuse on invalid token', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer abcdefdg`)
                .send(JSON.stringify({ foobar: 'baz' }));
        
            expect(res).to.have.status(403);
        });
    
        it('should refuse on missing rights in token', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(JSON.stringify({ foobar: 'baz' }));
        
            expect(res).to.have.status(403);
        });
    
        it('should update file with adm token', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create({ adm: true })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
        
            expect(res).to.have.status(200);
        });
    });
    
    describe('GET /:id/info', () => {
        beforeEach(async () => {
            await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
        });
        
        it('should return info', async () => {
            const res = await request(app)
                .get(`/${id}/info`);
    
            expect(res).to.have.status(200);
            expect(res).to.have.header('Content-Type', 'application/json; charset=utf-8');
            expect(res.body).to.be.eql({ foobar: 'baz' });
        });
        
        it('should thrown on unknown id', async () => {
            const res = await request(app)
                .get(`/00000000-0000-0000-0000-000000000000/info`);

            expect(res).to.have.status(404);
        });
    });
    
});
