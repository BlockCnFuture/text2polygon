import opentype from 'opentype.js'

/**
 * 将文本转换为 GeoJSON Polygon Collection
 * @param {string} fontPath - 字体文件
 * @param {string} text - 需要转换的文本
 * @param {[number, number]} [center=[0,0]] - 文本整体中心位置，[x, y]
 * @param {number} [fontSize=0.01] - 字体大小，单位米
 * @param {Object} [properties={}] - 每个 Feature 的附加属性
 * @returns {Promise<GeoJSON.FeatureCollection>} - 返回 GeoJSON FeatureCollection
 */
export async function text2PolygonFeature(fontPath, text, center = [0, 0], fontSize = 12, properties = {}) {
    let font = await opentype.load(fontPath)
    let glyphs = font.stringToGlyphs(text)
    let features = []
    let x = 0
    let segments = 10
    let allPoints = []

    // 1纬度约 111320米
    let scale = fontSize / 111320 / font.unitsPerEm

    function sampleQuadratic(p0, p1, p2) {
        let pts = []
        for (let t = 0; t <= 1; t += 1 / segments) {
            let x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
            let y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
            pts.push([x, y])
        }
        return pts
    }

    function sampleCubic(p0, p1, p2, p3) {
        let pts = []
        for (let t = 0; t <= 1; t += 1 / segments) {
            let x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0]
            let y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t ** 2 * p2[1] + t ** 3 * p3[1]
            pts.push([x, y])
        }
        return pts
    }

    // 计算路径方向，顺时针为 true，逆时针为 false
    function isClockwise(path) {
        let sum = 0
        for (let i = 0; i < path.length; i++) {
            let [x1, y1] = path[i]
            let [x2, y2] = path[(i + 1) % path.length]
            sum += (x2 - x1) * (y2 + y1)
        }
        return sum > 0
    }

    for (let glyph of glyphs) {
        let path = glyph.getPath(x, 0, font.unitsPerEm * scale)
        let subPaths = []
        let currentPath = []

        for (let cmd of path.commands) {
            if (cmd.type === 'M') {
                if (currentPath.length) subPaths.push(currentPath)
                currentPath = [[cmd.x, -cmd.y]]
            } else if (cmd.type === 'L') {
                currentPath.push([cmd.x, -cmd.y])
            } else if (cmd.type === 'Q') {
                let p0 = currentPath[currentPath.length - 1]
                let p1 = [cmd.x1, -cmd.y1]
                let p2 = [cmd.x, -cmd.y]
                currentPath.push(...sampleQuadratic(p0, p1, p2).slice(1))
            } else if (cmd.type === 'C') {
                let p0 = currentPath[currentPath.length - 1]
                let p1 = [cmd.x1, -cmd.y1]
                let p2 = [cmd.x2, -cmd.y2]
                let p3 = [cmd.x, -cmd.y]
                currentPath.push(...sampleCubic(p0, p1, p2, p3).slice(1))
            }
        }
        if (currentPath.length) subPaths.push(currentPath)
        subPaths.forEach(sp => allPoints.push(...sp))

        // 分组外环和内环
        let polygons = []
        subPaths.forEach(sp => {
            if (isClockwise(sp)) {
                polygons.push({ outer: sp, holes: [] })
            } else if (polygons.length > 0) {
                polygons[polygons.length - 1].holes.push(sp)
            }
        })

        polygons.forEach(p => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [p.outer, ...p.holes]
                },
                properties
            })
        })

        x += glyph.advanceWidth * scale
    }

    let minX = Math.min(...allPoints.map(p => p[0]))
    let maxX = Math.max(...allPoints.map(p => p[0]))
    let minY = Math.min(...allPoints.map(p => p[1]))
    let maxY = Math.max(...allPoints.map(p => p[1]))
    let dx = center[0] - (minX + maxX) / 2
    let dy = center[1] - (minY + maxY) / 2

    features.forEach(f => f.geometry.coordinates = f.geometry.coordinates.map(ring => ring.map(p => [p[0] + dx, p[1] + dy])))

    return { type: 'FeatureCollection', features }
}
