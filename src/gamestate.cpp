#include "gamestate.h"

GameStateManager::GameStateManager(FILE *file){
	if(!file){
		throw std::runtime_error("Invalid pointer to file.");
	}
	sharedFile=file;
	while(feof(file)==0){
		GameStateBlock *block=new GameStateBlock();
		if(fread((void *)block,1,sizeof(GameStateBlock),sharedFile)<sizeof(GameStateBlock)){
			free(block);
			break;
		}
		std::shared_ptr<GameStateBlock> sptr(block);
		blocks.push_back(sptr);
		blockMap[block->storylineId]=std::weak_ptr<GameStateBlock>(sptr);
	}
	fseek(file,0L,SEEK_SET);
}

GameStateManager::~GameStateManager(){
	save();
	fclose(sharedFile);
}

void GameStateManager::save(){
	for(std::shared_ptr<GameStateBlock> i:blocks){
		fwrite((const void*)i.get(),1,sizeof(GameStateBlock),sharedFile);
	}
	fflush(sharedFile);
	fseek(sharedFile,0L,SEEK_SET);
}

std::shared_ptr<GameStateBlock> GameStateManager::getBlock(const std::string& storyline_id){
	size_t storylineId=std::hash<std::string>{}(storyline_id);
	auto theSearch=blockMap.find(storylineId);
	if(theSearch==blockMap.end()){
		GameStateBlock *newBlock=new GameStateBlock();
		newBlock->storylineId=storylineId;
		return addBlock(newBlock);
	}
	return theSearch->second.lock();
}

std::shared_ptr<GameStateBlock> GameStateManager::addBlock(GameStateBlock *unreleaseable_block){
	std::shared_ptr<GameStateBlock> sharedptr(unreleaseable_block);
	blocks.push_back(sharedptr);
	return sharedptr;
}
