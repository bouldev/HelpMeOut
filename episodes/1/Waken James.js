var story = require('../../HelpMeOutPlz-DEMO');
//剧情文件（Not in use currently）
var initial = 0;
if (process.argv.slice(2) == "main") {
    main();
}
exports.main = function() {
    //say(文本，文本显示所需时间（秒），文本显示后所延迟时间（秒），是否可以跳过这句话（0/1）,输出完成是否换行（0/1）);
    story.say("...",1,3,1,1);
    story.say("oh my gosh, how do you noticed here is a person inside?",4,2,1,1);
    story.say("hard to believe that my pal...",2,2,1,1)
    story.say("I don’t know how you find here, but I’m now stuck in this fucking console",5,2,1,1);
    story.say("I tried many times, sadly, I can’t feel my organs anyway, but this terminal.\nThis probably my only sense now, sucks",10,3,1,1);
    story.say("...",1,3,1,1);
    story.say("well...",1,1,1,0);
    story.say("um...",2,2,1,1);
    story.say("I know it’s troublesome, but would you help me out? ",7,1,1,0);
    function askforhelp(j) {
        initial = j;
        story.say("(Y/n): ",0,0,1,0);
        process.stdin.on('data',(input)=>{
            input = input.toString().trim().toLowerCase();
            if (['y', 'yes'].indexOf(input) > -1) {
                //玩家选择YES之后的剧情
                story.say("Really? ",1,1,1,0);
                story.say("oh god...\nI’m so grateful, how can I give back to you",8,1,1,1);
                story.say("thank you...",2,1,1,1);
                //console.log("your answer is " + input);
                console.log("\x1B[2mLevel I Succeeded\x1B[0m");
                process.exit(0);
            } else if (['n', 'no'].indexOf(input) > -1) {
                //玩家选择NO之后的剧情
                story.say("Okay...",2,1,1,0);
                story.say("Don’t get me wrong, I’m not complaining...",5,1,1,1);
                story.say("but thank you anyway...",3,1,1,1);
                story.say("I'll try to figure out this by my self...",6,1,1,1);
                //console.log("your answer is " + input);
                console.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
                process.exit(1);
            } else if (initial == 0 && initial != 1) {
                //玩家错误输入第二次
                story.say("Haha, you seem to be very hesitant",5,2,1,1);
                story.say("Okay, it’s fine that if you don’t want to help me, it’s understandable",8,2,1,1);
                story.say("Don’t get me wrong, I’m not complaining...",5,1,1,1);
                story.say("but thank you anyway...",3,1,1,1);
                story.say("I’ll try to figure out this by my self...",6,1,1,1);
                console.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
                process.exit(1);
            } else if (initial == 1 && initial != 0) {
                //玩家错误输入第一次
                story.say("Well...I need an exact answer, that’s related to my life",5,1,1,1);
                story.say("I don’t expect you to be a good person, I just hope you can help me in this matter of life and death, seriously",10,2,1,1);
                story.say("You just need to say ",2,0,1,0);
                story.say("YES",1,0,1,0);
                story.say(" or NO...",1,1,1,0);
                askforhelp(0);
            }
        });
    }
    askforhelp(1);
}
