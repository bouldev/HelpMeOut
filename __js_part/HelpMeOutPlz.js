/*	Bouldev 2020
	如需更改该文件并push，请将更改部分进行完整注释，避免工作无法衔接导致项目滞后。
*/
const fs=require("fs");
const vm=require("vm");
const crypto=require("crypto");
const zlib=require("zlib");
const os=require("os");
const locale=require("os-locale");
var exec = require('child_process').exec;
var cmdSay = "";
//locales
var userLanguage, userHome, userName, userPlatform, userArch, userCPU;

function localeCheck(){
	userArch = process.arch;
	//ios lang path "~/Library/Preferences/com.apple.purplebuddy.plist".locale
	//needs require('plist') to parse plist files
	userLanguage = fs.existsSync("lang_pref") ? fs.readFileSync("lang_pref") : locale().toString;
	if (userLanguage === undefined) userLanguage = "en_US";
	userHome = os.homedir();
	userName = userHome.split("/").reverse()[0];
	userPlatform = osCheck();
}
function osCheck(){
	var currentOS = process.platform;
	if (currentOS == 'darwin') {
		//ios homedir can be "/var/mobile", "/var/root" and "/private/var/...", diff from macOS.
		//ios uses arm64/arm64e, armv7 deprecated
		if ((userHome.split("/")[1] == 'var' || userHome.split("/")[1] == 'private') && (userArch == 'arm64' || userArch == 'arm64e')) {
			currentOS = 'ios';
		}
	} else if (currentOS == 'linux') {
		//android termux app homedir is "/data/data/..."
		//submit an issue if you know other environment
		if (userHome.split("/")[1] == 'data' && userHome.split("/")[2] == 'data') {
			currentOS = 'android';
		}
	}
	return currentOS;
}
localeCheck();

//`node HelpMeOut release` to disable debug at that moment
let DEBUG = (process.argv[2] == "release") ? false : true;

let inputcb;
process.stdin.on("data",(input)=>{
	if(inputcb)inputcb(input);
});

function log(content){
	if(DEBUG){
		console.log(`[DEBUG] ${content}`);
	}
}

// ENGINE-WIDE ENCRYPT METHODS
// Anti-Cheating
let md5sum = crypto.createHash('md5').update(userName + userPlatform + userHome).digest("hex");
//console.log(md5sum);
function aes256encrypt(data){
	return crypto.createCipheriv("aes-256-cfb",Buffer.from(md5sum),Buffer.from("Jayspond Mystery")).update(data);
}
function aes256decrypt(data){
	return crypto.createDecipheriv("aes-256-cfb",Buffer.from(md5sum),Buffer.from("Jayspond Mystery")).update(data).toString();
}
function aes256decryptToBuf(data){
	return crypto.createDecipheriv("aes-256-cfb",Buffer.from(md5sum),Buffer.from("Jayspond Mystery")).update(data);
}

// 全局变量
// 所有全局变量使用字符串保存
// key: 键
// data: 值

//Global essential data protection / read only
const protectedArgs = ["os","user","arch","lang","home","init"];
async function readGlobal(key){
	let mem={};
	if(!fs.existsSync("Memory"))return {};
	try {
		mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
	} catch(err) {
		console.log("fuck");
	}
	if(!mem.hasOwnProperty(lid))return {};
	return mem[lid][key];
}
let MEMERR = false;
async function saveGlobal(key,data) {
	let mem={};
	let lid="global";
	if(fs.existsSync("Memory")){
		try {
			mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
		} catch(err) {
			//console.log("fuck you");
			MEMERR = true;
			//console.log(err.description);
			await story_say("You messed up my memory...",2,1,1,1);
			await story_say("I\'m dizzy...",2,1,1,0);
			await story_say("Help me...",6,1,1,1);
			accident("memory file corruped");
		}
	}
	if(mem.hasOwnProperty(lid)){
		mem[lid][key]=data;
	}else{
		mem[lid]=JSON.parse(`{"${key}":"${data}"}`);
	}
	fs.writeFileSync("Memory",aes256encrypt(zlib.gzipSync(JSON.stringify(mem))));
}
async function killGlobal(key){
	let lid="global";
	if(!fs.existsSync("Memory"))return {};
	let mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
	if(!mem.hasOwnProperty(lid))return {};
	delete mem[lid][key];
}
async function initGlobal(){
	await saveGlobal("os",userPlatform);
	await saveGlobal("user",userName);
	await saveGlobal("arch",userArch);
	await saveGlobal("lang",userLanguage);
	await saveGlobal("home",userHome);
	await killGlobal("init");
}
saveGlobal("init","done");
if (!MEMERR) initGlobal();
// 存档 GAMESTATE

// (以下方法在storyScript中不能使用)
// ENGINE WIDE readGameStateWithEpid:
// string lid: 故事线ID
// return: SECTION {lid: ,epid: ,data: ,state: }
// return: ^ 如未找到则返回{}.
function readGameStateWithLineId(lid) {
	let mem={};
	if(lid=="global")return {};
	if(!fs.existsSync("Memory"))return {};
	try {
		mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
	} catch(err) {
		console.log("fuck");
	}
	if(!mem.hasOwnProperty(lid))return {};
	return mem[lid];
	//ORIGINAL
	let pointer=0;
	function readStr(){
		let th="";
		while(true){
		if(buf[pointer]==0){pointer++;return th;}
		th+=buf.toString("ascii",pointer,pointer+1);
		pointer++;
		}
	}
	function readSection(){
		let obj={};
		obj.lid=readStr();
		obj.epid=readStr();
		obj.lang=buf[pointer];
		pointer++;
		obj.state=buf.readUInt16BE(pointer);
		pointer+=2;
	}
	while(true){
		let sect=readSection();
		if(sect.lid==lid)return sect;
	}
	return null;
}
// ENGINE WIDE saveGameStateWithEpid:AndState:
// string lid: 故事线ID
// string epid: 章节ID
// Object data: 内容
// int state: 进度(单独存储)
function saveGameStateWithLineIdAndState(lid,epid,data,state) {
	if(lid!="global"){
		if(!state)state=0;
		let mem={};
		if(fs.existsSync("Memory")){
			try {
				mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
			} catch(err) {
				console.log("fuck");
			}
		}
		if(mem.hasOwnProperty(lid)){
			mem[lid].epid=epid;
			if(data!==null)mem[lid].data=data;
			if(state!=-1)mem[lid].state=state;
		}else{
			if(data===null)data={};
			if(state==-1)state=0;
			mem[lid]={epid,data,state};
			//console.log(mem);
		}
		fs.writeFileSync("Memory",aes256encrypt(zlib.gzipSync(JSON.stringify(mem))));
	}
	
	return;
	//ORIGINAL
	if(!state)state=0;
	let pointer=0;
	function writebuf(val,typ){
		if(typ==1){
			buf[pointer]=val;
			pointer++;
		}else if(typ==2){
			buf.writeInt16BE(val,pointer);
			pointer+=2;
		}else{
			buf.write(val,pointer);
			pointer+=val.length;
		}
	}
}

// END OF GAMESTATE

function sleep(numberMillis) {
	//延时方法 (await)
	return new Promise((ret)=>{
		setTimeout(ret,numberMillis);
	});
}

function minify(json) {
	//JSON注释处理
	json=json.toString();
	//可以用于读取带注释的JSON文件
	let tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
		in_string = false,
		in_multiline_comment = false,
		in_singleline_comment = false,
		tmp, tmp2, new_str = [], ns = 0, from = 0, lc, rc;

	tokenizer.lastIndex = 0;

	while (tmp = tokenizer.exec(json)) {
		lc = RegExp.leftContext;
		rc = RegExp.rightContext;
		if (!in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.substring(from);
			if (!in_string) {
				tmp2 = tmp2.replace(/(\n|\r|\s)*/g,"");
			}
			new_str[ns++] = tmp2;
		}
		from = tokenizer.lastIndex;

		if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.match(/(\\)*$/);
			if (!in_string || !tmp2 || (tmp2[0].length % 2) === 0) {   // start of string with ", or unescaped " character found to end string
				in_string = !in_string;
			}
			from--; // include " character in next catch
			rc = json.substring(from);
		}
		else if (tmp[0] == "/*" && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = true;
		}
		else if (tmp[0] == "*/" && !in_string && in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = false;
		}
		else if (tmp[0] == "//" && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_singleline_comment = true;
		}
		else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment && in_singleline_comment) {
			in_singleline_comment = false;
		}
		else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0]))) {
			new_str[ns++] = tmp[0];
		}
	}
	new_str[ns++] = rc;
	return new_str.join("");
}
function fastParse(filename){
	return JSON.parse(minify(fs.readFileSync(filename)));
}

let allLines={}
//Read storylines
for(let episode of fs.readdirSync("storylines")){
	//Check if storylines valid
	if(!fs.existsSync(`storylines/${episode}/manifest.json`)){
		log(`Storyline named ${episode} doesn't have a manifest file, ignoring.`);
		continue;
	}
	let episodeConfig=fastParse(`storylines/${episode}/manifest.json`);
	//Check duplicated storylines
	if(allLines.hasOwnProperty(episodeConfig.lineID)){
		log(`ERROR| Duplicated Storyline ID: ${episodeConfig.lineID}`);
		process.exit(5);
	}
	episodeConfig.episodes_dir=episodeConfig.episodes_dir.replace(/\.\./g,"");
	//Check episodes
	if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}`)){
		log(`WARNING| Episodes directory not found in storyline w/ id ${episodeConfig.lineID}, ignoring.`);
		continue;
	}
	let episodes={};
	//Read episodes
	for(let ep of fs.readdirSync(`storylines/${episode}/${episodeConfig.episodes_dir}`)){
		//Check episodes
		if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/config.json`)){
			log(`Episode named ${ep} doesn't have a config file,ignoring.`);
			continue;
		}
		let epConfig=fastParse(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/config.json`);
		//Check duplicated episodes in same storyline
		if(episodes.hasOwnProperty(epConfig.episodeID)){
			log(`ERROR(IGN)| Duplicated Episode ID ${epConfig.episodeID} in storyline with id: ${episodeConfig.lineID}, IGNORING.`);
			continue;
		}
		//Check if episodes valid
		if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/${epConfig.storyFile}`)){
			log(`WARNING| Story file of episode with id ${epConfig.episodeID} not found,ignoring.`);
			continue;
		}
		episodes[epConfig.episodeID]={info:epConfig,script:fs.readFileSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/${epConfig.storyFile}`).toString()};
	}
	//Check if any episodes exist in storylines
	if(Object.keys(episodes).length==0){
		log(`WARNING| Storyline w/ id ${episodeConfig.lineID} does not have any episode, ignoring.`);
		continue;
	}
	//Check if entry episodes valid
	if(!episodes.hasOwnProperty(episodeConfig.entry)){
		log(`WARNING| Entry episode of storyline with id ${episodeConfig.lineID} not found, ignoring this storyline.`);
		continue;
	}
	allLines[episodeConfig.lineID]={info:episodeConfig,episodes};
}

async function accident(reason){
    if (DEBUG && MEMERR) {
	    console.log(`\x1B[91mGame failed due to ${reason}.\nGameState must reinitialize to store data correctly.\x1B[0m`);
	//} else if (!DEBUG && MEMERR) {
	} else {
		fs.unlinkSync("Memory");
	}
	process.exit(1);
}
//story methods
async function story_say(text, spend, delay, skiable, wrap) {
	if(typeof(text)!="string"){
		throw new TypeError("story.say: Invalid type of argument text");
		//text=text+"";
	}
	if(spend<0||delay<0){
		throw new TypeError("story.say: spend or delay must >= 0.");
	}
	//James标准输出方法
	if (DEBUG) {
		//为了节省测试时间，设置DEBUG FLAG可以省略特效
		spend = 0;
		delay = 0;
	} else {
		spend = spend * 1000;
		delay = delay * 1000;
	}
	let output = text.split("");
	if (skiable == 1) {
		//还没想好怎么写gg
		//我认为一个真实的思想是不会允许其他人打断的
	}
	for (let i = 0; i < output.length; i++) {
		process.stdout.write(output[i]);
		await sleep(spend / output.length);
	}
	if (wrap == 1) {
		process.stdout.write("\n");
	}
	await sleep(delay);
}

async function story_say_with_voice(text, spend, delay, skiable, wrap, actor){
//MACOS ONLY!
	cmdSay = "say -v " + actor + " " + text;
	if(typeof(text)!="string"){
		throw new TypeError("story.say: Invalid type of argument text");
	}
	if(spend<0||delay<0){
		throw new TypeError("story.say: spend or delay must >= 0.");
	}
	//James标准输出方法+macOS自带TTS
	if (DEBUG) {
		//为了节省测试时间，设置DEBUG FLAG可以省略特效
		spend = 0;
		delay = 0;
	} else {
		spend = spend * 1000;
		delay = delay * 1000;
	}
	let output = text.split("");
	if (skiable == 1) {
		//还没想好怎么写gg
		//我认为一个真实的思想是不会允许其他人打断的
	}
	exec(cmdSay, function(err,stdout,stderr){
		if(err) {
			throw new TypeError("macOS say error: " + stderr);
		}
	});
	for (let i = 0; i < output.length; i++) {
		process.stdout.write(output[i]);
		await sleep(spend / output.length);
	}
	if (wrap == 1) {
		process.stdout.write("\n");
	}
	await sleep(delay);
}

async function story_askforhelp(returnInput){
	story_say("(Y/n): ",0,0,1,0);
	let input=await new Promise((ret)=>{
		inputcb=ret;
	});
	input = input.toString().trim().toLowerCase();
	if (['y', 'yes', 'true', '1', 'sure', 'no problem', 'of course'].indexOf(input) > -1) {
		return 1;
	}else if (['n', 'no', 'false', '0'].indexOf(input) > -1) {
		return 0;
	}else{
		return (returnInput ? input : -1);
	}
}

async function story_askforinput(){
	story_say("(Input): ",0,0,1,0);
	let input=await new Promise((ret)=>{
		inputcb=ret;
	});
	return input.toString().trim();
}
//story methods =END=

function runStoryline(storyline){
	let allEpisodes=storyline.episodes;
	function runEpisodeWithEpisodeId(epid){
		if(!allEpisodes.hasOwnProperty(epid)){
			log(`ERROR| Next episode(id:${epid}) not found, nowhere to go..`);
			process.exit(6);
		}
		saveGameStateWithLineIdAndState(storyline.info.lineID,epid,null,-1);
		try{
			vm.runInNewContext(allEpisodes[epid].script,{engine:{
				log:log,
				hasEpisode:allEpisodes.hasOwnProperty,
				jumpToEpisode:runEpisodeWithEpisodeId,
				sleepNoAwait:(numberMillis,noDeprecationWarning)=>{
					// DEPRECATED , USE (await) engine.sleep instead.
					if(!noDeprecationWarning)log(`engine.sleepNoAwait is deprecated, please use await engine.sleep instead.`);
					let now = new Date();
					let exitTime = now.getTime() + numberMillis;
					while (true) {
						now = new Date();
						if (now.getTime() > exitTime)
							return;
					}
				},
				finish:()=>{
					//完成所有章节
					//目前无更多操作 故退出.
					//(结束故事线)
					process.exit(0);
				},
                debug:()=>{
                    return DEBUG;
                },
				fail:(reason)=>{
    				if (DEBUG && !MEMERR) {
    				    console.log(`\x1B[37;100mGame failed due to ${reason}.\nNormally, the game will enter dead storyline, in debug mode we disabled it and remains original gamestate.\x1B[0m`);
					} else if (DEBUG && MEMERR) {
					    console.log(`\x1B[91mGame failed due to ${reason}.\nGameState must reinitialize to store data correctly.\x1B[0m`);
					//} else if (!DEBUG && MEMERR) {
					} else {
					fs.unlinkSync("Memory");
    				//In release, epi0(dead episode) will run if James died.
					runEpisodeWithEpisodeId("helpmeout.mainepisodes.0");
					}
					process.exit(1);
				},
				// SLEEP: ASYNC
				sleep:sleep,
                isAndroid:()=>{
                    //currently Nodejs might read android as "linux" or "android", it's experimental
                    return (userPlatform=="android");
                },
				isiOS:()=>{
                    //currently Nodejs cannot read ios correctly, it might misread as "darwin"
                    //if you run HelpMeOut in JSBox or other ios apps with Nodejs support, it would return "ios"
					return (userPlatform=="ios");
				},
				isMacOS:()=>{
					return (userPlatform=="darwin");
                },
                isWindows:()=>{
                    return (userPlatform=="win32");
                },
                isUnixBased:()=>{
                    return (userPlatform!="win32" || userPlatform!="linux" || userPlatform!="android");
				},
                isUnixLike:()=>{
                    return (userPlatform!="win32");
                },
                isDarwin:()=>{
                    return (userPlatform=="ios" || userPlatform=="darwin");
                },
                isLinux:()=>{
                    return (userPlatform=="linux" || userPlatform=="android");
                }
			},game:{
				saveState:(state)=>{
					if(typeof(state)!="number"){
						throw new TypeError("saveState: state must be a number.");
					}
					saveGameStateWithLineIdAndState(storyline.info.lineID,epid,null,state);
				},
				readState:()=>{
					return readGameStateWithLineId(storyline.info.lineID).state;
				},
				saveGameData:(data)=>{
					saveGameStateWithLineIdAndState(storyline.info.lineID,epid,data,-1);
				},
				readGameData:()=>{
					return readGameStateWithLineId(storyline.info.lineID).data;
				},
				setGlobal:(key,value)=>{
					if (protectedArgs.indexOf(key) != -1) {
						log("Target string \"" + key + "\" is not rewritable, ignoring.");
						return false;
					} else {
						saveGlobal(key,value);
						return true;
					}
				},
				delGlobal:(key)=>{
					if (protectedArgs.indexOf(key) != -1) {
						log("Target string \"" + key + "\" is not rewritable, ignoring.");
						return false;
					} else {
						killGlobal(key);
						return true;
					}
				},
				getGlobal:(key)=>{
					return readGlobal(key);
				}
			},story:{
				say:story_say,
				sayvoice:story_say_with_voice,
				askforhelp:story_askforhelp,
				askforinput:story_askforinput
			},debug: (DEBUG) ? {
				get:(targetInfo)=>{
					switch(targetInfo) {
						case "help":
							log("debug.get(\"{arg}\");\n${arg} can be one of the items that listed below:\nstate_raw, mem_raw, free_mem.");
							break;
						case "state_raw":
							log(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
							break;
						case "mem_raw":
							log(process.memoryUsage.toString());
							break;
						case "free_mem":
							log(os.freemem());
							break;
						default:
							log("debug.get: Invalid argument, use \x1B[93;100mdebug.get(\"help\")\x1B[0m to get help.");
					}
				},
				set:(key,value)=>{
					saveGlobal(key,value);
				}
			}:{
				get:()=>{
				},
				set:()=>{
				}
			},setInterval
			,setTimeout
			,Promise
			,JSON
			,clearTimeout
			,clearInterval
			,setImmediate
			,clearImmediate
		},{
			filename:`${allEpisodes[epid].info.episodeID}.${allEpisodes[epid].info.storyFile}`
		});
		}catch(err){
			log(`ERROR| SCRIPT ERROR OCCURRED WHEN EXECUTING STORY SCRIPT:${err.stack}`);
			process.exit(7);
		}
	}
	let sectgamestate=readGameStateWithLineId(storyline.info.lineID);
	if(sectgamestate.epid){
		runEpisodeWithEpisodeId(sectgamestate.epid);
	}else{
		runEpisodeWithEpisodeId(storyline.info.entry);
	}
}

async function storyLineSelector(){
    let ltd=[0];
    let selLine;
    //if not in debug, Selector would auto run main storyline
    if(DEBUG) {
        console.log("Select a story line");
        console.log("===================");
        console.log("0) Remove Existing GameState");
        for(let line in allLines){
            console.log("%d) %s",ltd.length,allLines[line].info.lineName);
            ltd.push(line);
		}
		console.log("\x1B[2mTo exit, simply press ^C.\x1B[0m");
        while(true){
            process.stdout.write("(ID): ");
            let id=await new Promise((retr)=>{
                inputcb=retr;
            });
            inputcb=null;
            if(ltd[parseInt(id)]===undefined)continue;
            if(parseInt(id)==0){
				fs.unlink('Memory', function(err) {
   					if (err) {
       					return console.error(err);
   					}
				});
                process.exit(0);
            }
			selLine=allLines[ltd[parseInt(id)]];
            break;
        }
    } else {
		for(let line in allLines)ltd.push(line);
		selLine=allLines['helpmeout.storyline.main'];
    }
    runStoryline(selLine);
}
if(!MEMERR) storyLineSelector();
//runEpisodeWithEpisodeId(mainEpisodeID);
