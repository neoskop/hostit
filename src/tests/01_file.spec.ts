import express from 'express';
import { expect, request, use } from 'chai';
import { nem, NemBootstrappedModule } from '@neoskop/nem';
import { TestModule } from './test.module';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { FileEntity } from '../entities/file.entity';
import { getConnection, getConnectionManager } from 'typeorm';
import { TokenManager } from '../token-manager';

use(require('chai-http'));

export const ISO_DATE = /(\d{4}-[01]\d-[0-3]\d(?:T| )[0-2]\d:[0-5]\d:[0-5]\d\.?\d*)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/;

describe('file', () => {
    let app : express.Application;
    let module : NemBootstrappedModule;
    let manager : TokenManager;
    
    beforeEach(async () => {
        app = express();
        module = await nem().bootstrap(TestModule, { app });
        manager = new TokenManager('123456');
    });
    
    afterEach(() => {
        getConnection('default').close();
        (getConnectionManager() as any).connections.length = 0;
    });
    
    describe('POST /', () => {
        it('should create file and return uuid', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(200);
            expect(res.text).to.match(/^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/);
            
            const repo = await module.injector.get(ConnectionProxy).getRepository(FileEntity);
            
            const file = await repo.findOne(res.text);
            expect(file).not.to.be.null;
            expect(file.id).to.be.equal(res.text);
            expect(file.size).to.be.equal(7);
            expect(file.type).to.be.equal('text/plain');
            expect(file.info).to.be.null;
            expect(file.tags).to.be.an('array').with.length(0);
        });
        
        it('should create file with tags', async () => {
            const res = await request(app)
                .post('/?tags=foo,bar')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(200);
            expect(res.text).to.match(/^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/);
            
            const repo = await module.injector.get(ConnectionProxy).getRepository(FileEntity);
            
            const file = await repo.findOne(res.text);
            expect(file).not.to.be.null;
            expect(file.id).to.be.equal(res.text);
            expect(file.size).to.be.equal(7);
            expect(file.type).to.be.equal('text/plain');
            expect(file.info).to.be.null;
            expect(file.tags).to.be.an('array').with.length(2);
            expect(file.tags[ 0 ].tag).to.be.equal('foo');
            expect(file.tags[ 1 ].tag).to.be.equal('bar');
        });
    
        it('should accept token as query param', async () => {
            const res = await request(app)
                .post('/?token=' + manager.create())
                .set('Content-Type', 'text/plain')
                .send(new Buffer('abcdefg'));
        
            expect(res).to.have.status(200);
        });
        
        it('should refuse on missing token', async () => {
            const res = await request(app)
                .post('/?tags=foo,bar')
                .set('Content-Type', 'text/plain')
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(401);
        });
        
        it('should refuse on invalid token', async () => {
            const res = await request(app)
                .post('/?tags=foo,bar')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer abcdefdg`)
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(403);
        });
        
        it('should refuse invalid content-type', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'application/gzip')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(415);
        });
        
        it('should refuse too big requests', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('ab'.repeat(513)));
            
            expect(res).to.have.status(413);
        });
        
        it('should refuse suspect files', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
    
            expect(res).to.have.status(406);
        });
    });
    
    describe('GET /:id', () => {
        let id : string;
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(JSON.stringify({ foo: 'bar' }));
            
            id = res.text;
        });
        
        it('should return file', async () => {
            const res = await request(app)
                .get(`/${id}`);
    
            expect(res).to.have.status(200);
            expect(res).to.have.header('Content-Type', 'text/json; charset=utf-8');
            expect(JSON.parse(res.text)).to.be.eql({ foo: 'bar' });
        });
        
        it('should thrown on unknown id', async () => {
            const res = await request(app)
                .get(`/00000000-0000-0000-0000-000000000000`);

            expect(res).to.have.status(404);
        });
    });
    
    describe('PUT /:id', () => {
        let id : string;
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send(JSON.stringify({ foo: 'bar' }));
            
            id = res.text;
        });
        
        it('should update file', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
    
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}`);
    
            expect(JSON.parse(res2.text)).to.be.eql({ foobar: 'baz' });
            expect(res2).to.have.header('Content-Length', '16');
        });
    
        it('should refuse on missing token', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/json')
                .send(JSON.stringify({ foobar: 'baz' }));
        
            expect(res).to.have.status(401);
        });
    
        it('should refuse on invalid token', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer abcdefdg`)
                .send(new Buffer('abcdefg'));
        
            expect(res).to.have.status(403);
        });
    
        it('should refuse on missing rights in token', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(new Buffer('abcdefg'));
        
            expect(res).to.have.status(403);
        });
        
        it('should update file with adm token', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create({ adm: true })}`)
                .send(JSON.stringify({ foobar: 'baz' }));
        
            expect(res).to.have.status(200);
        });
        
        it('should refuse on different content-type', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'application/pdf')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send('abc');

            expect(res).to.have.status(415);
        });
        
        it('should refuse on unknown id', async () => {
            const res = await request(app)
                .put(`/00000000-0000-0000-0000-000000000000`)
                .set('Content-Type', 'application/pdf')
                .set('Authorization', `Bearer ${manager.create({ put: '00000000-0000-0000-0000-000000000000' })}`)
                .send('abc');

            expect(res).to.have.status(404);
        });
    
        it('should refuse suspect files', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create({ put: id })}`)
                .send('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
        
            expect(res).to.have.status(406);
        });
    });
    
    describe('DELETE /:id', () => {
        let id : string;
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/json')
                .set('Authorization', `Bearer ${manager.create()}`)
                .send(JSON.stringify({ foo: 'bar' }));
            
            id = res.text;
        });
        
        it('should delete file', async () => {
            const res = await request(app)
                .del(`/${id}`)
                .set('Authorization', `Bearer ${manager.create({ del: id })}`);
    
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}`);
    
            expect(res2).to.have.status(404);
        });
        
        it('should refuse on unknown id', async () => {
            const res = await request(app)
                .del(`/00000000-0000-0000-0000-000000000000`)
                .set('Authorization', `Bearer ${manager.create({ del: '00000000-0000-0000-0000-000000000000' })}`);

            expect(res).to.have.status(404);
        });
        
        it('should refuse on invalid token', async () => {
            const res = await request(app)
                .del(`/${id}`)
                .set('Authorization', `Bearer abcdefdg`);
        
            expect(res).to.have.status(403);
        });
    
        it('should refuse on missing rights in token', async () => {
            const res = await request(app)
                .del(`/${id}`)
                .set('Authorization', `Bearer ${manager.create()}`);
        
            expect(res).to.have.status(403);
        });
    
        it('should delete file with adm token', async () => {
            const res = await request(app)
                .del(`/${id}`)
                .set('Authorization', `Bearer ${manager.create({ adm: true })}`);
        
            expect(res).to.have.status(200);
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
        
        it('should set meta/counter on create', async () => {
            const repo = await module.injector.get(ConnectionProxy).getRepository(FileEntity);
    
            const file = await repo.findOne(id);
            expect(file.creator).to.be.equal('urn:hostit');
            expect(file.editor).to.be.null;
            expect(file.created).to.match(ISO_DATE);
            expect(file.updated).to.be.null;
            expect(file.updates).to.be.equal(0);
            expect(file.views).to.be.equal(0);
        });
        
        it('should update editor meta/counter', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/plain')
                .set('Authorization', `Bearer ${manager.create({ put: id }, { issuer: 'urn:hostit-test' })}`)
                .send('foobar');
            
            expect(res).to.have.status(200);
    
            const repo = await module.injector.get(ConnectionProxy).getRepository(FileEntity);
    
            const file = await repo.findOne(id);
            expect(file.creator).to.be.equal('urn:hostit');
            expect(file.editor).to.be.equal('urn:hostit-test');
            expect(file.created).to.match(ISO_DATE);
            expect(file.updated).to.match(ISO_DATE);
            expect(file.updates).to.be.equal(1);
            expect(file.views).to.be.equal(0);
        });
        
        it('should update views counter', async () => {
            const res = await request(app)
                .get(`/${id}`);
            
            expect(res).to.have.status(200);
    
            const repo = await module.injector.get(ConnectionProxy).getRepository(FileEntity);
    
            const file = await repo.findOne(id);
            expect(file.creator).to.be.equal('urn:hostit');
            expect(file.editor).to.be.null;
            expect(file.created).to.match(ISO_DATE);
            expect(file.updated).to.be.null;
            expect(file.updates).to.be.equal(0);
            expect(file.views).to.be.equal(1);
        });
    })
});
