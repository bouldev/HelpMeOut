#include "levels.h"

const std::vector<std::string> episodeRequiredElements={"storyFile","episodeName","episodeID"};

Episode::Episode(const std::string episodeDir){
	FILE *manifestFile=fopen((episodeDir+std::string("/config.json")).c_str(),"rb");
	if(!manifestFile){
		fprintf(stderr,"Episode in %s load failed due to config.json not found.\n",episodeDir.c_str());
		throw (short)32767;
	}
	fseek(manifestFile,0,SEEK_END);
	long fileLength=ftell(manifestFile);
	if(fileLength==0){
		fprintf(stderr,"Empty episode config file in %s.\n",episodeDir.c_str());
		fclose(manifestFile);
		throw (char)32767;
	}
	fseek(manifestFile,0,SEEK_SET);
	char *filecontent=(char *)calloc(1,fileLength+1);
	fread((void *)filecontent,1,fileLength,manifestFile);
	fclose(manifestFile);
	Json::Reader reader;
	Json::Value root;
	if(!reader.parse(std::string(filecontent),root)){
		free(filecontent);
		fprintf(stderr,"Failed to parse config.json in storyline %s.\n",episodeDir.c_str());
		throw (short)32767;
	}
	free(filecontent);
	for(std::string i:episodeRequiredElements){
		if(!root.isMember(i)){
			fprintf(stderr,"Required JSON member(%s) not found in config.json of episode %s.\n",i.c_str(),episodeDir.c_str());
			throw (short)32767;
		}
	}
	name=root["episodeName"].asString();
	episodeId=root["episodeID"].asString();
	FILE *scriptFile=fopen((episodeDir+std::string("/")+root["storyFile"].asString()).c_str(),"rb");
	if(!scriptFile){
		fprintf(stderr,"Episode w/ id %s load failed due to story script file not found.\n",episodeId.c_str());
		throw (short)32767;
	}
	fseek(scriptFile,0,SEEK_END);
	fileLength=ftell(scriptFile);
	if(fileLength==0){
		fprintf(stderr,"Empty story script file in episode with id %s.\n",episodeId);
		fclose(scriptFile);
		throw (char)32767;
	}
	fseek(manifestFile,0,SEEK_SET);
	filecontent=(char *)calloc(1,fileLength+1);
	fread((void *)filecontent,1,fileLength,scriptFile);
	fclose(scriptFile);
	storyScript=std::shared_ptr<std::string>(new std::string(filecontent));
	free(filecontent);
}

const std::vector<std::string> storyLineRequiredElements={"version","lineName","lineID","entry","episodes_dir"};

StoryLine::StoryLine(const std::string storylineDir){
	FILE *manifestFile=fopen((storylineDir+std::string("/manifest.json")).c_str(),"rb");
	if(!manifestFile){
		fprintf(stderr,"StoryLine in %s load failed due to manifest.json not found.\n",storylineDir.c_str());
		throw (char)1;
	}
	fseek(manifestFile,0,SEEK_END);
	long fileLength=ftell(manifestFile);
	if(fileLength==0){
		fclose(manifestFile);
		fprintf(stderr,"Empty storyline manifest file in %s.\n",storylineDir.c_str());
		throw (char)1;
	}
	fseek(manifestFile,0,SEEK_SET);
	char *filecontent=(char *)calloc(1,fileLength+1);
	fread((void *)filecontent,1,fileLength,manifestFile);
	fclose(manifestFile);
	Json::Reader reader;
	Json::Value root;
	if(!reader.parse(std::string(filecontent),root)){
		free(filecontent);
		fprintf(stderr,"Failed to parse manifest.json in storyline %s.\n",storylineDir.c_str());
		throw (char)1;
	}
	free(filecontent);
	for(std::string i:storyLineRequiredElements){
		if(!root.isMember(i)){
			fprintf(stderr,"Required JSON member(%s) not found in manifest.json of storyline %s.\n",i.c_str(),storylineDir.c_str());
			throw (char)1;
		}
	}
	version=root["version"].asString();
	name=root["lineName"].asString();
	lineId=root["lineID"].asString();
	DIR *container=opendir((storylineDir+std::string("/")+root["episodes_dir"].asString()).c_str());
	if(!container){
		fprintf(stderr,"Failed to open episode container of storyline w/ id %s.\n",lineId.c_str());
		throw (char)1;
	}
	struct dirent *entry;
	char dirname[513]={0};
	while((entry=readdir(container))!=nullptr){
		try{
			if(entry->d_type!=DT_DIR||strcmp(entry->d_name,".")==0||strcmp(entry->d_name,"..")==0){
				continue;
			}
			sprintf(dirname,"%s/%s/%s",storylineDir.c_str(),root["episodes_dir"].asString().c_str(),entry->d_name);
			Episode *current=new Episode((const std::string)std::string(dirname));
			if(current->episodeId==root["entry"].asString()){
				this->entry=current;
			}
			episodes.push_back(std::shared_ptr<Episode>(current));
		}catch(short jumpoutcode){}
	}
	if(!this->entry){
		fprintf(stderr,"Entry episode of storyline w/ id %s not found or has error.\n",lineId.c_str());
		throw (char)1;
	}
}

std::vector<std::shared_ptr<StoryLine>> loadStorylinesFromDirectory(const char *storylinesContainer) {
	std::vector<std::shared_ptr<StoryLine>> output;
	DIR *container=opendir(storylinesContainer);
	if(!container)return output;
	struct dirent *entry;
	char dirname[513]={0};
	while((entry=readdir(container))!=nullptr){
		try{
			if(entry->d_type!=DT_DIR||strcmp(entry->d_name,".")==0||strcmp(entry->d_name,"..")==0){
				continue;
			}
			sprintf(dirname,"%s/%s",storylinesContainer,entry->d_name);
			output.push_back(std::shared_ptr<StoryLine>(new StoryLine(std::string(dirname))));
		}catch(char jumpoutcode){}
	}
	return output;
}
