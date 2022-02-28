class vector2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}
Math.lerp = function(v0, v1, t) {
    return v0*(1-t)+v1*t
}
