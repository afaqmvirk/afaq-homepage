import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

const improvedCrtHash = `float hash21(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}`;

const noiseOnlyCrtTransition = `float phase = clamp(u_turnOnPhase, 0.0, 1.0);
	if (phase < 1.0) {
		float frame = floor(u_time * 48.0);
		vec2 pixel = floor(gl_FragCoord.xy);
		float fineNoise = hash21(pixel + vec2(frame * 37.0, frame * 101.0));
		float crossNoise = hash21(
			pixel.yx * vec2(0.7549, 0.5697) + vec2(frame * 131.0, -frame * 67.0)
		);
		float staticNoise = fract(fineNoise + crossNoise * 0.61803398875);
		float reveal = smoothstep(0.68, 1.0, phase);
		col = mix(vec3(staticNoise) * tubeMask, col, reveal);
	}`;

const mobileCrtLayout = `const CRT_PANEL_SEAM_X = 0.2585562765598297;
const CRT_PANEL_MAX_X = 0.4642995595932007;
const CRT_PANEL_MAX_Y = 0.5654453039169312;
const CRT_CONTROL_MIN_Y = 0.008465498685836792;
const CRT_SCREEN_MIN_X = -0.46389153599739075;
const CRT_SCREEN_MAX_X = 0.2585562765598297;
const CRT_PANEL_GAP = 0;
const CRT_PANEL_WIDTH = CRT_PANEL_MAX_X - CRT_PANEL_SEAM_X;
const CRT_SCREEN_WIDTH = CRT_SCREEN_MAX_X - CRT_SCREEN_MIN_X;
const CRT_PANEL_X_SCALE = CRT_SCREEN_WIDTH /
    (CRT_PANEL_MAX_Y - CRT_CONTROL_MIN_Y);
const CRT_PANEL_DEST_MIN_X = CRT_SCREEN_MIN_X;
const CRT_PANEL_DEST_TOP_Y = -0.02358478307723999 - CRT_PANEL_GAP;
const CRT_CONTROL_FACE_MIN_X = 0.3011869192123413;
const CRT_CONTROL_TOP_FILL = CRT_CONTROL_FACE_MIN_X - CRT_PANEL_SEAM_X;
const CRT_DESKTOP_DIAL_SPECS = [
    { id: 1, x: 0.36155, y: 0.44949 },
    { id: 2, x: 0.36155, y: 0.31213 },
];
const CRT_MOBILE_DIAL_SPECS = CRT_DESKTOP_DIAL_SPECS.map((dial) => ({
    id: dial.id,
    x: CRT_PANEL_DEST_MIN_X + (dial.y - CRT_CONTROL_MIN_Y) * CRT_PANEL_X_SCALE,
    y: CRT_PANEL_DEST_TOP_Y - (dial.x - CRT_PANEL_SEAM_X),
}));
let crtMobileLayoutActive = false;

function getCrtDialSpecs() {
    return crtMobileLayoutActive ? CRT_MOBILE_DIAL_SPECS : CRT_DESKTOP_DIAL_SPECS;
}

function applyMobileCrtLayout(sceneObj, slug) {
    crtMobileLayoutActive = slug === 'little-tv' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 640px)').matches;
    if (!crtMobileLayoutActive)
        return;

    // The Sharp cabinet is authored as a collection of connected islands.
    // Islands wholly to the right of the front seam form the control pod;
    // cabinet islands crossing the seam are truncated to close the screen.
    sceneObj.traverse((node) => {
        if (!node.isMesh || !node.geometry)
            return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        if (materials.some((material) => material?.name === 'screenMaterial'))
            return;
        const position = node.geometry.getAttribute('position');
        if (!position || position.count === 0)
            return;
        node.geometry.computeBoundingBox();
        const authoredBounds = node.geometry.boundingBox;
        if (authoredBounds && authoredBounds.max.z < -0.02) {
            // The separate deep rear shell is useful on desktop but becomes
            // the tall side-panel sliver when the front is rearranged. Make
            // it degenerate on mobile so it contributes neither pixels nor
            // off-centre bounds to the fitted model.
            const collapsedX = (CRT_SCREEN_MIN_X + CRT_SCREEN_MAX_X) * 0.5;
            for (let i = 0; i < position.count; i += 1) {
                position.setXYZ(i, collapsedX, 0.27, -0.16);
            }
            position.needsUpdate = true;
            node.geometry.computeBoundingBox();
            node.geometry.computeBoundingSphere();
            node.visible = false;
            return;
        }
        const parent = new Int32Array(position.count);
        const used = new Uint8Array(position.count);
        for (let i = 0; i < parent.length; i += 1)
            parent[i] = i;
        const find = (value) => {
            let root = value;
            while (parent[root] !== root)
                root = parent[root];
            while (parent[value] !== value) {
                const next = parent[value];
                parent[value] = root;
                value = next;
            }
            return root;
        };
        const union = (a, b) => {
            const rootA = find(a);
            const rootB = find(b);
            if (rootA !== rootB)
                parent[rootB] = rootA;
        };
        const index = node.geometry.index;
        const indexCount = index ? index.count : position.count;
        const vertexAt = (offset) => index ? index.getX(offset) : offset;
        for (let i = 0; i + 2 < indexCount; i += 3) {
            const a = vertexAt(i);
            const b = vertexAt(i + 1);
            const c = vertexAt(i + 2);
            used[a] = 1;
            used[b] = 1;
            used[c] = 1;
            union(a, b);
            union(b, c);
        }
        const components = new Map();
        for (let i = 0; i < position.count; i += 1) {
            if (!used[i])
                continue;
            const root = find(i);
            let component = components.get(root);
            if (!component) {
                component = {
                    vertices: [],
                    minX: Infinity,
                    maxX: -Infinity,
                    minY: Infinity,
                    maxY: -Infinity,
                    maxZ: -Infinity,
                };
                components.set(root, component);
            }
            const x = position.getX(i);
            component.vertices.push(i);
            component.minX = Math.min(component.minX, x);
            component.maxX = Math.max(component.maxX, x);
            component.minY = Math.min(component.minY, position.getY(i));
            component.maxY = Math.max(component.maxY, position.getY(i));
            component.maxZ = Math.max(component.maxZ, position.getZ(i));
        }
        const normal = node.geometry.getAttribute('normal');
        const tangent = node.geometry.getAttribute('tangent');
        let changed = false;
        for (const component of components.values()) {
            const isControlPod = component.minX >= CRT_PANEL_SEAM_X - 0.0002;
            const crossesSeam = component.minX < CRT_PANEL_SEAM_X &&
                component.maxX > CRT_PANEL_SEAM_X;
            const isFrontControlPod = isControlPod && component.maxZ >= 0.13;
            const isRearControlRemnant = isControlPod && component.maxZ < 0.13;
            if (!isFrontControlPod && !crossesSeam && !isRearControlRemnant)
                continue;
            const centerX = (component.minX + component.maxX) * 0.5;
            const centerY = (component.minY + component.maxY) * 0.5;
            const componentWidth = component.maxX - component.minX;
            const componentHeight = component.maxY - component.minY;
            const dial = isFrontControlPod
                ? CRT_DESKTOP_DIAL_SPECS.find((spec) =>
                    Math.abs(centerX - spec.x) < 0.026 &&
                    Math.abs(centerY - spec.y) < 0.026 &&
                    componentWidth < 0.14 &&
                    componentHeight < 0.14 &&
                    component.maxZ > 0.152
                )
                : null;
            const componentXScale = dial ? 1 : CRT_PANEL_X_SCALE;
            const dialDestinationX = dial
                ? CRT_PANEL_DEST_MIN_X +
                    (dial.y - CRT_CONTROL_MIN_Y) * CRT_PANEL_X_SCALE
                : 0;
            for (const vertex of component.vertices) {
                const x = position.getX(vertex);
                const y = position.getY(vertex);
                if (isRearControlRemnant) {
                    position.setXYZ(vertex, CRT_SCREEN_MAX_X, 0.27, -0.16);
                }
                else if (isFrontControlPod) {
                    position.setXYZ(
                        vertex,
                        dial
                            ? dialDestinationX + (y - dial.y)
                            : Math.max(
                                CRT_SCREEN_MIN_X,
                                Math.min(
                                    CRT_SCREEN_MAX_X,
                                    CRT_PANEL_DEST_MIN_X +
                                        (y - CRT_CONTROL_MIN_Y) * CRT_PANEL_X_SCALE,
                                ),
                            ),
                        CRT_PANEL_DEST_TOP_Y - (x - CRT_PANEL_SEAM_X),
                        position.getZ(vertex),
                    );
                    if (normal) {
                        const nx = normal.getX(vertex);
                        const ny = normal.getY(vertex);
                        const nz = normal.getZ(vertex);
                        const mappedNX = ny / componentXScale;
                        const mappedNY = -nx;
                        const normalLength = Math.hypot(mappedNX, mappedNY, nz) || 1;
                        normal.setXYZ(
                            vertex,
                            mappedNX / normalLength,
                            mappedNY / normalLength,
                            nz / normalLength,
                        );
                    }
                    if (tangent) {
                        const tx = tangent.getX(vertex);
                        const ty = tangent.getY(vertex);
                        const tz = tangent.getZ(vertex);
                        const mappedTX = ty * componentXScale;
                        const mappedTY = -tx;
                        const tangentLength = Math.hypot(mappedTX, mappedTY, tz) || 1;
                        tangent.setXYZW(
                            vertex,
                            mappedTX / tangentLength,
                            mappedTY / tangentLength,
                            tz / tangentLength,
                            tangent.getW(vertex),
                        );
                    }
                }
                else if (crossesSeam && x > CRT_PANEL_SEAM_X) {
                    position.setX(vertex, CRT_PANEL_SEAM_X);
                }
                changed = true;
            }
        }
        if (!changed)
            return;
        position.needsUpdate = true;
        if (normal)
            normal.needsUpdate = true;
        if (tangent)
            tangent.needsUpdate = true;
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
    });
    // The authored face has no full rectangular backing of its own. This
    // closes the new pod from the cabinet edge down, eliminating the old
    // rear shelf and making the mobile silhouette exactly screen-width.
    const backingGeometry = new THREE.BoxGeometry(
        CRT_SCREEN_WIDTH,
        CRT_PANEL_WIDTH,
        0.018,
    );
    const backingMaterial = new THREE.MeshBasicMaterial({
        color: 0x181818,
        toneMapped: false,
    });
    const backing = new THREE.Mesh(backingGeometry, backingMaterial);
    backing.name = 'mobile-control-pod-backing';
    backing.position.set(
        (CRT_SCREEN_MIN_X + CRT_SCREEN_MAX_X) * 0.5,
        CRT_PANEL_DEST_TOP_Y - CRT_PANEL_WIDTH * 0.5,
        0.138,
    );
    sceneObj.add(backing);
    // Front-facing fillers cover the two empty authored margins without
    // obscuring the speaker, knobs, or power details.
    const fillerMaterial = new THREE.MeshBasicMaterial({
        color: 0x303030,
        toneMapped: false,
    });
    const topFillerGeometry = new THREE.BoxGeometry(
        CRT_SCREEN_WIDTH,
        CRT_CONTROL_TOP_FILL,
        0.01,
    );
    const topFiller = new THREE.Mesh(topFillerGeometry, fillerMaterial);
    topFiller.name = 'mobile-control-pod-top-filler';
    topFiller.position.set(
        (CRT_SCREEN_MIN_X + CRT_SCREEN_MAX_X) * 0.5,
        CRT_PANEL_DEST_TOP_Y - CRT_CONTROL_TOP_FILL * 0.5,
        0.178,
    );
    sceneObj.add(topFiller);
    sceneObj.updateMatrixWorld(true);
}`;

const interactiveCrtDials = `function prepareCrtDialGeometry(sceneObj) {
    const dialSpecs = getCrtDialSpecs();
    const allowedMaterials = new Set(['Material.002', 'Material.003']);
    const records = [];
    sceneObj.traverse((node) => {
        if (!node.isMesh || !node.geometry)
            return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        if (!materials.some((material) => allowedMaterials.has(material?.name)))
            return;
        const position = node.geometry.getAttribute('position');
        if (!position || position.count === 0)
            return;
        const parent = new Int32Array(position.count);
        const used = new Uint8Array(position.count);
        for (let i = 0; i < parent.length; i += 1)
            parent[i] = i;
        const find = (value) => {
            let root = value;
            while (parent[root] !== root)
                root = parent[root];
            while (parent[value] !== value) {
                const next = parent[value];
                parent[value] = root;
                value = next;
            }
            return root;
        };
        const union = (a, b) => {
            const rootA = find(a);
            const rootB = find(b);
            if (rootA !== rootB)
                parent[rootB] = rootA;
        };
        const index = node.geometry.index;
        const triangleCount = index ? index.count : position.count;
        const vertexAt = (i) => index ? index.getX(i) : i;
        for (let i = 0; i + 2 < triangleCount; i += 3) {
            const a = vertexAt(i);
            const b = vertexAt(i + 1);
            const c = vertexAt(i + 2);
            used[a] = 1;
            used[b] = 1;
            used[c] = 1;
            union(a, b);
            union(b, c);
        }
        const components = new Map();
        for (let i = 0; i < position.count; i += 1) {
            if (!used[i])
                continue;
            const root = find(i);
            let component = components.get(root);
            if (!component) {
                component = {
                    vertices: [],
                    minX: Infinity,
                    minY: Infinity,
                    minZ: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity,
                    maxZ: -Infinity,
                };
                components.set(root, component);
            }
            const x = position.getX(i);
            const y = position.getY(i);
            const z = position.getZ(i);
            component.vertices.push(i);
            component.minX = Math.min(component.minX, x);
            component.minY = Math.min(component.minY, y);
            component.minZ = Math.min(component.minZ, z);
            component.maxX = Math.max(component.maxX, x);
            component.maxY = Math.max(component.maxY, y);
            component.maxZ = Math.max(component.maxZ, z);
        }
        const dialByVertex = new Uint8Array(position.count);
        let selectedCount = 0;
        for (const component of components.values()) {
            const centerX = (component.minX + component.maxX) * 0.5;
            const centerY = (component.minY + component.maxY) * 0.5;
            const width = component.maxX - component.minX;
            const height = component.maxY - component.minY;
            const dial = dialSpecs.find((spec) =>
                Math.abs(centerX - spec.x) < 0.026 &&
                Math.abs(centerY - spec.y) < 0.026 &&
                width < 0.14 &&
                height < 0.14 &&
                component.maxZ > 0.152
            );
            if (!dial)
                continue;
            for (const vertex of component.vertices) {
                dialByVertex[vertex] = dial.id;
                selectedCount += 1;
            }
        }
        if (selectedCount === 0)
            return;
        const originalPosition = new Float32Array(position.count * 3);
        for (let i = 0; i < position.count; i += 1) {
            originalPosition[i * 3] = position.getX(i);
            originalPosition[i * 3 + 1] = position.getY(i);
            originalPosition[i * 3 + 2] = position.getZ(i);
        }
        const normal = node.geometry.getAttribute('normal');
        let originalNormal = null;
        if (normal && normal.count === position.count) {
            originalNormal = new Float32Array(normal.count * 3);
            for (let i = 0; i < normal.count; i += 1) {
                originalNormal[i * 3] = normal.getX(i);
                originalNormal[i * 3 + 1] = normal.getY(i);
                originalNormal[i * 3 + 2] = normal.getZ(i);
            }
            normal.setUsage(THREE.DynamicDrawUsage);
        }
        position.setUsage(THREE.DynamicDrawUsage);
        records.push({ position, normal, originalPosition, originalNormal, dialByVertex });
    });
    return records;
}

function applyCrtDialGeometry(records, channelAngle, volumeAngle) {
    const centers = getCrtDialSpecs();
    const angles = [channelAngle, volumeAngle];
    const rotations = angles.map((angle) => ({
        cosine: Math.cos(angle),
        sine: Math.sin(angle),
    }));
    for (const record of records) {
        let changed = false;
        for (let i = 0; i < record.dialByVertex.length; i += 1) {
            const dialId = record.dialByVertex[i];
            if (!dialId)
                continue;
            const center = centers[dialId - 1];
            const { cosine, sine } = rotations[dialId - 1];
            const x = record.originalPosition[i * 3] - center.x;
            const y = record.originalPosition[i * 3 + 1] - center.y;
            record.position.setXYZ(
                i,
                center.x + x * cosine - y * sine,
                center.y + x * sine + y * cosine,
                record.originalPosition[i * 3 + 2],
            );
            if (record.normal && record.originalNormal) {
                const nx = record.originalNormal[i * 3];
                const ny = record.originalNormal[i * 3 + 1];
                record.normal.setXYZ(
                    i,
                    nx * cosine - ny * sine,
                    nx * sine + ny * cosine,
                    record.originalNormal[i * 3 + 2],
                );
            }
            changed = true;
        }
        if (changed) {
            record.position.needsUpdate = true;
            if (record.normal)
                record.normal.needsUpdate = true;
        }
    }
}

function createCrtDialProjectionState() {
    return {
        lastPublishedAt: -Infinity,
        readyPublished: false,
        values: Object.create(null),
        center: new THREE.Vector3(),
        edge: new THREE.Vector3(),
    };
}

function publishCrtDialPositions(canvas, sceneObj, camera, state, elapsed, width, height) {
    const host = canvas?.closest?.('.crt-stage');
    if (!host || !sceneObj || !camera || !state)
        return;
    if (width <= 0 || height <= 0)
        return;
    if (elapsed - state.lastPublishedAt < 1 / 24)
        return;
    state.lastPublishedAt = elapsed;
    sceneObj.updateWorldMatrix(true, false);
    camera.updateWorldMatrix(true, false);
    const dialSpecs = getCrtDialSpecs();
    const specs = [
        { name: 'channel', x: dialSpecs[0].x, y: dialSpecs[0].y },
        { name: 'volume', x: dialSpecs[1].x, y: dialSpecs[1].y },
    ];
    for (const spec of specs) {
        const center = state.center.set(spec.x, spec.y, 0.166)
            .applyMatrix4(sceneObj.matrixWorld)
            .project(camera);
        const edge = state.edge.set(spec.x + 0.0605, spec.y, 0.166)
            .applyMatrix4(sceneObj.matrixWorld)
            .project(camera);
        const x = (center.x * 0.5 + 0.5) * width;
        const y = (-center.y * 0.5 + 0.5) * height;
        const edgeX = (edge.x * 0.5 + 0.5) * width;
        const edgeY = (-edge.y * 0.5 + 0.5) * height;
        const controlPadding = width <= 640 ? 4 : 16;
        const size = Math.max(44, Math.hypot(edgeX - x, edgeY - y) * 2 + controlPadding);
        const nextValues = {
            x: x.toFixed(2) + 'px',
            y: y.toFixed(2) + 'px',
            size: size.toFixed(2) + 'px',
        };
        const previousValues = state.values[spec.name];
        if (!previousValues || previousValues.x !== nextValues.x)
            host.style.setProperty('--crt-' + spec.name + '-x', nextValues.x);
        if (!previousValues || previousValues.y !== nextValues.y)
            host.style.setProperty('--crt-' + spec.name + '-y', nextValues.y);
        if (!previousValues || previousValues.size !== nextValues.size)
            host.style.setProperty('--crt-' + spec.name + '-size', nextValues.size);
        state.values[spec.name] = nextValues;
    }
    if (!state.readyPublished) {
        state.readyPublished = true;
        host.dispatchEvent(new CustomEvent('crt-model-ready', { bubbles: true }));
    }
}`;

const dynamicScreenBounce = `    function updateScreenBounce(elapsed) {
        const bounce = screenBounceRef.current;
        const sample = screenBounceSampleRef.current;
        if (!bounce || elapsed - sample.lastSample < 0.3)
            return;
        sample.lastSample = elapsed;
        const video = videoElRef.current;
        const source = video && video.readyState >= 2
            ? video
            : textureRef.current?.image;
        if (!source || (typeof source.complete === 'boolean' && !source.complete))
            return;
        if (!sample.canvas) {
            sample.canvas = document.createElement('canvas');
            sample.canvas.width = 12;
            sample.canvas.height = 8;
            sample.context = sample.canvas.getContext('2d', { willReadFrequently: true });
        }
        const context = sample.context;
        if (!context)
            return;
        try {
            context.clearRect(0, 0, 12, 8);
            context.drawImage(source, 0, 0, 12, 8);
            const pixels = context.getImageData(0, 0, 12, 8).data;
            let red = 0;
            let green = 0;
            let blue = 0;
            let totalWeight = 0;
            for (let index = 0; index < pixels.length; index += 4) {
                const alpha = pixels[index + 3] / 255;
                const r = pixels[index] / 255;
                const g = pixels[index + 1] / 255;
                const b = pixels[index + 2] / 255;
                const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
                const weight = alpha * (0.18 + luminance * 0.82);
                red += r * weight;
                green += g * weight;
                blue += b * weight;
                totalWeight += weight;
            }
            if (totalWeight <= 0.001)
                return;
            const whiteMix = 0.38;
            const r = whiteMix + (red / totalWeight) * (1 - whiteMix);
            const g = whiteMix + (green / totalWeight) * (1 - whiteMix);
            const b = whiteMix + (blue / totalWeight) * (1 - whiteMix);
            bounce.color.setRGB(r, g, b, THREE.SRGBColorSpace);
            const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
            bounce.intensity = 0.42 + Math.min(1, luminance) * 0.24;
        }
        catch (_) {
            // Cross-origin media may forbid canvas sampling; retain the
            // previous pale bounce color rather than interrupt rendering.
        }
}
`;

const crtCaptionCanvas = `function drawCrtCaptionCanvas(canvas, detail) {
    const context = canvas.getContext('2d');
    if (!context)
        return false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const text = typeof detail?.text === 'string' ? detail.text.trim() : '';
    if (!text)
        return false;
    const fontFamily = detail.fontFamily || 'Arial, sans-serif';
    const fontWeight = Number.isFinite(detail.fontWeight) ? detail.fontWeight : 600;
    const requestedFontSize = Number.isFinite(detail.fontSize) ? detail.fontSize : 44;
    const maxWidth = canvas.width * (Number.isFinite(detail.maxWidth) ? detail.maxWidth : 0.84);
    const maxLines = Math.max(1, Math.round(Number.isFinite(detail.maxLines) ? detail.maxLines : 2));
    const lineHeightScale = Number.isFinite(detail.lineHeight) ? detail.lineHeight : 1.18;
    const words = text.split(/\\s+/);
    const wrapAtSize = (fontSize) => {
        context.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
        const lines = [];
        let line = '';
        for (const word of words) {
            const candidate = line ? line + ' ' + word : word;
            if (!line || context.measureText(candidate).width <= maxWidth) {
                line = candidate;
            }
            else {
                lines.push(line);
                line = word;
            }
        }
        if (line)
            lines.push(line);
        return lines;
    };
    let fontSize = requestedFontSize;
    let lines = wrapAtSize(fontSize);
    while (lines.length > maxLines && fontSize > 28) {
        fontSize -= 2;
        lines = wrapAtSize(fontSize);
    }
    const lineHeight = fontSize * lineHeightScale;
    const horizontalPadding = Number.isFinite(detail.horizontalPadding) ? detail.horizontalPadding : 18;
    const verticalPadding = Number.isFinite(detail.verticalPadding) ? detail.verticalPadding : 10;
    const bottomPadding = Number.isFinite(detail.bottomPadding) ? detail.bottomPadding : 62;
    const backgroundOpacity = Math.max(0, Math.min(1, Number.isFinite(detail.backgroundOpacity) ? detail.backgroundOpacity : 0.72));
    const outlineWidth = Math.max(0, Number.isFinite(detail.outlineWidth) ? detail.outlineWidth : 2);
    const textWidth = Math.min(maxWidth, Math.max(...lines.map((line) => context.measureText(line).width)));
    const textHeight = lineHeight * lines.length;
    const boxWidth = textWidth + horizontalPadding * 2;
    const boxHeight = textHeight + verticalPadding * 2;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = canvas.height - bottomPadding - boxHeight;
    const radius = 10;
    context.beginPath();
    context.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    context.fillStyle = 'rgba(0, 0, 0, ' + backgroundOpacity + ')';
    context.fill();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    context.strokeStyle = 'rgba(0, 0, 0, 0.96)';
    context.lineWidth = outlineWidth * 2;
    context.fillStyle = '#ffffff';
    lines.forEach((line, index) => {
        const y = boxY + verticalPadding + lineHeight * (index + 0.5);
        if (outlineWidth > 0)
            context.strokeText(line, canvas.width / 2, y, maxWidth);
        context.fillText(line, canvas.width / 2, y, maxWidth);
    });
    return true;
}

function drawCrtChannelCanvas(canvas, channel, title, creationDate) {
    const context = canvas.getContext('2d');
    if (!context || !Number.isFinite(channel))
        return false;
    const label = String(Math.max(1, Math.round(channel))).padStart(2, '0');
    const fontSize = 58;
    const stripY = 0;
    const stripHeight = 104;
    context.save();
    context.fillStyle = 'rgba(0, 0, 0, 0.62)';
    context.fillRect(0, stripY, canvas.width, stripHeight);
    context.font = '500 ' + fontSize + 'px "Geist Pixel Square", monospace';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    const centerY = stripY + stripHeight / 2;
    context.lineJoin = 'round';
    context.miterLimit = 2;
    context.lineWidth = 10;
    context.strokeStyle = '#185dff';
    context.strokeText(label, 72, centerY);
    context.fillStyle = '#ffffff';
    context.fillText(label, 72, centerY);
    const channelTitle = typeof title === 'string' ? title.trim() : '';
    if (channelTitle) {
        context.font = '600 32px Arial, sans-serif';
        context.fillText(channelTitle, 218, centerY + 2, canvas.width - 282);
    }
    const dateLabel = typeof creationDate === 'string' ? creationDate.trim() : '';
    if (dateLabel) {
        context.font = '500 25px "Geist Pixel Square", monospace';
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.lineWidth = 5;
        context.strokeText(dateLabel, canvas.width - 58, canvas.height - 46);
        context.fillText(dateLabel, canvas.width - 58, canvas.height - 46);
    }
    context.restore();
    return true;
}

function drawCrtVolumeCanvas(canvas, level) {
    const context = canvas.getContext('2d');
    if (!context || !Number.isFinite(level))
        return false;
    const volumeLevel = Math.max(0, Math.min(4, Math.round(level)));
    const barWidth = 28;
    const barGap = 12;
    const baseX = 62;
    const baseY = canvas.height - 52;
    context.save();
    context.lineWidth = 5;
    context.lineJoin = 'round';
    context.strokeStyle = '#185dff';
    for (let index = 0; index < 4; index += 1) {
        const height = 24 + index * 13;
        const x = baseX + index * (barWidth + barGap);
        const y = baseY - height;
        if (index < volumeLevel) {
            context.fillStyle = '#ffffff';
            context.fillRect(x, y, barWidth, height);
        }
        context.strokeRect(x, y, barWidth, height);
    }
    context.restore();
    return true;
}`;

const crtAudioSystem = `const CRT_STATIC_IDLE_GAIN = 0.012;

function createCrtAudioSystem() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass)
        return null;

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    // A narrow, upper-mid-heavy noise bed reads as a small analogue set
    // without masking speech as much as full-spectrum white noise would.
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1)
        noiseData[index] = Math.random() * 2 - 1;

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const staticHighpass = context.createBiquadFilter();
    staticHighpass.type = 'highpass';
    staticHighpass.frequency.value = 1500;
    staticHighpass.Q.value = 0.35;
    const staticBand = context.createBiquadFilter();
    staticBand.type = 'bandpass';
    staticBand.frequency.value = 4200;
    staticBand.Q.value = 0.5;
    const staticGain = context.createGain();
    staticGain.gain.value = CRT_STATIC_IDLE_GAIN;
    noiseSource.connect(staticHighpass);
    staticHighpass.connect(staticBand);
    staticBand.connect(staticGain);
    staticGain.connect(masterGain);
    noiseSource.start();

    return {
        context,
        masterGain,
        noiseSource,
        staticGain,
        programCleanup: null,
    };
}

function setCrtAudioVolume(system, volume) {
    if (!system)
        return;
    const now = system.context.currentTime;
    const output = Math.pow(Math.max(0, Math.min(1, volume)), 1.35) * 0.78;
    system.masterGain.gain.cancelScheduledValues(now);
    system.masterGain.gain.setTargetAtTime(output, now, 0.025);
    if (volume > 0 && system.context.state === 'suspended') {
        const resumed = system.context.resume();
        if (resumed?.catch)
            resumed.catch(() => {});
    }
}

function burstCrtStatic(system) {
    if (!system)
        return;
    const now = system.context.currentTime;
    const gain = system.staticGain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(CRT_STATIC_IDLE_GAIN, gain.value), now);
    gain.linearRampToValueAtTime(0.14, now + 0.018);
    gain.exponentialRampToValueAtTime(CRT_STATIC_IDLE_GAIN, now + 0.58);
}

function connectCrtProgramAudio(system, video) {
    if (!system)
        return null;

    system.programCleanup?.();
    const source = system.context.createMediaElementSource(video);
    const highpass = system.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 220;
    highpass.Q.value = 0.7;
    const lowShelf = system.context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 520;
    lowShelf.gain.value = -9.5;
    const presence = system.context.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 2300;
    presence.Q.value = 0.75;
    presence.gain.value = 4;
    const lowpass = system.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 6100;
    lowpass.Q.value = 0.6;
    const compressor = system.context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 16;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.16;
    const programGain = system.context.createGain();
    programGain.gain.value = 0.92;

    source.connect(highpass);
    highpass.connect(lowShelf);
    lowShelf.connect(presence);
    presence.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(programGain);
    programGain.connect(system.masterGain);

    const cleanup = () => {
        [source, highpass, lowShelf, presence, lowpass, compressor, programGain]
            .forEach((node) => {
                try {
                    node.disconnect();
                }
                catch (_) { /* already disconnected */ }
            });
        if (system.programCleanup === cleanup)
            system.programCleanup = null;
    };
    system.programCleanup = cleanup;
    return cleanup;
}

function destroyCrtAudioSystem(system) {
    if (!system)
        return;
    system.programCleanup?.();
    try {
        system.noiseSource.stop();
    }
    catch (_) { /* already stopped */ }
    system.staticGain.disconnect();
    system.masterGain.disconnect();
    const closed = system.context.close();
    if (closed?.catch)
        closed.catch(() => {});
}`;

const fixCrazyGlModelPaths = (): Plugin => ({
  name: "fix-crazygl-model-paths",
  enforce: "pre" as const,
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const littleTvPaths = [
        "/node_modules/@crazygl/hero-vhs-product-screen/dist/models/little-tv.glb",
        "/node_modules/@crazygl/hero-vhs-product-screen/models/little-tv.glb",
      ];

      if (littleTvPaths.some((path) => request.url?.startsWith(path))) {
        request.url = "/models/sharp-vintage-tv.glb";
      } else if (
        request.url?.startsWith(
          "/node_modules/@crazygl/hero-vhs-product-screen/dist/models/",
        )
      ) {
        request.url = request.url.replace(
          "/node_modules/@crazygl/hero-vhs-product-screen/dist/models/",
          "/node_modules/@crazygl/hero-vhs-product-screen/models/",
        );
      }

      next();
    });
  },
  transform(code: string, id: string) {
    const modulePath = id.split("?", 1)[0].replaceAll("\\", "/");

    if (
      !modulePath.endsWith(
        "@crazygl/hero-vhs-product-screen/dist/VhsScreenStage.js",
      )
    ) {
      return null;
    }

    return code
      .replaceAll(
        "new URL('./models/belweder-ot-1782.glb', import.meta.url)",
        "new URL('../models/belweder-ot-1782.glb', import.meta.url)",
      )
      .replaceAll(
        "new URL('./models/crt-tv.glb', import.meta.url)",
        "new URL('../models/crt-tv.glb', import.meta.url)",
      )
      .replaceAll(
        "new URL('./models/little-tv.glb', import.meta.url)",
        "new URL('/models/sharp-vintage-tv.glb', import.meta.url)",
      )
      .replaceAll(
        "new URL('./models/vintage-tv-1.glb', import.meta.url)",
        "new URL('../models/vintage-tv-1.glb', import.meta.url)",
      )
      .replace(
        "const DEG = Math.PI / 180;",
        `const DEG = Math.PI / 180;
${mobileCrtLayout}
${interactiveCrtDials}
${crtCaptionCanvas}
${crtAudioSystem}`,
      )
      .replace(
        "const sceneObj = gltf.scene;",
        `const sceneObj = gltf.scene;
                applyMobileCrtLayout(sceneObj, slug);
                crtDialGeometryRef.current = prepareCrtDialGeometry(sceneObj);`,
      )
      .replace(
        "renderer.toneMappingExposure = 1.0;",
        "renderer.toneMappingExposure = 1.16;",
      )
      .replace(
        "new THREE.DirectionalLight(0xfff0d8, 1.0)",
        "new THREE.DirectionalLight(0xfff0d8, 1.9)",
      )
      .replace(
        "new THREE.DirectionalLight(0xa8c5ff, 0.45)",
        "new THREE.DirectionalLight(0xa8c5ff, 0.55)",
      )
      .replace(
        "new THREE.AmbientLight(0x303843, 0.55)",
        "new THREE.AmbientLight(0x46505d, 0.7)",
      )
      .replace(
        "uniform float u_emissive;              // brightness multiplier",
        `uniform float u_emissive;              // brightness multiplier
uniform vec2  u_mediaGrade;             // video-only saturation + contrast
uniform float u_stretchMedia;           // stretch all media to the tube`,
      )
      .replace(
        "uniform sampler2D u_screenMedia;",
        `uniform sampler2D u_screenMedia;
uniform sampler2D u_captionTexture;
uniform float u_haveCaption;`,
      )
      .replace(
        "return texture2D(u_screenMedia, mediaUV).rgb;",
        `vec3 mediaColor = texture2D(u_screenMedia, mediaUV).rgb;
	if (u_haveCaption > 0.5) {
		vec4 captionColor = texture2D(u_captionTexture, mediaUV);
		mediaColor = mix(mediaColor, captionColor.rgb, captionColor.a);
	}
	return mediaColor;`,
      )
      .replace(
        "u_emissive: { value: screenEmissive },",
        `u_emissive: { value: screenEmissive },
                u_mediaGrade: { value: new THREE.Vector2(1.0, 1.0) },
                u_stretchMedia: { value: 0.0 },`,
      )
      .replace(
        "u_screenMedia: { value: null },",
        `u_screenMedia: { value: null },
                u_captionTexture: { value: null },
                u_haveCaption: { value: 0.0 },`,
      )
      .replace(
        "\tvec2 mediaUV = (contentUV - 0.5) * scale + 0.5;",
        `\t// Every source fills the tube with its complete frame instead of
\t// cropping or adding bars; mismatched aspect ratios are stretched.
\tscale = mix(scale, vec2(1.0), u_stretchMedia);
\tvec2 mediaUV = (contentUV - 0.5) * scale + 0.5;`,
      )
      .replace(
        "\tcol.b = mix(col.b, col.b * 1.04, 0.5);",
        `\tcol.b = mix(col.b, col.b * 1.04, 0.5);

\t// YouTube video tends to arrive flatter than the highly saturated canvas
\t// and PNG sources. Lift only video saturation/contrast so the rest of the
\t// TV content keeps its existing grade.
\tfloat mediaLum = dot(col, vec3(0.299, 0.587, 0.114));
\tcol = mix(vec3(mediaLum), col, u_mediaGrade.x);
\tcol = (col - 0.5) * u_mediaGrade.y + 0.5;`,
      )
      .replace(
        "            const om2 = offscreenMatRef.current;\n            if (om2) {",
        `            const om2 = offscreenMatRef.current;
            if (om2) {
                const videoGrade = isVideoUrl(url);
                om2.uniforms.u_mediaGrade.value.set(
                    videoGrade ? 1.2 : 1.0,
                    videoGrade ? 1.1 : 1.0,
                );
                om2.uniforms.u_stretchMedia.value = 1.0;`,
      )
      .replace(
        "const videoElRef = React.useRef(null);",
        `const videoElRef = React.useRef(null);
    const videoPlaybackPositionsRef = React.useRef(new Map());
    const videoVolumeRef = React.useRef(0);
    const audioSystemRef = React.useRef(null);
    const audioProgramCleanupRef = React.useRef(null);
    const captionCanvasRef = React.useRef(null);
    const captionTextureRef = React.useRef(null);
    const captionDetailRef = React.useRef({});
    const channelOverlayRef = React.useRef({ channel: null, title: '', creationDate: '', hideTimer: null });
    const volumeOverlayRef = React.useRef({ level: null, hideTimer: null });
    const screenBounceRef = React.useRef(null);
    const screenBounceSampleRef = React.useRef({ canvas: null, context: null, lastSample: -1 });`,
      )
      .replace(
        "        offscreenMatRef.current = offscreenMat;",
        `        offscreenMatRef.current = offscreenMat;
        if (captionTextureRef.current) {
            offscreenMat.uniforms.u_captionTexture.value = captionTextureRef.current;
        }`,
      )
      .replace(
        "const pitchRef = React.useRef(0);",
        `const pitchRef = React.useRef(0);
    const crtDialGeometryRef = React.useRef([]);
    const crtDialTargetRef = React.useRef({ channel: 0, volume: 0 });
    const crtDialCurrentRef = React.useRef({ channel: 0, volume: 0 });
    const crtDialAppliedRef = React.useRef({ channel: NaN, volume: NaN });
    const crtDialProjectionRef = React.useRef(createCrtDialProjectionState());
    const canvasTextureVersionRef = React.useRef(-1);
    React.useEffect(() => {
        let system = null;
        try {
            system = createCrtAudioSystem();
        }
        catch (_) { /* Web Audio is an enhancement; retain direct playback as fallback. */ }
        audioSystemRef.current = system;
        setCrtAudioVolume(system, videoVolumeRef.current);
        return () => {
            audioProgramCleanupRef.current?.();
            audioProgramCleanupRef.current = null;
            audioSystemRef.current = null;
            destroyCrtAudioSystem(system);
        };
    }, []);
    React.useEffect(() => {
        const handleDialChange = (event) => {
            const detail = event.detail ?? {};
            if (Number.isFinite(detail.channelAngle))
                crtDialTargetRef.current.channel = detail.channelAngle;
            if (Number.isFinite(detail.volumeAngle))
                crtDialTargetRef.current.volume = detail.volumeAngle;
        };
        window.addEventListener('crt-dial-change', handleDialChange);
        return () => window.removeEventListener('crt-dial-change', handleDialChange);
    }, []);
    React.useEffect(() => {
        const handleVolumeChange = (event) => {
            const requestedVolume = Number(event.detail?.volume);
            if (!Number.isFinite(requestedVolume))
                return;
            const volume = Math.max(0, Math.min(1, requestedVolume));
            videoVolumeRef.current = volume;
            const audioSystem = audioSystemRef.current;
            setCrtAudioVolume(audioSystem, volume);
            const video = videoElRef.current;
            if (video) {
                video.volume = audioSystem ? 1 : volume;
                video.muted = volume <= 0;
            }
            if (video && volume > 0) {
                const playing = video.play();
                if (playing?.catch)
                    playing.catch(() => {});
            }
        };
        const handleChannelChange = () => {
            const audioSystem = audioSystemRef.current;
            if (!audioSystem || videoVolumeRef.current <= 0)
                return;
            if (audioSystem.context.state === 'suspended') {
                const resumed = audioSystem.context.resume();
                if (resumed?.catch)
                    resumed.catch(() => {});
            }
            burstCrtStatic(audioSystem);
        };
        window.addEventListener('crt-volume-change', handleVolumeChange);
        window.addEventListener('crt-channel-change', handleChannelChange);
        return () => {
            window.removeEventListener('crt-volume-change', handleVolumeChange);
            window.removeEventListener('crt-channel-change', handleChannelChange);
        };
    }, []);
    React.useEffect(() => {
        const renderOverlay = () => {
            let canvas = captionCanvasRef.current;
            let texture = captionTextureRef.current;
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.width = 1280;
                canvas.height = 720;
                captionCanvasRef.current = canvas;
            }
            if (!texture) {
                texture = new THREE.CanvasTexture(canvas);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.flipY = true;
                captionTextureRef.current = texture;
            }
            const hasCaption = drawCrtCaptionCanvas(canvas, captionDetailRef.current);
            const channelOverlay = channelOverlayRef.current;
            const hasChannel = drawCrtChannelCanvas(
                canvas,
                channelOverlay.channel,
                channelOverlay.title,
                channelOverlay.creationDate,
            );
            const hasVolume = drawCrtVolumeCanvas(canvas, volumeOverlayRef.current.level);
            texture.needsUpdate = true;
            const material = offscreenMatRef.current;
            if (material) {
                material.uniforms.u_captionTexture.value = texture;
                material.uniforms.u_haveCaption.value = hasCaption || hasChannel || hasVolume ? 1.0 : 0.0;
            }
            rtPrimedRef.current = false;
        };
        const handleCaptionChange = (event) => {
            captionDetailRef.current = event.detail ?? {};
            renderOverlay();
        };
        const handleChannelOverlay = (event) => {
            const channel = Number(event.detail?.channel);
            if (!Number.isFinite(channel))
                return;
            const overlay = channelOverlayRef.current;
            if (overlay.hideTimer !== null)
                window.clearTimeout(overlay.hideTimer);
            overlay.channel = channel;
            overlay.title = typeof event.detail?.title === 'string' ? event.detail.title : '';
            overlay.creationDate = typeof event.detail?.creationDate === 'string'
                ? event.detail.creationDate
                : '';
            renderOverlay();
            document.fonts?.load?.('500 58px "Geist Pixel Square"').then(() => {
                if (channelOverlayRef.current.channel === channel)
                    renderOverlay();
            }).catch(() => {});
            overlay.hideTimer = window.setTimeout(() => {
                overlay.channel = null;
                overlay.title = '';
                overlay.creationDate = '';
                overlay.hideTimer = null;
                renderOverlay();
            }, 3000);
        };
        const handleVolumeOverlay = (event) => {
            const level = Number(event.detail?.level);
            if (!Number.isFinite(level))
                return;
            const overlay = volumeOverlayRef.current;
            if (overlay.hideTimer !== null)
                window.clearTimeout(overlay.hideTimer);
            overlay.level = level;
            renderOverlay();
            overlay.hideTimer = window.setTimeout(() => {
                overlay.level = null;
                overlay.hideTimer = null;
                renderOverlay();
            }, 3000);
        };
        window.addEventListener('crt-caption-change', handleCaptionChange);
        window.addEventListener('crt-channel-change', handleChannelOverlay);
        window.addEventListener('crt-volume-change', handleVolumeOverlay);
        return () => {
            window.removeEventListener('crt-caption-change', handleCaptionChange);
            window.removeEventListener('crt-channel-change', handleChannelOverlay);
            window.removeEventListener('crt-volume-change', handleVolumeOverlay);
            if (channelOverlayRef.current.hideTimer !== null)
                window.clearTimeout(channelOverlayRef.current.hideTimer);
            if (volumeOverlayRef.current.hideTimer !== null)
                window.clearTimeout(volumeOverlayRef.current.hideTimer);
            captionTextureRef.current?.dispose?.();
            captionTextureRef.current = null;
            captionCanvasRef.current = null;
        };
    }, []);`,
      )
      .replace(
        "            v.muted = true;",
        `            v.volume = audioSystemRef.current ? 1 : videoVolumeRef.current;
            v.muted = videoVolumeRef.current <= 0;`,
      )
      .replace(
        "        const prevVid = videoElRef.current;",
        `        const prevVid = videoElRef.current;
        audioProgramCleanupRef.current?.();
        audioProgramCleanupRef.current = null;`,
      )
      .replace(
        "            videoElRef.current = v;",
        `            videoElRef.current = v;
            try {
                audioProgramCleanupRef.current = connectCrtProgramAudio(audioSystemRef.current, v);
            }
            catch (_) {
                audioProgramCleanupRef.current = null;
                v.volume = videoVolumeRef.current;
            }`,
      )
      .replace(
        "            v.loop = true;",
        `            const mediaStartMatch = url.match(/[?&]startAt=(\\d+(?:\\.\\d+)?)/);
            const mediaStartTime = mediaStartMatch ? Number(mediaStartMatch[1]) : 0;
            const mediaEndMatch = url.match(/[?&]endAt=(\\d+(?:\\.\\d+)?)/);
            const mediaEndTime = mediaEndMatch ? Number(mediaEndMatch[1]) : 0;
            const savedMediaTime = videoPlaybackPositionsRef.current.get(url);
            v.dataset.crtMediaUrl = url;
            const publishVideoTime = () => {
                if (Number.isFinite(v.currentTime))
                    videoPlaybackPositionsRef.current.set(url, v.currentTime);
                const videoEventTarget = canvasRef.current?.closest?.('.crt-stage') ?? window;
                videoEventTarget.dispatchEvent(new CustomEvent('crt-video-time', {
                    bubbles: true,
                    detail: {
                        url: v.dataset.crtMediaUrl || '',
                        currentTime: v.currentTime,
                        duration: v.duration,
                    },
                }));
            };
            v.addEventListener('timeupdate', publishVideoTime);
            v.addEventListener('seeked', publishVideoTime);
            v.loop = mediaStartTime <= 0 && mediaEndTime <= 0;
            if (mediaStartTime > 0 || mediaEndTime > 0) {
                const restartVideo = () => {
                    // The requested offset applies only to the initial tune-in.
                    // Later loops replay the video from its actual beginning.
                    v.currentTime = 0;
                    const replay = v.play();
                    if (replay?.catch)
                        replay.catch(() => {});
                };
                v.addEventListener('ended', restartVideo);
                if (mediaEndTime > mediaStartTime) {
                    v.addEventListener('timeupdate', () => {
                        if (v.currentTime >= mediaEndTime - 0.04)
                            restartVideo();
                    });
                }
            }`,
      )
      .replace(
        "                const p = v.play();",
        `                const resumeTime = Number.isFinite(savedMediaTime)
                    ? savedMediaTime
                    : mediaStartTime;
                if (resumeTime > 0)
                    v.currentTime = Math.min(resumeTime, Math.max(0, v.duration - 0.05));
                const p = v.play();`,
      )
      .replace(
        `            return () => {
                cancelled = true;
                v.removeEventListener('loadedmetadata', onMeta);`,
        `            return () => {
                if (v.readyState >= 1 && Number.isFinite(v.currentTime))
                    videoPlaybackPositionsRef.current.set(url, v.currentTime);
                cancelled = true;
                v.removeEventListener('loadedmetadata', onMeta);`,
      )
      .replace(
        "sceneRoot.add(amb);",
        `sceneRoot.add(amb);
        // Localized CRT spill: emissive materials do not cast light, so a
        // short-range source just in front of the glass provides screen bounce.
        const screenBounce = new THREE.PointLight(0xd7e7ff, 0.56, 6.0, 1.25);
        screenBounce.position.set(-0.42, 0.08, 2.35);
        modelWrap.add(screenBounce);
        screenBounceRef.current = screenBounce;`,
      )
      .replace(
        "cloned.roughness = 0.55;",
        "cloned.roughness = 0.72;",
      )
      .replace(
        `m.geometry = projected.geometry;
                        surfaceSize = projected.surfaceSize;`,
        `m.geometry = projected.geometry;
                        // Enlarge the physical curved glass around its own
                        // centre without zooming the media mapped onto it.
                        m.geometry.computeBoundingBox();
                        const glassBounds = m.geometry.boundingBox;
                        if (glassBounds) {
                            const glassCenter = glassBounds.getCenter(new THREE.Vector3());
                            const growGlass = new THREE.Matrix4()
                                .makeTranslation(glassCenter.x, glassCenter.y, glassCenter.z)
                                .multiply(new THREE.Matrix4().makeScale(1.08, 1.08, 1.0))
                                .multiply(new THREE.Matrix4().makeTranslation(-glassCenter.x, -glassCenter.y, -glassCenter.z));
                            m.geometry.applyMatrix4(growGlass);
                        }
                        surfaceSize = projected.surfaceSize;`,
      )
      .replace(
        "    // Glitch scheduling — next-burst-time + active-envelope are CPU side",
        `${dynamicScreenBounce}    // Glitch scheduling — next-burst-time + active-envelope are CPU side`,
      )
      .replace(
        "        renderer.render(scene, camera);",
        `        updateScreenBounce(elapsed);
        const dialTarget = crtDialTargetRef.current;
        const dialCurrent = crtDialCurrentRef.current;
        const dialEase = reducedMotion ? 1 : 1 - Math.exp(-Math.max(0.001, delta) * 12);
        dialCurrent.channel += (dialTarget.channel - dialCurrent.channel) * dialEase;
        dialCurrent.volume += (dialTarget.volume - dialCurrent.volume) * dialEase;
        if (Math.abs(dialTarget.channel - dialCurrent.channel) < 0.0001)
            dialCurrent.channel = dialTarget.channel;
        if (Math.abs(dialTarget.volume - dialCurrent.volume) < 0.0001)
            dialCurrent.volume = dialTarget.volume;
        const dialApplied = crtDialAppliedRef.current;
        if (dialApplied.channel !== dialCurrent.channel || dialApplied.volume !== dialCurrent.volume) {
            applyCrtDialGeometry(crtDialGeometryRef.current, dialCurrent.channel, dialCurrent.volume);
            dialApplied.channel = dialCurrent.channel;
            dialApplied.volume = dialCurrent.volume;
        }
        publishCrtDialPositions(
            canvasRef.current,
            modelObjRef.current,
            camera,
            crtDialProjectionRef.current,
            elapsed,
            size.width,
            size.height,
        );
        const canvasTexture = textureRef.current;
        const canvasImage = canvasTexture?.image;
        if (canvasImage instanceof HTMLCanvasElement) {
            const frameVersion = canvasImage.__crtFrameVersion ?? 0;
            if (canvasTextureVersionRef.current !== frameVersion) {
                canvasTextureVersionRef.current = frameVersion;
                canvasTexture.needsUpdate = true;
            }
        }
        renderer.render(scene, camera);`,
      )
      .replace(
        "        if (isVideoUrl(url)) {",
        `        if (url.startsWith('canvas:')) {
            const canvas = document.getElementById(url.slice('canvas:'.length));
            if (canvas instanceof HTMLCanvasElement) {
                canvasTextureVersionRef.current = -1;
                const tex = new THREE.CanvasTexture(canvas);
                applyTexture(tex, canvas.width, canvas.height);
                setMediaReady(true);
                return () => {
                    cancelled = true;
                };
            }
        }
        if (isVideoUrl(url)) {`,
      )
      .replace(
        "            screenGeomRef.current = null;",
        `            screenGeomRef.current = null;
            screenBounceRef.current = null;`,
      )
      .replace(
        "modelObjRef.current = null;\n        modelFitRef.current = null;",
        `modelObjRef.current = null;
        modelFitRef.current = null;
        crtDialGeometryRef.current = [];
        crtDialAppliedRef.current = { channel: NaN, volume: NaN };
        crtDialProjectionRef.current = createCrtDialProjectionState();`,
      )
      .replace(
        "const targetYaw = reducedMotion ? 0 : -px * (3.0 * Math.PI / 180) * pStrength;",
        "const targetYaw = reducedMotion ? 0 : px * (8.5 * Math.PI / 180) * pStrength;",
      )
      .replace(
        "const targetPitch = reducedMotion ? 0 : -py * (2.0 * Math.PI / 180) * pStrength;",
        "const targetPitch = reducedMotion ? 0 : py * (5.5 * Math.PI / 180) * pStrength;",
      )
      .replace(
        "Math.max(0.001, delta) * 5.5",
        "Math.max(0.001, delta) * 7.5",
      )
      .replace(
        /float hash21\(vec2 p\) \{[\s\S]*?\n\}/,
        improvedCrtHash,
      )
      .replace(
        /float phase = clamp\(u_turnOnPhase, 0\.0, 1\.0\);[\s\S]*?col = turnCol \* vis;\s*\}/,
        noiseOnlyCrtTransition,
      );
  },
});

export default defineConfig({
  optimizeDeps: {
    exclude: ["@crazygl/core", "@crazygl/hero-vhs-product-screen"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  ssr: {
    noExternal: [
      "@crazygl/core",
      "@crazygl/hero-vhs-product-screen",
      "three",
    ],
  },
  plugins: [
    fixCrazyGlModelPaths(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});
