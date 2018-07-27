import { Middleware, UnsupportedMediaTypeError } from '@neoskop/nem';
import { NextFunction, Request, Response } from 'express';
import { UPLOAD_ACCPTED_TYPES } from '../tokens';
import { Inject } from '@angular/core';
import typeis from 'type-is';
const debug = require('debug')('hostit:middlewares:validate-upload');

@Middleware()
export class ValidateUpload {
    constructor(@Inject(UPLOAD_ACCPTED_TYPES) protected readonly acceptedTypes : string[]) {
    }
    
    async use(request: Request, _response: Response, next: NextFunction) {
        const type = request.header('content-type')!;
        
        if(!typeis(request, this.acceptedTypes)) {
            debug(request.method, request.path, 'INVALID', type);
            return next(new UnsupportedMediaTypeError());
        }
        
        debug(request.method, request.path, 'VALID', type);
        
        next();
    };
}
