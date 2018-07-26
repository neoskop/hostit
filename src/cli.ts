import { configure } from './cli/configure';
import { nem, NemModule } from '@neoskop/nem';
import { TypeormModule } from '@neoskop/nem-typeorm';
import { HostitModule } from './hostit.module';
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
    }
});

@NemModule({
    modules: [
        TypeormModule.forConfiguration({
            ...config.get('db'),
            synchronize: true
        }),
        HostitModule.forConfiguration()
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
