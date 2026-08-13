const jsdom = require('jsdom');
const fs = require('fs');
const { JSDOM } = jsdom;

const html = fs.readFileSync('plataforma/admin.html', 'utf8');
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on('error', (err) => { console.log('ERROR:', err); });
virtualConsole.on('jsdomError', (err) => { console.log('JSDOM ERROR:', err); });

const dom = new JSDOM(html, {
    url: 'file:///' + process.cwd() + '/plataforma/admin.html',
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole
});

setTimeout(() => {
    console.log('Finished waiting. Checking document...');
    const body = dom.window.document.body;
    console.log('Body children:', body.children.length);
    console.log('Nav items length:', dom.window.document.querySelectorAll('.nav-item').length);
    process.exit(0);
}, 2000);
