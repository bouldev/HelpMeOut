/*	Bouldev 2020
	如需更改该文件并push，请将更改部分进行完整注释，避免工作无法衔接导致项目滞后。
*/
const fs=require("fs");
const vm=require("vm");
const crypto=require("crypto");
const zlib=require("zlib");
var exec = require('child_process').exec;
var cmdSay = "";

let DEBUG = true;

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
function aes256encrypt(data){
	return crypto.createCipheriv("aes-256-cfb",Buffer.from("Help me out plz,this is the key."),Buffer.from("bushe nmsl wrnmb")).update(data);
}
function aes256decrypt(data){
	return crypto.createDecipheriv("aes-256-cfb",Buffer.from("Help me out plz,this is the key."),Buffer.from("bushe nmsl wrnmb")).update(data).toString();
}
function aes256decryptToBuf(data){
	return crypto.createDecipheriv("aes-256-cfb",Buffer.from("Help me out plz,this is the key."),Buffer.from("bushe nmsl wrnmb")).update(data);
}

// 存档 GAMESTATE

// (以下方法在storyScript中不能使用)
// ENGINE WIDE readGameStateWithEpid:
// string lid: 故事线ID
// return: SECTION {lid: ,epid: ,data: ,state: }
// return: ^ 如未找到则返回{}.
function readGameStateWithLineId(lid) {
	if(!fs.existsSync("Memory"))return {};
	let mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
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
	if(!state)state=0;
	let mem={};
	if(fs.existsSync("Memory")){
		mem=JSON.parse(zlib.gunzipSync(aes256decryptToBuf(fs.readFileSync("Memory"))));
	}
	if(mem.hasOwnProperty(lid)){
		mem[lid].lid=lid;
		mem[lid].epid=epid;
		if(data!==null)mem[lid].data=data;
		if(state!=-1)mem[lid].state=state;
	}else{
		if(data===null)data={};
		if(state==-1)state=0;
		mem[lid]={lid,epid,data,state};
	}
	fs.writeFileSync("Memory",aes256encrypt(zlib.gzipSync(JSON.stringify(mem))));
	
	
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

for(let episode of fs.readdirSync("storylines")){
	if(!fs.existsSync(`storylines/${episode}/manifest.json`)){
		log(`Storyline named ${episode} doesn't have a manifest file,ignoring.`);
		continue;
	}
	const episodeConfig=fastParse(`storylines/${episode}/manifest.json`);
	if(allLines.hasOwnProperty(episodeConfig.lineID)){
		log(`ERROR| Duplicated Storyline ID: ${episodeConfig.lineID}`);
		process.exit(5);
	}
	episodeConfig.episodes_dir=episodeConfig.episodes_dir.replace(/\.\./g,"");
	if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}`)){
		log(`WARNING| Episodes directory not found in storyline w/ id ${episodeConfig.lineID}, ignoring.`);
		continue;
	}
	let episodes={};
	for(let ep of fs.readdirSync(`storylines/${episode}/${episodeConfig.episodes_dir}`)){
		if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/config.json`)){
			log(`Episode named ${ep} doesn't have a config file,ignoring.`);
			continue;
		}
		const epConfig=fastParse(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/config.json`);
		if(episodes.hasOwnProperty(epConfig.episodeID)){
			log(`ERROR(IGN)| Duplicated Episode ID ${epConfig.episodeID} in storyline with id: ${episodeConfig.lineID}, IGNORING.`);
			continue;
		}
		if(!fs.existsSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/${epConfig.storyFile}`)){
			log(`WARNING| Story file of episode with id ${epConfig.episodeID} not found,ignoring.`);
			continue;
		}
		episodes[epConfig.episodeID]={info:epConfig,script:fs.readFileSync(`storylines/${episode}/${episodeConfig.episodes_dir}/${ep}/${epConfig.storyFile}`).toString()};
	}
	if(Object.keys(episodes).length==0){
		log(`WARNING| Storyline w/ id ${episodeConfig.lineID} does not have any episode, ignoring.`);
		continue;
	}
	if(!episodes.hasOwnProperty(episodeConfig.entry)){
		log(`WARNING| Entry episode of storyline with id ${episodeConfig.lineID} not found, ignoring this storyline.`);
		continue;
	}
	allLines[episodeConfig.lineID]={info:episodeConfig,episodes};
}
/*
for(let episode of fs.readdirSync("episodes")){
	if(!fs.existsSync(`episodes/${episode}/config.json`)){
		log(`Episode named ${episode} doesn't have a config file,ignoring.`);
		continue;
	}
	const episodeConfig=fastParse(`episodes/${episode}/config.json`);
	if(allEpisodes.hasOwnProperty(episodeConfig.episodeID)){
		log(`ERROR| Duplicated Episode ID: ${episodeConfig.episodeID}`);
		process.exit(5);
	}
	if(!fs.existsSync(`episodes/${episode}/${episodeConfig.storyFile}`)){
		log(`WARNING| Story file of episode with id ${episodeConfig.episodeID} not found,ignoring.`);
		continue;
	}
	allEpisodes[episodeConfig.episodeID]={info:episodeConfig,script:fs.readFileSync(`episodes/${episode}/${episodeConfig.storyFile}`).toString()};
}*/
//story methods
async function story_say(text, spend, delay, skiable, wrap) {
	if(typeof(text)!="string"){
		throw new TypeError("story.say: Invalid type of argument text");
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

async function story_askforhelp(){
	story_say("(Y/n): ",0,0,1,0);
	let input=await new Promise((ret)=>{
		inputcb=ret;
	});
	input = input.toString().trim().toLowerCase();
	if (['y', 'yes'].indexOf(input) > -1) {
		return 1;
	}else if (['n', 'no'].indexOf(input) > -1) {
		return 0;
	}else{
		return -1;
	}
}

async function story_askforinput(){
	story_say("(Input): ",0,0,1,0);
	let input=await new Promise((ret)=>{
		inputcb=ret;
	});
	return input
}
//story methods =END=

function runStoryline(storyline){
	let allEpisodes=storyline.episodes;
	function runEpisodeWithEpisodeId(epid){
		if(!allEpisodes.hasOwnProperty(epid)){
			log(`ERROR| Next episode(id:${epid}) not found,nowhere to go..`);
			process.exit(6);
		}
		saveGameStateWithLineIdAndState(storyline.lineID,epid,null,-1);
		try{
			vm.runInNewContext(allEpisodes[epid].script,{engine:{
				log:log,
				hasEpisode:allEpisodes.hasOwnProperty,
				jumpToEpisode:runEpisodeWithEpisodeId,
				sleepNoAwait:(numberMillis,noDeprecationWarning)=>{
					// DEPRECATED , USE (await) engine.sleep instead.
					if(!noDeprecationWarning)log(`engine.sleepNoAwait is deprecated,please use await engine.sleep instead.`);
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
				fail:(reason)=>{
					//游戏失败
					//目前无更多操作 故退出.
					console.log(`Game failed due to ${reason}.`);
					process.exit(1);
				},
				// SLEEP: ASYNC
				sleep:sleep,
				isiOS:()=>{
					return false;
				},
				isInMacOS:()=>{
					return (require("os").platform()=="darwin");
				}
			},game:{
				saveState:(state)=>{
					if(typeof(state)!="number"){
						throw new TypeError("saveState: state must be a number.");
					}
					saveGameStateWithLineIdAndState(storyline.lineID,epid,null,state);
				},
				readState:()=>{
					return readGameStateWithLineId(storyline.lineID).state;
				},
				saveGameData:(data)=>{
					saveGameStateWithLineIdAndState(storyline.lineID,epid,data,-1);
				},
				readGameData:()=>{
					return readGameStateWithLineId(storyline.lineID).data;
				}
			},story:{
				say:story_say,
				sayvoice:story_say_with_voice,
				askforhelp:story_askforhelp,
				askforinput:story_askforinput
			},setInterval,setTimeout,Promise,JSON,clearTimeout,clearInterval,setImmediate,clearImmediate},{filename:`${allEpisodes[epid].info.episodeID}.${allEpisodes[epid].info.storyFile}`});
		}catch(err){
			log(`ERROR| SCRIPT ERROR OCCURRED WHEN EXECUTING STORY SCRIPT:${err.stack}`);
			process.exit(7);
		}
	}
	let sectgamestate=readGameStateWithLineId(storyline.lineID);
	if(sectgamestate.epid){
		runEpisodeWithEpisodeId(sectgamestate.epid);
	}else{
		runEpisodeWithEpisodeId(storyline.info.entry);
	}
}

async function storyLineSelector(){
	console.log("Select a story line");
	console.log("===================");
	console.log("0) Exit");
	let ltd=[0];
	for(let line in allLines){
		console.log("%d) %s",ltd.length,allLines[line].info.lineName);
		ltd.push(line);
	}
	let selLine;
	while(true){
		process.stdout.write("(ID): ");
		let id=await new Promise((retr)=>{
			inputcb=retr;
		});
		inputcb=null;
		if(ltd[parseInt(id)]===undefined)continue;
		if(parseInt(id)==0){
			process.exit(0);
		}
		selLine=allLines[ltd[parseInt(id)]];
		break;
	}
	runStoryline(selLine);
}
storyLineSelector();
//runEpisodeWithEpisodeId(mainEpisodeID);
