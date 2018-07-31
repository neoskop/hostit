import { CONFIG, IConfiguration, IVerifier, UPLOAD_VERIFY } from '../tokens';
import { Request, Response } from 'express';
import {
    AbstractParam,
    Annotator,
    ForbiddenError,
    NemModule,
    NemModuleWithProviders,
    UnauthorizedError
} from '@neoskop/nem';
import { Injectable, InjectionToken, Optional } from '@angular/core';
import { TokenManager } from '../token-manager';
import { IToken } from '../token-manager';

const debug = require('debug')('hostit:verifier:token');

export const TOKEN_SECRET = new InjectionToken<string|undefined>('Token Secret');


declare module 'express' {
    export interface Request {
        token? : IToken;
    }
}

export interface TokenDecorator {
    () : any;
    new () : Token
}

export interface Token extends AbstractParam<Token> {

}

export const Token : TokenDecorator = Annotator.makeParamDecorator('Token', () => ({
    resolve: (_options : Token, req : Request) => req.token
}), AbstractParam);

@Injectable()
export class TokenVerifier implements IVerifier {
    readonly PREUPLOAD = true;
    
    constructor(protected readonly tokenManager? : TokenManager) {
        /* istanbul ignore if */
        if(!this.tokenManager) {
            console.warn('no TokenManager configured, all access allowed');
        }
    }
    
    async verify(req : Request, _res : Response) : Promise<void> {
        /* istanbul ignore if */
        if(!this.tokenManager) {
            return;
        }
        
        if([ 'POST', 'PUT', 'DELETE' ].includes(req.method)) {
            let token : string | undefined;
            if(req.header('authorization') && req.header('authorization')!.startsWith('Bearer ')) {
                token = req.header('authorization')!.substr(7);
            } else if(req.query.token) {
                token = req.query.token;
            }
            
            debug('verify', token);
            
            if(!token) {
                throw new UnauthorizedError();
            }
            
            const data = this.tokenManager.verify(token);
            
            debug('data', data);
            
            if(null == data) {
                debug('forbidden');
                throw new ForbiddenError();
            }
            
            req.token = data;
            
            if('PUT' === req.method) {
                if(data.adm) return;
                if(data.put && req.path.includes(data.put)) return;
    
                throw new ForbiddenError();
            }
            
            if('DELETE' === req.method) {
                if(data.adm) return;
                if(data.del && req.path.includes(data.del)) return;
    
                throw new ForbiddenError();
            }
        }
    }
}

@NemModule({
    providers: [
        TokenVerifier,
        {
            provide: TOKEN_SECRET,
            useFactory: /* istanbul ignore next */(config? : IConfiguration) => {
                return config && config.secret
            },
            deps   : [ [ new Optional(), CONFIG ] ]
        },
        { provide: UPLOAD_VERIFY, useExisting: TokenVerifier, multi: true },
        {
            provide: TokenManager,
            useFactory(secret? : string) {
                return secret && new TokenManager(secret);
            },
            deps   : [ TOKEN_SECRET ]
        }
    ]
})
export class TokenModule {
    static withSecret(secret : string) : NemModuleWithProviders {
        return {
            nemModule: TokenModule,
            providers: [
                { provide: TOKEN_SECRET, useValue: secret }
            ]
        }
    }
}
