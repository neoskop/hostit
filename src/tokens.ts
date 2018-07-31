import { InjectionToken } from '@angular/core';
import { Request, Response } from 'express';

export interface IVerifier {
    readonly PREUPLOAD? : boolean;
    verify(req : Request, res : Response, buffer : Buffer): void|Promise<void>;
}

export interface IConfiguration {
    httpd: {
        port: number;
        ip: string;
    };
    db: {
        type: 'mysql'|'mariadb'|'sqlite',
        database: string;
        port: number;
        host: string;
        username?: string;
        password?: string;
    };
    verifier: string[];
    secret?: string;
}

export const UPLOAD_LIMIT = new InjectionToken<number|string>('Upload Limit');
export const UPLOAD_ACCPTED_TYPES = new InjectionToken<string[]>('Upload Accepted Types');
export const UPLOAD_VERIFY = new InjectionToken<IVerifier[]>('Upload Verify');
export const CONFIG = new InjectionToken<IConfiguration>('Convict config');
