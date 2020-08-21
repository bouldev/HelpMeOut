#include "scriptloader.h"

static ScriptLoader *sharedScriptLoader;

static const char* ToCString(const v8::String::Utf8Value& value) {
	return *value ? *value : "<string conversion failed>";
}

static unsigned int msTOus(unsigned int ms){
	return ms*1000;
}

#define THROW_EXCEPTION(str) isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,str));
#define SCRIPT_FUNCTION(super,sub) static void super##_##sub(const v8::FunctionCallbackInfo<v8::Value>& args)

class ScriptFunctions {
public:

	static void engine_printTestString(const v8::FunctionCallbackInfo<v8::Value>& args){
#if HMO_DEBUG
		printf("TEST\n");
#endif
	}

	static void engine_log(const v8::FunctionCallbackInfo<v8::Value>& info){
#if HMO_DEBUG
		v8::Isolate *isolate=info.GetIsolate();
		if(info.Length()<1){
			return;
		}
		v8::Local<v8::String> content=info[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		printf("%s\n",ToCString(v8::String::Utf8Value(isolate,content)));
#endif
	}

	static void engine_hasEpisode(const v8::FunctionCallbackInfo<v8::Value>& info){
		v8::Isolate *isolate=info.GetIsolate();
		if(info.Length()<1){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Too few parameters."));
			return;
		}
		v8::Local<v8::String> gvid=info[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		for(std::shared_ptr<Episode> ep:sharedScriptLoader->currentStoryLine->episodes){
			if(strcmp(ep->episodeId.c_str(),ToCString(v8::String::Utf8Value(isolate,gvid)))==0){
				info.GetReturnValue().Set(true);
				return;
			}
		}
		info.GetReturnValue().Set(false);
		return;
	}
	
	static void engine_jumpToEpisode(const v8::FunctionCallbackInfo<v8::Value>& args){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()<1){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Too few parameters."));
			return;
		}
		v8::Local<v8::String> gvid=args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		for(std::shared_ptr<Episode> ep:sharedScriptLoader->currentStoryLine->episodes){
			if(strcmp(ep->episodeId.c_str(),ToCString(v8::String::Utf8Value(isolate,gvid)))==0){
				isolate->TerminateExecution();
				sharedScriptLoader->loadEpisode(ep.get());
				return;
			}
		}
		isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Episode not found"));
	}
	
	static void engine_finish(const v8::FunctionCallbackInfo<v8::Value>& args){
		exit(0);
	}
	
	static void engine_fail(const v8::FunctionCallbackInfo<v8::Value>& args){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()<1){
			printf("Episode %s failed.\n",sharedScriptLoader->currentEpisode->name.c_str());
		}else{
			v8::Local<v8::String> reason=args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
			printf("Episode %s failed due to %s.\n",sharedScriptLoader->currentEpisode->name.c_str(),ToCString(v8::String::Utf8Value(isolate,reason)));
		}
		exit(0);
	}
	
	static void engine_sleep(const v8::FunctionCallbackInfo<v8::Value>& args){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()<1){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Too few parameters."));
			return;
		}
		sleep(args[0]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value());
	}
	
	static void engine_usleep(const v8::FunctionCallbackInfo<v8::Value>& args){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()<1){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Too few parameters."));
			return;
		}
		usleep(args[0]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value());
	}
	
	SCRIPT_FUNCTION(engine,canSpeechOut){
		v8::Isolate *isolate=args.GetIsolate();
		args.GetReturnValue().Set(access("/usr/bin/say",F_OK)==0);
	}
	
	SCRIPT_FUNCTION(game,saveState){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()!=1){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Bad parameters"));
			return;
		}
		u_int32_t value=args[0]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value();
		sharedScriptLoader->gameStateManager->getBlock(sharedScriptLoader->currentStoryLine->lineId)->gameState=value;
		sharedScriptLoader->gameStateManager->save();
	}
	
	SCRIPT_FUNCTION(game,readState){
		args.GetReturnValue().Set(sharedScriptLoader->gameStateManager->getBlock(sharedScriptLoader->currentStoryLine->lineId)->gameState);
	}
	
	SCRIPT_FUNCTION(story,say){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()!=5){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Bad parameters"));
			return;
		}
		v8::Local<v8::String> contentStr=args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		v8::String::Utf8Value utf8val(isolate,contentStr);
		const char *content=ToCString(utf8val);
		u_int32_t spend=args[1]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value();
		u_int32_t delay=args[2]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value();
#if HMO_DEBUG
		spend=delay=0;
#else
		spend=spend*1000000;
		delay=delay*1000000;
#endif
		bool skipable=*(args[3]->ToBoolean(isolate));
		bool warp=*(args[4]->ToBoolean(isolate));
		size_t out_length=strlen(content);
		while(*content!=0){
			printf("%c",*content);
			fflush(stdout);
			usleep(spend/out_length);
			content++;
		}
		if(warp){
			printf("\n");
			fflush(stdout);
		}
		usleep(delay);
	}
	
	SCRIPT_FUNCTION(story,sayvoice){
		v8::Isolate *isolate=args.GetIsolate();
		if(args.Length()!=6){
			isolate->ThrowException(v8::String::NewFromUtf8Literal(isolate,"Bad parameters"));
			return;
		}
		v8::Local<v8::String> contentStr=args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		v8::String::Utf8Value utf8val(isolate,contentStr);
		const char *content=ToCString(utf8val);
		u_int32_t spend=args[1]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value();
		u_int32_t delay=args[2]->ToUint32(isolate->GetCurrentContext()).ToLocalChecked()->Value();
#if HMO_DEBUG
		spend=delay=0;
#else
		spend=spend*1000000;
		delay=delay*1000000;
#endif
		bool skipable=*(args[3]->ToBoolean(isolate));
		bool warp=*(args[4]->ToBoolean(isolate));
		v8::Local<v8::String> castStr=args[5]->ToString(isolate->GetCurrentContext()).ToLocalChecked();
		v8::String::Utf8Value cutf8val(isolate,contentStr);
		const char *cast=ToCString(cutf8val);
		size_t out_length=strlen(content);
		std::thread sayThread([=](){
			char command[1024]={0};
			sprintf(command,"say -v %s %s",cast,content);
			system(command);
		});
		while(*content!=0){
			printf("%c",*content);
			fflush(stdout);
			usleep(spend/out_length);
			content++;
		}
		if(warp){
			printf("\n");
			fflush(stdout);
		}
		usleep(delay);
		sayThread.join();
	}
	
	SCRIPT_FUNCTION(story,askforhelp){
		printf("(y/n): ");
		fflush(stdout);
		fflush(stdin);
		char result[6]={0};
		fgets(result,5,stdin);
		if(strcmp(result,"y\n")==0||strcmp(result,"yes\n")==0){
			args.GetReturnValue().Set(1);
		}else if(strcmp(result,"n\n")==0||strcmp(result,"no\n")==0){
			args.GetReturnValue().Set(0);
		}else{
			args.GetReturnValue().Set(-1);
		}
	}
	
	SCRIPT_FUNCTION(story,askforinput){
		v8::Isolate *isolate=args.GetIsolate();
		printf("(Input): ");
		fflush(stdout);
		fflush(stdin);
		char input[1024]={0};
		fgets(input,1023,stdin);
		args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate,input,v8::NewStringType::kNormal).ToLocalChecked());
	}
};

#define NEWFUNC(name,callback) Set(v8::String::NewFromUtf8Literal(isolate,name),v8::FunctionTemplate::New(isolate,callback))
#define SFUNC(super,name) NEWFUNC(#name,ScriptFunctions::super##_##name)

static void ReportException(v8::Isolate* isolate, v8::TryCatch* try_catch,const std::string episodeId,const std::string storylineId) {
	fprintf(stderr,"Exception trapped in episode with ID %s of storyline with ID %s:\n",episodeId.c_str(),storylineId.c_str());
	v8::HandleScope handle_scope(isolate);
	v8::String::Utf8Value exception(isolate, try_catch->Exception());
	const char* exception_string = ToCString(exception);
	v8::Local<v8::Message> message = try_catch->Message();
	if (message.IsEmpty()) {
		// V8 didn't provide any extra information about this error; just
		// print the exception.
		fprintf(stderr, "%s\n", exception_string);
	} else {
		// Print (filename):(line number): (message).
		v8::String::Utf8Value filename(isolate,
			message->GetScriptOrigin().ResourceName());
		v8::Local<v8::Context> context(isolate->GetCurrentContext());
		const char* filename_string = ToCString(filename);
		int linenum = message->GetLineNumber(context).FromJust();
		fprintf(stderr, "%s:%i: %s\n", filename_string, linenum, exception_string);
		// Print line of source code.
		v8::String::Utf8Value sourceline(
			isolate, message->GetSourceLine(context).ToLocalChecked());
		const char* sourceline_string = ToCString(sourceline);
		fprintf(stderr, "%s\n", sourceline_string);
		// Print wavy underline (GetUnderline is deprecated).
		int start = message->GetStartColumn(context).FromJust();
		for (int i = 0; i < start; i++) {
			fprintf(stderr, " ");
		}
		int end = message->GetEndColumn(context).FromJust();
		for (int i = start; i < end; i++) {
			fprintf(stderr, "^");
		}
		fprintf(stderr, "\n");
		v8::Local<v8::Value> stack_trace_string;
		if (try_catch->StackTrace(context).ToLocal(&stack_trace_string) &&
			stack_trace_string->IsString() &&
			v8::Local<v8::String>::Cast(stack_trace_string)->Length() > 0) {
			v8::String::Utf8Value stack_trace(isolate, stack_trace_string);
			const char* stack_trace_string = ToCString(stack_trace);
			fprintf(stderr, "%s\n", stack_trace_string);
		}
	}
}

ScriptLoader::ScriptLoader(const std::vector<std::shared_ptr<StoryLine>> storylines,const char *argv0) {
	if(sharedScriptLoader){
		fprintf(stderr,"Too many script loaders created.\n");
		exit(11);
	}
	sharedScriptLoader=this;
	storyLines=storylines;
	v8::V8::InitializeICUDefaultLocation(argv0);
	v8::V8::InitializeExternalStartupData(argv0);
	platform = v8::platform::NewDefaultPlatform();
	v8::V8::InitializePlatform(platform.get());
	v8::V8::Initialize();
	create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
	//isolate=v8::Isolate::New(create_params);
	gameStateManager=std::make_unique<GameStateManager>((access("Memory",F_OK)==0)?fopen("Memory","rb+"):fopen("Memory","wb+"));
}

ScriptLoader::~ScriptLoader(){
	//isolate->Dispose();
	//for(auto i:isolates){
	//	i->Dispose();
	//}
	v8::V8::Dispose();
	v8::V8::ShutdownPlatform();
	delete create_params.array_buffer_allocator;
}

void ScriptLoader::loadScript(std::shared_ptr<const std::string> scriptSource){
	std::thread([=](){
	v8::Isolate* isolate=v8::Isolate::New(create_params);
	isolates.push_back(isolate);
	v8::Isolate::Scope isolate_scope(isolate);
	v8::HandleScope handle_scope(isolate);
	v8::Local<v8::ObjectTemplate> engine=v8::ObjectTemplate::New(isolate);
	/*engine->Set(v8::String::NewFromUtf8Literal(isolate,"printTestString"),v8::FunctionTemplate::New(isolate,ScriptFunctions::engine_printTestString));
	engine->NEWFUNC("log",ScriptFunctions::engine_log);
	engine->NEWFUNC("hasEpisode",ScriptFunctions::engine_hasEpisode);
	engine->NEWFUNC("jumpToEpisode",ScriptFunctions::engine_jumpToEpisode);
	engine->NEWFUNC("finish",ScriptFunctions::engine_finish);
	engine->NEWFUNC("fail",ScriptFunctions::engine_fail);*/
	engine->SFUNC(engine,printTestString);
	engine->SFUNC(engine,log);
	engine->SFUNC(engine,hasEpisode);
	engine->SFUNC(engine,jumpToEpisode);
	engine->SFUNC(engine,finish);
	engine->SFUNC(engine,fail);
	engine->SFUNC(engine,sleep);
	engine->SFUNC(engine,usleep);
	engine->SFUNC(engine,canSpeechOut);
	v8::Local<v8::ObjectTemplate> game=v8::ObjectTemplate::New(isolate);
	game->SFUNC(game,saveState);
	game->SFUNC(game,readState);
	v8::Local<v8::ObjectTemplate> story=v8::ObjectTemplate::New(isolate);
	story->SFUNC(story,say);
	story->SFUNC(story,sayvoice);
	story->SFUNC(story,askforhelp);
	story->SFUNC(story,askforinput);
	v8::Local<v8::ObjectTemplate> global=v8::ObjectTemplate::New(isolate);
	global->Set(v8::String::NewFromUtf8Literal(isolate,"engine"),engine);
	global->Set(v8::String::NewFromUtf8Literal(isolate,"game"),game);
	global->Set(v8::String::NewFromUtf8Literal(isolate,"story"),story);
	v8::Local<v8::Context> context=v8::Context::New(isolate,NULL,global);
	if(context.IsEmpty()){
		fprintf(stderr,"Error creating context.\n");
		exit(2);
	}
	v8::Context::Scope context_scope(context);
	v8::ScriptOrigin origin(v8::String::NewFromUtf8(isolate,(currentStoryLine->lineId+":"+currentEpisode->episodeId).c_str(),v8::NewStringType::kNormal).ToLocalChecked());
	v8::TryCatch tryCatch(isolate);
	v8::Local<v8::Script> script;
	if(!v8::Script::Compile(context,v8::String::NewFromUtf8(isolate,scriptSource->c_str(),v8::NewStringType::kNormal).ToLocalChecked(),&origin).ToLocal(&script)){
		ReportException(isolate,&tryCatch,currentEpisode->episodeId,currentStoryLine->lineId);
		return;
	}
	v8::Local<v8::Value> result;
	if(!script->Run(context).ToLocal(&result)&&!tryCatch.HasTerminated()){
		ReportException(isolate,&tryCatch,currentEpisode->episodeId,currentStoryLine->lineId);
		exit(1);
	}
	return;
	}).join();
	exit(0);
}

void ScriptLoader::loadEpisode(const Episode *episode){
	currentEpisode=episode;
	std::shared_ptr<GameStateBlock> block=gameStateManager->getBlock(currentStoryLine->lineId);
	block->episodeId=std::hash<std::string>{}(episode->episodeId);
	gameStateManager->save();
	loadScript(episode->storyScript);
}

bool ScriptLoader::loadEpisodeWithId(const std::string episodeId) {
	if(!currentStoryLine)return false;
	for(auto i:currentStoryLine->episodes){
		loadEpisode(i.get());
		return true;
	}
	return false;
}

void ScriptLoader::loadStoryLine(const StoryLine *storyline) {
	currentStoryLine=storyline;
	auto lineBlock=gameStateManager->getBlock(currentStoryLine->lineId);
	if(lineBlock->episodeId!=0){
		for(auto ptr:currentStoryLine->episodes){
			if(std::hash<std::string>{}(ptr->episodeId)==lineBlock->episodeId){
				loadEpisode(ptr.get());
				return;
			}
		}
	}
	loadEpisode(storyline->entry);
}

bool ScriptLoader::loadStoryLineWithId(const std::string storylineId) {
	for(auto storyline:storyLines){
		if(storyline->lineId==storylineId){
			loadStoryLine(storyline.get());
			return true;
		}
	}
	return false;
}
