import { configure } from './cli/configure';
import { nem, NemModule } from '@neoskop/nem';
import { TypeormModule } from '@neoskop/nem-typeorm';
import { HostitModule } from './hostit.module';
import { __importDefault } from 'tslib';
import { CONFIG, IVerifier } from './tokens';
import { Type } from '@angular/core';

const debug = require('debug')('hostit:cli');

const config = configure({
    httpd: {
        port: {
            doc: 'Port to serve on',
            format: 'Number',
            default: 5717,
            arg: 'port',
            env: 'PORT'
        },
        ip: {
            doc: 'Address to listen on',
            format: 'ipaddress',
            default: '0.0.0.0',
            arg: 'ip',
            env: 'IP'
        }
    },
    db: {
        type: {
            doc: 'Database type',
            format: [ 'mysql', 'mariadb', 'sqlite' ],
            default: 'mysql' as 'mysql'
        },
        database: {
            doc: 'Database name or sqlite file',
            format: 'String',
            default: 'hostit'
        },
        port: {
            doc: 'Database port',
            format: 'port',
            default: 3306
        },
        host: {
            doc: 'Database host',
            format: 'String',
            default: '127.0.0.1'
        },
        username: {
            doc: 'Database username',
            format: '*',
            default: undefined
        },
        password: {
            doc: 'Database password',
            format: '*',
            default: undefined,
            sensitive: true
        }
    },
    verifier: {
        doc: 'Verifier',
        format: 'Array',
        default: [ './verifier#ClamAVModule', './verifier#TokenModule' ],
        arg: 'verifier'
    },
    secret: {
        doc: 'Secret Token',
        format: '*',
        default: undefined as undefined|string,
        arg: 'token',
        env: 'TOKEN'
    }
});

@NemModule({
    modules: [
        TypeormModule.forConfiguration({
            ...config.get('db'),
            synchronize: true
        }),
        HostitModule.forConfiguration(),
        ...config.get('verifier').map(loadVerifier)
    ],
    providers: [
        { provide: CONFIG, useValue: config.get() }
    ]
})
class CoreModule {

}

debug('config', config.toString());

nem().bootstrap(CoreModule).listen(config.get('httpd.port'), config.get('httpd.ip')).then(() => {
    console.log(`Server started on port ${config.get('httpd.port')}...`);
}, err => {
    console.error(err);
    process.exit(1);
});

function loadVerifier(verifier : string) : Type<IVerifier> {
    const index = verifier.indexOf('#');
    if(-1 == index) {
        return __importDefault(require(verifier)).default;
    }
    
    const mod = verifier.substr(0, index);
    const name = verifier.substr(index + 1);
    
    return require(mod)[name];
}
