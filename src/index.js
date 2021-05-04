const ref = require('ref-napi');
const process = require('process');
const Struct = require('ref-struct-di')(ref);
const w32API = require('win32-api');
const win32Def = require('win32-def');
const user32 = w32API.U.load();
const DS = win32Def.DStruct;

const lpszClass = Buffer.from('CLOWNFISHVOICECHANGER\0','ucs2');
const hWnd = user32.FindWindowExW(0,0,lpszClass,ref.NULL);

if (hWnd == undefined || hWnd == null) {
    logIt('ERROR','Could Not find Clownfish Voice Changer running');
    process.exit(1);
}
sendMessage("1|We are working now!");


function sendMessage(message){
    const copyData = new Struct(DS.COPYDATASTRUCT)()
    copyData.dwData = 42
    copyData.cbData = message.length;
    copyData.lpData = Buffer.from(message+'\0','utf-8');
    console.log(JSON.stringify(copyData));
    const copyDataAddr = ref.address(copyData.ref())
    return user32.SendMessageW(hWnd,0x4A,0,copyDataAddr);
  }