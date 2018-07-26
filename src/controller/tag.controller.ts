import { BadRequestError, Body, Get, JsonController, OnUndefined, Param, Put } from '@neoskop/nem';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { FileEntity } from '../entities/file.entity';
import { FileTagEntity } from '../entities/file-tag.entity';

const debug = require('debug')('hostit:controller:tag');

@JsonController()
export class TagController {
    
    
    constructor(protected readonly connection : ConnectionProxy) {
    }
    
    @Get('/:id/tags')
    @OnUndefined(404)
    async ead(@Param('id') id : string) {
        const repo = await this.connection.getRepository(FileEntity);
        
        debug('read', id);
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        return file.tags && file.tags.map(({ tag }) => tag) || [];
    }
    
    @Put('/:id/tags')
    @OnUndefined(404)
    async update(@Param('id') id : string,
                 @Body() tags : string[]) {
        const repo = await this.connection.getRepository(FileEntity);
        const tagRepo = await this.connection.getRepository(FileTagEntity);
        
        debug('update', id, tags);
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        if(!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) {
            throw new BadRequestError();
        }
        
        await tagRepo.delete({ file });
        for(const tag of tags) {
            await tagRepo.save({ file, tag });
        }
        
        debug('updated', id, tags);
        
        return tags;
    }
}
