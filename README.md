### 使用方法

```js
const { loadFont, text2PolygonFeature } = require("@mapcatch/text2polygon")
const path = require('path')

loadFont(path.join(__dirname, './微软雅黑.ttf')).then(font => {
    const res = text2PolygonFeature(font, '欧 洲小镇', [114.3642124, 30.512943])
    console.log(JSON.stringify(res))
})
```