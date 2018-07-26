import express from 'express';
import { expect, request, use } from 'chai';
import { nem } from '@neoskop/nem';
import { TestModule } from './test.module';
import { getConnection, getConnectionManager } from 'typeorm';

use(require('chai-http'));

describe('tags', () => {
    let app : express.Application;
    let id : string;
    
    beforeEach(async () => {
        app = express();
        await nem().bootstrap(TestModule, { app });
    
        const res = await request(app)
            .post('/?tags=foo,bar')
            .set('Content-Type', 'text/plain')
            .send(new Buffer('abcdefg'));
        
        id = res.text;
    });
    
    afterEach(() => {
        getConnection('default').close();
        (getConnectionManager() as any).connections.length = 0;
    });
    
    describe('GET /:id/tags', () => {
        it('should return tags', async () => {
            const res = await request(app)
                .get(`/${id}/tags`);
    
            expect(res).to.have.status(200);
            expect(res).to.have.header('Content-Type', 'application/json; charset=utf-8');
            expect(res.body).to.be.eql([ 'foo', 'bar' ]);
        });
        
        it('should thrown on unknwon id', async () => {
            const res = await request(app)
                .get(`/00000000-0000-0000-0000-000000000000/tags`);

            expect(res).to.have.status(404);
        });
    });
    
    describe('PUT /:id/tags', () => {
        it('should update tags', async () => {
            const res = await request(app)
                .put(`/${id}/tags`)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify([ 'foobar', 'baz' ]));
    
            expect(res).to.have.status(200);
            
            const res2 = await request(app)
                .get(`/${id}/tags`);
    
            expect(res2.body).to.be.eql([ 'foobar', 'baz' ]);
        });
        
        it('should throw on invalid json', async () => {
            const res = await request(app)
                .put(`/${id}/tags`)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({}));

            expect(res).to.have.status(400);
        });
        
        it('should thrown on unknown id', async () => {
            const res = await request(app)
                .put(`/00000000-0000-0000-0000-000000000000/tags`)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify([ 'foobar', 'baz' ]));

            expect(res).to.have.status(404);
        });
    });
});
