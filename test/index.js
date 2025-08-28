const { loadFont, text2PolygonFeature } = require("../src")
const path = require('path')

loadFont(path.join(__dirname, './MalgunGothicRegular.ttf')).then(font => {
    const res = text2PolygonFeature(font, '새 폴더 만들기', [114.3642124, 30.512943])
    console.log(JSON.stringify(res))
})
console.log('\r\n\r\n\r\n')
loadFont(path.join(__dirname, './微软雅黑.ttf')).then(font => {
    const res = text2PolygonFeature(font, '欧 洲小镇', [114.3642124, 30.512943])
    console.log(JSON.stringify(res))
})