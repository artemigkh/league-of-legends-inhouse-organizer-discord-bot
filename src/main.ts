import {InHouseBot} from "./discord/InHouseBot";

function main() {
    const inHouseBot = new InHouseBot();

}

// @ts-ignore
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// @ts-ignore
global.xhr = new XMLHttpRequest();
// @ts-ignore
global.FormData = require("formdata-node").default;

main();
