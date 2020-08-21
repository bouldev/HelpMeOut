#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <sys/types.h>
#include <dirent.h>

#include <vector>
#include <string>
#include <json/json.h>
#include <memory>

class Episode {
public:
	std::string name;
	std::string episodeId;
	std::shared_ptr<std::string> storyScript;
	
	Episode(const std::string episodeDir);
};

class StoryLine {
public:
	std::string version;
	std::string name;
	std::string lineId;
	std::vector<std::shared_ptr<Episode>> episodes;
	Episode *entry=nullptr;
	
	StoryLine(const std::string storylineDir);
};

std::vector<std::shared_ptr<StoryLine>> loadStorylinesFromDirectory(const char *storylinesContainer);
