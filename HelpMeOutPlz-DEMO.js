/* Bouldev 2020
   本项目仅作为概念展示之用，不代表最终产品质量
   如需更改该文件并push，请将更改部分进行完整注释，避免工作无法衔接导致项目滞后。
*/
var initial = 0;
function readGameState() {
    //游戏自动存档，先挖个坑
}
function sleep(numberMillis) {
    //延时方法
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
function say(text, spend, delay, skiable, wrap) {
    //James标准输出方法
    if (process.argv.slice(2) == "debug") {
        //为了节省测试时间，启动时后面附带debug可以省略特效
        spend = 0;
        delay = 0;
    } else {
        spend = spend * 1000;
        delay = delay * 1000;
    }
    var output = text.split("");
    if (skiable == 1) {
        //还没想好怎么写gg
        //我认为一个真实的思想是不会允许其他人打断的
    }
    for (var i = 0; i < output.length; i++) {
        process.stdout.write(output[i]);
        sleep(spend / output.length);
    }
    if (wrap == 1) {
        process.stdout.write("\n");
    }
    sleep(delay);
}
/*
——————————以下是故事情节———————————
 这里就是我们需要考虑做成外部文件的部分
————————————————————————————————
*/
//say(文本，文本显示所需时间（秒），文本显示后所延迟时间（秒），是否可以跳过这句话（0/1）,输出完成是否换行（0/1）);
say("...",1,3,1,1);
say("oh my gosh, is that you?",2,2,1,1);
say("hard to believe that my pal...",2,2,1,1)
say("I don\'t know how you find here, but I\'m now stuck in this fucking console",5,2,1,1);
say("I tried many times, sadly, I can\'t feel my organs anyway, but this terminal.\nThis probably my only sense now, sucks",10,3,1,1);
say("...",1,3,1,1);
say("well...",1,1,1,0);
say("um...",2,2,1,1);
say("I know it\'s troublesome, but would you help me out? ",7,1,1,0);
function askforhelp(j) {
    initial = j;
    say("(Y/n): ",0,0,1,0);
    process.stdin.on('data',(input)=>{
        input = input.toString().trim().toLowerCase();
        if (['y', 'yes'].indexOf(input) > -1) {
            //玩家选择YES之后的剧情
            say("Really? ",1,1,1,0);
            say("oh god...\nI\'m so grateful, how can I give back to you",8,1,1,1);
            say("thank you...",2,1,1,1);
            //console.log("your answer is " + input);
            console.log("\x1B[2mLevel I Succeeded\x1B[0m");
            process.exit(0);
        } else if (['n', 'no'].indexOf(input) > -1) {
            //玩家选择NO之后的剧情
            say("Okay...",2,1,1,0);
            say("Don't get me wrong, I'm not complaining...",5,1,1,1);
            say("but thank you anyway...",3,1,1,1);
            say("I\'ll try to figure out this by my self...",6,1,1,1);
            //console.log("your answer is " + input);
            console.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
            process.exit(1);
        } else if (initial == 0 && initial != 1) {
            //玩家错误输入第二次
            say("Haha, you seem to be very hesitant",5,2,1,1);
            say("Okay, it\'s fine that if you don’t want to help me, it’s understandable",8,2,1,1);
            say("Don't get me wrong, I'm not complaining...",5,1,1,1);
            say("but thank you anyway...",3,1,1,1);
            say("I\'ll try to figure out this by my self...",6,1,1,1);
            console.log("\x1B[2mJames Died\nLevel I failed\x1B[0m");
            process.exit(1);
        } else if (initial == 1 && initial != 0) {
            //玩家错误输入第一次
            say("Well...I need an exact answer, that\'s related to my life",5,1,1,1);
            say("I don’t expect you to be a good person, I just hope you can help me in this matter of life and death, seriously",10,2,1,1);
            say("You just need to say ",2,0,1,0);
            say("YES",1,0,1,0);
            say(" or NO...",1,1,1,0);
            askforhelp(0);
        }
    });
}
askforhelp(1);