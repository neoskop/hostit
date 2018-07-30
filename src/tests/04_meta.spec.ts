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

describe('meta', () => {
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
    
    describe('GET /:id/meta', () => {
        
        it('should return meta', async () => {
            const res = await request(app)
                .get(`/${id}/meta`);
    
            expect(res).to.have.status(200);
            expect(res).to.have.header('Content-Type', 'application/json; charset=utf-8');
    
            const repo = await nemModule.injector.get(ConnectionProxy).getRepository(FileEntity);
            const file = await repo.findOne(id);
            
            expect(res.body.creator).to.be.equal(file.creator);
            expect(res.body.editor).to.be.equal(file.editor);
            expect(res.body.created).to.be.equal(file.created);
            expect(res.body.updated).to.be.equal(file.updated);
            expect(res.body.updates).to.be.equal(file.updates);
            expect(res.body.views).to.be.equal(file.views);
        });
        
        it('should thrown on unknown id', async () => {
            const res = await request(app)
                .get(`/00000000-0000-0000-0000-000000000000/meta`);

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
        
        it('should NOT update views counter', async () => {
            const res = await request(app)
                .get(`/${id}/meta`);
            
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
