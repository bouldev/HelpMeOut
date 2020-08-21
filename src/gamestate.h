#include <functional>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <memory>
#include <map>

struct GameStateBlock {
public:
	size_t storylineId;
	size_t episodeId;
	u_int32_t gameState;
	char writableMemory[64];
	char gameDataArea[32];
private:
	size_t languageRESERVED;
	size_t systemRESERVED;
};

class GameStateManager {
private:
	std::vector<std::shared_ptr<GameStateBlock>> blocks;
	std::map<size_t,std::weak_ptr<GameStateBlock>> blockMap;
	FILE *sharedFile=nullptr;
public:
	GameStateManager(FILE *file);  //rb+ is required.
	~GameStateManager();
	void save();
	std::shared_ptr<GameStateBlock> getBlock(const std::string& storyline_id);
	std::shared_ptr<GameStateBlock> addBlock(GameStateBlock *unreleaseable_block);
};
