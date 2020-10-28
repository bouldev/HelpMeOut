async function main() {
	await story.say("...",1,3,1,1);
	await story.say("Target progress is not responding...",4,3,1,1);
    await story.say("Connection attempt 1",4,3,1,0);
    await story.say("...",4,3,1,0);
    await story.say("\x1B[31mFAILED!\x1B[0m",0,3,1,1);
    await story.say("Connection attempt 2",4,3,1,0);
    await story.say("...",4,3,1,0);
    await story.say("\x1B[31mFAILED!\x1B[0m",0,3,1,1);
    await story.say("Connection attempt 3",4,3,1,0);
    await story.say("...",4,3,1,0);
    await story.say("\x1B[31mFAILED!\x1B[0m",0,3,1,1);
    await story.say("\x1B[33mUnable to initiate connection to progress \"James Bunder\".\x1B[0m",0,1,1,1);
    await story.say("Recover data? ",0,2,1,0);
    while(true) {
        let firstAsk=await story.askforhelp();
        if(firstAsk==1) {
            //玩家选择YES之后的剧情
            await story.say("Processing...",1,4,1,0);
            await story.say("\x1B[33mDONE!\x1B[0m",1,1,1,1);
            engine.log("\x1B[2mLevel Reinitiated\x1B[0m");
            engine.jumpToEpisode("helpmeout.mainepisodes.1");
        } else {
            //玩家选择NO之后的剧情
            await story.say("Terminating...",1,1,1,1);
            engine.log("\x1B[2mPlayer selected NO, gamestate remains\x1B[0m");
        }
        engine.finish();
    }
}
main();
