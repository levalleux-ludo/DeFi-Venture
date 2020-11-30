'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('./src/assets/startups.json');
let startups = JSON.parse(rawdata);
console.log(startups.startups.length);
const startups_new = [];
for (let i = 0; i < startups.startups.length; i++) {
    const startup = startups.startups[i];
    startups_new.push({
        name: startup.name,
        detail: startup.detail,
        image: startup.image
    });
}

let data = JSON.stringify({ startups: startups_new });
fs.writeFileSync('./src/assets/startups-new.json', data);