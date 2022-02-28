 //linear congruential generator parameters
 var M = 4294967296,
 A = 1664525,
 C = 1;
 w = window.innerWidth,
 h = window.innerHeight

function Interpolate(pa, pb, px){
 var ft = px * Math.PI,
   f = (1 - Math.cos(ft)) * 0.5;
 return pa * (1 - f) + pb * f;
}

//1D perlin line generator
function Perlin(amp, wl, width){
 this.x = 0;
 this.amp = amp;
 this.wl = wl;
 this.fq = 1 / wl;
 this.psng = new PSNG();
 this.a = this.psng.next();
 this.b = this.psng.next();
 this.pos = [];
 while(this.x < width){
   if(this.x % this.wl === 0){
     this.a = this.b;
     this.b = this.psng.next();
     this.pos.push(this.a * this.amp);
   }else{
     this.pos.push(Interpolate(this.a, this.b, (this.x % this.wl) / this.wl) * this.amp);
   }
   this.x++;
 }
}

//octave generator
function GenerateNoise(amp, wl, octaves, divisor, width){
 var result = [];
 for(var i = 0; i < octaves; i++){
   result.push(new Perlin(amp, wl, width));
   amp /= divisor;
   wl /= divisor;
 }
 return result;
}

//combines octaves together
function CombineNoise(pl){
 var result = {pos: []};
 for(var i = 0, total = 0, j = 0; i < pl[0].pos.length; i++){
   total = 0;
   for(j = 0; j < pl.length; j++){
     total += pl[j].pos[i];
   }
   result.pos.push(total);
 }
 return result;
}

//perlin line plotting
function DrawLine(L){
 ctx.moveTo(0, h / 2);
 for(var i = 0; i < L.pos.length; i++){
   ctx.lineTo(i, h / 2 + L.pos[i]);
 }
 ctx.stroke();
}
//psuedo-random number generator (linear congruential)
function PSNG(){
 this.Z = Math.floor(Math.random() * M);
 this.next = function(){
   this.Z = (A * this.Z + C) % M;
   return this.Z / M - 0.5;
 }
}

function saveAudio(arr,name='wav',sampleRate = 8060){
  console.log(arr)
  encoder = new WavAudioEncoder(sampleRate, 1)
  audio = Float32Array.from(arr);
  encoder.encode([audio]);
  blob = encoder.finish();
  saveAs(blob,name+'.wav')
}
//waveform encoder
(function(self) {
  var min = Math.min,
      max = Math.max;

  var setString = function(view, offset, str) {
    var len = str.length;
    for (var i = 0; i < len; ++i)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  var Encoder = function(sampleRate, numChannels) {
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
    this.numSamples = 0;
    this.dataViews = [];
  };

  Encoder.prototype.encode = function(buffer) {
    var len = buffer[0].length,
        nCh = this.numChannels,
        view = new DataView(new ArrayBuffer(len * nCh * 2)),
        offset = 0;
    for (var i = 0; i < len; ++i)
      for (var ch = 0; ch < nCh; ++ch) {
        var x = buffer[ch][i] * 0x7fff;
        view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
        offset += 2;
      }
    this.dataViews.push(view);
    this.numSamples += len;
  };

  Encoder.prototype.finish = function(mimeType) {
    var dataSize = this.numChannels * this.numSamples * 2,
        view = new DataView(new ArrayBuffer(44));
    setString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    setString(view, 8, 'WAVE');
    setString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, this.numChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 4, true);
    view.setUint16(32, this.numChannels * 2, true);
    view.setUint16(34, 16, true);
    setString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    this.dataViews.unshift(view);
    var blob = new Blob(this.dataViews, { type: 'audio/wav' });
    this.cleanup();
    return blob;
  };

  Encoder.prototype.cancel = Encoder.prototype.cleanup = function() {
    delete this.dataViews;
  };

  self.WavAudioEncoder = Encoder;
})(self);
//filesaver
/*
* FileSaver.js
* A saveAs() FileSaver implementation.
*
* By Eli Grey, http://eligrey.com
*
* License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
* source  : http://purl.eligrey.com/github/FileSaver.js
*/

// The one and only way of getting global scope in all environments
// https://stackoverflow.com/q/3277182/1008999
var _global = typeof window === 'object' && window.window === window
  ? window : typeof self === 'object' && self.self === self
  ? self : typeof global === 'object' && global.global === global
  ? global
  : this

function bom (blob, opts) {
  if (typeof opts === 'undefined') opts = { autoBom: false }
  else if (typeof opts !== 'object') {
    console.warn('Deprecated: Expected third argument to be a object')
    opts = { autoBom: !opts }
  }

  // prepend BOM for UTF-8 XML and text/* types (including HTML)
  // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
  if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
    return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type })
  }
  return blob
}

function download (url, name, opts) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url)
  xhr.responseType = 'blob'
  xhr.onload = function () {
    saveAs(xhr.response, name, opts)
  }
  xhr.onerror = function () {
    console.error('could not download file')
  }
  xhr.send()
}

function corsEnabled (url) {
  var xhr = new XMLHttpRequest()
  // use sync to avoid popup blocker
  xhr.open('HEAD', url, false)
  try {
    xhr.send()
  } catch (e) {}
  return xhr.status >= 200 && xhr.status <= 299
}

// `a.click()` doesn't work for all browsers (#465)
function click (node) {
  try {
    node.dispatchEvent(new MouseEvent('click'))
  } catch (e) {
    var evt = document.createEvent('MouseEvents')
    evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                          20, false, false, false, false, 0, null)
    node.dispatchEvent(evt)
  }
}

// Detect WebView inside a native macOS app by ruling out all browsers
// We just need to check for 'Safari' because all other browsers (besides Firefox) include that too
// https://www.whatismybrowser.com/guides/the-latest-user-agent/macos
var isMacOSWebView = /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent)

var saveAs = _global.saveAs || (
  // probably in some web worker
  (typeof window !== 'object' || window !== _global)
    ? function saveAs () { /* noop */ }

  // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView
  : ('download' in HTMLAnchorElement.prototype && !isMacOSWebView)
  ? function saveAs (blob, name, opts) {
    var URL = _global.URL || _global.webkitURL
    var a = document.createElement('a')
    name = name || blob.name || 'download'

    a.download = name
    a.rel = 'noopener' // tabnabbing

    // TODO: detect chrome extensions & packaged apps
    // a.target = '_blank'

    if (typeof blob === 'string') {
      // Support regular links
      a.href = blob
      if (a.origin !== location.origin) {
        corsEnabled(a.href)
          ? download(blob, name, opts)
          : click(a, a.target = '_blank')
      } else {
        click(a)
      }
    } else {
      // Support blobs
      a.href = URL.createObjectURL(blob)
      setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
      setTimeout(function () { click(a) }, 0)
    }
  }

  // Use msSaveOrOpenBlob as a second approach
  : 'msSaveOrOpenBlob' in navigator
  ? function saveAs (blob, name, opts) {
    name = name || blob.name || 'download'

    if (typeof blob === 'string') {
      if (corsEnabled(blob)) {
        download(blob, name, opts)
      } else {
        var a = document.createElement('a')
        a.href = blob
        a.target = '_blank'
        setTimeout(function () { click(a) })
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name)
    }
  }

  // Fallback to using FileReader and a popup
  : function saveAs (blob, name, opts, popup) {
    // Open a popup immediately do go around popup blocker
    // Mostly only available on user interaction and the fileReader is async so...
    popup = popup || open('', '_blank')
    if (popup) {
      popup.document.title =
      popup.document.body.innerText = 'downloading...'
    }

    if (typeof blob === 'string') return download(blob, name, opts)

    var force = blob.type === 'application/octet-stream'
    var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari
    var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent)

    if ((isChromeIOS || (force && isSafari) || isMacOSWebView) && typeof FileReader !== 'undefined') {
      // Safari doesn't allow downloading of blob URLs
      var reader = new FileReader()
      reader.onloadend = function () {
        var url = reader.result
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;')
        if (popup) popup.location.href = url
        else location = url
        popup = null // reverse-tabnabbing #460
      }
      reader.readAsDataURL(blob)
    } else {
      var URL = _global.URL || _global.webkitURL
      var url = URL.createObjectURL(blob)
      if (popup) popup.location = url
      else location.href = url
      popup = null // reverse-tabnabbing #460
      setTimeout(function () { URL.revokeObjectURL(url) }, 4E4) // 40s
    }
  }
)

_global.saveAs = saveAs.saveAs = saveAs

if (typeof module !== 'undefined') {
  module.exports = saveAs;
}
