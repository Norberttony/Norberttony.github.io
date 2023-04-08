// Handles displaying messages into the console. Since there is a lot of overlap calls from class
// Board, there have to be certain flags or modes for the logger to decide when message should be
// sent.

class Logger {
    constructor(){
        this.consoleFlag = 1;
        this.name = "Unnamed";
    }

    log(msg){
        if (this.consoleFlag){
            console.log(`[${this.name}]: ${msg}`);
        }
    }
    warn(msg){
        console.warn(`[${this.name}]: ${msg}`);
    }
    error(msg){
        console.error(`[${this.name}]: ${msg}`);
    }

    logn(n, msg){
        console.log(`[${n}]: ${msg}`);
    }
    warnn(n, msg){
        console.warn(`[${n}]: ${msg}`);
    }
    errorn(n, msg){
        console.error(`[${n}]: ${msg}`);
    }

    setName(name){
        this.name = name;
    }
    unsetName(){
        this.name = "Unnamed";
    }

    setConsoleFlag(v){
        //this.consoleFlag = v;
    }

    // either creates a new global logger object, or returns the current one.
    static get console(){
        if (!Logger.loggerObject){
            Logger.loggerObject = new Logger();
        }
        return Logger.loggerObject;
    }
}
