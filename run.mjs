import { Interface, Panel } from './src/index.mjs';

const ui = new Interface();
const panel = new Panel({ 
    height: 25,
    width: 150,
    text: 'This is a question?'
})
ui.addPanel
ui.fullFrameRenderLoop();
//console.log(ui.render(40, 80))