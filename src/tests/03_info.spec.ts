import express from 'express';
import { expect, request, use } from 'chai';
import { nem, NemBootstrappedModule } from '@neoskop/nem';
import { TestModule } from './test.module';
import { getConnection, getConnectionManager } from 'typeorm';
import { TokenManager } from '../token-manager';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { FileEntity } from '../entities/file.entity';
import { ISO_DATE } from './01_file.spec';

use(require('chai-http'));

describe('info', () => {
    let app : express.Application;
    let nemModule : NemBootstrappedModule;
    let id : string;
    let manager : TokenManager;
    
    beforeEach(async () => {
        app = express();
        nemModule = await nem().bootstrap(TestModule, { app });
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
    
    
    describe('meta/counter', () => {
        let id : string;
        
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('abcdefg'));
            
            id = res.text;
        });
        
        it('should update editor meta/counter', async () => {
            const res = await request(app)
                .put(`/${id}/info`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${manager.create({ put: id }, { issuer: 'urn:hostit-test' })}`)
                .send(JSON.stringify([ 'foobar' ]));
            
            expect(res).to.have.status(200);
            
            const repo = await nemModule.injector.get(ConnectionProxy).getRepository(FileEntity);
            
            const file = await repo.findOne(id);
            expect(file.creator).to.be.equal('urn:hostit');
            expect(file.editor).to.be.equal('urn:hostit-test');
            expect(file.created).to.match(ISO_DATE);
            expect(file.updated).to.match(ISO_DATE);
            expect(file.updates).to.be.equal(1);
            expect(file.views).to.be.equal(0);
        });
        
        it('should NOT update views counter', async () => {
            const res = await request(app)
                .get(`/${id}/info`);
            
            expect(res).to.have.status(200);
            
            const repo = await nemModule.injector.get(ConnectionProxy).getRepository(FileEntity);
            
            const file = await repo.findOne(id);
            expect(file.creator).to.be.equal('urn:hostit');
            expect(file.editor).to.be.null;
            expect(file.created).to.match(ISO_DATE);
            expect(file.updated).to.be.null;
            expect(file.updates).to.be.equal(0);
            expect(file.views).to.be.equal(0);
        });
    });
    
});
