const fs = require('fs');

const fixes = [
    ['Ã¡', 'á'], ['Ã¢', 'â'], ['Ã£', 'ã'],
    ['Ã©', 'é'], ['Ãª', 'ê'],
    ['Ã­', 'í'],
    ['Ã³', 'ó'], ['Ã´', 'ô'], ['Ãµ', 'õ'],
    ['Ãº', 'ú'],
    ['Ã§', 'ç'],
    ['Ã§Ãµ', 'çõ'],
    ['Ã§Ã£', 'çã'],
    ['Ã\x8d', 'Í'],
    ['Ã\x81', 'Á'],
    ['Ã\x89', 'É'],
    ['Ã\x93', 'Ó'],
    ['Ã\x9a', 'Ú'],
    ['Ã\x87', 'Ç'],
    ['âœ…', '✅'],
    ['â Œ', '❌'],
    ['âš ï¸ ', '⚠️'],
    ['â„¹ï¸ ', 'ℹ️']
];

for (let file of ['portal.html', 'admin.html']) {
    let content = fs.readFileSync('C:/Users/Roberto/Desktop/DISCIPULADO/plataforma/' + file, 'utf8');
    for(let [bad, good] of fixes) {
        content = content.split(bad).join(good);
    }
    content = content.split('Ã').join('À'); // run Ã last to avoid intercepting others
    fs.writeFileSync('C:/Users/Roberto/Desktop/DISCIPULADO/plataforma/' + file, content, 'utf8');
}
console.log('Fixed HTML double encodings');
