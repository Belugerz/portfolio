const movie1 = document.querySelector('#pc-fv-movie1');
const movie2 = document.querySelector('#pc-fv-movie2');
const home = document.querySelector('#home');
const skillsPanel  = document.getElementById('skillsPanel');
const skillsScroller= skillsPanel.querySelector('.rise-panel');
const skillsSection = skillsPanel.querySelector('.skills-scroll');
const skillsTrack  = skillsPanel.querySelector('.skills-track');
const skillsBg = document.getElementById('Skills');
const skillCards = [...skillsPanel.querySelectorAll('.skill-card')];



const fadeDuration = 0;

movie1.loop = false;
movie1.style.opacity = 1;
movie2.style.opacity = 0;


let handedOff = false;

const PER_CARD = 700;

let maxX = 0;
let speed = 1;

const loader = document.querySelector('.loading-screen');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const IDLE_FULL  = 800;
const DRAIN_TIME = 2400;
const IDLE_TEXT  = 1000;
const FADE_TIME  = 1000;

loader.style.setProperty('--drain-time', DRAIN_TIME + 'ms');

window.addEventListener('load', async () => {
    await wait(IDLE_FULL);
    loader.classList.add('drained');

    await wait(DRAIN_TIME + IDLE_TEXT);
    loader.classList.add('done');       // fade out
    document.body.classList.remove('loading');

    movie1.currentTime = 1;
    movie1.play();

    await wait(FADE_TIME);
    loader.remove();
});

document.querySelectorAll('[data-scroll]').forEach((item) => {
    item.addEventListener('click', () => {
        document.getElementById(item.dataset.scroll)
            .scrollIntoView({ behavior: 'smooth' });
    });
});


movie1.addEventListener('timeupdate', () => {
    if (!handedOff && movie1.duration && movie1.currentTime >= movie1.duration - fadeDuration) {
        handedOff = true;

        movie2.currentTime = 0;
        movie2.play();

        movie1.style.opacity = 0;
        movie2.style.opacity = 1;

        setTimeout(() => movie1.pause(), fadeDuration * 1000);
    }
});

function openPanel(panel) {
    panel.inert = false;
    panel.classList.add('is-open');
    document.body.classList.add('panel-open');
    home.inert = true;
    panel.querySelector('.rise-panel').scrollTop = 0;
    if (panel.id === 'skillsPanel') setupSkills();
    replayRise(panel);
}

function closePanel(panel) {
    panel.inert = true;
    const inner = panel.querySelector('.rise-panel');
    panel.classList.remove('is-open');

    inner.addEventListener('transitionend', function onHidden(e) {
        if (e.propertyName !== 'transform') return;
        document.body.classList.remove('panel-open');
        home.inert = false;
        resetRise(panel);
        inner.removeEventListener('transitionend', onHidden);
    });
}

document.querySelectorAll('[data-panel]').forEach((navItem) => {
    navItem.addEventListener('click', () => {
        const panel = document.getElementById(navItem.dataset.panel);
        if (panel) openPanel(panel);
    });
});
document.querySelectorAll('.close-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        closePanel(btn.closest('.rise-wrap'));
    });
});

function setupSkills() {
    maxX = skillsTrack.scrollWidth - window.innerWidth;
    const cardStep = skillCards.length > 1
        ? skillCards[1].offsetLeft - skillCards[0].offsetLeft
        : skillCards[0].offsetWidth;
    speed = PER_CARD / cardStep;

    skillsSection.style.height = (window.innerHeight + maxX * speed) + 'px';
    updateSkills();
}

function updateSkills() {
    const scrolled = skillsScroller.scrollTop - skillsSection.offsetTop;
    const progress = Math.min(Math.max(scrolled / (maxX * speed), 0), 1);
    skillsTrack.style.transform = `translateX(${-progress * maxX}px)`;

    const items = [...skillsTrack.querySelectorAll('[data-color]')];
    const line = window.innerWidth * 0.6;
    let active = items[0];
    items.forEach((item) => {
        if (item.getBoundingClientRect().left < line) active = item;
    });

    items.forEach((item) => item.classList.toggle('active', item === active));
    skillsBg.style.setProperty('--skills-bg', active.dataset.color);

    const pattern = active.dataset.pattern;
    if (pattern) skillsBg.style.setProperty('--skills-pattern', pattern);
    skillsBg.classList.toggle('has-pattern', !!pattern);
}

let ticking = false;
skillsScroller.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateSkills(); ticking = false; });
});

document.querySelectorAll('.image-project-container').forEach((box) => {
    const imgs = [...box.querySelectorAll('img')];
    const dotsBox = box.querySelector('.slide-dots');
    if (imgs.length < 2 || !dotsBox) return;

    const n = imgs.length;
    const delay = Number(box.dataset.interval) || 0;
    let timer = null;


    const slides = document.createElement('div');
    slides.className = 'slides';
    const track = document.createElement('div');
    track.className = 'slides-track';
    imgs.forEach((img) => track.appendChild(img));
    slides.appendChild(track);
    box.prepend(slides);


    function move(px = 0, animate = true) {
        track.style.transition = animate ? '' : 'none';
        track.style.transform = `translateX(calc(${-current * 100}% + ${px}px))`;
    }

    const dots = imgs.map((_, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Gambar ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); startAuto(); });
        dotsBox.appendChild(dot);
        return dot;
    });

    function goTo(i) {
        current = i;
        dots.forEach((d, k) => d.classList.toggle('active', k === current));
        move();
    }

    function startAuto() {
        clearInterval(timer);
        if (delay) timer = setInterval(() => goTo((current + 1) % n), delay);
    }


    let dragging = false;
    let startX = 0;
    let dx = 0;

    slides.addEventListener('pointerdown', (e) => {
        dragging = true;
        startX = e.clientX;
        dx = 0;
        slides.setPointerCapture(e.pointerId);
        clearInterval(timer);
    });

    slides.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        dx = e.clientX - startX;

        if ((current === 0 && dx > 0) || (current === n - 1 && dx < 0)) dx *= 0.3;
        move(dx, false);
    });

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        const limit = slides.offsetWidth * 0.2;
        if (dx < -limit && current < n - 1) goTo(current + 1);
        else if (dx > limit && current > 0) goTo(current - 1);
        else move();
        startAuto();
    }

    slides.addEventListener('pointerup', endDrag);
    slides.addEventListener('pointercancel', endDrag);

    goTo(0);
    startAuto();
});

const reloadText = document.querySelector('.reload-text');
new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) {
        reloadText.classList.add('drawn');
        obs.disconnect();
    }
}, { threshold: 0.3 }).observe(reloadText);


function splitRise(el) {
    const byWord = el.dataset.split === 'word';
    let i = 0;

    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));

    function makeMask(text) {
        const mask = document.createElement('span');
        mask.className = 'rt-mask';
        mask.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.className = 'rt-char';
        inner.textContent = text;
        inner.style.setProperty('--i', i++);
        mask.appendChild(inner);
        return mask;
    }


    function walk(node) {
        [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) return walk(child);
            if (child.nodeType !== Node.TEXT_NODE) return;

            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    frag.appendChild(document.createTextNode(' '));
                    return;
                }
                if (byWord) {
                    frag.appendChild(makeMask(part));
                } else {
                    const word = document.createElement('span');
                    word.className = 'rt-word';
                    [...part].forEach((ch) => word.appendChild(makeMask(ch)));
                    frag.appendChild(word);
                }
            });
            child.replaceWith(frag);
        });
    }

    walk(el);
}

const riseObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            riseObserver.unobserve(entry.target);   // cukup animasi sekali
        }
    });
}, { threshold: 0.4 });

document.querySelectorAll('.rise-text').forEach((el) => {
    splitRise(el);
    riseObserver.observe(el);
});

document.querySelectorAll('.rise-block').forEach((el) => {
    const inner = document.createElement('div');
    inner.className = 'rb-inner';

    const display = getComputedStyle(el).display;
    inner.style.display = display === 'inline' ? 'inline-block' : display;

    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);

    riseObserver.observe(el);
})


function resetRise(panel) {
    panel.querySelectorAll('.rise-text, .rise-block').forEach((el) => {
        el.classList.remove('show');
        riseObserver.unobserve(el);
    });
}

function replayRise(panel) {
    panel.querySelectorAll('.rise-text, .rise-block').forEach((el) => {
        riseObserver.observe(el);
    });
}

window.addEventListener('resize', setupSkills);
window.addEventListener('load', setupSkills);

