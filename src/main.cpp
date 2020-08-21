#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <memory>

#include <sys/types.h>
#include <dirent.h>

#include <libplatform/libplatform.h>
#include <v8.h>
#include "levels.h"
#include "scriptloader.h"

// NOT CONST DUE TO IT MAY NEED TO CHANGE DYNAMICALLY.
static const char *storylines_path="../storylines";
static std::vector<std::shared_ptr<StoryLine>> storylines;

int main(int argc,char *argv[]){
	storylines=loadStorylinesFromDirectory(storylines_path);
	ScriptLoader scriptLoader(storylines,argv[0]);
	/*if(!scriptLoader.loadStoryLineWithId("helpmeout.storyline.main")){
		fprintf(stderr,"Unable to load main storyline.\n");
		return 1;
	}*/
	printf("Select a story line\n");
	printf("===================\n");
	printf("0) Exit\n");
	for(int i=0;i<storylines.size();i++){
		printf("%d) %s\n",i+1,storylines[i]->name.c_str());
	}
	char selLine[16]={0};
	while(1){
		printf("ID: ");
		fgets(selLine,15,stdin);
		int sel=atoi(selLine);
		if(sel==0)return 0;
		if(sel-1>=storylines.size()||sel<0)continue;
		scriptLoader.loadStoryLine(storylines[sel-1].get());
	}
	return 0;
}
