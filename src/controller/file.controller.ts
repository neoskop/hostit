import {
    Body,
    ContentType,
    Controller,
    Delete,
    Get,
    Header,
    OnUndefined,
    Param,
    Post,
    Put,
    QueryParam,
    Raw,
    Req,
    Result,
    Text,
    UnsupportedMediaTypeError,
    Use
} from '@neoskop/nem';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { Request } from 'express';
import { FileEntity } from '../entities/file.entity';
import { ValidateUpload } from '../middlewares/validate-upload.middleware';

const debug = require('debug')('hostit:controller:file');

@Controller()
export class FileController {
    
    
    constructor(protected readonly connection : ConnectionProxy) {
    }
    
    @Post('/')
    @ContentType('text/plain')
    @Use(ValidateUpload)
    @Text()
    async create(@Req() req : Request,
                 @Body() content : Buffer,
                 @QueryParam('tags', { parse: (val?: string) => val && val.split(/\s*,\s*/) }) tags? : string[]) {
        const type = req.header('content-type')!;
        const size = content.length;
        
        debug('create', { type, size, tags });
        
        const repo = await this.connection.getRepository(FileEntity);
        
        const res = await repo.save<FileEntity>({
            type,
            size,
            content,
            tags: tags && tags.map(tag => ({ tag }))
        });
    
        debug('created', res.id);
        
        return res.id!;
    }
    
    @Get('/:id')
    @OnUndefined(404)
    @Raw()
    async read(@Param('id') id : string) {
        const repo = await this.connection.getRepository(FileEntity);
        
        debug('read', id);
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        return Result([
            new ContentType(file.type),
            new Header('Content-Length', file.size.toString())
        ], file.content);
    }
    
    @Put('/:id')
    @OnUndefined(404)
    @ContentType('text/plain')
    @Text()
    async update(@Req() req : Request,
                 @Param('id') id : string,
                 @Body() content : Buffer,) {
        const type = req.header('content-type')!;
        const size = content.length;
        const repo = await this.connection.getRepository(FileEntity);
    
        debug('update', { id, type, size });
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        if(file.type !== type) {
            throw new UnsupportedMediaTypeError(`Invalid Content-Type "${req.header('content-type')}"`)
        }
        
        file.content = content;
        file.size = size;
        
        await repo.save(file);
        
        debug('updated', file.id);
        
        return file.id!;
    }
    
    @Delete('/:id')
    @OnUndefined(404)
    @ContentType('text/plain')
    @Text()
    async delete(@Param('id') id : string) {
        debug('delete', id);
        
        const repo = await this.connection.getRepository(FileEntity);
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        await repo.remove(file);
    
        debug('deleted', file.id);
        
        return 'deleted';
    }
}
