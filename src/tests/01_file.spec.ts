import express from 'express';
import { expect, request, use } from 'chai';
import { nem, NemBootstrappedModule } from '@neoskop/nem';
import { TestModule } from './test.module';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { FileEntity } from '../entities/file.entity';
import { getConnection, getConnectionManager } from 'typeorm';

use(require('chai-http'));

describe('file', () => {
    let app : express.Application;
    let module : NemBootstrappedModule;
    
    beforeEach(async () => {
        app = express();
        module = await nem().bootstrap(TestModule, { app });
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
        
        it('should refuse invalid content-type', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'application/gzip')
                .send(new Buffer('abcdefg'));
            
            expect(res).to.have.status(415);
        });
        
        it('should refuse too big requests', async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/plain')
                .send(new Buffer('ab'.repeat(513)));
            
            expect(res).to.have.status(413);
        });
    });
    
    describe('GET /:id', () => {
        let id : string;
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/json')
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
        
        it('should thrown on unknwon id', async () => {
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
                .send(JSON.stringify({ foo: 'bar' }));
            
            id = res.text;
        });
        
        it('should update file', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'text/json')
                .send(JSON.stringify({ foobar: 'baz' }));
    
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}`);
    
            expect(JSON.parse(res2.text)).to.be.eql({ foobar: 'baz' });
            expect(res2).to.have.header('Content-Length', '16');
        });
        
        it('should throw on different content-type', async () => {
            const res = await request(app)
                .put(`/${id}`)
                .set('Content-Type', 'application/pdf')
                .send('abc');

            expect(res).to.have.status(415);
        });
        
        it('should thrown on unknwon id', async () => {
            const res = await request(app)
                .put(`/00000000-0000-0000-0000-000000000000`)
                .set('Content-Type', 'application/pdf')
                .send('abc');

            expect(res).to.have.status(404);
        });
    });
    
    describe('DELETE /:id', () => {
        let id : string;
        beforeEach(async () => {
            const res = await request(app)
                .post('/')
                .set('Content-Type', 'text/json')
                .send(JSON.stringify({ foo: 'bar' }));
            
            id = res.text;
        });
        
        it('should delete file', async () => {
            const res = await request(app)
                .del(`/${id}`);
    
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}`);
    
            expect(res2).to.have.status(404);
        });
        
        it('should thrown on unknown id', async () => {
            const res = await request(app)
                .del(`/00000000-0000-0000-0000-000000000000`);

            expect(res).to.have.status(404);
        });
    });
    
    it('should throw on verifier exception', async () => {
        const res = await request(app)
            .post('/')
            .set('Content-Type', 'text/plain')
            .send('invalid');
    
        expect(res).to.have.status(400);
    })
});
