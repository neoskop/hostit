import {
    APP, BadRequestError,
    BOOTSTRAP_LISTENER_BEFORE,
    ERROR_HANDLER,
    HttpError,
    NemModule,
    NemModuleWithProviders
} from '@neoskop/nem';
import bodyParser from 'body-parser';
import { Application, NextFunction, Request, Response } from 'express'
import { Optional, Type } from '@angular/core';
import { provideEntity, TypeormModule } from '@neoskop/nem-typeorm';
import { FileEntity } from './entities/file.entity';
import { FileTagEntity } from './entities/file-tag.entity';
import { FileController } from './controller/file.controller';
import { ValidateUpload } from './middlewares/validate-upload.middleware';
import { UPLOAD_ACCPTED_TYPES, UPLOAD_LIMIT, UPLOAD_VERIFY, IVerifier } from './tokens';
import { defaultErrorHandler } from '@neoskop/nem/lib/errors/error-handler';
import { TagController } from './controller/tag.controller';
import { InfoController } from './controller/info.controller';
import { MetaController } from './controller/meta.controller';

const debug = require('debug')('hostit');

export interface HostitConfiguration {
    /**
     * Upload limit in byte or a string readable by the bytes module, default to `'5mb'`
     */
    limit? : number | string;
    
    /**
     * MIME types to accepts, default to `['*\/*']`
     */
    acceptedTypes? : string[]
    
    /**
     * Functions to verify the file upload
     */
    verifier? : Type<IVerifier>[];
}

@NemModule({
    modules    : [
        TypeormModule
    ],
    middlewares: [
        bodyParser.json({ strict: true })
    ],
    providers  : [
        {
            provide: BOOTSTRAP_LISTENER_BEFORE,
            useFactory(app : Application, limit : number | string, type : string[], verifier? : IVerifier[]) {
                return () => {
                    app.use(bodyParser.raw({
                        limit,
                        type
                    }));
                    
                    if(verifier) {
                        app.use(async (req : Request, res : Response, next : NextFunction) => {
                            try {
                                for(const v of verifier) {
                                    await v.verify(req, res, req.body);
                                }
                                next();
                            } catch(e) {
                                next(e);
                            }
                        })
                    }
                };
            },
            deps   : [ APP, UPLOAD_LIMIT, UPLOAD_ACCPTED_TYPES, [ new Optional(), UPLOAD_VERIFY ] ],
            multi  : true
        },
        provideEntity(FileEntity),
        provideEntity(FileTagEntity),
        ValidateUpload,
        {
            provide : ERROR_HANDLER,
            useValue: (error : any, request : Request, response : Response, next : NextFunction) => {
                if(error.type === 'entity.too.large') {
                    error = new HttpError(413, error.message);
                } else if(error.type === 'entity.parse.failed') {
                    error = new BadRequestError(error.message);
                }
                debug(request.method, request.path, error);
                defaultErrorHandler(error, request, response, next);
            }
        }
    ],
    controller : [
        [ '/', FileController ],
        [ '/', TagController ],
        [ '/', InfoController ],
        [ '/', MetaController ]
    ]
    
})
export class HostitModule {
    static forConfiguration({ limit = '5mb', acceptedTypes = [ '*/*' ], verifier } : HostitConfiguration = {}) : NemModuleWithProviders {
        return {
            nemModule: HostitModule,
            providers: [
                { provide: UPLOAD_LIMIT, useValue: limit },
                { provide: UPLOAD_ACCPTED_TYPES, useValue: acceptedTypes },
                ...(verifier ? verifier.map(v => ({ provide: UPLOAD_VERIFY, useClass: v, multi: true })) : [])
            ]
        }
    }
}
