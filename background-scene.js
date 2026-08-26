(async () => {
    const scene = document.querySelector('#bg > svg');
    if (!scene) return;

    const loaderUrl = document.currentScript?.src || location.href;
    let compressed;
    if (location.protocol === 'file:') {
        await new Promise((resolve, reject) => {
            const dataScript = document.createElement('script');
            dataScript.src = new URL('background-scene-data.js?v=1.0', loaderUrl).href;
            dataScript.onload = resolve;
            dataScript.onerror = () => reject(new Error('Unable to load the local background payload.'));
            document.head.append(dataScript);
        });
        const payload = globalThis.__backgroundScenePayload;
        compressed = Uint8Array.from(atob(payload), character => character.charCodeAt(0));
        delete globalThis.__backgroundScenePayload;
    } else {
        const response = await fetch(new URL('background-scene.svg.gz?v=1.0', loaderUrl));
        if (!response.ok) throw new Error(`Background request failed with ${response.status}.`);
        compressed = new Uint8Array(await response.arrayBuffer());
    }

    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    scene.innerHTML = await new Response(stream).text();
    const planets = Array.from(scene.querySelectorAll(':scope > g[id^="planet-"]'));
    const measuredPlanets = planets
        .map((planet) => {
            const box = planet.getBBox();
            return { planet, size: Math.sqrt(box.width * box.height) };
        })
        .sort((left, right) => left.size - right.size);
    const sizeRank = new Map(measuredPlanets.map(({ planet }, rank) => [planet, rank]));
    const maxRank = Math.max(1, planets.length - 1);

    planets.forEach((planet) => {
        const rank = sizeRank.get(planet);
        const depth = rank / maxRank;
        const measured = measuredPlanets.find(({ planet: candidate }) => candidate === planet);
        const entrance = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        planet.dataset.sceneSize = measured.size.toFixed(6);
        entrance.classList.add('scene-planet-entrance');
        entrance.dataset.planetEntranceRank = String(rank);
        entrance.style.setProperty('--planet-pop-delay', `${rank * 16}ms`);
        entrance.style.setProperty('--planet-pop-scale', (.64 + .16 * depth).toFixed(4));
        while (planet.firstChild) entrance.append(planet.firstChild);
        planet.append(entrance);
    });
    document.dispatchEvent(new CustomEvent('background-scene-ready'));
})().catch((error) => {
    console.error('Unable to initialize the vector background.', error);
});
