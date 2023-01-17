const AdmZip = require("adm-zip");
const path  = require("path");
const fs = require("fs");
const pkg = require("pkg");
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"))
const { exit } = require("process")

const build = async(platform) => {
    fs.mkdirSync(`./base/${platform}`)
    fs.copyFileSync("./base/entry.tp", `./base/${platform}/entry.tp`)
    fs.copyFileSync("./base/plugin_icon.png", `./base/${platform}/${packageJson.name}.png`)
    fs.copyFileSync("./node_modules/ffi-napi/prebuilds/win32-x64/node.napi.uv1.node", `./base/${platform}/node.napi.uv1.node`)
    fs.copyFileSync("./node_modules/ref-napi/prebuilds/win32-x64/node.napi.node", `./base/${platform}/node.napi.node`)

    let nodeVersion = 'node16-win-x64'
    let execName = `${packageJson.name}.exe`

    if( platform != "Windows" ) {
        execName = packageJson.name
    }

    if( platform == "MacOS") {
        nodeVersion = 'node16-macos-x64'
        
    }
    if( platform == "MacOS-Arm64") {
        nodeVersion = '???'
    }
    if( platform == "Linux") {
        nodeVersion = 'node16-linux-x64'
    }

    console.log("Running pkg")
    await pkg.exec([
      "--targets",
      nodeVersion,
      "--output",
      `base/${platform}/${execName}`,
      ".",
    ]);
    
    console.log("Running Zip File Creation")
    const zip = new AdmZip()
    zip.addLocalFolder(
      path.normalize(`./base/${platform}/`),
      packageJson.name
    );
    
    zip.writeZip(path.normalize(`./Installers/${packageJson.name}-${platform}-${packageJson.version}.tpp`))

    console.log("Cleaning Up")
    fs.rmSync(`./base/${platform}`, {recursive:true})
}

const cleanInstallers  = async () => {
        dirPath = './Installers/'
        try {
          fs.rmSync(dirPath, { recursive : true})
          fs.mkdirSync(dirPath)
        } catch (err) {
          console.error(err);
        }
}

const executeBuilds= async () => {
    await cleanInstallers()
    await build("Windows")
    //await build("MacOS")
    //await build("Linux")
}

executeBuilds();