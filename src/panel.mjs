import { Ansi, Grid } from '@ansi-art/tools';
import { Color } from '@ansi-art/color';
export class Panel{
    constructor(options={}){
        this.options = options;
        this.dirty = true;
        const bitDepth = options.bitDepth || '4bit';
        this.bitDepth = bitDepth;
        this.color = new Color(bitDepth);
        this.ansi = new Ansi(this.color);
    }
    
    render(){
        return this.options.content;
    }
    
    offset(){
        return {
            x:0, 
            y:0
        };
    }
    
    drawOnto(grid, xOffset, yOffset){
        if(!this.grided){
            this.grided = new Grid(this.rendered, { bitDepth: this.bitDepth });
        }
        for(let row=0; row < this.grided.width; row++){
            for(let col=0; col < this.grided.height; col++){
                this.grided.setValue(0, 2, 'O');
            }
        }
    }
    
    content(){
        if(this.dirty){
            this.grided = null;
            this.rendered = this.render();
        }
        return this.rendered;
    }
}