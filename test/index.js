const { text2PolygonFeature } = require("../src")
const path = require('path')

text2PolygonFeature(path.join(__dirname, './MalgunGothicRegular.ttf'), '새 폴더 만들기', [114.3642124, 30.512943]).then(res => console.log(JSON.stringify(res)))
console.log('\r\n\r\n\r\n')
text2PolygonFeature(path.join(__dirname, './微软雅黑.ttf'), '欧 洲小镇', [114.3642124, 30.512943]).then(res => console.log(JSON.stringify(res)))