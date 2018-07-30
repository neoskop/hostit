import jwt from 'jsonwebtoken';
import { Injectable } from '@angular/core';
const debug = require('debug')('hostit:token-manager');

export interface IToken {
    iat: number;
    exp: number;
    aud: string;
    iss: string;
    put?: string; // Allow put requests
    del?: string; // Allow delete requests
    adm?: boolean; // Allow admin requests
}

@Injectable()
export class TokenManager {
    protected readonly ttl : string;
    protected readonly algorithm : string;
    protected readonly issuer : string;
    
    constructor(protected readonly secret : string,
                { ttl = '30m', algorithm = 'HS256', issuer = 'urn:hostit' } : { ttl?: string, algorithm?: string, issuer?: string } = {}) {
        this.ttl = ttl;
        this.algorithm = algorithm;
        this.issuer = issuer;
        debug('init', { secret, ttl, algorithm });
    }
    
    create({ put, del, adm } : { put?: string; del?: string; adm?: boolean } = {},
           { payload = {}, ttl = this.ttl, algorithm = this.algorithm, issuer = this.issuer } : { payload? : object, ttl?: string, algorithm?: string, issuer?: string } = {}) {
        debug('create', { put, del, adm }, { payload, ttl, algorithm });
        return jwt.sign({ put, del, adm, ...payload }, this.secret, { expiresIn: ttl, algorithm, audience: 'urn:hostit', issuer })
    }
    
    verify(token : string, { algorithms = [] } : { algorithms?: string[] } = {}) : IToken|null {
        algorithms = [ ... algorithms, this.algorithm ];
        debug('verify', { token, algorithms });
        try {
            return jwt.verify(token, this.secret, { algorithms, audience: 'urn:hostit' }) as IToken|null;
        } catch(e) {
            debug('verify exception', e);
            return null;
        }
    }
}
