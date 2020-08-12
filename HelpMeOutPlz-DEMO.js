/* Bouldev 2020
   本项目仅作为概念展示之用，不代表最终产品质量
   如需更改该文件并push，请将更改部分进行完整注释，避免工作无法衔接导致项目滞后。
*/
var initial = 0;
function readGameState() {
    //游戏自动存档，先挖个坑
}
function setGameState() {
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
exports.say = function(text, spend, delay, skiable, wrap) {
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

function minify(json) {
    //JSON注释处理
    //可以用于读取带注释的JSON文件
    var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
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
};
/* 下面是故事文件的读取部分，还没想好怎么写，先硬编一个 */
var wj = require('./episodes/1/Waken James.js');
wj.main();