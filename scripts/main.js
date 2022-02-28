 var waves = [];
var mousePos = {x:0,y:0};
//elements
var indexSelector = document.getElementById('waveIndexSelector');
var workSpace = document.getElementById('workspace');
var header = document.getElementById('header');
var canvas = document.getElementById('lineCanvas');
var mathdiv = document.getElementById('mathopreations');
//holding
var ctx = canvas.getContext('2d');
var currentPointId = 0;
var holdingPoint = false;
var startY = window.innerHeight/2;
var indexTimer = 0;
var addedButtonIds = 0;
var MathNames = [];
var MathClasses = new Map();
class wave{
    constructor(){
        this.id = 0;
        this.samples = [];
        this.controlHTML = '';
        this.typeName = '';
        this.mathOperations = [];
    }
    getMathId(id){
        for(let i=0;i<this.mathOperations.length;i++){
            if(this.mathOperations[i].id == id){
                return i;
            }
        }
    }
    draw(){
    }
    loadHtml(){
        document.getElementById('controlDiv').innerHTML = this.getControlHTML(this);  
    }
    drawSamples(self){
        ctx.beginPath();
        ctx.moveTo(-10,0);
        self.runMath(self);
        for(let i=0;i<self.samples.length;i++){
            ctx.lineTo(i,(self.samples[i]*window.innerHeight)+header.getBoundingClientRect().height+startY)  
        }
        ctx.stroke();
    }
    getControlHTML(self){
        return self.controlHTML;
    }
    tick(){}
    update(){}
    runMath(self){
        for(let i=0;i<self.mathOperations.length;i++){
            self.mathOperations[i].parent = this;
            self.mathOperations[i].run();
        }
    }
    addMath(){
        this.mathOperations[this.mathOperations.length] = new mathAdd();
        this.updateMath(this);
    }
    updateMath(self){
        mathdiv.innerHTML = '';
        let newMath = [];
        for(let i=0;i<self.mathOperations.length;i++){
            if(self.mathOperations[i].destroyed == false){
                newMath[newMath.length] = self.mathOperations[i];
            }
        }
        self.mathOperations = newMath;
        for(let i=0;i<self.mathOperations.length;i++){
            mathdiv.innerHTML +='<div class="mathDiv">'+self.mathOperations[i].getHTML()+'</div>';
        }
    }
}
class pointWave extends wave{
    constructor(){
        super(wave);
        this.typeIndex = 0;
        this.controlHTML = "<button onClick='addPoint()'>add</button>";
        this.points = [];
    }
    addPoint(){
        this.points[this.points.length] = new vector2(canvas.width/2,0);
    }
    update(){    
    let pointIds = 0;
        for(let i=0;i<this.points.length;i++){
            workSpace.innerHTML+=getPointHTML(this.points[i],pointIds);
            pointIds++;
        }
    }
    tick(){
        if(holdingPoint){
            this.points[currentPointId].x = mousePos.x;
            this.points[currentPointId].y = mousePos.y-header.getBoundingClientRect().height;
        }
    }
    draw(){
        this.points2 = this.points;
        this.points = rearange(this.points);
        calculateWave(this);
        this.drawSamples(this);
        this.points = this.points2;
    }  
}
class constWave extends wave{
    constructor(){
        super(wave);
        this.value = 1;
    }
    getControlHTML(self){
        return '<input type="number">'+self.value;
    }
}
class oscWave extends wave{
    constructor(){
        super(wave);
        this.type = 0;
        this.amp = 0.5;
        this.frequency = 1;
        this.controlHTML = '';
        this.typeIndex = 2;
    }
    getControlHTML(self){
        return 'frequency:<input type="range" min="0" step="0.1" max="15" id="oscWave_freq" value='+self.frequency+'><br>'+
        'amp:<input value='+self.amp+' type="range" step=0.01 min=0 max=1 id="oscWave_amp" value="0.5"><br>'+'wave type:'+self.getwaveSelectorHTML(self)+
        self.getCheckBoxHTML(self);
    }
    getCheckBoxHTML(self){
        if(self.flip){
            return 'flipped:<input type="checkbox" id="oscWave_flipped" checked>';
        }else{
            return 'flipped:<input type="checkbox" id="oscWave_flipped">'
        }
    }
    getwaveSelectorHTML(self){
        let typeNames = ['triangle','sin','square','wave','ramp'];
        let ret = '<select name="oscWave_type" id="oscWave_type">';
        for(let i=0;i<typeNames.length;i++){
            let selected = '';
            if(i==self.type){selected = 'selected';}
            ret+='<option value="'+i+'" '+selected+'>'+typeNames[i]+'</option>'
        }
        ret+='</select>'
        return ret;
    }
    draw(){    
        if(indexSelector.value == this.id&&indexTimer>10){
            if(document.getElementById('oscWave_type') == null){
                this.loadHtml();
            }
            this.type = document.getElementById('oscWave_type').value;
            this.amp = document.getElementById('oscWave_amp').value;
            this.frequency = document.getElementById('oscWave_freq').value;
            this.flip = document.getElementById('oscWave_flipped').checked;
    }
        for(let i=0;i<window.innerWidth;i++){
            this.samples[i] = getPointInWave(i,this.type,this.frequency,this.amp,this.flip);
        }
        this.drawSamples(this);
    }
}
function getPointInWave(x,typId='0',frequency=1,amp=1,flip=false){
    let y = (x*frequency)/100;
    let wav = 0;
    switch(typId){
        case '0':
            wav = Math.abs(y-Math.floor(y)-0.5)*2;
            break;
        case '1':
            wav = (Math.sin(y*Math.PI)+1)/2;
            break;
        case '2':
            wav = Math.round((Math.sin(y*Math.PI)+1)/2)
            break;
        case '3':
            wav = Math.abs(((Math.sin(y*Math.PI)+1)/2)-0.5)*2;
            break;
        case '4':
            wav = y-Math.floor(y);
            break;    
            
    }
    wav = (wav*window.innerWidth*amp)-((amp*window.innerWidth)/2);
    if(flip){
        wav = wav*-1;
    }
    wav = wav/window.innerHeight;
    //console.log(wav)
    return wav;
}
function addWave(){
    waves[waves.length] = new pointWave();
    indexSelector.max = waves.length-1;

}
addWave();
addWave();
addWave();
addWave();
function updatePerlinWave(id){
    waves[indexSelector.value].generate();
}
function updateWaveType(elm){
    let mathStorage = waves[indexSelector.value].mathOperations;
    switch(elm.value){
        case 'points':
            waves[indexSelector.value] = new pointWave();
        break;
        case 'osc':
            waves[indexSelector.value] = new oscWave();
        break;
        case 'constant':
            waves[indexSelector.value] = new constWave();
        break;
    }
    waves[indexSelector.value].mathOperations = mathStorage;
    waves[indexSelector.value].loadHtml();
}
indexSelector.onchange=function(){
    let typeSelector = document.getElementById('typeSelector');
    typeSelector.options.selectedIndex = waves[indexSelector.value].typeIndex;
    waves[indexSelector.value].loadHtml();
    waves[indexSelector.value].updateMath(waves[indexSelector.value]);
}
indexSelector.onchange();
function addPoint(){
    waves[indexSelector.value].addPoint();
}

function updatePoints(){
    workSpace.innerHTML = '';
    waves[indexSelector.value].update();
}

function getPointHTML(v2,id){
    return '<div class="point" onmousedown="onPointClick(this)" id="'+id+'" style="margin-left:'+v2.x+'px;margin-top:'+v2.y+'px;"></div>'
}
function onPointClick(element){
    element.holding = true;
    holdingPoint = true;
    currentPointId = element.id.split('_')[0];
}
function onMouseUp(){
    holdingPoint = false;
}
//ticking
setInterval(tick,10);
function tick(){
    startY = window.innerHeight/2;
    indexTimer++;
    tickPoints();
    updatePoints();
    draw();
}
document.addEventListener("mousemove", function(e){
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});
function tickPoints(){ 
    waves[indexSelector.value].tick();
}

function draw(){
    cls();
    drawLine();
}
function cls(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
function drawLine(){ 
        for(let i=0;i<waves.length;i++){
            waves[i].id = i;
            if(i!=indexSelector.value){
                ctx.strokeStyle = '#dddddd';
                waves[i].draw();
            }
        }
        ctx.strokeStyle = '#000000';
        waves[indexSelector.value].draw();
}
function rearange(arr){
    let newArr = [];
    for(let i=0;i<arr.length;i++){
        newArr[arr[i].x] = arr[i];
    }
    let finalArr = [];
    for(let i=0;i<newArr.length;i++){
        if(newArr[i]!=undefined){
            finalArr[finalArr.length] = newArr[i];
        }
    }
    return finalArr;
}
function exportWave(){
    saveAudio(waves[indexSelector.value].samples,document.getElementById('sampleNameSelector').value,document.getElementById('sampleRateSelector').value);
}
function calculateWave(wave){
    wave.samples = [];
    let points2 = wave.points.concat([new vector2(canvas.width,startY)]);
    for(let i=0;i<points2.length;i++){
        let point1 = points2[i];
        let point2 = new vector2(0,startY);
        
        if(i!=0){
            point2 = points2[i-1];
        }   
        let slope = (point1.y-point2.y)/(point1.x-point2.x);
        for(let j = 0;j<(point1.x-point2.x);j++){
            wave.samples[wave.samples.length] = point2.y+(j*slope);
        }
    }
    for(let i=0;i<wave.samples.length;i++){
        wave.samples[i]-=startY;
        wave.samples[i]/=canvas.height;
    }
}
function debug(str){
    document.getElementById('debugger').innerHTML = str;
}
function deleteMath(math){
    let id = getMathIdFromElm(math);
    waves[indexSelector.value].mathOperations[id].destroyed = true;
    waves[indexSelector.value].updateMath(waves[indexSelector.value]);
}
function updateMathId(math){
    let id = getMathIdFromElm(math);
    waves[indexSelector.value].mathOperations[id].channelId = math.value;
}
function changeMath(math){
    let id = getMathIdFromElm(math);
    let clas =  getMathFromName(math.value);
    waves[indexSelector.value].mathOperations[id] = new clas();
}

function getMathIdFromElm(elm){
    return waves[indexSelector.value].getMathId(elm.id.split('_')[1]);
}
function getMathDropDown(math){
    let str = '<select id="mathChange_'+math.id+'" onChange="changeMath(this)">';
    for(let i=0;i<MathNames.length;i++){
        if(MathNames[i]== math.name){
            str+='<option selected>'+MathNames[i]+'</option>'
        }else{
            str+='<option>'+MathNames[i]+'</option>'
        }
    }
    str+= '</select>';
    return str;
}
class mathOperation{
    constructor(){
        this.parent = null;
        this.channelId = 1;
        this.name = 'mathOperation';
        this.destroyed = false;

        this.id = addedButtonIds;
        addedButtonIds++;
    }
    run(){
        for(let i=0;i<this.parent.samples.length;i++){
            this.parent.samples[i] = this.exec(this.parent.samples[i],waves[this.channelId].samples[i]);
        }
    }
    defaultHTML(self){
        return '<header>'+self.name+' '+getMathDropDown(self)+'<button id="buttonMath_'+self.id+'" onClick="deleteMath(this)">delete</button></header>'+'channel id:<input Type="number" value="'+self.channelId+'" id="addMath_'+self.id+'" onChange="updateMathId(this)">';
    }
    exec(){}
    getHTML(){return this.defaultHTML(this);}
}
//math classes
//add
class mathAdd extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'add'
    }
    exec(sampleA,sampleB){
        return sampleA+sampleB;
    }
}
//subtract
class mathSub extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'subtract'
    }
    exec(sampleA,sampleB){
        return sampleA-sampleB;
    }
}
//multiply
class mathMul extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'multiply'
    }
    exec(sampleA,sampleB){
        return sampleA*sampleB;
    }
}
//divide
class mathDiv extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'divide'
    }
    exec(sampleA,sampleB){
        return sampleA/sampleB;
    }
}
//min and max
class mathMin extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'min'
    }
    exec(sampleA,sampleB){
        return Math.min(sampleA,sampleB);
    }
}
class mathMax extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'max'
    }
    exec(sampleA,sampleB){
        return Math.max(sampleA,sampleB);
    }
}
//floor ceil round
class mathRound extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'round'
    }
    exec(sampleA,sampleB){
        return Math.round(sampleA/sampleB)*sampleB;
    }
}
class mathFloor extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'floor'
    }
    exec(sampleA,sampleB){
        return Math.floor(sampleA/sampleB)*sampleB;
    }
}
class mathCeil extends mathOperation{
    constructor(){
        super(mathOperation);
        this.name = 'ceil'
    }
    exec(sampleA,sampleB){
        return Math.ceil(sampleA/sampleB)*sampleB;
    }
}

function getMathFromName(name){
    return (MathClasses.get(name))
}
function addMathOp(clas){
    let name = new clas().name;
    MathNames[MathNames.length] = name;
    MathClasses.set(name,clas);
}
//actually add the classes
addMathOp(mathAdd);
addMathOp(mathSub);
addMathOp(mathMul);
addMathOp(mathDiv);
addMathOp(mathMin);
addMathOp(mathMax);
addMathOp(mathRound);
addMathOp(mathFloor);
addMathOp(mathCeil);
