import { InjectionToken } from '@angular/core';
import { Request, Response } from 'express';

export interface IVerifier {
    verify(req : Request, res : Response, buffer : Buffer): void|Promise<void>;
}

export const UPLOAD_LIMIT = new InjectionToken<number|string>('Upload Limit');
export const UPLOAD_ACCPTED_TYPES = new InjectionToken<string[]>('Upload Accepted Types');
export const UPLOAD_VERIFY = new InjectionToken<IVerifier[]>('Upload Verify');
