const { isHexString } = require("ethers/lib/utils");

const eSpaceType = {
    GENESIS: 0,
    QUARANTINE: 1,
    LIQUIDATION: 2,
    CHANCE: 3,
    ASSET_CLASS_1: 4,
    ASSET_CLASS_2: 5,
    ASSET_CLASS_3: 6,
    ASSET_CLASS_4: 7
}

const eChanceType = {
    PAY: 0,
    RECEIVE: 1,
    MOVE_N_SPACES_FWD: 2,
    MOVE_N_SPACES_BCK: 3,
    GOTO_SPACE: 4,
    IMMUNITY: 5,
    PAY_PER_ASSET: 6,
    RECEIVE_PER_ASSET: 7
}

const NB_SPACES = 24;
const NB_CHANCES = 32;

const getSpaces = (nbSpaces) => {
    // let spaces = [];
    let spacesHexStr = '';
    const genesisId = 0;
    const quarantineId = Math.floor(nbSpaces / 2);
    const liquidationId = Math.floor(3 * nbSpaces / 4);
    const chances = [
        randomBetween(1, nbSpaces / 4),
        randomBetween(nbSpaces / 4, quarantineId),
        randomBetween(1 + quarantineId, liquidationId),
        randomBetween(1 + liquidationId, nbSpaces)
    ];
    let assetCount = 0;
    for (let spaceId = 0; spaceId < nbSpaces; spaceId++) {
        let spaceType;
        let assetId = 0;
        switch (spaceId) {
            case genesisId:
                {
                    spaceType = eSpaceType.GENESIS;
                    break;
                }
            case quarantineId:
                {
                    spaceType = eSpaceType.QUARANTINE;
                    break;
                }
            case liquidationId:
                {
                    spaceType = eSpaceType.LIQUIDATION;
                    break;
                }
            default:
                {
                    if (chances.includes(spaceId)) {
                        spaceType = eSpaceType.CHANCE;

                    } else {
                        assetId = assetCount++
                            const assetClass = randomBetween(0, 4);
                        spaceType = eSpaceType.ASSET_CLASS_1 + assetClass;
                    }
                    break;
                }
        }
        const spaceCode = spaceType + (assetId << 3);
        const spaceCodeHexStr = zeroPad(spaceCode.toString(16), 2);
        // console.log(spaceId, spaceType, assetId, '0x' + spaceCodeHexStr);
        spacesHexStr = spaceCodeHexStr + spacesHexStr;
    }
    spacesHexStr = '0x' + zeroPad(spacesHexStr, 64);
    // console.log(spacesHexStr);
    return spacesHexStr;
}

const getChances = (nbChances, nbSpaces) => {
    // const chances = [];
    let chancesHexStr = '';
    for (let chanceId = 0; chanceId < nbChances; chanceId++) {
        const chanceType = randomBetween(0, 7);
        let chanceParam = 0;
        switch (chanceType) {
            case eChanceType.RECEIVE:
            case eChanceType.PAY:
            case eChanceType.PAY_PER_ASSET:
            case eChanceType.RECEIVE_PER_ASSET:
                {
                    chanceParam = randomBetween(1, 5);
                    break;
                }
            case eChanceType.GOTO_SPACE:
                {
                    chanceParam = randomBetween(0, nbSpaces);
                    break;
                }
            case eChanceType.MOVE_N_SPACES_FWD:
                {
                    chanceParam = randomBetween(0, nbSpaces / 2);
                    break;
                }
            case eChanceType.MOVE_N_SPACES_BCK:
                {
                    chanceParam = randomBetween(0, nbSpaces / 2);
                    break;
                }
        }
        const chanceCode = chanceType + (chanceParam << 3);
        // const chanceCodeHexStr = zeroPad(decimalToHexString(chanceParam), 1) + zeroPad(decimalToHexString(chanceType), 1);
        const chanceCodeHexStr = zeroPad(chanceCode.toString(16), 2);
        // console.log(chanceId, chanceType, chanceParam, '0x' + chanceCodeHexStr);
        // chances.push(chanceCode);
        chancesHexStr = chanceCodeHexStr + chancesHexStr;
    }
    chancesHexStr = '0x' + zeroPad(chancesHexStr, 64);
    // console.log(chancesHexStr);
    return chancesHexStr;
}

const hexlify = (anArray) => {
    let hexString = '';
    for (let i = 0; i < anArray.length; i++) {
        hexString = zeroPad(decimalToHexString(anArray[i]), 2) + hexString;
    }
    hexString = '0x' + hexString;
    return hexString;
}

function decimalToHexString(number) {
    if (number < 0) {
        number = 0xF + number + 1;
    }

    return number.toString(16).toUpperCase();
}

function zeroPad(value, length) {
    while (value.length < length) {
        value = '0' + value;
    }
    return value;
}

function randomBetween(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}

const spaces = getSpaces(NB_SPACES);
const chances = getChances(NB_CHANCES, NB_SPACES);

module.exports = {
    getSpaces,
    getChances,
    eSpaceType,
    eChanceType
};