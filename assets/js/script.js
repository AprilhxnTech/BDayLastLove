/* ============================================================
   0. SAFE STORAGE (Mencegah crash di file:// Android)
   ============================================================ */
const safeStorage = {
    getItem: function(key) {
        try { return sessionStorage.getItem(key); } catch(e) { return null; }
    },
    setItem: function(key, val) {
        try { sessionStorage.setItem(key, val); } catch(e) {}
    }
};

/* ============================================================
   1. SHARED: Fullscreen, Music, Navigation
   ============================================================ */
(function(){
    'use strict';
    const bgm = document.getElementById('bgm');
    const TIME_KEY = 'bgm_time';
    const PLAYING_KEY = 'bgm_playing';

    window.triggerFullscreen = function(){
        if(!document.fullscreenElement){
            const el = document.documentElement;
            if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
            else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
    };

    function updateMusicUI(isPlaying){
        const c = document.getElementById('music-btn');
        const t = document.getElementById('toggle-text');
        if(!c || !t) return;
        if(isPlaying){ c.classList.remove('music-off'); c.classList.add('playing'); t.innerText = 'Music: ON'; }
        else { c.classList.add('music-off'); c.classList.remove('playing'); t.innerText = 'Music: OFF'; }
    }

    window.saveMusicBeforeLeave = function(){
        if(bgm && !bgm.paused){
            safeStorage.setItem(TIME_KEY, bgm.currentTime);
            safeStorage.setItem(PLAYING_KEY, 'true');
        }
    };

    function resumeMusic(){
        if(!bgm) return;
        const savedTime = parseFloat(safeStorage.getItem(TIME_KEY) || '0');
        const wasPlaying = safeStorage.getItem(PLAYING_KEY) === 'true';
        if(!wasPlaying) { updateMusicUI(false); return; }
        function seekPlay(){
            if(savedTime > 0 && isFinite(savedTime)){
                try { bgm.currentTime = savedTime; } catch(e){}
            }
            bgm.play().then(()=>{ updateMusicUI(true); }).catch(()=>{ updateMusicUI(false); });
        }
        if(bgm.readyState >= 1) seekPlay();
        else bgm.addEventListener('loadedmetadata', seekPlay, { once: true });
    }

    window.toggleMusic = function(){
        if(!bgm) return;
        if(bgm.paused){
            bgm.play().then(()=>{ safeStorage.setItem(PLAYING_KEY,'true'); updateMusicUI(true); })
                .catch(()=>updateMusicUI(false));
        } else {
            bgm.pause();
            safeStorage.setItem(PLAYING_KEY,'false');
            updateMusicUI(false);
        }
    };

    setInterval(()=>{
        if(bgm && !bgm.paused){
            safeStorage.setItem(TIME_KEY, bgm.currentTime);
            safeStorage.setItem(PLAYING_KEY, 'true');
        }
    }, 1000);

    window.addEventListener('beforeunload', window.saveMusicBeforeLeave);
    window.addEventListener('pagehide', window.saveMusicBeforeLeave);

    window.goTo = function(pageId){
        if(bgm && !bgm.paused){
            safeStorage.setItem(TIME_KEY, bgm.currentTime);
            safeStorage.setItem(PLAYING_KEY, 'true');
        }
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById('page-' + pageId);
        if(target) target.classList.add('active');

        if(pageId === 'candle' && window.resetCandle) window.resetCandle();
        if(pageId === 'gift' && window.resetGift) window.resetGift();
        if(pageId === 'surat' && window.resetSurat) window.resetSurat();
        if(pageId === 'memori' && window.resetMemori) window.resetMemori();
    };

    window.__resumeMusic = resumeMusic;
    window.__updateMusicUI = updateMusicUI;
})();

/* ============================================================
   2. HOME MODULE
   ============================================================ */
(function(){
    'use strict';
    const birthDate = new Date(2005, 10, 10, 0, 0, 0);
    const correctPassword = "sayang";
    let attemptsLeft = 5;
    let isUnlocked = false;
    
    // Variabel untuk transisi & glow
    let isShowingLock = false;
    let prevD = null, prevH = null, prevM = null, prevS = null;

    function showLockScreen(){
        if (isShowingLock) return;
        isShowingLock = true;

        const countdown = document.getElementById('screen-countdown');
        const lockScreen = document.getElementById('screen-lock');
        const homeScreen = document.getElementById('screen-home');
        
        if (homeScreen) homeScreen.style.display = 'none';

        // 1. Animasi fade-out pada countdown
        if (countdown && countdown.style.display !== 'none') {
            countdown.classList.add('fade-out-anim');
        }

        // 2. Tunggu 0.8 detik, lalu munculkan lock screen
        setTimeout(() => {
            if (countdown) {
                countdown.style.display = 'none';
                countdown.classList.remove('fade-out-anim'); 
            }
            if (lockScreen) {
                lockScreen.style.display = 'flex';
                void lockScreen.offsetWidth; // Paksa browser render ulang
                lockScreen.classList.add('show-lock'); // Memicu animasi fade-in CSS
            }
            isShowingLock = false;
        }, 800); 
    }

    window.checkPassword = function(){
        const input = document.getElementById('password-input').value.toLowerCase();
        const lockBox = document.querySelector('.lock-box');
        const hint = document.getElementById('hint-text');
        if(input === correctPassword){
            if(window.triggerFullscreen) window.triggerFullscreen();
            
            const bgm = document.getElementById('bgm');
            if(bgm && bgm.paused){
                safeStorage.setItem('bgm_playing', 'true');
                let savedTime = parseFloat(safeStorage.getItem('bgm_time') || '0');
                if(savedTime > 0) bgm.currentTime = savedTime;
                bgm.play().then(()=> {
                    if(window.__updateMusicUI) window.__updateMusicUI(true);
                }).catch(()=>{});
            }

            showHomeScreen();
            safeStorage.setItem('unlocked', 'true');
        } else {
            attemptsLeft--;
            lockBox.classList.add('shake');
            setTimeout(()=>lockBox.classList.remove('shake'), 500);
            if(attemptsLeft > 0) hint.innerHTML = `Wrong! Attempts left: ${attemptsLeft}.<br>Hint: The word you hear every day.`;
            else {
                hint.innerHTML = `Out of attempts. Hint: Your pet name! (${correctPassword})`;
                document.getElementById('password-input').disabled = true;
            }
            document.getElementById('password-input').value = '';
        }
    };

    function showHomeScreen(){
        isUnlocked = true;
        document.getElementById('screen-countdown').style.display = 'none';
        document.getElementById('screen-lock').style.display = 'none';
        document.getElementById('screen-home').style.display = 'block';
        document.getElementById('music-btn').style.display = 'flex';
        const bgm = document.getElementById('bgm');
        if(bgm && bgm.paused && safeStorage.getItem('bgm_playing') === 'true'){
            bgm.play().catch(()=>{});
            if(window.__updateMusicUI) window.__updateMusicUI(true);
        }
        startParticles();
    }

    function updateCountdown(){
        if(isUnlocked) return;
        const now = new Date();
        let years = now.getFullYear() - birthDate.getFullYear();
        let months = now.getMonth() - birthDate.getMonth();
        let days = now.getDate() - birthDate.getDate();
        let hours = now.getHours() - birthDate.getHours();
        let minutes = now.getMinutes() - birthDate.getMinutes();
        let seconds = now.getSeconds() - birthDate.getSeconds();
        
        if(seconds < 0){ seconds += 60; minutes--; }
        if(minutes < 0){ minutes += 60; hours--; }
        if(hours < 0){ hours += 24; days--; }
        if(days < 0){ const pm = new Date(now.getFullYear(), now.getMonth(), 0); days += pm.getDate(); months--; }
        if(months < 0){ months += 12; years--; }
        
        const text = document.getElementById('time-passed-text');
        if(text) text.innerHTML = `You have been in this world for <strong>${years} years, ${months} months, ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds</strong>.`;
        
        let targetDate = new Date(now.getFullYear(), 10, 10, 0, 0, 0);
        if(now.getTime() > targetDate.getTime()) targetDate = new Date(now.getFullYear()+1, 10, 10, 0, 0, 0);
        const diff = targetDate - now;
        
        if(diff <= 0){ showLockScreen(); return; }
        
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        
        // --- EFEK SPARKLE & GLOW SAAT ANGKA BERUBAH ---
        if (prevD !== null && d !== prevD) triggerNumberChange('cd-days');
        if (prevH !== null && h !== prevH) triggerNumberChange('cd-hours');
        if (prevM !== null && m !== prevM) triggerNumberChange('cd-mins');
        if (prevS !== null && s !== prevS) triggerNumberChange('cd-secs');
        
        prevD = d; prevH = h; prevM = m; prevS = s;
        // ----------------------------------------------

        const setTxt = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v<10?'0'+v:v; };
        setTxt('cd-days', d); setTxt('cd-hours', h); setTxt('cd-mins', m); setTxt('cd-secs', s);
    }

    function triggerNumberChange(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('glow-anim');
        void el.offsetWidth; 
        el.classList.add('glow-anim');
        const rect = el.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            createSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }

    function createSparkle(x, y) {
        const p = document.createElement('div');
        p.classList.add('sparkle-particle');
        const size = Math.random() * 4 + 2;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = (x - size / 2) + 'px';
        p.style.top = (y - size / 2) + 'px';
        document.body.appendChild(p);

        const destX = x + (Math.random() - 0.5) * 40;
        const destY = y + Math.random() * 30 + 20; 

        p.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        requestAnimationFrame(() => {
            p.style.transform = `translate(${destX - x}px, ${destY - y}px) scale(0)`;
            p.style.opacity = '0';
        });
        setTimeout(() => p.remove(), 850);
    }

    const secret = document.getElementById('secret-trigger');
    if(secret){
        secret.addEventListener('dblclick', showLockScreen);
        let lastTap = 0;
        secret.addEventListener('touchend', (e)=>{
            const ct = new Date().getTime();
            const tl = ct - lastTap;
            if(tl < 300 && tl > 0){ showLockScreen(); e.preventDefault(); }
            lastTap = ct;
        });
    }

    const pwd = document.getElementById('password-input');
    if(pwd) pwd.addEventListener('keypress', (e)=>{ if(e.key === 'Enter') checkPassword(); });

    let particlesStarted = false;
    function startParticles(){
        if(particlesStarted) return;
        particlesStarted = true;
        const container = document.getElementById('particles-container');
        if(!container) return;
        setInterval(()=>{
            const p = document.createElement('div');
            p.classList.add('particle');
            const size = Math.random()*5+3;
            p.style.width = size+'px';
            p.style.height = size+'px';
            p.style.left = Math.random()*100+'%';
            p.style.animationDuration = (Math.random()*3+3)+'s';
            p.style.backgroundColor = Math.random()>0.5 ? 'var(--gold)' : 'var(--blush)';
            container.appendChild(p);
            setTimeout(()=>p.remove(), 6000);
        }, 300);
    }

    if(safeStorage.getItem('unlocked') === 'true'){
        showHomeScreen();
        if(window.__resumeMusic) window.__resumeMusic();
    } else {
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }
})();

/* ============================================================
   3. CANDLE MODULE
   ============================================================ */
(function(){
    'use strict';
    let candleState = 0;
    const flame = document.getElementById('flame');
    const smoke = document.getElementById('smoke');
    const glow = document.getElementById('glow');
    const titleText = document.getElementById('title-text');
    const descText = document.getElementById('desc-text');
    const actionBtn = document.getElementById('action-btn');
    const btnText = document.getElementById('btn-text');
    const btnProgress = document.getElementById('btn-progress');
    let isHolding = false;
    const holdDuration = 2000;
    let holdStartTime = 0;
    let animationFrame;

    function lightCandle(){
        if(candleState !== 0) return;
        candleState = 1;
        flame.classList.add('lit');
        glow.classList.add('active');
        titleText.innerText = "Make a wish...";
        descText.innerText = "Close your eyes and pray";
        btnText.innerText = "Hold to Blow";
        btnProgress.style.width = '0%';
        setTimeout(()=>{
            if(candleState === 1){
                titleText.innerText = "Blow the candle";
                descText.innerText = "Press and hold the button";
            }
        }, 3000);
    }

    function blowCandle(){
        if(candleState !== 1) return;
        candleState = 2;
        flame.classList.remove('lit');
        glow.classList.remove('active');
        smoke.classList.add('smoking');
        titleText.innerText = "Yay!";
        descText.innerText = "Your wish has been made";
        actionBtn.classList.add('hidden');
        document.getElementById('flash-overlay').classList.add('flash-active');
        setTimeout(()=>{
            document.getElementById('congrats').classList.add('show');
            startGrandParticles();
        }, 800);
    }

    function startPress(e){
        if(candleState === 0) lightCandle();
        else if(candleState === 1){
            isHolding = true;
            holdStartTime = Date.now();
            function tick(){
                if(!isHolding) return;
                const elapsed = Date.now() - holdStartTime;
                const percent = Math.min((elapsed / holdDuration) * 100, 100);
                btnProgress.style.width = percent + '%';
                const scale = Math.max(0.2, 1 - (percent/100)*0.8);
                flame.style.transition = "none";
                flame.style.transform = `translateX(-50%) scale(${scale}) rotate(${percent/10}deg)`;
                if(elapsed < holdDuration) animationFrame = requestAnimationFrame(tick);
                else blowCandle();
            }
            tick();
        }
    }
    function cancelPress(){
        if(candleState === 1 && isHolding){
            isHolding = false;
            cancelAnimationFrame(animationFrame);
            btnProgress.style.width = '0%';
            flame.style.transition = "transform 0.3s ease, opacity 0.3s";
            flame.style.transform = "translateX(-50%) scale(1) rotate(0deg)";
        }
    }
    if(actionBtn){
        actionBtn.addEventListener('mousedown', startPress);
        actionBtn.addEventListener('mouseup', cancelPress);
        actionBtn.addEventListener('mouseleave', cancelPress);
        actionBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); startPress(e); }, { passive: false });
        actionBtn.addEventListener('touchend', (e)=>{ e.preventDefault(); cancelPress(); });
        actionBtn.addEventListener('touchcancel', cancelPress);
    }

    function startGrandParticles(){
        const colors = ['#c5a880','#e8b4b8','#fcf9f2','#ffd700','#fff'];
        for(let i=0; i<60; i++){
            setTimeout(()=>{
                const p = document.createElement('div');
                p.classList.add('particle-fx');
                const size = Math.random()*8+4;
                p.style.width = size+'px';
                p.style.height = size+'px';
                p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
                p.style.left = '50%';
                p.style.top = '40%';
                const angle = Math.random()*Math.PI*2;
                const vel = Math.random()*300+100;
                const tx = Math.cos(angle)*vel;
                const ty = Math.sin(angle)*vel-150;
                p.style.transition = 'all 2s cubic-bezier(0.1,0.8,0.2,1)';
                document.body.appendChild(p);
                setTimeout(()=>{ p.style.transform = `translate(${tx}px,${ty}px) scale(0)`; p.style.opacity = '0'; }, 50);
                setTimeout(()=>p.remove(), 2000);
            }, i*20);
        }
        for(let j=0; j<25; j++){
            setTimeout(()=>{
                const star = document.createElement('div');
                star.classList.add('star-particle');
                star.innerHTML = '★';
                star.style.left = Math.random()*100+'vw';
                star.style.top = '-50px';
                const dur = Math.random()*2+2;
                star.style.fontSize = (Math.random()*15+10)+'px';
                star.style.transition = `all ${dur}s linear`;
                document.body.appendChild(star);
                setTimeout(()=>{ star.style.top = '100vh'; star.style.transform = `rotate(${Math.random()*360}deg)`; star.style.opacity = '0'; }, 50);
                setTimeout(()=>star.remove(), dur*1000);
            }, j*100);
        }
        for(let k=0; k<60; k++){
            setTimeout(()=>{
                const foil = document.createElement('div');
                foil.classList.add('gold-foil');
                foil.style.width = (Math.random()*6+4)+'px';
                foil.style.height = (Math.random()*12+8)+'px';
                foil.style.left = Math.random()*100+'vw';
                foil.style.top = '-50px';
                const dur = Math.random()*2.5+2.5;
                foil.style.transition = `all ${dur}s linear`;
                document.body.appendChild(foil);
                setTimeout(()=>{ foil.style.top = '100vh'; foil.style.transform = `rotate(${Math.random()*720}deg) translateX(${Math.random()*100-50}px)`; foil.style.opacity = '0'; }, 50);
                setTimeout(()=>foil.remove(), dur*1000);
            }, k*80);
        }
    }

    window.resetCandle = function(){
        candleState = 0;
        isHolding = false;
        cancelAnimationFrame(animationFrame);
        flame.classList.remove('lit');
        flame.style.transition = '';
        flame.style.transform = '';
        smoke.classList.remove('smoking');
        glow.classList.remove('active');
        titleText.innerText = "Ready to celebrate?";
        descText.innerText = "Light up the candle first";
        btnText.innerText = "Light the Candle";
        btnProgress.style.width = '0%';
        actionBtn.classList.remove('hidden');
        document.getElementById('flash-overlay').classList.remove('flash-active');
        document.getElementById('congrats').classList.remove('show');
    };
})();

/* ============================================================
   4. GIFT MODULE
   ============================================================ */
(function(){
    'use strict';
    let giftState = 0;
    const giftImg = document.getElementById('gift-img');
    const roseImg = document.getElementById('rose-img');
    const glowGift = document.getElementById('glow-gift');
    const titleGift = document.getElementById('title-text-gift');
    const descGift = document.getElementById('desc-text-gift');
    const instructionText = document.getElementById('instruction-text');
    const loveTextContainer = document.getElementById('love-text-container');
    const btnNext = document.getElementById('btn-next-gift');
    const giftTrigger = document.getElementById('gift-trigger');

    let petals = [];
    let loveCoords = [];
    function drawLine(x1,y1,x2,y2,steps){
        const pts = [];
        for(let i=0;i<=steps;i++) pts.push({ x: x1+(x2-x1)*(i/steps), y: y1+(y2-y1)*(i/steps) });
        return pts;
    }
    loveCoords = loveCoords.concat(
        drawLine(20,20,20,30,10), drawLine(20,30,32,30,6), drawLine(23,20,23,27,7)
    );
    loveCoords = loveCoords.concat(
        drawLine(38,20,50,20,8), drawLine(50,20,50,30,8), drawLine(50,30,38,30,8),
        drawLine(38,30,38,20,8), drawLine(42,23,46,23,4), drawLine(46,23,46,27,4),
        drawLine(46,27,42,27,4), drawLine(42,27,42,23,4)
    );
    loveCoords = loveCoords.concat(
        drawLine(56,20,62,30,10), drawLine(68,20,62,30,10), drawLine(59,20,63,26,6)
    );
    loveCoords = loveCoords.concat(
        drawLine(74,20,74,30,10), drawLine(74,20,82,20,4), drawLine(74,25,80,25,3),
        drawLine(74,30,82,30,4), drawLine(77,23,77,27,4)
    );
    loveCoords = loveCoords.concat(
        drawLine(42,70,42,80,10), drawLine(58,70,58,80,10), drawLine(42,80,58,80,8),
        drawLine(45,72,45,78,6), drawLine(55,72,55,78,6)
    );

    function startPetalBurst(){
        for(let i=0; i<220; i++){
            const petal = document.createElement('div');
            petal.classList.add('petal-particle');
            const size = Math.random()*10+12;
            petal.style.width = size+'px';
            petal.style.height = size+'px';
            petal.style.left = '50%';
            petal.style.top = '50%';
            petal.style.opacity = '1';
            petal.style.transition = 'none';
            petal.style.transform = 'translate(-50%,-50%) scale(0)';
            document.getElementById('page-gift').appendChild(petal);
            petals.push(petal);
            setTimeout((p)=>{
                const angle = Math.random()*Math.PI*2;
                const dist = Math.random()*120+50;
                const tx = Math.cos(angle)*dist;
                const ty = Math.sin(angle)*dist;
                p.style.transition = 'transform 1.2s cubic-bezier(0.1,0.8,0.3,1), opacity 1.2s';
                p.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1) rotate(${Math.random()*360}deg)`;
            }, 50, petal);
        }
        setTimeout(gatherPetals, 1500);
    }

    function gatherPetals(){
        instructionText.style.opacity = '0';
        loveTextContainer.classList.add('show');
        petals.forEach((petal, idx)=>{
            if(idx < loveCoords.length){
                const c = loveCoords[idx];
                petal.style.transition = 'all 2s cubic-bezier(0.2,0.8,0.2,1)';
                petal.style.left = c.x+'vw';
                petal.style.top = c.y+'vh';
                petal.style.transform = `translate(0,0) scale(0.7) rotate(${Math.random()*360}deg)`;
            } else {
                petal.style.transition = 'opacity 1s';
                petal.style.opacity = '0';
                setTimeout(()=>petal.remove(), 1000);
            }
        });
        setTimeout(()=>btnNext.classList.add('show'), 2000);
    }

    if(giftTrigger){
        giftTrigger.addEventListener('click', ()=>{
            if(giftState === 1) return;
            giftState = 1;
            titleGift.innerText = "Surprise!";
            descGift.innerText = "A bucket of red roses for you";
            giftImg.classList.add('shake');
            setTimeout(()=>{
                giftImg.classList.remove('shake');
                giftImg.classList.add('explode');
                setTimeout(()=>{
                    roseImg.classList.add('reveal');
                    glowGift.classList.add('active');
                    setTimeout(()=>{
                        roseImg.classList.add('shake-bucket');
                        setTimeout(()=>{
                            roseImg.classList.remove('shake-bucket');
                            startPetalBurst();
                        }, 600);
                    }, 2000);
                }, 400);
            }, 500);
        });
    }

    window.resetGift = function(){
        giftState = 0;
        petals.forEach(p=>p.remove());
        petals = [];
        giftImg.classList.remove('shake','explode');
        giftImg.style.display = '';
        roseImg.classList.remove('reveal','shake-bucket');
        glowGift.classList.remove('active');
        titleGift.innerText = "A gift for you";
        descGift.innerText = "Tap the box to open it";
        instructionText.style.opacity = '1';
        loveTextContainer.classList.remove('show');
        btnNext.classList.remove('show');
    };
})();

/* ============================================================
   5. MEMORI MODULE
   ============================================================ */
(function(){
    'use strict';
    const STRIPS = [
        { name: "Heart",  ornament: "assets/img/ornament-heart.png",  accent: "#e8b4b8", tint: "rgba(232,180,184,0.38)", bg: "assets/img/bg-strip-heart.png" },
        { name: "Star",   ornament: "assets/img/ornament-star.png",   accent: "#c5a880", tint: "rgba(197,168,128,0.42)", bg: "assets/img/bg-strip-star.png" },
        { name: "Flower", ornament: "assets/img/ornament-flower.png", accent: "#d1a3a4", tint: "rgba(209,163,164,0.38)", bg: "assets/img/bg-strip-flower.png" },
        { name: "Sun",    ornament: "assets/img/ornament-sun.png",    accent: "#e0b589", tint: "rgba(224,181,137,0.38)", bg: "assets/img/bg-strip-sun.png" }
    ];
    const PHOTOS = Array.from({ length: 16 }, (_, i) => {
        const n = i + 1;
        return { src: "assets/img/memori/" + String(n).padStart(2,'0') + ".jpg" };
    });
    const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#fcf9f2"/><text x="200" y="230" font-size="90" text-anchor="middle" fill="#c5a880" opacity="0.5">♡</text></svg>');
    const $ = (s, r=document) => r.querySelector(s);
    const rnd = (a,b) => a + Math.random()*(b-a);

    function attachFallback(img){ img.addEventListener("error", ()=>{ img.src = FALLBACK; }, { once: true }); }

    const stripGallery = $("#stripGallery");
    const stripStage = $("#stripStage");
    const stripLarge = $("#stripLarge");
    const stripClose = $("#stripClose");
    const lightbox = $("#lightbox");
    const lbImg = $("#lightboxImg");
    const lbCounter = $("#lbCounter");
    let lbIndex = -1;
    let currentStrip = -1;

    function openLightbox(i){
        if(i < 0 || i >= PHOTOS.length) return;
        lbIndex = i;
        lbImg.src = PHOTOS[lbIndex].src;
        attachFallback(lbImg);
        lbCounter.textContent = (lbIndex+1) + " / " + PHOTOS.length;
        lightbox.classList.add("show");
    }
    function navLightbox(dir){
        if(lbIndex < 0) return;
        lbIndex = (lbIndex + dir + PHOTOS.length) % PHOTOS.length;
        openLightbox(lbIndex);
    }
    function closeLightbox(){ lightbox.classList.remove("show"); lbIndex = -1; }

    if($("#lbClose")) $("#lbClose").addEventListener("click", closeLightbox);
    if($("#lbPrev")) $("#lbPrev").addEventListener("click", e=>{ e.stopPropagation(); navLightbox(-1); });
    if($("#lbNext")) $("#lbNext").addEventListener("click", e=>{ e.stopPropagation(); navLightbox(1); });
    if(lightbox) lightbox.addEventListener("click", e=>{ if(e.target === lightbox) closeLightbox(); });

    function buildStrips(){
        if(!stripGallery) return;
        stripGallery.innerHTML = "";
        STRIPS.forEach((strip, i)=>{
            const photos = PHOTOS.slice(i*4, (i+1)*4);
            if(photos.length === 0) return;
            const card = document.createElement("div");
            card.className = "strip-card";
            card.style.setProperty("--accent", strip.accent);
            card.style.backgroundImage = "url('" + strip.bg + "')";
            const sticker = document.createElement("img");
            sticker.className = "strip-sticker";
            sticker.src = strip.ornament;
            sticker.alt = "ornament";
            card.appendChild(sticker);
            const wrap = document.createElement("div");
            wrap.className = "strip-photos";
            photos.forEach(ph=>{
                const img = document.createElement("img");
                img.className = "strip-photo";
                img.src = ph.src;
                img.alt = "memory";
                img.loading = "lazy";
                attachFallback(img);
                wrap.appendChild(img);
            });
            card.appendChild(wrap);
            const label = document.createElement("p");
            label.className = "strip-label";
            label.textContent = strip.name;
            card.appendChild(label);
            card.addEventListener("click", ()=>openStrip(i));
            stripGallery.appendChild(card);
        });
    }

    function openStrip(index){
        if(currentStrip === index) return;
        currentStrip = index;
        const strip = STRIPS[index];
        const photos = PHOTOS.slice(index*4, (index+1)*4);
        stripLarge.style.setProperty("--accent", strip.accent);
        stripLarge.style.setProperty("--tint", strip.tint);
        stripLarge.style.backgroundImage = "url('" + strip.bg + "')";
        stripLarge.innerHTML = "";
        const sticker = document.createElement("img");
        sticker.className = "strip-sticker";
        sticker.src = strip.ornament;
        sticker.alt = "ornament";
        stripLarge.appendChild(sticker);
        const wrap = document.createElement("div");
        wrap.className = "strip-photos";
        photos.forEach((ph, pi)=>{
            const img = document.createElement("img");
            img.className = "strip-photo";
            img.src = ph.src;
            img.alt = "memory";
            attachFallback(img);
            const globalIdx = index*4 + pi;
            img.addEventListener("click", e=>{ e.stopPropagation(); openLightbox(globalIdx); });
            wrap.appendChild(img);
        });
        stripLarge.appendChild(wrap);
        const label = document.createElement("p");
        label.className = "strip-label";
        label.textContent = strip.name + " ♡";
        stripLarge.appendChild(label);
        addFloatStickers(strip);
        stripStage.classList.add("show");
        setTimeout(()=>burstStickers(strip), 420);
    }

    function addFloatStickers(strip){
        const positions = [
            { top:"-30px", left:"-50px" }, { top:"12%", right:"-60px" },
            { top:"52%", left:"-60px" }, { top:"82%", right:"-50px" },
            { bottom:"12%", left:"-50px" }, { bottom:"-30px", right:"10%" }
        ];
        positions.forEach((pos, i)=>{
            const el = document.createElement("img");
            el.className = "float-sticker";
            el.src = strip.ornament;
            el.alt = "ornament";
            Object.assign(el.style, pos);
            el.style.animationDelay = (i*0.4)+"s";
            el.style.width = (30 + Math.random()*15)+"px";
            el.style.height = el.style.width;
            stripLarge.appendChild(el);
        });
    }

    function burstStickers(strip){
        const rect = stripLarge.getBoundingClientRect();
        const cx0 = rect.left + rect.width/2;
        const cy0 = rect.top + rect.height/2;
        for(let i=0; i<28; i++){
            const el = document.createElement("img");
            el.className = "burst-sticker";
            el.src = strip.ornament;
            el.alt = "ornament";
            const angle = (i/28)*Math.PI*2 + rnd(-0.2, 0.2);
            const dist = 200 + Math.random()*220;
            el.style.left = cx0+"px";
            el.style.top = cy0+"px";
            el.style.setProperty("--dx", Math.cos(angle)*dist+"px");
            el.style.setProperty("--dy", Math.sin(angle)*dist+"px");
            el.style.setProperty("--rot", (Math.random()*720-360)+"deg");
            el.style.animationDelay = (Math.random()*0.35)+"s";
            el.style.width = (30+Math.random()*20)+"px";
            el.style.height = el.style.width;
            document.body.appendChild(el);
            setTimeout(()=>el.remove(), 3200);
        }
        for(let i=0; i<14; i++){
            setTimeout(()=>{
                const el = document.createElement("img");
                el.className = "burst-sticker sparkle";
                el.src = "assets/img/ornament-star.png";
                el.alt = "sparkle";
                el.style.left = cx0+"px";
                el.style.top = cy0+"px";
                el.style.setProperty("--dx", (Math.random()-0.5)*320+"px");
                el.style.setProperty("--dy", (Math.random()-0.5)*420+"px");
                el.style.setProperty("--rot", "0deg");
                el.style.animationDelay = "0s";
                document.body.appendChild(el);
                setTimeout(()=>el.remove(), 2400);
            }, i*90);
        }
    }

    function closeStrip(){
        stripStage.classList.remove("show");
        currentStrip = -1;
        setTimeout(()=>{ if(!stripStage.classList.contains("show")) stripLarge.innerHTML = ""; }, 500);
    }

    if(stripClose) stripClose.addEventListener("click", closeStrip);
    if(stripStage) stripStage.addEventListener("click", e=>{ if(e.target === stripStage) closeStrip(); });
    document.addEventListener("keydown", e=>{
        if(lightbox.classList.contains("show")){
            if(e.key === "Escape") closeLightbox();
            if(e.key === "ArrowLeft") navLightbox(-1);
            if(e.key === "ArrowRight") navLightbox(1);
            return;
        }
        if(stripStage.classList.contains("show") && e.key === "Escape") closeStrip();
    });

    buildStrips();

    window.resetMemori = function(){
        closeStrip();
        closeLightbox();
    };
})();

/* ============================================================
   6. SURAT MODULE
   ============================================================ */
(function(){
    'use strict';
    const envelopeBtn = document.getElementById('envelopeBtn');
    const envelopeArea = document.getElementById('envelope-area');
    const letterPaper = document.getElementById('letterPaper');
    const headerArea = document.getElementById('header-area');
    const btnContainer = document.getElementById('btnContainer');
    const mainStage = document.getElementById('mainStage');
    const goldFlash = document.getElementById('goldFlash');
    const tapHint = document.getElementById('tapHint');
    const pageSurat = document.getElementById('page-surat');
    const dustContainer = document.getElementById('dustContainer');
    let dustInterval = null;
    let observer = null;

    function createDust(){
        if(dustInterval) return;
        dustInterval = setInterval(()=>{
            if(!pageSurat.classList.contains('reading-mode-active')) return;
            const dust = document.createElement('div');
            dust.classList.add('dust');
            const size = Math.random()*4+2;
            dust.style.width = size+'px';
            dust.style.height = size+'px';
            dust.style.left = Math.random()*100+'vw';
            const dur = Math.random()*7+5;
            dust.style.animationDuration = dur+'s';
            dustContainer.appendChild(dust);
            setTimeout(()=>dust.remove(), dur*1000);
        }, 300);
    }
    function setupScrollReveal(){
        if(observer) observer.disconnect();
        const reveals = document.querySelectorAll('#page-surat .reveal-on-scroll');
        observer = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        reveals.forEach(r=>observer.observe(r));
    }
    function createSparkles(){
        const colors = ['#c5a880','#e8b4b8','#ffffff'];
        for(let i=0; i<40; i++){
            setTimeout(()=>{
                const sp = document.createElement('div');
                sp.style.position = 'fixed';
                sp.style.left = '50%';
                sp.style.top = '50%';
                sp.style.width = (Math.random()*8+4)+'px';
                sp.style.height = sp.style.width;
                sp.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
                sp.style.borderRadius = '50%';
                sp.style.pointerEvents = 'none';
                sp.style.zIndex = '99';
                sp.style.boxShadow = '0 0 10px #fff';
                document.body.appendChild(sp);
                const angle = Math.random()*Math.PI*2;
                const dist = Math.random()*300+100;
                sp.style.transition = 'all 1.5s cubic-bezier(0.2,0.8,0.2,1)';
                sp.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`;
                sp.style.opacity = '0';
                setTimeout(()=>sp.remove(), 1500);
            }, i*20);
        }
    }

    if(envelopeBtn){
        envelopeBtn.addEventListener('click', ()=>{
            envelopeBtn.style.pointerEvents = 'none';
            tapHint.style.opacity = '0';
            envelopeBtn.classList.add('shake');
            setTimeout(()=>{
                envelopeBtn.classList.remove('shake');
                envelopeBtn.classList.add('open');
                setTimeout(()=>{
                    goldFlash.classList.add('active');
                    envelopeBtn.classList.add('fade-out');
                    setTimeout(()=>{
                        pageSurat.classList.add('reading-mode-active');
                        envelopeArea.style.display = 'none';
                        headerArea.style.opacity = "0";
                        mainStage.classList.add('reading');
                        createDust();
                        setTimeout(()=>{
                            letterPaper.classList.add('show');
                            createSparkles();
                            setTimeout(()=>{
                                setupScrollReveal();
                                setTimeout(()=>document.getElementById('signature').classList.add('typing'), 1500);
                                btnContainer.classList.add('show');
                            }, 1000);
                        }, 600);
                    }, 600);
                }, 1000);
            }, 400);
        });
    }

    window.resetSurat = function(){
        if(!envelopeBtn) return;
        envelopeBtn.style.pointerEvents = '';
        envelopeBtn.classList.remove('shake','open','fade-out');
        tapHint.style.opacity = '';
        goldFlash.classList.remove('active');
        pageSurat.classList.remove('reading-mode-active');
        envelopeArea.style.display = 'flex';
        headerArea.style.opacity = '1';
        mainStage.classList.remove('reading');
        letterPaper.classList.remove('show');
        btnContainer.classList.remove('show');
        document.getElementById('signature').classList.remove('typing');
        document.querySelectorAll('#page-surat .reveal-on-scroll').forEach(el=>el.classList.remove('visible'));
        if(observer){ observer.disconnect(); observer = null; }
        if(dustInterval){ clearInterval(dustInterval); dustInterval = null; }
        dustContainer.innerHTML = '';
    };
})();