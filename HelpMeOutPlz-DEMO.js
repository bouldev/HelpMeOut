/* Bouldev 2020
	本demo主要是想要展示项目的大致立意，代码仅作为外部演示，不代表最终代码质量
*/
const fs = require('fs');
const readline = require('readline');
function readSyncByRl(tips) {
    tips = tips || '> ';
 
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
 
        rl.question(tips, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
 

function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
console.log("...");
sleep(3000);
console.log("oh my gosh, is that you?");
sleep(2000);
console.log("hard to believe that my pal...");
sleep(1000);
console.log("I don\'t know how you find here, but I\'m now stuck in this fucking console");
sleep(2000);
console.log("I tried many times, sadly, I can\'t feel my organs anyway, but this terminal.\nThis probably my only sence now, sucks");
sleep(3000);
console.log("...");
sleep(3000);
console.log("well...um...");
sleep(1000);

readSyncByRl('Can you help me out? (Y/n): ').then((res) => {
    if (res == "y" | res == "Y") {
      console.log("Really? oh god...");
      sleep(1000);
      console.log("thank you...");
    }
    sleep(3000);
    console.log("your answer is " + res);
    sleep(500);
    console.log("Level I Succeeded");
});
