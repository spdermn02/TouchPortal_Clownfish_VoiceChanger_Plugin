// Info sourced from: https://clownfish-translator.com/voicechanger/#clownfishAPI

const ref = require('ref-napi');
const fs = require('fs');
const process = require('process');
const Struct = require('ref-struct-di')(ref);
const w32API = require('win32-api');
const win32Def = require('win32-def');
const { open } = require("out-url")
const user32 = w32API.U.load();
const DS = win32Def.DStruct;
const TPClient = new (require('touchportal-api').Client)();
const pluginId = 'TouchPortal_Clownfish_VoiceChanger';

const lpszClass = Buffer.from('CLOWNFISHVOICECHANGER\0','ucs2');
const hWnd = user32.FindWindowExW(0,0,lpszClass,ref.NULL);

const Constants = {
    'releaseUrl': 'https://github.com/spdermn02/TouchPortal_Clownfish_VoiceChanger_Plugin/releases',
    'updateUrl': 'https://raw.githubusercontent.com/spdermn02/TouchPortal_Clownfish_VoiceChanger_Plugin/main/package.json'
}

if (hWnd == undefined || hWnd == null) {
    logIt('ERROR','Could Not find Clownfish Voice Changer running');
    process.exit(1);
}

const COMMAND_LIST = {
    "Play Audio"        : 0,
    "Text-to-Speech"    : 1,
    "Toggle Clownfish"  : 2,
    "Set Voice Changer" : 3,
    "Set Sound FX"      : 4,
    "Set Sound Volume"  : 5,
    "VST Effect"        : 6
    /* "Toggle Music"      : 7 */
};

const VOICE_LIST = {
    "None"          : 0,
    "Alien"         : 1,
    "Atari"         : 2,
    "Clone"         : 3,
    "Mutation"      : 4,
    "Fast Mutation" : 5,
    "Slow Mutation" : 6,
    "Male Pitch"    : 7,
    "Female Pitch"  : 8,
    "Helium Pitch"  : 9,
    "Baby Pitch"    :10,
    "Radio"         :11,
    "Robot"         :12,
    "Custom Pitch"  :13,
    "Silence"       :14
};

const SOUND_FX = {
    "None"    : 0,
    "Church" : 1,
    "Cave"   : 2,
    "Choir"  : 3,
    "Ghost"  : 4
}

const playAudio = (tpmessage) => {
    let file = tpmessage.data[0].value;
    if( file !== '' || file != undefined || file != null ) {
        let allowed = false;
        //check if file exists, else write error
        try{
            if( fs.existsSync(file) ) 
            {
                allowed = true;
            }
        }
        catch  (err) {
            logIt('ERROR',`File ${file} caused an error ${err}`);
            return;
        }
        if( !allowed ){
            logIt('WARN',`File ${file} cannot be used, or is not found`);
            return;
        }
        file = file.replace(/\\/g,'\\\\');
    }
    else {
        file = '';
    }
    const message = COMMAND_LIST["Play Audio"] +"|"+ file;
    console.log(message);
    sendMessage(message);
}

const setVoiceChanger = (tpmessage) => {
    let voiceSelection = VOICE_LIST[tpmessage.data[0].value];
    if( voiceSelection < 0 || voiceSelection > 14 ) {
        voiceSelection = 0;
    }
    const message = COMMAND_LIST["Set Voice Changer"] +"|"+ voiceSelection;
    sendMessage(message);

    TPClient.stateUpdate('clownfish_voice_selected', tpmessage.data[0].value);
}

const setCustomPitch = (tpmessage) => {
    let pitch = tpmessage.data[0].value;
    if( pitch < -15.0 || pitch > 30.0 ) {
        pitch = 0.0;
    }
    const message = COMMAND_LIST["Set Voice Changer"] +"|"+VOICE_LIST["Custom Pitch"]+"|"+ pitch;
    sendMessage(message);
    TPClient.stateUpdate('clownfish_voice_selected', 'Custom Pitch');
}

const setSoundFx = (tpmessage) => {
    let soundFx = SOUND_FX[tpmessage.data[0].value];
    if( soundFx < 0 || soundFx > 4) {
        soundFx = 0;
    }
    const message = COMMAND_LIST["Set Sound FX"] +"|"+ soundFx;
    sendMessage(message);

    TPClient.stateUpdate('clownfish_sound_fx_selected',tpmessage.data[0].value);
}

const textToSpeech = (tpmessage) => {
    let sayIt = tpmessage.data[0].value;
    if( sayIt === '' || sayIt == undefined || sayIt == null ) {
        logIt('WARN','Attempting to use text-to-speech with no text');
        return;
    }
    const message = COMMAND_LIST["Text-to-Speech"] +"|"+ sayIt;

    logIt("DEBUG",`Text to speech message ${message}`)
    sendMessage(message);
}

const toggleClownfish = (tpmessage) => {
    let toggle = (tpmessage.data[0].value === "Enable") ? 0 : 1;
    const message = COMMAND_LIST["Toggle Clownfish"] +"|"+ toggle;
    sendMessage(message);
}

const setVST = (tpmessage) => {
    const vst = tpmessage.data[0].value;
    const message = COMMAND_LIST["VST Effect"] + "|"+ vst;
    sendMessage(message);
}

const setVSTOff = () => {
    const message = COMMAND_LIST["VST Effect"] + "|disable";
    sendMessage(message);
}

const configVST = () => {
    const message = COMMAND_LIST["VST Effect"] + "|configure";
    sendMessage(message);
}

function sendMessage(message){
    const copyData = new Struct(DS.COPYDATASTRUCT)()
    copyData.dwData = 42
    copyData.cbData = message.length;
    copyData.lpData = Buffer.from(message+'\0','utf-8');
    //console.log(JSON.stringify(copyData));
    const copyDataAddr = ref.address(copyData.ref())
    return user32.SendMessageW(hWnd,0x4A,0,copyDataAddr);
}

TPClient.on("Action", (message,hold) => {
    console.log(pluginId, ": DEBUG : ACTION ", JSON.stringify(message), "hold", hold);
    switch(message.actionId) {
        case "clownfish_play_audio":
            playAudio(message);
            break;
        case "clownfish_text_to_speech":
            textToSpeech(message);
            break;
        case "clownfish_toggle":
            toggleClownfish(message);
            break;
        case "clownfish_set_voice_changer":
            setVoiceChanger(message);
            break;
        case "clownfish_set_custom_pitch":
            setCustomPitch(message);
            break;
        case "clownfish_set_sound_fx":
            setSoundFx(message);
            break;
        case "clownfish_set_vst":
            setVST(message);
            break;
        case "clownfish_disable_vst":
            setVSTOff(message);
            break;
        case "clownfish_configure_vst":
            configVST(message);
            break;
        default:
            logIt('WARN',`Unknown action of ${message.actionId}`);
    }
});  

TPClient.on("Info", (data) => {
    //TP Is connected now
    logIt('DEBUG','We are connected, received Info message');
});

TPClient.on("Update", (curVersion,newVersion) => {
    TPClient.logIt("DEBUG","Update: there is an update curVersion:",curVersion,"newVersion:",newVersion)
    TPClient.sendNotification(`${pluginId}_update_notification_${newVersion}`,`Clownfish Plugin Update Available`,
    `\nNew Version: ${newVersion}\n\nPlease updated to get the latest bug fixes and new features\n\nCurrent Installed Version: ${curVersion}`,
    [{id: `${pluginId}_update_notification_go_to_download`, title: "Go To Download Location" }]
  );
  });
  
  TPClient.on("NotificationClicked", (data) => {
    if( data.optionId === `${pluginId}_update_notification_go_to_download`) {
      open(Constants.releaseUrl);
    }
  });

function logIt() {
    var curTime = new Date().toISOString();
    var message = [...arguments];
    var type = message.shift();
    console.log(curTime,":",pluginId,":"+type+":",message.join(" "));
}
    
TPClient.connect({ pluginId, updateUrl: Constants.updateUrl });