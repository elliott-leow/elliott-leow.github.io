(window.setScroll = () => document.body.style.setProperty('--scroll', scrollY / innerHeight))();
['scroll', 'resize'].forEach(e => addEventListener(e, setScroll));


const bg = document.querySelector('#bg');

addEventListener('touchstart', () => bg.style.setProperty('--multiplier', '0'));
addEventListener('mousemove', ({ clientX, clientY }) => {
    bg.style.setProperty('--tx', `${20 * (clientX - innerWidth / 2) / innerWidth}px`);
    bg.style.setProperty('--ty', `${20 * (clientY - innerHeight / 2) / innerHeight}px`);
});

['mouseenter', 'mouseleave'].forEach(e => document.addEventListener(e, () => {
    if (e === 'mouseleave') bg.removeAttribute('style');
    bg.style.transition = 'transform .1s linear';
    setTimeout(() => bg.style.transition = '', 100);
}));

document.querySelector('#arrow svg').addEventListener('click', () => {
    const start = performance.now();

    !function step() {
        const progress = (performance.now() - start) / 200;
        scrollTo({ top: (innerWidth > 880 ? .3 : .8) * innerHeight * easeOutCubic(progress) });
        if (progress < 1) requestAnimationFrame(step);
    }();

    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const animationEasing = 'cubic-bezier(0.42, 0, 0.58, 1)'; // Customize your bezier curve here
    const animationDuration = 350;

    document.querySelectorAll('.collapsible-section summary').forEach(summary => {
        summary.addEventListener('click', e => {
            e.preventDefault();
            const details = summary.parentElement;
            if (details.dataset.isAnimating) return;
            details.dataset.isAnimating = true;

            const content = summary.nextElementSibling;
            
            if (details.open) {
                const currentHeight = content.offsetHeight + 'px';
                const anim = content.animate({ maxHeight: [currentHeight, '0px'] }, {
                    duration: animationDuration,
                    easing: animationEasing
                });

                anim.onfinish = () => {
                    details.removeAttribute('open');
                    delete details.dataset.isAnimating;
                };
            } else {
                details.setAttribute('open', '');
                const targetHeight = content.offsetHeight + 'px';
                const anim = content.animate({ maxHeight: ['0px', targetHeight] }, {
                    duration: animationDuration,
                    easing: animationEasing
                });

                anim.onfinish = () => {
                    delete details.dataset.isAnimating;
                };
            }
        });
    });
});
