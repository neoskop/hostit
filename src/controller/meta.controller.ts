import { Get, JsonController, OnUndefined, Param } from '@neoskop/nem';
import { ConnectionProxy } from '@neoskop/nem-typeorm/lib';
import { FileEntity } from '../entities/file.entity';

const debug = require('debug')('hostit:controller:meta');

@JsonController()
export class MetaController {
    
    
    constructor(protected readonly connection : ConnectionProxy) {
    }
    
    @Get('/:id/meta')
    @OnUndefined(404)
    async ead(@Param('id') id : string) {
        const repo = await this.connection.getRepository(FileEntity);
        
        debug('read', id);
        
        const file = await repo.findOne(id);
        
        if(!file) {
            return;
        }
        
        return {
            creator: file.creator,
            editor: file.editor,
            created: file.created,
            updated: file.updated,
            updates: file.updates,
            views: file.views
        }
    }
    
}
