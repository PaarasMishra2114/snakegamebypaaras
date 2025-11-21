// Curvy Snake (canvas) — clean single-file implementation
const GRID = 18;

// DOM & audio
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBox = document.getElementById('scoreBox');
const hiscoreBox = document.getElementById('hiscoreBox');
const foodSound = new Audio('music/paaras-track-1.mp3');
const gameOverSound = new Audio('music/paaras-track-2.mp3');
const moveSound = new Audio('music/paaras-track-3.mp3');
const musicSound = new Audio('music/paaras-track-4.mp3');

// Game state
let inputDir = {x:0,y:0};
let snakeArr = [ {x:13,y:15}, {x:12,y:15}, {x:11,y:15}, {x:10,y:15} ];
let prevSnakeArr = JSON.parse(JSON.stringify(snakeArr));
let food = {x:6,y:7};
let score = 0;
let hiscoreval = 0;

// Rendering & timing
let cellSize = 40;
let lastRenderTime = 0;
let logicalSpeed = 8; // grid steps per second (tweaked faster)
let moveInterval = 1 / logicalSpeed;
let moveProgress = 0;

let fruitImg = new Image();
fruitImg.src = 'img/paaras-fruit.svg';

// Fruit variants (colors) — used when drawing programmatic fruits
const fruitColors = ['#ff4b4b','#ff8c42','#ffd24b','#7af29a','#a176ff','#4bdcff'];
let lastFruitVariant = null;

function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(200, Math.floor(rect.width));
    canvas.height = Math.max(200, Math.floor(rect.height));
    cellSize = canvas.width / GRID;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Blink state
let blinkAccumulator = 0;
let blinkTime = 0;
let blinking = false;
const BLINK_INTERVAL = 3.0;
const BLINK_DURATION = 0.16;

// helpers
function lerp(a,b,t){ return a + (b-a) * t; }
function normalize(x,y){ const l = Math.hypot(x,y); if(l===0) return {x:0,y:0}; return {x:x/l,y:y/l}; }

// color helpers
function hexToRgb(hex){ const h = hex.replace('#',''); const bigint = parseInt(h,16); return {r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255}; }
function rgbToHex(r,g,b){ return '#' + [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function lighten(hex, amt){ const c = hexToRgb(hex); return rgbToHex(c.r + 255*amt, c.g + 255*amt, c.b + 255*amt); }
function darken(hex, amt){ const c = hexToRgb(hex); return rgbToHex(c.r * (1-amt), c.g * (1-amt), c.b * (1-amt)); }

function spawnFood(){
    const margin = 2;
    let fx, fy;
    do {
        fx = Math.floor(margin + Math.random() * (GRID - margin*2)) + 1;
        fy = Math.floor(margin + Math.random() * (GRID - margin*2)) + 1;
    } while (snakeArr.some(s => s.x === fx && s.y === fy));
    // choose a fruit appearance variant different from last
    let variant;
    do { variant = Math.floor(Math.random() * fruitColors.length); } while(variant === lastFruitVariant && fruitColors.length > 1);
    lastFruitVariant = variant;
    food = {x: fx, y: fy, variant };
}

function isCollide(snake){
    for(let i=1;i<snake.length;i++){
        if(snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    if(snake[0].x > GRID || snake[0].x < 1 || snake[0].y > GRID || snake[0].y < 1) return true;
    return false;
}

function logicalStep(){
    if(inputDir.x === 0 && inputDir.y === 0) return;

    const newHead = { x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y };
    snakeArr.unshift(newHead);

    if(newHead.x === food.x && newHead.y === food.y){
        try{ foodSound.play(); }catch(e){}
        score += 1;
        if(score > hiscoreval){ hiscoreval = score; localStorage.setItem('hiscore', JSON.stringify(hiscoreval)); hiscoreBox.innerHTML = 'HiScore: ' + hiscoreval; }
        scoreBox.innerHTML = 'Score: ' + score;
        spawnFood();
    } else {
        snakeArr.pop();
    }

    if(isCollide(snakeArr)){
        try{ gameOverSound.play(); }catch(e){}
        try{ musicSound.pause(); }catch(e){}
        inputDir = {x:0,y:0};
        alert('Game Over. Press any key to play again!');
        snakeArr = [{x:13,y:15}];
        prevSnakeArr = JSON.parse(JSON.stringify(snakeArr));
        try{ musicSound.play(); }catch(e){}
        score = 0;
        scoreBox.innerHTML = 'Score: ' + score;
    }
}

function render(t, delta){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#d6f3d6';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // blink update
    blinkAccumulator += delta;
    if(!blinking && blinkAccumulator >= BLINK_INTERVAL){ blinking = true; blinkTime = 0; blinkAccumulator = 0; }
    if(blinking){ blinkTime += delta; if(blinkTime >= BLINK_DURATION){ blinking = false; blinkTime = 0; } }

    // interpolated points
    const maxLen = Math.max(prevSnakeArr.length, snakeArr.length);
    const ipoints = [];
    for(let i=0;i<maxLen;i++){
        const prev = prevSnakeArr[i] || prevSnakeArr[prevSnakeArr.length-1] || snakeArr[snakeArr.length-1];
        const curr = snakeArr[i] || snakeArr[snakeArr.length-1];
        const ix = (lerp(prev.x, curr.x, t) - 0.5) * cellSize;
        const iy = (lerp(prev.y, curr.y, t) - 0.5) * cellSize;
        ipoints.push({x: ix, y: iy});
    }

    // draw body
    if(ipoints.length >= 2){
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const baseWidth = Math.max(14, cellSize * 0.98);
        for(let i = ipoints.length-1; i>0; i--){
            const p0 = ipoints[i]; const p1 = ipoints[i-1];
            const segT = i / ipoints.length; const hue = (i * 26) % 360;
            ctx.strokeStyle = `hsla(${hue},78%,48%,${0.35 + 0.55*segT})`;
            ctx.lineWidth = baseWidth * (0.5 + 0.5 * segT);
            ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
            const cx = (p0.x + p1.x)/2; const cy = (p0.y + p1.y)/2;
            ctx.quadraticCurveTo(p0.x, p0.y, cx, cy); ctx.stroke();
        }
    }

    // head
    const headPrev = prevSnakeArr[0] || snakeArr[0];
    const headCurr = snakeArr[0];
    const headX = (lerp(headPrev.x, headCurr.x, t) - 0.5) * cellSize;
    const headY = (lerp(headPrev.y, headCurr.y, t) - 0.5) * cellSize;
    const renderDir = {x: headCurr.x - headPrev.x, y: headCurr.y - headPrev.y};
    const dirNorm = normalize(renderDir.x, renderDir.y);
    const dirForEyes = (dirNorm.x === 0 && dirNorm.y === 0) ? normalize(inputDir.x, inputDir.y) : dirNorm;

    const headRadius = Math.max(16, cellSize * 0.80); // larger head for personality
    ctx.save(); ctx.beginPath(); ctx.fillStyle = `hsl(12,78%,60%)`; ctx.arc(headX, headY, headRadius, 0, Math.PI*2); ctx.fill(); ctx.restore();

    // eyes
    const pupilOffset = Math.min(headRadius*0.37, 12);
    const perp = {x: -dirForEyes.y, y: dirForEyes.x};
    const eyeForward = Math.max(6, headRadius * 0.32);
    const eye1 = {x: headX + dirForEyes.x*eyeForward + perp.x*pupilOffset*0.45, y: headY + dirForEyes.y*eyeForward + perp.y*pupilOffset*0.45};
    const eye2 = {x: headX + dirForEyes.x*eyeForward - perp.x*pupilOffset*0.45, y: headY + dirForEyes.y*eyeForward - perp.y*pupilOffset*0.45};

    if(blinking){
        ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(2, headRadius*0.12);
        ctx.beginPath(); ctx.moveTo(eye1.x - 6, eye1.y); ctx.lineTo(eye1.x + 6, eye1.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(eye2.x - 6, eye2.y); ctx.lineTo(eye2.x + 6, eye2.y); ctx.stroke();
    } else {
        const scleraR = Math.max(6, headRadius*0.28);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(eye1.x, eye1.y, scleraR, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2.x, eye2.y, scleraR, 0, Math.PI*2); ctx.fill();
        const pupilR = Math.max(3, headRadius*0.12);
        const pupil1 = {x: eye1.x + dirForEyes.x * (pupilOffset*0.35), y: eye1.y + dirForEyes.y * (pupilOffset*0.35)};
        const pupil2 = {x: eye2.x + dirForEyes.x * (pupilOffset*0.35), y: eye2.y + dirForEyes.y * (pupilOffset*0.35)};
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(pupil1.x, pupil1.y, pupilR, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(pupil2.x, pupil2.y, pupilR, 0, Math.PI*2); ctx.fill();
    }

    // fruit (programmatic variants, larger size)
    const fx = (food.x - 1) * cellSize; const fy = (food.y - 1) * cellSize;
    const padding = Math.max(2, cellSize * 0.05);
    const size = Math.max(18, cellSize * 0.9 - padding*2);
    const cx = fx + 0.5*cellSize; const cy = fy + 0.5*cellSize;

    // choose color from variant (fallback to red)
    const color = (food && typeof food.variant === 'number') ? fruitColors[food.variant] : '#ff4b4b';

    // radial gradient body
    const g = ctx.createRadialGradient(cx - size*0.18, cy - size*0.25, size*0.12, cx, cy, size*0.9);
    g.addColorStop(0, lighten(color, 0.18));
    g.addColorStop(0.6, color);
    g.addColorStop(1, darken(color, 0.08));
    ctx.beginPath(); ctx.fillStyle = g; ctx.arc(cx, cy, size*0.5, 0, Math.PI*2); ctx.fill();

    // small highlight
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.ellipse(cx - size*0.18, cy - size*0.22, size*0.18, size*0.12, -0.6, 0, Math.PI*2); ctx.fill();

    // little leaf/stem for variation — draw green leaf rotated
    const leafW = size*0.28, leafH = size*0.16;
    ctx.save(); ctx.translate(cx + size*0.28, cy - size*0.28); ctx.rotate(-0.7);
    ctx.beginPath(); ctx.fillStyle = '#2ea94b'; ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

function main(ctime){
    window.requestAnimationFrame(main);
    if(!lastRenderTime) lastRenderTime = ctime;
    const delta = (ctime - lastRenderTime) / 1000;
    lastRenderTime = ctime;

    moveProgress += delta;
    while(moveProgress >= moveInterval){
        moveProgress -= moveInterval;
        prevSnakeArr = JSON.parse(JSON.stringify(snakeArr));
        logicalStep();
    }

    const t = Math.min(1, moveProgress / moveInterval);
    render(t, delta);
}

// startup
try{ musicSound.play(); }catch(e){}
let hiscore = localStorage.getItem('hiscore');
if(hiscore === null){ hiscoreval = 0; localStorage.setItem('hiscore', JSON.stringify(hiscoreval)); }
else{ hiscoreval = JSON.parse(hiscore); hiscoreBox.innerHTML = 'HiScore: ' + hiscoreval; }

window.requestAnimationFrame(main);

// controls
window.addEventListener('keydown', e =>{
    let newDir = null;
    switch(e.key){
        case 'ArrowUp': newDir = {x:0,y:-1}; break;
        case 'ArrowDown': newDir = {x:0,y:1}; break;
        case 'ArrowLeft': newDir = {x:-1,y:0}; break;
        case 'ArrowRight': newDir = {x:1,y:0}; break;
        default: return;
    }
    if(inputDir.x === 0 && inputDir.y === 0) inputDir = newDir;
    if(newDir.x === -inputDir.x && newDir.y === -inputDir.y) return; // prevent reverse
    inputDir = newDir;
    try{ moveSound.play(); }catch(e){}
});

// Touch / swipe controls for mobile
let touchStart = null;
const SWIPE_MIN = 24; // pixels
canvas.addEventListener('touchstart', e => {
    if(!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    touchStart = {x: t.clientX, y: t.clientY};
});
canvas.addEventListener('touchmove', e => {
    // prevent page scroll while swiping on canvas
    if(e.cancelable) e.preventDefault();
});
canvas.addEventListener('touchend', e => {
    if(!touchStart) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if(!t) { touchStart = null; return; }
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if(Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return; // not a swipe
    let newDir = null;
    if(Math.abs(dx) > Math.abs(dy)){
        newDir = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
    } else {
        newDir = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
    }
    // prevent immediate reverse
    if(newDir.x === -inputDir.x && newDir.y === -inputDir.y) return;
    // start if idle
    if(inputDir.x === 0 && inputDir.y === 0) inputDir = newDir;
    inputDir = newDir;
    try{ moveSound.play(); }catch(e){}
}, {passive: false});