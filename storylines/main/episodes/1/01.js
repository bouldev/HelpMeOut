async function main() {
	//await(重要！) say(文本，文本显示所需时间（秒），文本显示后所延迟时间（秒），是否可以跳过这句话（0/1）,输出完成是否换行（0/1）);
	await debug.set("hacked","hacked");
	await story.say("...",1,3,1,1);
	await story.say("oh my gosh, how do you noticed here is a person inside?",4,2,1,1);
	await story.say("hard to believe that my pal...",2,2,1,1)
	await story.say("I don’t know how you find here, but I’m now trapped in this fucking console",5,2,1,1);
	await story.say("I tried many times, sadly, I can’t feel my organs anyway, but this terminal.\nThis probably my only sense now, sucks",10,3,1,1);
	await story.say("...",1,3,1,1);
	await story.say("well...",1,1,1,0);
	await story.say("um...",2,2,1,1);
	await story.say("I know it’s troublesome, but would you help me out? ",7,1,1,0);
	let askCount=0;
	while(true){
		let firstAsk=await story.askforhelp();
		if(firstAsk==1){
			//玩家选择YES之后的剧情
			await story.say("Really? ",1,1,1,0);
			await story.say("oh god...\nI’m so grateful, how can I give back to you",8,1,1,1);
			await story.say("thank you...",2,1,1,1);
			engine.log("\x1B[2mLevel I Succeeded\x1B[0m");
			engine.jumpToEpisode("helpmeout.mainepisodes.2");
			return;
		}else if(firstAsk==0){
			//玩家选择NO之后的剧情
			await story.say("Okay...",2,1,1,0);
			await story.say("Don’t get me wrong, I’m not complaining...",5,1,1,1);
			await story.say("but thank you anyway...",3,1,1,1);
			await story.say("I'll try to figure out this by my self...",6,1,1,1);
			engine.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
            //engine.jumpToEpisode("helpmeout.mainepisodes.0");
			engine.fail("James Died");
			return;
		}else{
			if(askCount>0){
				//第二次错误输入
				await story.say("Haha, you seem to be very hesitant",5,2,1,1);
				await story.say("Okay, it’s fine that if you don’t want to help me, it’s understandable",8,2,1,1);
				await story.say("Don’t get me wrong, I’m not complaining...",5,1,1,1);
				await story.say("but thank you anyway...",3,1,1,1);
				await story.say("I’ll try to figure out this by my self...",6,1,1,1);
				engine.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
				engine.fail("James Died");
				return;
			}
			//第一次错误输入
			await story.say("Well...I need an exact answer, that’s related to my life",5,1,1,1);
			await story.say("I don’t expect you to be a good person, I just hope you can help me in this matter of life and death, seriously",10,2,1,1);
			await story.say("You just need to say ",2,0,1,0);
			await story.say("YES",1,0,1,0);
			await story.say(" or NO...",1,1,1,0);
		}
		askCount++;
	}
}
main();
//末尾一定要调用
