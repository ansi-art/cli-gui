import { Panel } from './panel.mjs';

export class OutputPanel extends Panel{
    constructor(options={}){
        super(options);
        this.options = options;
        this.history = [];
        if(!this.options.width){
            this.options.width = (
                process &&
                process.stdout &&
                process.stdout.columns
            )?process.stdout.columns:80;
        }
        if(!this.options.height){
            this.options.height = (
                process &&
                process.stdout &&
                process.stdout.rows
            )?process.stdout.rows:40;
        }
    }
    
    rerenderContent(){
        const width = this.options.width;
        const height = this.options.height;
        const lines = this.history.slice(0, height-2).map((line)=>{
            return line.substring(0, width-2);
        });
        while(lines.length < height-2) lines.push('');
        //box in content square
        this.options.content = this.justify(lines.reverse().join('\n'), this.options.width-2);
        
    }
    
    attachToConsole(){
        //const log = console.log;
        console.log = (...args)=>{
            const text = args.map((arg)=>{
                switch(typeof arg){
                    case 'object' : return JSON.stringify(arg, null, '    ');
                    case 'string' : return arg;
                    default: return arg.toString?
                        arg.toString:
                        JSON.stringify(arg, null, '    ');
                }
            }).join(', ');
            this.history.unshift(text);
            this.rerenderContent();
        };
    }
}