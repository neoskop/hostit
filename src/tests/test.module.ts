import { NemModule } from '@neoskop/nem';
import { HostitModule } from '../hostit.module';
import { TypeormModule } from '@neoskop/nem-typeorm';
import { ClamAVModule } from '../verifier';

@NemModule({
    modules: [
        TypeormModule.forConfiguration({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true
        }),
        HostitModule.forConfiguration({
            limit: '1kb',
            acceptedTypes: [ 'text/json', 'image/jpeg', 'application/pdf', 'text/plain' ]
        }),
        ClamAVModule
    ]
})
export class TestModule {

}
