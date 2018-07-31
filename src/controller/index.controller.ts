import { Controller, Get, Text } from '@neoskop/nem';
import { VueConstructor } from 'vue';

const PKG = require('../../package.json');

declare const Vue : VueConstructor;


function init() {
    
    function upload(file : File, token : string, progress? : (event : ProgressEvent) => void) : Promise<string> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open('POST', '/', true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            progress && xhr.upload.addEventListener('progress', progress);
            xhr.addEventListener('error', () => reject(xhr));
            xhr.addEventListener('load', () => {
                if(xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr);
                }
            });
            
            xhr.send(file);
        });
    }
    
    Vue.filter('bytes', (size : number) => {
        const suffix = [ 'b', 'kB', 'MB', 'GB' ];
        
        let n = -1;
        while(true) {
            const s = 1024 * (1024 ** ++n);
            if(n >= suffix.length - 1 || size <= s) {
                return (size / (1024 ** n)).toFixed(n && 2) + suffix[ n ];
            }
        }
        
    });
    
    const app = new Vue({
        el     : '#main',
        data   : {
            state  : 'form' as 'form' | 'upload' | 'result' | 'error',
            error  : '',
            uploads: [] as {
                total : number;
                loaded : number;
                percentage : string,
                bps : number
            }[],
            links  : [] as { name : string, href : string, size : number }[]
        },
        methods: {
            submit(e : Event) {
                e.preventDefault();
                
                this.state = 'upload';
                
                
                this.uploads.length = 0;
                
                Promise.all(Array.from((this.$refs[ 'file' ] as HTMLInputElement).files!).map((file) => {
                    const index = this.uploads.push({
                        total     : 0,
                        loaded    : 0,
                        percentage: '0',
                        bps       : 0
                    }) - 1;
                    let lastTime = Date.now();
                    let lastValue = 0;
                    return upload(file, (this.$refs[ 'token' ] as HTMLInputElement).value, e => {
                        const now = Date.now();
                        const value = e.loaded - lastValue;
                        lastValue = e.loaded;
                        const time = (now - lastTime) / 1000;
                        const bps = value / time;
                        lastTime = now;
                        this.uploads[ index ].percentage = (e.loaded / e.total * 100).toFixed(2);
                        this.uploads[ index ].bps = bps;
                        this.uploads[ index ].total = e.total;
                        this.uploads[ index ].loaded = e.loaded;
                    }).then(id => ({ id, name: file.name, size: file.size }))
                })).then(ids => {
                    this.links = ids.map(({ id, name, size }) => ({ href: `${location.origin}/${id}`, name, size }));
                    this.state = 'result';
                }, err => {
                    this.error = err.responseText || err.message || err.toString();
                    this.state = 'error';
                });
            }
        }
    });
    
    console.log(app);
}

@Controller()
export class IndexController {
    @Get('/')
    @Get('/index.html')
    @Text()
    index() {
        return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>HostIt</title>
        <style>
            @import url('https://fonts.googleapis.com/css?family=Roboto');
            body, html { margin: 0; padding: 0; min-height: 100vh; font-family: Roboto, sans-serif }
            main { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(to bottom right, lightgreen, lightblue 80%) }
            section { background: white; padding: 10px; border-radius: 3px; box-shadow: 5px 5px 5px rgba(0, 0, 0, .3); min-width: 300px; }
            h1 { font-size: 24px; display: block; border-bottom: 1px solid rgba(0, 0, 0, .3); }
            small.version { position: fixed; bottom: 10px; right: 10px; display: block; text-align: right; color: rgba(0, 0, 0, .3); }
            meter, progress { width: 100%; min-width: 300px; display: block; margin-top: 10px; }
            small.desc { display: block; color: rgba(0, 0, 0, .3); margin-top: 5px; text-align: right }
            small.desc.left { float: left }
            #result a { display: block }
            #result dl { display: grid; grid-gap: 5px 5px; }
            #result dl dt { grid-column: 1 }
            #result dl dt + dd { margin: 0; grid-column: 2; color: rgba(0, 0, 0, .3); text-align: right }
            #result dl dt + dd + dd { margin: 0; grid-column-start: 1; grid-column-end: 3; padding-bottom: 10px; }
            
            a, a:link, a:visited, a:hover { text-decoration: none; color: royalblue; transition: color .4s }
            a:hover { color: darkslategrey }
            
            form {}
            form div { margin-bottom: 10px; }
            form label { display: block; }
            form input { width: 100%; min-width: 300px; }
            form .buttons { text-align: right }
           
           
            progress[value] {
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
              height: 20px;
              border-radius: 3px;
            }
            progress[value]::-webkit-progress-bar {
              background: #eee;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
              border-radius: 3px;
              overflow: hidden;
            }
            progress[value]::-moz-progress-bar {
              background: #eee;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
              border-radius: 3px;
              overflow: hidden;
            }
            
            progress[value]::-webkit-progress-value {
              background-color: green;
              background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, .3), rgba(255, 255, 255, 0) 80%);
              background-repeat: no-repeat;
            }
            
            progress[value]::-moz-progress-value {
              background-color: green;
              background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, .3), rgba(255, 255, 255, 0) 80%);
              background-repeat: no-repeat;
            }

        </style>
    </head>
    
    <body>
        <main id="main">
            <section>
                <h1>HostIt</h1>
                <p>Simple REST file hosting</p>
                <form v-if="state == 'form'" @submit="submit">
                    <div>
                        <label for="file">File</label>
                        <input type="file" id="file" multiple required ref="file" />
                    </div>
                    <div>
                        <label for="token">Token</label>
                        <input type="text" id="token" required ref="token" />
                    </div>
                    <div class="buttons">
                        <button id="submit">Upload</button>
                    </div>
                </form>
                <div v-if="state == 'upload'">
                    <div v-for="upload in uploads">
                        <progress v-bind:value="upload.percentage" max="100"></progress>
                        <small class="desc left">{{ upload.loaded | bytes}} / {{ upload.total | bytes }}</small>
                        <small class="desc">{{ upload.percentage }}% {{ upload.bps | bytes }}/s</small>
                    </div>
                </div>
                <div id="result" v-if="state == 'result'">
                    <dl>
                        <template v-for="link of links">
                            <dt>{{ link.name }}</dt>
                            <dd>{{ link.size | bytes }}</dd>
                            <dd><a v-bind:href="link.href" target="_blank">{{ link.href }}</a></dd>
                        </template>
                    </dl>
                </div>
                <div id="error" v-if="state == 'error'">{{ error }}</div>
            </section>
        </main>
        <small class="version">version: ${PKG.version}</small>
        <script>const process = {
            env: {
                NODE_ENV: ${JSON.stringify(process.env.NODE_ENV)}
            }
        }</script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.js"></script>
        <script>
            (${init.toString()})();
        </script>
    </body>
</html>
        `
    }
}
