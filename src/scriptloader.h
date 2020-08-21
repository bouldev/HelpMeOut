#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <string>
#include <libplatform/libplatform.h>
#include <v8.h>
#include <thread>
#include <memory>
#include <unistd.h>
#include "levels.h"
#include "configs.h"
#include "gamestate.h"

class ScriptLoader {
private:
	std::unique_ptr<v8::Platform> platform;
	v8::Isolate::CreateParams create_params;
	//v8::Isolate* isolate;
	std::vector<v8::Isolate *> isolates;
public:
	std::vector<std::shared_ptr<StoryLine>> storyLines;
	const StoryLine *currentStoryLine=nullptr;
	const Episode *currentEpisode=nullptr;
	std::unique_ptr<GameStateManager> gameStateManager;
	
	ScriptLoader(const std::vector<std::shared_ptr<StoryLine>> storylines,const char *argv0);
	~ScriptLoader();
	void loadScript(std::shared_ptr<const std::string> script);
	void loadEpisode(const Episode *episode);
	bool loadEpisodeWithId(const std::string episodeId);
	void loadStoryLine(const StoryLine *storyline);
	bool loadStoryLineWithId(const std::string storylineId);
};
