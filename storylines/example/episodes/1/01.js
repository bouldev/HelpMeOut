async function main() {
	await story.say("Welcome to HelpMeOut Developer Guide!",4,3,1,1);
    await story.say("In this guide, we will tell you how to use ours API.",4,3,1,1);
    engine.log("Currently NOT IN USE. Sorry.");
    debug.get("state_raw");
    if (engine.isMacOS) {
        engine.log("macOS detected.");
    }
    while(true) {
        let firstAsk=await story.askforhelp(true);
        if(firstAsk==1) {
            //玩家选择YES之后的剧情
            await story.say("YES",1,4,1,1);
        } else if(firstAsk==0) {
            //玩家选择NO之后的剧情
            await story.say("NO",1,4,1,1);
        } else {
            await story.say(firstAsk+"",1,4,1,1);
            await story.say((firstAsk=="fuck")?"fuckyou too":"fuckyou",1,4,1,1);
        }
        engine.finish();
    }
}
main();
