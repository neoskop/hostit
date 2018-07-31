import { Controller, Get, Text } from '@neoskop/nem';

const PKG = require('../../package.json');

function init() {
    const formEl = document.getElementById('form')! as HTMLFormElement;
    const fileEl = document.getElementById('file')! as HTMLInputElement;
    const tokenEl = document.getElementById('token')! as HTMLInputElement;
    const progressEl = document.getElementById('progress')! as HTMLMeterElement;
    const descEl = document.getElementById('desc')! as HTMLElement;
    const resultEl = document.getElementById('result')! as HTMLElement;
    const errorEl = document.getElementById('error')! as HTMLElement;
    formEl.addEventListener('submit', e => {
        e.preventDefault();
        const file = fileEl.files![0];
        const token = tokenEl.value;
        
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/', true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        let lastTime = Date.now();
        let lastValue = 0;
        xhr.upload.addEventListener('progress', e => {
            const now = Date.now();
            const value = e.loaded - lastValue;
            lastValue = e.loaded;
            const time = (now - lastTime) / 1000;
            const bps = value / time;
            lastTime = now;
            const percentage = e.loaded / e.total * 100;
            progressEl.value = percentage;
            descEl.textContent = `${percentage.toFixed(2)}% ${bps / 1024 |0}kBs`
        });
        
        formEl.style.display = 'none';
        progressEl.style.display = 'block';
        descEl.style.display = 'block';
        
        xhr.addEventListener('error', e => {
            progressEl.style.display = 'none';
            descEl.style.display = 'none';
            errorEl.style.display = '';
            errorEl.innerText = e.message;
        });
        
        xhr.addEventListener('load', e => {
            progressEl.style.display = 'none';
            descEl.style.display = 'none';
            console.log(e);
            if(xhr.status === 200) {
                resultEl.style.display = '';
                resultEl.innerHTML = `<a href="${location.origin}/${xhr.responseText}" target="_blank">${location.origin}/${xhr.responseText}</a>`;
            } else {
                errorEl.style.display = '';
                errorEl.innerText = xhr.responseText;
            }
        });
    
        xhr.send(file);
    })
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
            meter { width: 100%; min-width: 300px; display: block }
            desc { display: block; color: rgba(0, 0, 0, .3); font-size: 12px; margin-top: 5px; text-align: right }
            
            a, a:link, a:visited, a:hover { text-decoration: none; color: royalblue; transition: color .4s }
            a:hover { color: darkslategrey }
            
            form {}
            form div { margin-bottom: 10px; }
            form label { display: block; }
            form input { width: 100%; min-width: 300px; }
            form .buttons { text-align: right }
           
        </style>
    </head>
    
    <body>
        <main>
            <section>
                <h1>HostIt</h1>
                <p>Simple REST file hosting</p>
                <form id="form">
                    <div>
                        <label for="file">File</label>
                        <input type="file" id="file" required />
                    </div>
                    <div>
                        <label for="token">Token</label>
                        <input type="text" id="token" required />
                    </div>
                    <div class="buttons">
                        <button id="submit">Upload</button>
                    </div>
                </form>
                <meter id="progress" value="0" max="100" style="display:none"></meter>
                <desc id="desc" display: none></desc>
                <div id="result" style="display:none"></div>
                <idv id="error" style="display:none"></idv>
            </section>
        </main>
        <small class="version">version: ${PKG.version}</small>
        <script>
            (${init.toString()})();
        </script>
    </body>
</html>
        `
    }
}
