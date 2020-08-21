story.say("...",1,3,1,1);
story.say("Oh, forget to tell ya, my name is James Bunder",4,1,1,1);
story.say("spells ",1,0,1,0);
story.say("JAMES BUNDER",4,2,1,1);
if(engine.canSpeechOut()){
	osx();
}
engine.finish();
function osx() {
	story.say("Wait, ",0.5,0,1,0);
	story.say("are you using macOS?",1.5,1,1,1);
	story.say("I pretty like this OS and I personally owned many iMacs and MacBooks",5,3,1,1);
	story.say("yes, there's a veeeeeery amazing feature if you are using Mac",2.5,2,1,1);
	story.sayvoice("I can literally speak something here!",3,2,1,1,"daniel");
	story.sayvoice("But I can't hear my own voice",2,2,1,1,"daniel");
}
