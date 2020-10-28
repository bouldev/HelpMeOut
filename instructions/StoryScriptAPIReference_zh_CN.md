# Story Script API Reference
## Namespaces
### Examples
Format: 
```JavaScript
namespaces.methods(arguments);
```
Samples:
```JavaScript
//Check OS
if (engine.isWindows) {
    //[DEBUG]Windows Sucks
    engine.log("Windows Sucks");
    //Output "Wow, Windows best." in 4s with animation
    story.say("Wow, Windows best.",4,0,1,1);
    //Switch current episode to "helpmeout.mainepisodes.0"
    engine.jumpToEpisode("helpmeout.mainepisodes.0");
} else {
    //Initiate a Y/n input
    let answer = story.askforhelp();
    if (answer == 1) {
        //Player selects YES
        story.say("True",0,0,1,1);
    } else if (answer == 0) {
        //Player selects NO
        story.say("False",0,0,1,1);
    } else {
        //Player attempts enter something else
        story.say("What the hell you inputed?",0,0,1,1);
    }
}
```
### engine
| 方法 | 描述 | 参数 | 返回 |
| -- | -- | -- | -- |
|`canSpeechOut`|检测是否可以输出声音||`bool`|
|`debug`|返回调试状态||`bool`|
|`fail`|故事线失败时调用|`string reason`: 原因||
|`finish`|结束故事线|||
|`hasEpisode`|查询章节是否存在(仅限相同故事线内)|`string episodeId`: 章节ID|`bool`|
|`isAndroid`|是否为安卓<br>**该方法处于实验阶段**||`bool`|
|`isDarwin`|是否为Darwin族||`bool`|
|`isiOS`|是否为iOS（iPhone/iPad/iPod touch/Simulator）<br>**该方法处于实验阶段**||`bool`|
|`isLinux`|是否为Linux族||`bool`|
|`isMacOS`|是否为macOS||`bool`|
|`isUnixBased`|是否为UNIX族||`bool`|
|`isUnixLike`|是否为类UNIX||`bool`|
|`isWindows`|是否为Windows设备||`bool`|
|`jumpToEpisode`|跳转到指定章节并存档(仅限相同故事线内)|`string episodeId`: 章节ID||
|`log`|记录调试日志(仅在调试模式显示)|`string content`: 日志内容||
|`printTestString`|JavaScript 引擎测试方法，如果处于调试模式则在控制台输出TEST|||
|`sleep`|以秒为单位睡眠|`uint32`: 等待时间(秒) 最大值为4294967295||
|`usleep`|以微秒为单位睡眠|`uint32`: 等待时间(微秒) 最大值为4294967295||
### game
(每个故事线一个独立存档)
| 方法 | 描述 | 参数 | 返回 |
| -- | -- | -- | -- |
|`readState`|获取状态||`uint32 state`: 状态(默认为0)|
|`saveState`|保存状态|`uint32 state`: 状态||
### story
| 方法 | 描述 | 参数 | 返回 |
| -- | -- | -- | -- |
|`askforhelp`|寻求帮助(选择Y/n)<br>**Y可以为yes/1/true/y，N可以为no/0/false/n；不区分大小写**|可选：<br>`bool`: 是否返回意外输入|`number`: 当选择Y时为`1`，选择N时为`0`，无效选择时为`-1`<br>**调用时传入true的情况下，无效选择返回用户输入**|
|`askforinput`|等待用户输入||`string`: 用户输入|
|`say`|输出文字|`string text`: 内容<br>`unsigned int spend`: 文字输出耗时(s)<br>`unsigned int delay`: 输出后等待时间(s)<br>`bool skipable`: 是否可跳过(尚未实现)<br>`bool warp`: 末尾是否换行||
|`sayvoice`|输出文字并朗读<br>(！：仅限macOS)|`string text`: 内容<br>`unsigned int32 spend`: 文字输出耗时(s)<br>`unsigned int32 delay`: 输出后等待时间(s)<br>`bool skipable`: 是否可跳过(尚未实现)<br>`bool warp`: 末尾是否换行<br>`string actor`: 角色声音/声优名称||
## JS 方法
StoryScript不可以访问大部分JS方法，目前支持的部分js方法:
* `Promise`
* `JSON`
