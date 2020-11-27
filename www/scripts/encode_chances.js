'use strict';

const fs = require('fs');

const eChanceType = {
    INVALID: 0,
    PAY: 1,
    RECEIVE: 2,
    MOVE_N_SPACES_FWD: 3,
    MOVE_N_SPACES_BCK: 4,
    GOTO_SPACE: 5,
    IMMUNITY: 6,
    GO_TO_QUARANTINE: 7,
    PAY_PER_ASSET: 8,
    RECEIVE_PER_ASSET: 9
}

const PARAMS = {
    INVALID: '',
    PAY: 'amount',
    RECEIVE: 'amount',
    MOVE_N_SPACES_FWD: 'nb',
    MOVE_N_SPACES_BCK: 'nb',
    GOTO_SPACE: 'space',
    IMMUNITY: null,
    GO_TO_QUARANTINE: null,
    PAY_PER_ASSET: 'amount',
    RECEIVE_PER_ASSET: 'amount'
}

let rawdata = fs.readFileSync('./src/assets/chances.json');
let chances = JSON.parse(rawdata);
// console.log(chances.chances.length);
let chancesHexStr = '';
for (let i = 0; i < chances.chances.length; i++) {
    const chanceCode = encodeChance(chances.chances[i]);
    const chanceCodeHexStr = zeroPad(chanceCode.toString(16), 4);
    chancesHexStr = chanceCodeHexStr + chancesHexStr;
}
chancesHexStr = '0x' + zeroPad(chancesHexStr, 64);

console.log(chancesHexStr);

function zeroPad(value, length) {
    while (value.length < length) {
        value = '0' + value;
    }
    return value;
}

function encodeChance(chance) {
    const chanceType = eChanceType[chance.impl];
    const params_key = PARAMS[chance.impl];
    let chanceParam = 0;
    if (params_key) {
        chanceParam = chance.params[params_key];
    }
    const chanceCode = (chanceType + (chanceParam << 8)) & 0xFFFF; // encode on 2 bytes
    console.log(chance, chanceType, chanceParam, zeroPad(chanceCode.toString(16), 4));
    return chanceCode;
}

function getChanceDetails(chancesHexStr, chanceId) {
    const chanceCodeHexStr = chancesHexStr.substr(2 + (15 - chanceId) * 4, 4);
    console.log('chanceId', chanceId, 'chanceCodeHexStr', chanceCodeHexStr);
}

for (let i = 0; i < 16; i++) {
    getChanceDetails(chancesHexStr, i);
}