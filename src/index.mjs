/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

/**
 * A JSON object
 * @typedef { object } JSON
 */

import { Border } from '@ansi-art/table';
import { Ansi, Grid } from '@ansi-art/tools';
import { Color } from '@ansi-art/color';
import { Panel } from './panel.mjs';
import { OutputPanel } from './output-panel.mjs';
import { InteractiveInput } from '@ansi-art/interactive-input';

export { Panel, OutputPanel };

const nByM = (chr, n, m)=>{
    const lines = [];
    for(let row=0; row < n; row++){
        lines.push(chr.repeat(m));
    }
    return lines.join('\n');
};

export class Interface{
    constructor(options={}){
        this.panels = [];
        const bitDepth = options.bitDepth || '4bit';
        this.bitDepth = bitDepth;
        this.color = new Color(bitDepth);
        this.ansi = new Ansi(this.color);
    }
    
    addPanel(panel){
        this.panels.push(panel);  
        if(!this.focused) this.focused = panel;
    }
    
    removePanel(panel){
        const index = this.panels.indexOf(panel);
        if(index!==-1){
            this.panels.splice(index, 1);
            if(this.focused === panel) this.focused = null;
        }else{
            this.terminate(true);
        }
    }
    
    focus(panel){
        this.focused = panel;
    }
    
    focusedPanel(){
        return this.focused;
    }
    
    pick(x, y){
        let offset = null;
        for(let lcv=0; lcv < this.panels.length; lcv++){
            offset = this.panels[lcv].offsets(y, x);
            if(
                x > offset.x &&
                x < offset.x + this.panels[lcv].width &&
                y > offset.y &&
                y < offset.y + this.panels[lcv].height
            ){
                console.log('FOUND', x, y, this.panels[lcv]);
                process.exit();
                return this.panels[lcv];
            }
        }
        return null;
    }
    
    consoleOuput(){
        const panel = new OutputPanel({ 
            height: 10,
            verticalLayout: 'bottom'
        });
        this.addPanel(panel);
        panel.attachToConsole();
        this.focus(panel);
        return panel;
    }
    
    alert(content){
        const panel = new Panel({ 
            height: 5,
            text: content,
            name:'alert-'+Math.floor(Math.random()*100000000),
            buttons: [
                { 
                    label: 'OK',
                    action: ()=>{ }
                }
            ]
        });
        this.addPanel(panel);
        this.focus(panel);
    }
    
    async confirm(content, confirmFn){
        const panel = new Panel({ 
            height: 5,
            text: content,
            name:'confirm-'+Math.floor(Math.random()*100000000),
            buttons: [
                { 
                    label: 'Cancel',
                    action: ()=>{
                        this.removePanel(panel);
                    }
                },
                { 
                    label: 'OK',
                    action: ()=>{
                        this.terminate(true);
                    }
                }
            ]
        });
        this.addPanel(panel);
        this.focus(panel);
    }
    
    dialog(content, buttons){
        const panel = new Panel({ 
            height: 5,
            name:'dialog-'+Math.floor(Math.random()*100000000),
            text: content,
            buttons
        });
        this.addPanel(panel);
        this.focus(panel);
    }
    
    render(rows, cols){
        const content =  nByM('X', rows-2, cols-2);
        const borderedFrame = Border.create({ content });
        const grid = new Grid(borderedFrame, { bitDepth: this.bitDepth });
        let offset = null;
        for(let lcv=0; lcv < this.panels.length; lcv++){
            offset = this.panels[lcv].offsets(rows, cols);
            this.panels[lcv].drawOnto(grid, offset.y, offset.x);
        }
        if(this.cursor && this.cursor.x && this.cursor.y){
            console.log(this.cursor);
            //process.exit();
            //const value = grid.getValue(this.cursor.x, this.cursor.y); //value.chr
            grid.setValue(this.cursor.x, this.cursor.y, '↖', ['inverse']);
            grid.setValue(
                this.cursor.x+1, 
                this.cursor.y, 
                grid.getValue( this.cursor.x+1, this.cursor.y).chr, 
                ['reset']);
        }
        return grid.toString().trim();
    }
    
    async initialize(){
        /*
        await new Promise((resolve, reject)=>{
            //tput civis
            const initExpression = 'tput civis;';
            //const initExpression = 'curs_set(0) ';
            exec(initExpression, (error, stdout, stderr)=>{
                if(error) reject(error);
                resolve();
            });
        });
        //*/
    }
    
    terminate(stop){
        if(this.input) this.input.stop();
        if(stop) process.exit();
    }
    
    async fullFrameRenderLoop(){
        await this.initialize();
        const loop = ()=>{
            const columns = (
                process &&
                process.stdout &&
                process.stdout.columns
            )?process.stdout.columns:80;
            const rows = (
                process &&
                process.stdout &&
                process.stdout.rows
            )?process.stdout.rows:40;
            const frame = this.render(rows, columns);
            process.stdout.write(frame);
            setTimeout(()=>{
                process.stdout.write('\x1B['+(rows)+'F');
                loop();
            });
        };
        loop();
        
        const tracker = new InteractiveInput({});
        this.input = tracker;
        process.stdin.setRawMode(true);
        process.stdin.on('data', (buffer) => {
            tracker.consume(buffer.toJSON());
        });
        tracker.start();
        const gracefulTerminate = ()=>{ this.terminate(); };
        process.on('SIGTERM', gracefulTerminate);
        process.on('SIGINT', gracefulTerminate);
        tracker.on('keypress', (event)=>{
            process.stdout.write(JSON.stringify(event));
            if(event.ctrlKey && event.key === 'q'){
                this.confirm('Are you sure you want to quit?', ()=>{
                    this.terminate(true);
                });
            }
            if(event.key === 'Escape'){
                if(this.console){
                    this.removePanel(this.console);
                    this.console = null;
                }else{
                    this.console = this.consoleOuput();
                }
            }
            if(event.key === 'Enter'){
                if(this.focused){
                    const input = this.focused.selectedInput();
                    if(input){
                        const action = input.action;
                        if(action){
                            action();
                        }
                    }
                }
            }
            if(event.key === 'Tab'){
                if(this.focused){
                    this.focused.selectNextFocusable();
                }
            }
            if(event.ctrlKey && event.key === 'c'){
                this.terminate(true);
            }
        });
        tracker.on('mousedown', (event)=>{
            console.log(event);
            this.pick(event.pageX, event.pageY);
        });
        tracker.on('mousemove', (event)=>{
            this.cursor = {
                x: event.pageX,
                y: event.pageY
            };
        });
        tracker.on('mouseup', (event)=>{
            this.pick(event.pageX, event.pageY);
        });
    }
}