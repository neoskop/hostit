import { Controller, Get, Text } from '@neoskop/nem';

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
            main { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: lightblue }
            section { background: white; padding: 10px; border-radius: 3px; box-shadow: 5px 5px 5px rgba(0, 0, 0, .3); min-width: 300px; }
            h1 { font-size: 24px; display: block; border-bottom: 1px solid rgba(0, 0, 0, .3); }
        </style>
    </head>
    
    <body>
        <main>
            <section>
                <h1>HostIt</h1>
                <p>Simple REST file hosting</p>
            </section>
        </main>
    </body>

</html>
        `
    }
}
