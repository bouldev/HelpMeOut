# Story Script API Reference
## Namespaces
### engine
#### engine.printTestString
JavaScript 引擎测试方法，如果处于调试模式则在控制台输出TEST。
#### engine.log
记录调试日志(仅在调试模式显示)。
* Arguments
    - `string content`: 日志内容
#### engine.hasEpisode
查询章节是否存在(仅限相同故事线内)
* Arguments
    - `string episodeId`: 章节ID
* Return
    - `bool`
#### engine.jumpToEpisode
跳转到指定章节并存档(仅限相同故事线内)
* Arguments
    - `string episodeId`: 章节ID
#### engine.finish
结束故事线。
* 无参数
#### engine.fail
故事线失败时调用。
* Arguments
    - `string reason`: 原因
#### engine.sleep
以秒为单位睡眠。  
* Arguments
    - `uint32`: 等待时间(秒) 最大值为4294967295
#### engine.usleep
以微秒为单位睡眠。  
* Arguments
    - `uint32`: 等待时间(微秒) 最大值为4294967295
#### engine.canSpeechOut
检测是否可以输出声音
* 无参数
* Return
    - `bool`
### game
(每个故事线一个独立存档)
#### game.saveState
保存状态
* Arguments
    - `uint32 state`: 状态
#### game.readState
获取状态
* 无参数
* Return
    - `uint32 state`: 状态(默认为0)
### story
#### story.say
输出文字
* Arguments
    - `string text`: 内容
    - `unsigned int spend`: 文字输出耗时(s)
    - `unsigned int delay`: 输出后等待时间(s)
    - `bool skipable`: 是否可跳过(尚未实现)
    - `bool warp`: 末尾是否换行
#### story.sayvoice
输出文字并朗读
(！：仅限macOS)
* Arguments
    - `string text`: 内容
    - `unsigned int32 spend`: 文字输出耗时(s)
    - `unsigned int32 delay`: 输出后等待时间(s)
    - `bool skipable`: 是否可跳过(尚未实现)
    - `bool warp`: 末尾是否换行
    - `string actor`: 角色声音/声优名称
#### story.askforhelp
寻求帮助(选择Y/n)
* 无参数
* Return
    - `number`: 当选择Y时为`1`，选择N时为`0`，无效选择时为`-1`
#### story.askforinput
等待用户输入
* 无参数
* Return
    - `string`: 用户输入
## JS 方法
StoryScript不可以访问大部分JS方法，目前支持的部分js方法:
* `Promise`
* `JSON`
