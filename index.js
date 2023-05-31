const visitTime = new Date(new Date().setSeconds(0, 0)).getTime();

function setScrollValue() {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
    document.documentElement.style.setProperty('--scroll-y-percent', window.scrollY / window.innerHeight);
    document.documentElement.classList.toggle('scrolled', window.scrollY > 0);
};

setScrollValue();
window.addEventListener('scroll', setScrollValue);
window.addEventListener('resize', setScrollValue);

document.querySelector('.down-arrow-inner').addEventListener('click', () => {
    window.scrollTo({
        top: window.innerHeight * 0.3,
        behavior: 'smooth'
    });
});

function setClock() {
    const date = new Date();
    const { year, month, day, hour, minute, second } = (() => {
        const dayObject = {};
        new Intl.DateTimeFormat([], {
            timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, day: 'numeric', month: 'numeric', year: 'numeric'
        }).formatToParts(new Date()).forEach(({ type: type, value: value }) => {
            if (type !== 'literal') dayObject[type] = Number(value);
        });
        return dayObject;
    })();

    const hourOffset = -date.getTimezoneOffset() / 60;
    const minuteOffset = new Date(date.getTime() - date.getTime() % 1000 - hourOffset * 60 * 60 * 1000);
    const myTimezoneOffset = (new Date(year, month - 1, day, hour, minute, second) - minuteOffset) / 1000 / 60 / 60;
    const timezoneDiff = myTimezoneOffset - hourOffset;
    const timePassed = date.getTime() - visitTime;

    document.querySelector('.widget-clock-hour-hand').style.transform = `rotate(${hour % 12 / 12 * 360 + minute / 60 * 30 + second / 60 / 60 * 30}deg)`;
    document.querySelector('.widget-clock-minute-hand').style.transform = `rotate(${minute / 60 * 360 + second / 60 * 6}deg)`;
    document.querySelector('.widget-clock-second-hand').style.transform = `rotate(${360 * Math.floor(timePassed / 60 / 1000) + second / 60 * 360}deg)`;
    document.querySelector('.widget-clock-date-text').innerHTML = new Date(date.getTime() + timezoneDiff * 60 * 60 * 1000).toLocaleDateString();
    document.querySelector('.widget-clock-timezone-abbr').innerHTML = 'ICT';
    document.querySelector('.widget-clock-hour').innerHTML = hour.toString().padStart(2, '0');
    document.querySelector('.widget-clock-minute').innerHTML = minute.toString().padStart(2, '0');
    document.querySelector('.widget-clock-second').innerHTML = second.toString().padStart(2, '0');
    document.querySelector('.widget-clock-timezone-diff').innerHTML = timezoneDiff === 0 ? 'same time' : (timezoneDiff > 0 ? `${formatTimezoneDiff(timezoneDiff)} ahead` : `${formatTimezoneDiff(-timezoneDiff)} behind`);
    document.querySelector('.widget-clock-timezone-utc-offset').innerHTML = ` / UTC ${(myTimezoneOffset >= 0 ? '+' : '')}${Math.floor(myTimezoneOffset)}:${(myTimezoneOffset % 1 * 60).toString().padStart(2, '0')}`;
}

setClock();
setInterval(setClock, 500);

function formatTimezoneDiff(timeZoneDifferent) {
    if (timeZoneDifferent < 0) return `-${formatTimezoneDiff(-timeZoneDifferent)}`;

    const minutes = timeZoneDifferent % 1 * 60;
    timeZoneDifferent = Math.floor(timeZoneDifferent);

    if (minutes) return `${timeZoneDifferent}h ${minutes}m`;

    return `${timeZoneDifferent}h`;
}

function setSquareSizeAndGap() {
    const bento = document.querySelector('.bento');

    const numColumns = getComputedStyle(bento).gridTemplateColumns.split(' ').length;
    const columnGap = parseInt(getComputedStyle(bento).columnGap);
    const squareSize = (bento.offsetWidth - columnGap * (numColumns - 1)) / numColumns;

    bento.style.setProperty('--square-size', `${squareSize}px`);
    bento.style.setProperty('--gap', `${columnGap}px`);
};

setSquareSizeAndGap();
window.addEventListener('resize', setSquareSizeAndGap);

document.addEventListener('mousemove', ({ clientX, clientY }) => {
    document.querySelector('#background').style.setProperty('--tx', `${20 * (clientX - window.innerWidth / 2) / window.innerWidth}px`);
    document.querySelector('#background').style.setProperty('--ty', `${20 * (clientY - window.innerHeight / 2) / window.innerHeight}px`);
});
document.addEventListener('mouseleave', () => {
    document.querySelector('#background').style.setProperty('--tx', '0px');
    document.querySelector('#background').style.setProperty('--ty', '0px');
});

window.addEventListener('touchstart', () => {
    document.body.classList.add("touch-device");
}, { once: true });

document.querySelectorAll('.project').forEach(async (project) => {
    const href = project.querySelector('a').getAttribute('href');
    if (!href.startsWith('https://github.com/')) return;
    const { star, fork } = await (await fetch(`/repos/${href.slice(19)}`)).json();

    project.querySelector('.project-metas').insertAdjacentHTML('afterbegin', `
    <div class="project-meta project-stars">
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" stroke-width="0" fill="currentColor"></path>
        </svg>${star ?? '-'}</div>
    <div class="project-meta project-forks">
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em">
            <g>
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21 3.001 3.001 0 1 1 2.032.064A5.001 5.001 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21z"></path>
            </g>
        </svg>${fork ?? '-'}</div>`);
})
