import { Middleware, UnsupportedMediaTypeError } from '@neoskop/nem';
import { NextFunction, Request, Response } from 'express';
import { UPLOAD_ACCPTED_TYPES } from '../tokens';
import { Inject } from '@angular/core';
const debug = require('debug')('hostit:middlewares:validate-upload');

@Middleware()
export class ValidateUpload {
    protected readonly acceptedTypes : Set<string>;
    
    constructor(@Inject(UPLOAD_ACCPTED_TYPES) acceptedTypes : string[]) {
        this.acceptedTypes = new Set(acceptedTypes);
    }
    
    async use(request: Request, _response: Response, next: NextFunction) {
        const type = request.header('content-type')!;
        
        
        if(!this.acceptedTypes.has(type)) {
            debug(request.method, request.path, 'INVALID', type);
            return next(new UnsupportedMediaTypeError());
        }
        
        debug(request.method, request.path, 'VALID', type);
        
        next();
    };
}
