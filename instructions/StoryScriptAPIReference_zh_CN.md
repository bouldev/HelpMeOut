# Story Script API Reference
* 注意: 标有`(async)`的方法调用时在方法名前加`await `。
## Namespaces
### engine
#### engine.log
记录调试日志。
* Arguments
    - `string content`: 日志内容
#### engine.hasEpisode
查询章节是否存在(仅限相同故事线内)
* Arguments
    - `string episodeId`: 章节ID
#### engine.jumpToEpisode
跳转到指定章节并存档(仅限相同故事线内)
* Arguments
    - `string episodeId`: 章节ID
#### engine.sleepNoAwait
以毫秒为单位睡眠。  
该方法性能消耗较高。  
**已弃用: 使用(async) engine.sleep代替。**
* Arguments
    - `number numberMillis`: 等待时间(毫秒)
    - `BOOL noDeprecationWarning`: 不进行弃用提示
#### engine.finish
结束故事线。
* 无参数
#### engine.fail
故事线失败时调用。
* Arguments
    - `string reason`: 原因
#### (async) engine.sleep
以毫秒为单位睡眠。  
* Arguments
    - `number numberMillis`: 等待时间(毫秒)
### game
(每个故事线一个独立存档)
#### game.saveState
保存状态
* Arguments
    - `number state`: 状态
#### game.readState
获取状态
* 无参数
* Return
    - `number state`: 状态(默认为0)
#### game.saveGameData
保存数据
* Arguments
    - `(any) data`: 数据
#### game.readGameData
获取数据
* 无参数
* Return
    - `(any) data`: 数据(默认为`{}`)
### story
#### (async) story.say
输出文字
* Arguments
    - `string text`: 内容
    - `unsigned int spend`: 文字输出耗时(ms)
    - `unsigned int delay`: 输出后等待时间(ms)
    - `bool skipable`: 是否可跳过(尚未实现)
    - `bool warp`: 末尾是否换行
#### (async) story.sayvoice
输出文字并朗读
(！：仅限macOS)
* Arguments
    - `string text`: 内容
    - `unsigned int spend`: 文字输出耗时(ms)
    - `unsigned int delay`: 输出后等待时间(ms)
    - `bool skipable`: 是否可跳过(尚未实现)
    - `bool warp`: 末尾是否换行
    - `string actor`: 角色声音/声优名称
#### (async) story.askforhelp
寻求帮助(选择Y/n)
* 无参数
* Return
    - `number`: 当选择Y时为`1`，选择N时为`0`，无效选择时为`-1`
#### (async) story.askforinput
等待用户输入
* 无参数
* Return
    - `string`: 用户输入
## JS 方法
StoryScript不可以访问所有JS方法，目前仅支持以下js方法:
* `setInterval`
* `setTimeout`
* `Promise`
* `JSON`
* `clearTimeout`
* `clearInterval`
* `setImmediate`
* `clearImmediate`
