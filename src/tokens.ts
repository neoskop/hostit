import { InjectionToken } from '@angular/core';
import { Request, Response } from 'express';

export type VerifyFn = (req : Request, res : Response, buffer : Buffer) => void|Promise<void>;

export const UPLOAD_LIMIT = new InjectionToken<number|string>('Upload Limit');
export const UPLOAD_ACCPTED_TYPES = new InjectionToken<string[]>('Upload Accepted Types');
export const UPLOAD_VERIFY = new InjectionToken<VerifyFn[]>('Upload Verify');
