(window.setScroll = () => document.body.style.setProperty('--scroll', scrollY / innerHeight))();
['scroll', 'resize'].forEach(e => addEventListener(e, setScroll));


const bg = document.querySelector('#bg');
let parallaxInitialized = false;

function initializeParallax() {
    if (parallaxInitialized) return;

    const backgroundScene = bg?.querySelector('svg');
    const planets = Array.from(backgroundScene?.querySelectorAll('g[id^="planet-"]') ?? []);
    if (!backgroundScene || !planets.length) return;

    parallaxInitialized = true;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const maxParallaxPixels = 18;
    let parallaxFrame = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;

    const layers = planets.map((planet) => {
        const box = planet.getBBox();
        return {
            element: planet,
            baseTransform: planet.getAttribute('transform') ?? '',
            size: Number(planet.dataset.sceneSize) || Math.sqrt(box.width * box.height)
        };
    });
    const sizes = layers.map(({ size }) => size);
    const smallest = Math.min(...sizes);
    const range = Math.max(...sizes) - smallest || 1;

    const planetLayers = layers.map((layer) => {
        const depth = .12 + .88 * (layer.size - smallest) / range;
        layer.element.dataset.parallaxDepth = depth.toFixed(6);
        return { ...layer, depth };
    });

    function resetPlanetTransforms() {
        planetLayers.forEach(({ element, baseTransform }) => {
            element.setAttribute('transform', baseTransform);
        });
    }

    function renderParallax() {
        parallaxFrame = 0;

        if (reducedMotion.matches) {
            currentParallaxX = targetParallaxX = 0;
            currentParallaxY = targetParallaxY = 0;
            resetPlanetTransforms();
            return;
        }

        currentParallaxX += (targetParallaxX - currentParallaxX) * .14;
        currentParallaxY += (targetParallaxY - currentParallaxY) * .14;

        const sceneBox = backgroundScene.getBoundingClientRect();
        const sceneScale = Math.max(sceneBox.width / 5120, sceneBox.height / 2880);
        const viewBoxShift = maxParallaxPixels / sceneScale;

        planetLayers.forEach(({ element, baseTransform, depth }) => {
            const x = currentParallaxX * viewBoxShift * depth;
            const y = currentParallaxY * viewBoxShift * depth;
            element.setAttribute('transform', `${baseTransform} translate(${x.toFixed(3)} ${y.toFixed(3)})`);
        });

        const unsettled = Math.abs(targetParallaxX - currentParallaxX) > .001
            || Math.abs(targetParallaxY - currentParallaxY) > .001;
        if (unsettled) parallaxFrame = requestAnimationFrame(renderParallax);
    }

    function requestParallaxFrame() {
        if (!parallaxFrame) parallaxFrame = requestAnimationFrame(renderParallax);
    }

    addEventListener('mousemove', ({ clientX, clientY }) => {
        targetParallaxX = Math.max(-1, Math.min(1, 2 * clientX / innerWidth - 1));
        targetParallaxY = Math.max(-1, Math.min(1, 2 * clientY / innerHeight - 1));
        requestParallaxFrame();
    });

    document.addEventListener('mouseleave', () => {
        targetParallaxX = 0;
        targetParallaxY = 0;
        requestParallaxFrame();
    });

    reducedMotion.addEventListener('change', requestParallaxFrame);
}

if (bg?.querySelector('g[id^="planet-"]')) initializeParallax();
else document.addEventListener('background-scene-ready', initializeParallax, { once: true });

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
    const arrowDuration = 680;
    const panelDuration = 820;
    const itemDuration = 570;
    const textDuration = 440;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const controllers = new WeakMap();
    const mix = (start, end, progress) => start + (end - start) * progress;
    const smootherstep = (progress) => {
        const value = Math.max(0, Math.min(1, progress));
        return value * value * value * (value * (value * 6 - 15) + 10);
    };
    const stagedValue = (progress, stages) => {
        const stageIndex = stages.findIndex(({ offset }) => progress <= offset);
        if (stageIndex <= 0) return stages[0].value;
        if (stageIndex === -1) return stages.at(-1).value;

        const previous = stages[stageIndex - 1];
        const next = stages[stageIndex];
        const localProgress = smootherstep(
            (progress - previous.offset) / (next.offset - previous.offset)
        );
        return mix(previous.value, next.value, localProgress);
    };
    const sampledFrames = (count, createFrame) => Array.from({ length: count }, (_, index) => {
        const offset = index / (count - 1);
        return { offset, ...createFrame(offset) };
    });
    const pathValue = (points) => `path("${points.map(([x, y], index) => (
        `${index ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`
    )).join(' ')}")`;

    const arrowFrames = sampledFrames(86, (progress) => {
        const turn = stagedValue(progress, [
            { offset: 0, value: 0 },
            { offset: .48, value: Math.PI / 2 },
            { offset: 1, value: Math.PI / 2 }
        ]);
        const stretch = stagedValue(progress, [
            { offset: 0, value: 0 },
            { offset: .66, value: 1 },
            { offset: 1, value: 0 }
        ]);
        const settle = smootherstep(progress);
        const direction = [Math.cos(turn), Math.sin(turn)];
        const perpendicular = [-direction[1], direction[0]];
        const shaftCenter = [mix(14.5, 16, settle), mix(16, 15.5, settle)];
        const shaftRadius = (17 + 7 * stretch) / 2;
        const shaft = [
            shaftCenter.map((value, axis) => value - shaftRadius * direction[axis]),
            shaftCenter.map((value, axis) => value + shaftRadius * direction[axis])
        ];

        const tipRadius = 8 + 4 * stretch;
        const headDepth = mix(7, 6, settle) + 2 * stretch;
        const headWidth = mix(7, 6, settle) + 2 * stretch;
        const tip = [16 + tipRadius * direction[0], 16 + tipRadius * direction[1]];
        const headBase = tip.map((value, axis) => value - headDepth * direction[axis]);
        const head = [
            headBase.map((value, axis) => value - headWidth * perpendicular[axis]),
            tip,
            headBase.map((value, axis) => value + headWidth * perpendicular[axis])
        ];

        return { shaft: pathValue(shaft), head: pathValue(head) };
    });
    const arrowShaftFrames = arrowFrames.map(({ offset, shaft }) => ({ offset, d: shaft }));
    const arrowHeadFrames = arrowFrames.map(({ offset, head }) => ({ offset, d: head }));

    function reverseFrames(frames) {
        return frames.map((frame) => ({ ...frame, offset: 1 - frame.offset })).reverse();
    }

    function pathAttribute(frame) {
        return frame.d.slice(6, -2);
    }

    function settleArrow(summary, opening) {
        const shaft = summary.querySelector('.section-arrow-shaft');
        const head = summary.querySelector('.section-arrow-head');
        const frames = opening
            ? [arrowShaftFrames.at(-1), arrowHeadFrames.at(-1)]
            : [arrowShaftFrames[0], arrowHeadFrames[0]];

        [shaft, head].forEach((path, index) => path.setAttribute('d', pathAttribute(frames[index])));
    }

    function animateSectionArrow(summary, opening, snapshot, reversing) {
        const shaft = summary.querySelector('.section-arrow-shaft');
        const head = summary.querySelector('.section-arrow-head');
        const terminal = opening
            ? [arrowShaftFrames.at(-1), arrowHeadFrames.at(-1)]
            : [arrowShaftFrames[0], arrowHeadFrames[0]];
        const direction = reversing ? [
            [
                { offset: 0, d: snapshot.shaftD, easing: 'cubic-bezier(.65,0,.35,1)' },
                { offset: 1, d: terminal[0].d }
            ],
            [
                { offset: 0, d: snapshot.headD, easing: 'cubic-bezier(.65,0,.35,1)' },
                { offset: 1, d: terminal[1].d }
            ]
        ] : opening ? [arrowShaftFrames, arrowHeadFrames] : [
            reverseFrames(arrowShaftFrames),
            reverseFrames(arrowHeadFrames)
        ];

        const paths = [shaft, head];
        const animations = paths.map((path, index) => path.animate(direction[index], {
            duration: reversing ? 420 : arrowDuration,
            easing: 'linear',
            fill: 'both'
        }));

        return animations;
    }

    function animatePanel(content, opening, startHeight, reversing) {
        const targetHeight = content.scrollHeight;
        const openingFrames = sampledFrames(84, (offset) => ({
            height: `${stagedValue(offset, [
                { offset: 0, value: startHeight },
                { offset: .82, value: targetHeight * 1.018 },
                { offset: 1, value: targetHeight }
            ])}px`
        }));
        const closingStages = reversing ? [
            { offset: 0, value: startHeight },
            { offset: 1, value: 0 }
        ] : [
            { offset: 0, value: startHeight },
            { offset: .1, value: startHeight * 1.01 },
            { offset: 1, value: 0 }
        ];
        const closingFrames = sampledFrames(70, (offset) => ({
            height: `${stagedValue(offset, closingStages)}px`
        }));
        const progress = Math.max(.15, Math.min(1, startHeight / targetHeight));
        const duration = opening
            ? (reversing ? Math.max(360, panelDuration * (1 - progress)) : panelDuration)
            : (reversing ? Math.max(320, 680 * progress) : 680);

        return content.animate(opening ? openingFrames : closingFrames, {
            duration,
            easing: 'linear',
            fill: 'both'
        });
    }

    function snapshotContent(content) {
        const items = Array.from(content.children);
        return items.map((item) => {
            const itemStyle = getComputedStyle(item);
            return {
                opacity: itemStyle.opacity,
                transform: itemStyle.transform,
                text: Array.from(item.querySelectorAll('h3, p')).map((line) => {
                    const style = getComputedStyle(line);
                    return {
                        opacity: style.opacity,
                        transform: style.transform,
                        clipPath: style.clipPath
                    };
                })
            };
        });
    }

    function transformState(transform, fallback) {
        if (!transform || transform === 'none') return fallback;
        const matrix = new DOMMatrixReadOnly(transform);
        return {
            y: matrix.m42,
            scaleY: matrix.m22
        };
    }

    function clippedPercent(clipPath, fallback) {
        const values = clipPath?.match(/-?\d*\.?\d+/g)?.map(Number);
        return values?.length ? values.at(-1) : fallback;
    }

    function animateContent(content, opening, snapshots, reversing) {
        const items = Array.from(content.children);
        const animations = [];

        items.forEach((item, itemIndex) => {
            const visualIndex = opening ? itemIndex : items.length - itemIndex - 1;
            const itemStart = transformState(
                snapshots[itemIndex].transform,
                opening ? { y: -20, scaleY: .92 } : { y: 0, scaleY: 1 }
            );
            const itemStages = opening ? {
                opacity: [
                    { offset: 0, value: reversing ? Number(snapshots[itemIndex].opacity) : 0 },
                    { offset: .78, value: 1 },
                    { offset: 1, value: 1 }
                ],
                y: [
                    { offset: 0, value: itemStart.y },
                    { offset: .78, value: 3 },
                    { offset: 1, value: 0 }
                ],
                scaleY: [
                    { offset: 0, value: itemStart.scaleY },
                    { offset: .78, value: 1.018 },
                    { offset: 1, value: 1 }
                ]
            } : {
                opacity: [
                    { offset: 0, value: Number(snapshots[itemIndex].opacity) },
                    { offset: .16, value: .96 },
                    { offset: 1, value: 0 }
                ],
                y: [
                    { offset: 0, value: itemStart.y },
                    { offset: .16, value: 2 },
                    { offset: 1, value: -14 }
                ],
                scaleY: [
                    { offset: 0, value: itemStart.scaleY },
                    { offset: .16, value: 1.008 },
                    { offset: 1, value: .94 }
                ]
            };
            const itemFrames = sampledFrames(72, (offset) => ({
                opacity: stagedValue(offset, itemStages.opacity),
                transform: `translateY(${stagedValue(offset, itemStages.y)}px) scaleY(${stagedValue(offset, itemStages.scaleY)})`,
                transformOrigin: '50% 0%'
            }));
            animations.push(item.animate(itemFrames, {
                delay: reversing ? 0 : opening ? 90 + visualIndex * 58 : visualIndex * 36,
                duration: reversing ? 320 : opening ? itemDuration : 560,
                easing: opening
                    ? 'linear'
                    : 'linear',
                fill: 'both'
            }));

            const text = Array.from(item.querySelectorAll('h3, p'));
            text.forEach((line, lineIndex) => {
                const textSnapshot = snapshots[itemIndex].text[lineIndex];
                const lineStart = transformState(
                    textSnapshot.transform,
                    opening ? { y: 12, scaleY: 1 } : { y: 0, scaleY: 1 }
                );
                const lineStages = opening ? {
                    opacity: [
                        { offset: 0, value: reversing ? Number(textSnapshot.opacity) : 0 },
                        { offset: .82, value: 1 },
                        { offset: 1, value: 1 }
                    ],
                    clip: [
                        { offset: 0, value: reversing ? clippedPercent(textSnapshot.clipPath, 100) : 100 },
                        { offset: .82, value: 0 },
                        { offset: 1, value: 0 }
                    ],
                    y: [
                        { offset: 0, value: lineStart.y },
                        { offset: .82, value: -1.5 },
                        { offset: 1, value: 0 }
                    ]
                } : {
                    opacity: [
                        { offset: 0, value: Number(textSnapshot.opacity) },
                        { offset: .18, value: .96 },
                        { offset: 1, value: 0 }
                    ],
                    clip: [
                        { offset: 0, value: clippedPercent(textSnapshot.clipPath, 0) },
                        { offset: .18, value: 4 },
                        { offset: 1, value: 100 }
                    ],
                    y: [
                        { offset: 0, value: lineStart.y },
                        { offset: .18, value: 1 },
                        { offset: 1, value: -8 }
                    ]
                };
                const lineFrames = sampledFrames(66, (offset) => ({
                    opacity: stagedValue(offset, lineStages.opacity),
                    clipPath: `inset(0 0 ${stagedValue(offset, lineStages.clip)}% 0)`,
                    transform: `translateY(${stagedValue(offset, lineStages.y)}px)`
                }));
                animations.push(line.animate(lineFrames, {
                    delay: reversing ? 0 : opening
                        ? 140 + visualIndex * 58 + lineIndex * 32
                        : visualIndex * 36 + (text.length - lineIndex - 1) * 18,
                    duration: reversing ? 260 : opening ? textDuration : 510,
                    easing: opening
                        ? 'linear'
                        : 'linear',
                    fill: 'both'
                }));
            });
        });

        return animations;
    }

    function animateTitle(summary, opening, startTransform, reversing) {
        const title = summary.querySelector('h2');
        const matrix = new DOMMatrixReadOnly(startTransform === 'none' ? undefined : startTransform);
        const stages = opening ? {
            y: [
                { offset: 0, value: reversing ? matrix.m42 : 0 },
                { offset: .36, value: 3 },
                { offset: 1, value: 0 }
            ],
            scaleX: [
                { offset: 0, value: reversing ? matrix.m11 : 1 },
                { offset: .36, value: .985 },
                { offset: 1, value: 1 }
            ],
            scaleY: [
                { offset: 0, value: reversing ? matrix.m22 : 1 },
                { offset: .36, value: 1.035 },
                { offset: 1, value: 1 }
            ]
        } : {
            y: [
                { offset: 0, value: matrix.m42 },
                { offset: .3, value: -2 },
                { offset: 1, value: 0 }
            ],
            scaleX: [
                { offset: 0, value: matrix.m11 },
                { offset: .3, value: 1.008 },
                { offset: 1, value: 1 }
            ],
            scaleY: [
                { offset: 0, value: matrix.m22 },
                { offset: .3, value: .99 },
                { offset: 1, value: 1 }
            ]
        };
        const frames = sampledFrames(64, (offset) => ({
            transform: `translateY(${stagedValue(offset, stages.y)}px) scale(${stagedValue(offset, stages.scaleX)}, ${stagedValue(offset, stages.scaleY)})`
        }));

        return title.animate(frames, {
            duration: reversing ? 360 : opening ? 620 : 480,
            easing: 'linear',
            fill: 'both'
        });
    }

    function finishImmediately(details, summary, opening) {
        controllers.get(details)?.animations.forEach((animation) => animation.cancel());
        controllers.delete(details);
        details.open = opening;
        details.dataset.motionState = opening ? 'open' : 'closed';
        settleArrow(summary, opening);
    }

    function toggleDisclosure(details, summary) {
        const content = summary.nextElementSibling;
        const state = details.dataset.motionState;
        const opening = state === 'closed' || state === 'closing';

        if (reducedMotion.matches) {
            finishImmediately(details, summary, opening);
            return;
        }

        const prior = controllers.get(details);
        const reversing = Boolean(prior);
        const startHeight = state === 'closed' ? 0 : content.getBoundingClientRect().height;
        const snapshots = snapshotContent(content);
        const titleTransform = getComputedStyle(summary.querySelector('h2')).transform;
        const arrowSnapshot = {
            shaftD: getComputedStyle(summary.querySelector('.section-arrow-shaft')).d,
            headD: getComputedStyle(summary.querySelector('.section-arrow-head')).d
        };
        prior?.animations.forEach((animation) => animation.cancel());

        details.open = true;
        details.dataset.motionState = opening ? 'opening' : 'closing';
        const animations = [
            ...animateSectionArrow(summary, opening, arrowSnapshot, reversing),
            animateTitle(summary, opening, titleTransform, reversing),
            animatePanel(content, opening, startHeight, reversing),
            ...animateContent(content, opening, snapshots, reversing)
        ];
        const controller = { animations };
        controllers.set(details, controller);

        Promise.all(animations.map(({ finished }) => finished)).then(() => {
            if (controllers.get(details) !== controller) return;

            settleArrow(summary, opening);
            details.open = opening;
            details.dataset.motionState = opening ? 'open' : 'closed';
            animations.forEach((animation) => animation.cancel());
            controllers.delete(details);
        }).catch(() => {});
    }

    document.querySelectorAll('.collapsible-section summary').forEach(summary => {
        const details = summary.parentElement;
        details.dataset.motionState = details.open ? 'open' : 'closed';
        settleArrow(summary, details.open);

        summary.addEventListener('click', e => {
            e.preventDefault();
            toggleDisclosure(details, summary);
        });
    });
});
