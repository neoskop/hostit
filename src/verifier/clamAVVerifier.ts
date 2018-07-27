import { IVerifier, UPLOAD_VERIFY } from '../tokens';
import { Request, Response } from 'express';
import execa from 'execa';
import which from 'which';
import { NemModule, NotAcceptableError } from '@neoskop/nem';
import { Inject, Injectable, InjectionToken } from '@angular/core';

const debug = require('debug')('hostit:verifier:clamav');

export const CLAMAV_SCAN_COMMAND = new InjectionToken<'clamdscan'|'clamscan'>('ClamAV Command');

@Injectable()
export class ClamAVVerifier implements IVerifier {
    protected readonly binary : string|null;
    constructor(@Inject(CLAMAV_SCAN_COMMAND) scanCommand : 'clamdscan'|'clamscan') {
        this.binary = which.sync(scanCommand, { nothrow: true });
        /* istanbul ignore else */
        if(this.binary) {
            debug('scan command:', this.binary);
        } else {
            debug('scan command no available:', scanCommand);
        }
    }
    
    async verify(_req : Request, _res : Response, buffer : Buffer) : Promise<void> {
        if(!(buffer instanceof Buffer) || !this.binary) {
            return;
        }
        debug('start verifying', buffer.length);
        const start = Date.now();
        try {
            await execa(this.binary, [ '-', '--no-summary' ], { input: buffer });
        } catch(err) {
            debug(err.stdout);
            /* istanbul ignore else */
            if(err.stdout && err.stdout.match(/FOUND/)) {
                throw new NotAcceptableError();
            }
            /* istanbul ignore next */
            throw err;
        } finally {
            debug(`verifier in ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
        }
    }
}

@NemModule({
    providers: [
        ClamAVVerifier,
        { provide: CLAMAV_SCAN_COMMAND, useValue: 'clamdscan' },
        { provide: UPLOAD_VERIFY, useExisting: ClamAVVerifier, multi: true }
    ]
})
export class ClamAVModule {

}
