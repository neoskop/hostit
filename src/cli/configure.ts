import convict from 'convict';
import yaml from 'js-yaml';
import path from 'path';
import 'colors';

convict.addParser({ extension: [ 'yml', 'yaml' ], parse: yaml.safeLoad });

export function configure<T>(schema : convict.Schema<T>) {
    const config = Object.assign(convict({
        help: {
            doc: 'Display help',
            format: 'Boolean',
            arg: 'help',
            default: false
        },
        version: {
            doc: 'Display version',
            format: 'Boolean',
            arg: 'version',
            default: false
        },
        config: {
            doc: 'Load config file',
            format: 'String',
            arg: 'config',
            env: 'CONFIG',
            default: null
        },
        ...(schema as any)
    } as convict.Schema<T>), {
        usage(err?: any) {
            console.log();
            if(err) {
                console.log('  ', err.toString().red);
                console.log();
            }
            console.log('  ', 'Usage:', process.argv
                .slice(0, 2)
                .map((x, i) => {
                    // ignore the node bin, specify this in your
                    // bin file with #!/usr/bin/env node
                    if (i === 0 && /\b(node|iojs)(\.exe)?$/.test(x)) return;
                    const b = path.relative(process.cwd(), x);
                    return x.match(/^(\/|([a-zA-Z]:)?\\)/) && b.length < x.length ? b : x
                })
                .join(' ').trim());
            console.log();
        },
        help() {
            let maxArgLength = 0,
                maxDocLength = 0;
            
            const schema = config.getSchema();
            const keys : keyof T[] = Object.keys(schema.properties) as any;
            const data : [ string, string, string ][] = [];
            
            for(const key of keys) {
                const arg : string|undefined = (schema.properties[key as keyof T] as any).arg;
                const doc : string = (schema.properties[key as keyof T] as any).doc;
                const format : string = (schema.properties[key as keyof T] as any).format;
                if(!arg) {
                    continue;
                }
                maxArgLength = Math.max(maxArgLength, arg.length);
                maxDocLength = Math.max(maxDocLength, doc.length);
                
                data.push([ arg, doc, format ]);
            }
            
            console.log('  ', 'Options:'.cyan);
            for(const [ arg, doc, format ] of data) {
                console.log(
                    '  ',
                    ('  --' + arg).yellow + ' '.repeat(maxArgLength - arg.length),
                    doc + ' '.repeat(maxDocLength - doc.length),
                    '['.cyan + format.gray + ']'.cyan
                );
            }
        },
        version() {
            console.log(require(__dirname + '/../../package.json').version);
        }
    });
    
    if(config.get('config')) {
        config.loadFile(config.get('config')!);
    }
    
    if(config.get('help')) {
        config.help();
        process.exit();
    }
    
    if(config.get('version')) {
        config.version();
        process.exit();
    }
    
    try {
        config.validate({ allowed: 'strict' });
    } catch(e) {
        config.usage(e);
        config.help();
        process.exit(1);
    }
    
    return config;
}
