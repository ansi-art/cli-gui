import { Ansi, Grid } from '@ansi-art/tools';
import { Color } from '@ansi-art/color';
import { Border } from '@ansi-art/table';


const nByM = (chr, n, m)=>{
    const lines = [];
    for(let row=0; row < m; row++){
        lines.push(chr.repeat(n));
    }
    return lines.join('\n');
};

const joinByLine = (a, b)=>{
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    return linesA.map((line)=>{
        return line + linesB.shift();
    }).join('\n');
};

const justify = (ansi, str, size, direction='left')=>{
    return str.split('\n').map((line)=>{
        const lineLength = ansi.length(line);
        const delta = size-lineLength;
        if(delta < 1) return str;
        if(direction === 'left'){
            return line + ' '.repeat(size-lineLength);
        }else{
            return ' '.repeat(size-lineLength) + line;
        }
    }).join('\n');
};

export class Panel{
    constructor(options={}){
        if(!options.name) options.name = 'panel-'+Math.floor(Math.random()*100000000);
        this.options = options;
        this.dirty = true;
        const bitDepth = options.bitDepth || '4bit';
        this.bitDepth = bitDepth;
        this.color = new Color(bitDepth);
        this.ansi = new Ansi(this.color);
        this.layout = {
            vertical: this.options.verticalLayout || 'center',
            horizontal: this.options.horizontalLayout || 'center',
        };
        if(this.options.text && !this.options.width){
            this.options.width = this.options.text.length + 4;
        }
        if(this.options.buttons){
            //this.options.height += 3;
        }
        this.selectedInputIndex = -1;
    }
    
    justify(str, size, direction='left'){
        return str.split('\n').map((line)=>{
            const lineLength = this.ansi.length(line);
            const delta = size-lineLength;
            if(delta < 1) return str;
            if(direction === 'left'){
                return line + ' '.repeat(size-lineLength);
            }else{
                return ' '.repeat(size-lineLength) + line;
            }
        }).join('\n');
    }
    
    render(){
        if(this.options.width && this.options.height){
            let content = this.options.content || nByM(' ', this.options.width-2, this.options.height-2);
            if(this.options.buttons){
                let button = null;
                let buttonGroup = ' \n \n ';
                //let buttonMap = {};
                
                for(let lcv=0; lcv < this.options.buttons.length; lcv++){
                    button = this.options.buttons[lcv];
                    let buttonAnsi = Border.create({content: ` ${button.label} `});
                    const grid = new Grid(buttonAnsi, { bitDepth: this.bitDepth });
                    if( this.selectedInputIndex === lcv){
                        for(let lcv=0; lcv < grid.height; lcv++){
                            grid.setStyles(0, lcv, ['inverse']);
                        }
                    }
                    buttonGroup = joinByLine(buttonGroup, grid.toString());
                    
                }
                buttonGroup = joinByLine(buttonGroup, ' \n \n ');
                buttonGroup = justify(this.ansi, buttonGroup, this.options.width-2, (
                    this.options.buttonAlign  || 'right'
                ));
                content = content+'\n'+buttonGroup;
            }
            const bordered = Border.create({content});
            this.grided = new Grid(bordered, { bitDepth: this.bitDepth });
            if(this.options.text){
                for(let lcv=0; lcv< this.options.text.length; lcv++){
                    this.grided.setValue(2+lcv, 2, this.options.text[lcv]);
                }
            }
            return this.grided;
        }else throw new Error('bounds not set');
    }
    
    selectNextFocusable(){
        if(this.options.buttons){
            this.selectedInputIndex = (this.selectedInputIndex+1)%this.options.buttons.length;
            console.log(
                'input-focus: '+
                (this.selectedInputIndex+1)+
                '/'+this.options.buttons.length
            );
        }
    }
    
    selectedInput(){
        if(!this.options.buttons) return null;
        if(this.selectedInputIndex === -1) return null;
        return this.options.buttons[this.selectedInputIndex];
    }
    
    offsets(height, width){
        //TODO: handle margins padding and border
        let x = 0;
        let y = 0;
        switch(this.layout.horizontal){
            case 'center':
            case 'middle':
                //eslint-disable-next-line no-case-declarations
                const panelOffsetX = Math.floor(this.options.width/2);
                //eslint-disable-next-line no-case-declarations
                const centerX = Math.floor(width/2);
                x = centerX - panelOffsetX;
                break;
            case 'left':
                x = 0;
                break;
            case 'right':
                x = width - this.options.width;
                break;
        }
        switch(this.layout.vertical){
            case 'center':
            case 'middle':
                //eslint-disable-next-line no-case-declarations
                const panelOffsetY = Math.floor(this.options.height/2);
                //eslint-disable-next-line no-case-declarations
                const centerY = Math.floor(height/2);
                y = centerY - panelOffsetY;
                break;
            case 'top':
                y = 0;
                break;
            case 'bottom':
                y = height - this.options.height;
                break;
        }
        return { x, y };
    }
    
    drawOnto(grid, xOffset=0, yOffset=0, focused=false){
        const grided = this.content();
        let value = null;
        for(let row=0; row < grided.height; row++){
            for(let col=0; col < grided.width; col++){
                value = grided.getValue(col, row) || {chr: ' ', styles:[]};
                if(!value.styles){
                    value.styles = [];
                }
                grid.setValue( col + yOffset, row + xOffset, value.chr, value.styles);
            }
        }
    }
    
    content(){
        return this.render();
        /*if(this.dirty){
            this.grided = null;
            this.rendered = this.render();
            this.dirty = false;
        }
        return this.rendered;*/
    }
}