(() => {
    const logo = document.querySelector('header h1 > svg');
    if (!logo) return;

    logo.setAttribute('viewBox', '92 140 454 70.3');
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', 'Elliott Leow');
    logo.removeAttribute('width');
    logo.removeAttribute('height');
    logo.dataset.logoAnimation = 'ready';
    logo.dataset.logoTypeface = 'Montserrat Bold';
    logo.innerHTML = `
        <title>Elliott Leow</title>
        <defs>
            <!-- Montserrat Bold outlines; Elliott maps to VRoid and Leow maps to Studio. -->
            <path id="logo-elliott-e" data-font-outline="Montserrat-Bold"
                d="M83 0V700H612V570H244V130H625V0ZM232 292V418H569V292Z"></path>
            <path id="logo-glyph-l" data-font-outline="Montserrat-Bold"
                d="M72 0V742H228V0Z"></path>
            <path id="logo-glyph-i-stem" data-font-outline="Montserrat-Bold"
                d="M72 0V538H228V0Z"></path>
            <path id="logo-glyph-i-dot" data-font-outline="Montserrat-Bold"
                d="M150 613Q107 613 80 638Q53 663 53 700Q53 737 80 762Q107 787 150 787Q193 787 220 763.5Q247 740 247 703Q247 664 220.5 638.5Q194 613 150 613Z"></path>
            <g id="logo-glyph-i" data-font-outline="Montserrat-Bold">
                <use href="#logo-glyph-i-stem"></use>
                <use href="#logo-glyph-i-dot"></use>
            </g>
            <path id="logo-glyph-o" data-font-outline="Montserrat-Bold"
                d="M328-8Q242-8 175.5 28Q109 64 70.5 126.5Q32 189 32 269Q32 350 70.5 412.5Q109 475 175.5 510.5Q242 546 328 546Q413 546 480 510.5Q547 475 585 413Q623 351 623 269Q623 189 585 126.5Q547 64 480 28Q413-8 328-8ZM328 120Q367 120 398 138Q429 156 447 189.5Q465 223 465 269Q465 316 447 349Q429 382 398 400Q367 418 328 418Q289 418 258 400Q227 382 208.5 349Q190 316 190 269Q190 223 208.5 189.5Q227 156 258 138Q289 120 328 120Z"></path>
            <path id="logo-glyph-t" data-font-outline="Montserrat-Bold"
                d="M292-8Q197-8 144 40.5Q91 89 91 185V657H247V187Q247 153 265 134.5Q283 116 314 116Q351 116 377 136L419 26Q395 9 361.5.5Q328-8 292-8ZM8 418V538H381V418Z"></path>
            <path id="logo-glyph-L" data-font-outline="Montserrat-Bold"
                d="M83 0V700H245V132H596V0Z"></path>
            <path id="logo-glyph-e" data-font-outline="Montserrat-Bold"
                d="M339-8Q247-8 177.5 28Q108 64 70 126.5Q32 189 32 269Q32 350 69.5 412.5Q107 475 172 510.5Q237 546 319 546Q398 546 461.5 512.5Q525 479 562 416.5Q599 354 599 267Q599 258 598 246.5Q597 235 596 225H159V316H514L454 289Q454 331 437 362Q420 393 390 410.5Q360 428 320 428Q280 428 249.5 410.5Q219 393 202 361.5Q185 330 185 287V263Q185 219 204.5 185.5Q224 152 259.5 134.5Q295 117 343 117Q386 117 418.5 130Q451 143 478 169L561 79Q524 37 468 14.5Q412-8 339-8Z"></path>
            <path id="logo-glyph-w" data-font-outline="Montserrat-Bold"
                d="M195 0 1 538H148L309 75H239L407 538H539L702 75H632L798 538H936L741 0H590L447 397H493L345 0Z"></path>
            <path id="logo-glyph-V" data-font-outline="Montserrat-Bold"
                d="M293 0-9 700H166L430 80H327L595 700H756L453 0Z"></path>
            <path id="logo-glyph-R" data-font-outline="Montserrat-Bold"
                d="M83 0V700H382Q528 700 609 632.5Q690 565 690 446Q690 368 653 311.5Q616 255 548 225Q480 195 386 195H173L245 266V0ZM528 0 353 254H526L703 0ZM245 248 173 324H377Q452 324 489 356.5Q526 389 526 446Q526 504 489 536Q452 568 377 568H173L245 645Z"></path>
            <path id="logo-glyph-S" data-font-outline="Montserrat-Bold"
                d="M313-12Q229-12 152 10.5Q75 33 28 69L83 191Q128 159 189.5 138.5Q251 118 314 118Q362 118 391.5 127.5Q421 137 435 154Q449 171 449 193Q449 221 427 237.5Q405 254 369 264.5Q333 275 289.5 284.5Q246 294 202.5 308Q159 322 123 344Q87 366 64.5 402Q42 438 42 494Q42 554 74.5 603.5Q107 653 172.5 682.5Q238 712 337 712Q403 712 467 696.5Q531 681 580 650L530 527Q481 555 432 568.5Q383 582 336 582Q289 582 259 571Q229 560 216 542.5Q203 525 203 502Q203 475 225 458.5Q247 442 283 432Q319 422 362.5 412Q406 402 449.5 389Q493 376 529 354Q565 332 587.5 296Q610 260 610 205Q610 146 577 97Q544 48 478.5 18Q413-12 313-12Z"></path>
            <path id="logo-glyph-u" data-font-outline="Montserrat-Bold"
                d="M299-8Q232-8 179.5 18Q127 44 98 97.5Q69 151 69 234V538H225V257Q225 190 253.5 158.5Q282 127 334 127Q370 127 398 142.5Q426 158 442 190.5Q458 223 458 272V538H614V0H466V148L493 105Q466 49 413.5 20.5Q361-8 299-8Z"></path>
            <path id="logo-glyph-d" data-font-outline="Montserrat-Bold"
                d="M303-8Q227-8 166 26.5Q105 61 69.5 123Q34 185 34 269Q34 354 69.5 416Q105 478 166 512Q227 546 303 546Q371 546 422 516Q473 486 501 425Q529 364 529 269Q529 175 502 113.5Q475 52 424.5 22Q374-8 303-8ZM330 120Q368 120 399 138Q430 156 448.5 189.5Q467 223 467 269Q467 316 448.5 349Q430 382 399 400Q368 418 330 418Q291 418 260 400Q229 382 210.5 349Q192 316 192 269Q192 223 210.5 189.5Q229 156 260 138Q291 120 330 120ZM471 0V110L474 270L464 429V742H620V0Z"></path>

            <g id="logo-elliott-shape">
                <use href="#logo-elliott-e" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-l" transform="translate(642.429)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-l" transform="translate(914.857)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-i" transform="translate(1187.286)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-o" transform="translate(1459.714)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-t" transform="translate(2086.143)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-t" transform="translate(2492.572)" data-font-outline="Montserrat-Bold"></use>
            </g>
            <g id="logo-elliott-rest-shape">
                <use href="#logo-glyph-l" transform="translate(642.429)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-l" transform="translate(914.857)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-i" transform="translate(1187.286)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-o" transform="translate(1459.714)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-t" transform="translate(2086.143)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-t" transform="translate(2492.572)" data-font-outline="Montserrat-Bold"></use>
            </g>
            <path id="logo-elliott-e-trace" data-traces-letter="E"
                d="M580 590L540 650L150 650L150 355L550 355L150 355L150 65L580 65"></path>
            <g id="logo-leow-shape">
                <use href="#logo-glyph-L" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-e" transform="translate(575.429)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-o" transform="translate(1173.857)" data-font-outline="Montserrat-Bold"></use>
                <use href="#logo-glyph-w" transform="translate(1800.286)" data-font-outline="Montserrat-Bold"></use>
            </g>
            <g id="logo-typeface-calibration">
                <use href="#logo-glyph-V"></use>
                <use href="#logo-glyph-R" transform="translate(717.429)"></use>
                <use href="#logo-glyph-o" transform="translate(1408.857)"></use>
                <use href="#logo-glyph-i" transform="translate(2035.286)"></use>
                <use href="#logo-glyph-d" transform="translate(2307.714)"></use>
                <use href="#logo-glyph-S" transform="translate(3225.572)"></use>
                <use href="#logo-glyph-t" transform="translate(3835)"></use>
                <use href="#logo-glyph-u" transform="translate(4241.429)"></use>
                <use href="#logo-glyph-d" transform="translate(4899.857)"></use>
                <use href="#logo-glyph-i" transform="translate(5563.286)"></use>
                <use href="#logo-glyph-o" transform="translate(5835.715)"></use>
            </g>

            <clipPath id="logo-elliott-reveal-clip" clipPathUnits="userSpaceOnUse">
                <rect class="logo-elliott-reveal" x="128" y="140" width="174" height="68"></rect>
            </clipPath>
            <clipPath id="logo-elliott-e-outline-clip" clipPathUnits="userSpaceOnUse">
                <use href="#logo-elliott-e"></use>
            </clipPath>
            <clipPath id="logo-elliott-l1-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="l1" data-axis="width" data-extent="190"
                    class="logo-elliott-letter-reveal logo-elliott-l1-reveal"
                    x="700" y="-20" width="190" height="830"></rect>
            </clipPath>
            <clipPath id="logo-elliott-l2-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="l2" data-axis="width" data-extent="190"
                    class="logo-elliott-letter-reveal logo-elliott-l2-reveal"
                    x="972" y="-20" width="190" height="830"></rect>
            </clipPath>
            <clipPath id="logo-elliott-i-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="i" data-axis="height" data-extent="550"
                    class="logo-elliott-letter-reveal logo-elliott-i-reveal"
                    x="1240" y="-8" width="200" height="550"></rect>
            </clipPath>
            <clipPath id="logo-elliott-o-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="o" data-axis="height" data-extent="554"
                    class="logo-elliott-letter-reveal logo-elliott-o-reveal"
                    x="1480" y="-8" width="620" height="554"></rect>
            </clipPath>
            <clipPath id="logo-elliott-t1-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="t1" data-axis="width" data-extent="440"
                    class="logo-elliott-letter-reveal logo-elliott-t1-reveal"
                    x="2080" y="-20" width="440" height="830"></rect>
            </clipPath>
            <clipPath id="logo-elliott-t2-clip" clipPathUnits="userSpaceOnUse">
                <rect data-elliott-reveal="t2" data-axis="width" data-extent="440"
                    class="logo-elliott-letter-reveal logo-elliott-t2-reveal"
                    x="2486" y="-20" width="440" height="830"></rect>
            </clipPath>
            <clipPath id="logo-leow-outline-reveal-clip" clipPathUnits="userSpaceOnUse">
                <rect class="logo-leow-outline-reveal" x="347" y="140" width="199" height="68"></rect>
            </clipPath>
            <clipPath id="logo-leow-white-clip" clipPathUnits="userSpaceOnUse">
                <rect class="logo-leow-white-clip" x="347" y="140" width="199" height="68"></rect>
            </clipPath>
            <clipPath id="logo-leow-yellow-window-clip" clipPathUnits="userSpaceOnUse">
                <rect class="logo-leow-yellow-window" x="325" y="138" width="60" height="72"></rect>
            </clipPath>
            <mask id="logo-elliott-e-draw-mask" maskUnits="userSpaceOnUse" x="60" y="-20" width="590" height="750">
                <rect x="60" y="-20" width="590" height="750" fill="#000"></rect>
                <use class="logo-elliott-e-mask-line" href="#logo-elliott-e-trace"></use>
            </mask>
            <linearGradient id="logo-yellow-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffe400"></stop>
                <stop offset="1" stop-color="#ffb81c"></stop>
            </linearGradient>
        </defs>

        <path id="logo-opening-slash" data-logo-layer pathLength="1" d="M140 152L116 206"></path>

        <g id="logo-elliott" data-logo-layer>
            <g transform="translate(85.84 203) scale(.074241 -.075)">
                <g id="logo-elliott-e-outline" clip-path="url(#logo-elliott-e-outline-clip)">
                    <path class="logo-e-shooting-trace logo-e-shooting-spine"
                        data-e-shooting-trace="spine-bottom"
                        d="M150 650V65H580"></path>
                    <path class="logo-e-shooting-head logo-e-shooting-spine-head"
                        d="M150 650V65H580"></path>
                    <path class="logo-e-shooting-trace logo-e-shooting-top"
                        data-e-shooting-trace="top"
                        d="M150 650H580"></path>
                    <path class="logo-e-shooting-head logo-e-shooting-top-head"
                        d="M150 650H580"></path>
                    <path class="logo-e-shooting-trace logo-e-shooting-middle"
                        data-e-shooting-trace="middle"
                        d="M150 355H550"></path>
                    <path class="logo-e-shooting-head logo-e-shooting-middle-head"
                        d="M150 355H550"></path>
                </g>
                <use id="logo-elliott-e-fill" href="#logo-elliott-e"
                    mask="url(#logo-elliott-e-draw-mask)"></use>
            </g>
            <g transform="translate(85.84 203) scale(.074241 -.075)">
                <g clip-path="url(#logo-elliott-l1-clip)">
                    <use href="#logo-glyph-l" transform="translate(642.429)"></use>
                </g>
                <g clip-path="url(#logo-elliott-l2-clip)">
                    <use href="#logo-glyph-l" transform="translate(914.857)"></use>
                </g>
                <g clip-path="url(#logo-elliott-i-clip)">
                    <use id="logo-elliott-i-stem" href="#logo-glyph-i-stem"
                        transform="translate(1187.286)"></use>
                </g>
                <g transform="translate(1187.286)">
                    <use id="logo-elliott-i-dot" href="#logo-glyph-i-dot"></use>
                </g>
                <g clip-path="url(#logo-elliott-o-clip)">
                    <use href="#logo-glyph-o" transform="translate(1459.714)"></use>
                </g>
                <g clip-path="url(#logo-elliott-t1-clip)">
                    <use href="#logo-glyph-t" transform="translate(2086.143)"></use>
                </g>
                <g clip-path="url(#logo-elliott-t2-clip)">
                    <use href="#logo-glyph-t" transform="translate(2492.572)"></use>
                </g>
            </g>
        </g>

        <g id="logo-leow-outline" data-logo-layer clip-path="url(#logo-leow-outline-reveal-clip)">
            <use href="#logo-leow-shape" transform="translate(340.743 203) scale(.075 -.075)"></use>
        </g>

        <path id="logo-orbit-stroke" data-logo-layer pathLength="1"
            d="M270 177C278 265 365 290 450 254C520 225 575 166 620 120"></path>

        <g id="logo-leow-white" data-logo-layer clip-path="url(#logo-leow-white-clip)">
            <use href="#logo-leow-shape" transform="translate(340.743 203) scale(.075 -.075)"></use>
        </g>

        <g id="logo-leow-yellow" data-logo-layer clip-path="url(#logo-leow-yellow-window-clip)">
            <use href="#logo-leow-shape" transform="translate(340.743 203) scale(.075 -.075)"></use>
        </g>`;

    const heroElements = [
        document.querySelector('header > img'),
        document.querySelector('header section > p'),
        document.querySelector('.social-links')
    ].filter(Boolean);
    const sequenceAnimations = () => [
        ...logo.getAnimations({ subtree: true }),
        ...heroElements.flatMap((element) => element.getAnimations()),
        ...Array.from(document.querySelectorAll('.scene-planet-entrance'))
            .flatMap((element) => element.getAnimations())
    ];

    const commonStartTime = document.timeline.currentTime;
    let frozenFrameTime = null;
    const synchronizeAnimations = (animations = sequenceAnimations()) => {
        animations.forEach((animation) => {
            animation.pause();
            if (frozenFrameTime !== null) {
                animation.currentTime = frozenFrameTime;
                return;
            }
            animation.currentTime = 0;
            animation.play();
            animation.startTime = commonStartTime;
        });
    };
    synchronizeAnimations();
    document.addEventListener('background-scene-ready', () => {
        synchronizeAnimations(Array.from(document.querySelectorAll('.scene-planet-entrance'))
            .flatMap((element) => element.getAnimations()));
    });

    const freezeFrame = (frame) => {
        const frameTime = Math.max(0, Math.min(153, Number(frame) || 0)) * 20;
        frozenFrameTime = frameTime;
        sequenceAnimations().forEach((animation) => {
            animation.pause();
            animation.currentTime = frameTime;
        });
    };

    window.setLogoAnimationFrame = freezeFrame;
    document.documentElement.classList.add('logo-animation-ready');
})();
