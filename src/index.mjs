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
//import { Panel } from './panel.mjs';

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
    }
    
    removePanel(panel){
        
    }
    
    alert(content){
        
    }
    
    render(rows, cols){
        const content =  nByM('X', rows-2, cols-2);
        const borderedFrame = Border.create({ content });
        const grid = new Grid(borderedFrame, { bitDepth: this.bitDepth });
        let offset = null;
        for(let lcv=0; lcv < this.panels.length; lcv++){
            offset = this.panels.offsets();
            this.panels[lcv].drawOnto(grid, offset.x, offset.y);
        }
        return grid.toString();
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
            //var numLines = frame?frame.split("\n").length:0;
            setTimeout(()=>{
                process.stdout.write('\x1B['+(rows)+'F');
                loop();
            });
        };
        //mouse events on
        //console.log('\x1B[?1000h');
        process.stdout.write('\x1B[?12l');
        loop();
        process.stdin.setRawMode(true);
        process.stdin.on('data', (buffer) => {
            const keyName = getKeyName(buffer.toJSON().data);
            if(keyName === 'Escape'){
                process.exit();
            }
            /*
            switch(keyName){
                case 'ArrowUp' : 
                    engine.grid.avatar.position.y++;
                    break;
                case 'ArrowDown' : 
                    engine.grid.avatar.position.y--;
                    break;
                case 'ArrowLeft' : 
                    engine.grid.avatar.position.x--;
                    break;
                case 'ArrowRight' : 
                    engine.grid.avatar.position.x++;
                    break;
                default: console.log(keyName);
            }
            //*/
            //console.log(keyName);
        });
    }
}

const Key = {
    Unknown  : '',
    
    // other Ascii
    Backspace  : 'Backspace',
    Tab  : 'Tab',
    Enter  : 'Enter',
    Escape  : 'Escape',
    Space  : 'Space',
    Delete  : 'Delete',
    
    // arrows
    ArrowUp  : 'ArrowUp',
    ArrowDown  : 'ArrowDown',
    ArrowRight  : 'ArrowRight',
    ArrowLeft  : 'ArrowLeft',
    
    // cursor position
    Home  : 'Home',
    Insert  : 'Insert',
    End  : 'End',
    PageUp  : 'PageUp',
    PageDown  : 'PageDown',
    
    // functional
    F1  : 'F1',
    F2  : 'F2',
    F3  : 'F3',
    F4  : 'F4',
    F5  : 'F5',
    F6  : 'F6',
    F7  : 'F7',
    F8  : 'F8',
    F9  : 'F9',
    F10  : 'F10',
    F11  : 'F11',
    F12  : 'F12'
};

const keyMap = [
    // other ASCII
    { data: [[8], [127]], keyName: Key.Backspace }, // ssh connection via putty generates 127 for Backspace - weird...
    { data: [[9]], keyName: Key.Tab },
    { data: [[13]], keyName: Key.Enter },
    { data: [[27]], keyName: Key.Escape },
    { data: [[32]], keyName: Key.Space },
    { data: [[27, 91, 51, 126]], keyName: Key.Delete },
    // arrows
    { data: [[27, 91, 65]], keyName: Key.ArrowUp },
    { data: [[27, 91, 66]], keyName: Key.ArrowDown },
    { data: [[27, 91, 67]], keyName: Key.ArrowRight },
    { data: [[27, 91, 68]], keyName: Key.ArrowLeft },
    // cursor position
    { data: [[27, 91, 49, 126]], keyName: Key.Home },
    { data: [[27, 91, 50, 126]], keyName: Key.Insert },
    { data: [[27, 91, 52, 126]], keyName: Key.End },
    { data: [[27, 91, 53, 126]], keyName: Key.PageUp },
    { data: [[27, 91, 54, 126]], keyName: Key.PageDown },
    // functional
    { data: [[27, 91, 91, 65], [27, 91, 49, 49, 126]], keyName: Key.F1 },
    { data: [[27, 91, 91, 66], [27, 91, 49, 50, 126]], keyName: Key.F2 },
    { data: [[27, 91, 91, 67], [27, 91, 49, 51, 126]], keyName: Key.F3 },
    { data: [[27, 91, 91, 68], [27, 91, 49, 52, 126]], keyName: Key.F4 },
    { data: [[27, 91, 91, 69], [27, 91, 49, 53, 126]], keyName: Key.F5 },
    { data: [[27, 91, 49, 55, 126]], keyName: Key.F6 },
    { data: [[27, 91, 49, 56, 126]], keyName: Key.F7 },
    { data: [[27, 91, 49, 57, 126]], keyName: Key.F8 },
    { data: [[27, 91, 50, 48, 126]], keyName: Key.F9 },
    { data: [[27, 91, 50, 49, 126]], keyName: Key.F10 },
    { data: [[27, 91, 50, 51, 126]], keyName: Key.F11 },
    { data: [[27, 91, 50, 52, 126]], keyName: Key.F12 }
];

export const getKeyName = (data) => {
    let match;
    
    if (isSingleBytePrintableAscii(data)) {
        return String.fromCharCode(data[0]);
    }
    
    match = keyMap.filter((entry) => {
        const innerResult = entry.data.filter((subEntry) => subEntry.join(',') === data.join(','));
    
        return innerResult.length > 0;
    });
    
    if (match.length === 1) {
        return match[0].keyName;
    }
    
    return Key.Unknown;
};

const isSingleBytePrintableAscii = (data) => {
    // skip tilde as this is not the key available via single press
    return data.length === 1 &&
        '!'.charCodeAt(0) <= data[0] &&
        data[0] <= '}'.charCodeAt(0);
};