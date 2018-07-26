import { BadRequestError, NemModule } from '@neoskop/nem';
import { HostitModule } from '../hostit.module';
import { TypeormModule } from '@neoskop/nem-typeorm';

@NemModule({
    modules: [
        TypeormModule.forConfiguration({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true
        }),
        HostitModule.forConfiguration({
            limit: '1kb',
            acceptedTypes: [ 'text/json', 'image/jpeg', 'application/pdf', 'text/plain' ],
            verifier: [(_req : any, _res : any, body : Buffer) => {
                if('invalid' === body.toString()) {
                    throw new BadRequestError();
                }
            }]
        })
    ]
})
export class TestModule {

}
