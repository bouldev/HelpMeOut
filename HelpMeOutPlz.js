/* Bouldev 2020
   如需更改该文件并push，请将更改部分进行完整注释，避免工作无法衔接导致项目滞后。
   */
const fs=require("fs");
const vm=require("vm");

const DEBUG = true;
let initial = 0;

let inputcb;
process.stdin.on("data",(input)=>{
	if(inputcb)inputcb(input);
});

function log(content){
	if(DEBUG){
		console.log(`[DEBUG] ${content}`);
	}
}

function readGameState() {
	//游戏自动存档，先挖个坑
}
function setGameState() {
}
function sleep(numberMillis) {
	//延时方法 (await plz)
	return new Promise((ret)=>{
		setTimeout(ret,numberMillis);
	});
	//DEPRECATED ORIGINAL METHOD
	var now = new Date();
	var exitTime = now.getTime() + numberMillis;
	while (true) {
		now = new Date();
		if (now.getTime() > exitTime)
			return;
	}
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

let allEpisodes={};
const mainEpisodeID="helpmeout.mainepisodes.1";

for(let episode of fs.readdirSync("episodes")){
	if(!fs.existsSync(`episodes/${episode}/config.json`)){
		log(`Episode named ${episode} doesn't have a config file,ignoring.`);
		continue;
	}
	const episodeConfig=fastParse(`episodes/${episode}/config.json`);
	if(allEpisodes.hasOwnProperty(episodeConfig.info.episodeID)){
		log(`ERROR| Duplicated Episode ID: ${episodeConfig.info.episodeID}`);
		process.exit(5);
	}
	if(!fs.existsSync(`episodes/${episode}/${episodeConfig.info.storyFile}`)){
		log(`WARNING| Story file of episode with id ${episodeConfig.info.episodeID} not found,ignoring.`);
		continue;
	}
	allEpisodes[episodeConfig.info.episodeID]={info:episodeConfig.info,settings:episodeConfig.settings,script:fs.readFileSync(`episodes/${episode}/${episodeConfig.info.storyFile}`).toString()};
}
//story methods
async function story_say(text, spend, delay, skiable, wrap) {
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
	sleep(delay);
}

async function story_askforhelp(cb){
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
//story methods =END=

function runEpisodeWithEpisodeId(epid){
	if(!allEpisodes.hasOwnProperty(epid)){
		log(`ERROR| Next episode(id:${epid}) not found,nowhere to go..`);
		process.exit(6);
	}
	try{
		vm.runInNewContext(allEpisodes[epid].script,{engine:{
			log:log,
			hasEpisode:allEpisodes.hasOwnProperty,
			jumpToEpisode:runEpisodeWithEpisodeId,
			finish:()=>{
				//完成所有章节
				//目前无更多操作 故退出.
				process.exit(0);
			},
			fail:(reason)=>{
				//游戏失败
				//目前无更多操作 故退出.
				console.log(`Game failed due to ${reason}.`);
				process.exit(1);
			}
		},story:{
			say:story_say,
			askforhelp:story_askforhelp
		},setInterval,setTimeout,Promise},{filename:`${allEpisodes[epid].info.episodeID}.${allEpisodes[epid].info.storyFile}`});
	}catch(err){
		log(`ERROR| SCRIPT ERROR OCCURRED WHEN EXECUTING STORY SCRIPT:${err.stack}`);
	}
}

runEpisodeWithEpisodeId(mainEpisodeID);
