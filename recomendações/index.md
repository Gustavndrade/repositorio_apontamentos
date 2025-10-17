Perfeito — vou te dar um **guia prático e direto ao ponto** para você entender como o Avenza (ou apps similares) tratam localização e mapas offline, e como **implementar no seu app** a ideia que descreveu:

> um campo “vazio” (sem base raster) que mostre só o ícone/marker do usuário, e que permita **adicionar um mapa offline** (PDF/GeoTIFF/MBTiles) e renderizá‑lo naquele espaço quando o usuário quiser.

Vou cobrir: formatos, preparação do mapa (georreferenciamento → tiles/MBTiles), projeção/transformação de coordenadas, arquitetura móvel (Android/iOS), exemplos de código (Kotlin/Swift), e considerações de desempenho/UX.

---

# 1) Visão geral — como funciona (resumido)

* Mapas georreferenciados (PDF/GeoTIFF) trazem coordenadas para cada pixel.
* Para renderização eficiente offline, transforma‑se o mapa em **tiles** (XYZ) ou em **MBTiles** (SQLite contendo tiles raster ou vector).
* No app você pode:

  * iniciar a tela com **estilo vazio** (sem base), apenas com um overlay de marcador GPS ;
  * quando o usuário “adiciona” um mapa offline, registrar uma fonte de tiles local e ativar a camada raster sobre o mesmo espaço, sem depender da internet.
* Importante: **projeção**. A maioria dos renderers móveis usa WebMercator (EPSG:3857). Se seu mapa estiver em outra projeção reprojecte ao gerar tiles.

---

# 2) Formatos que você deve suportar (e o que fazer com cada um)

* **PDF georreferenciado (GeoPDF)**

  * Pode conter GCPs / georeference. Converta para GeoTIFF ou diretamente para tiles.
* **GeoTIFF** (com tags GeoTIFF) — ideal: pode ser lido por GDAL e convertido para tiles ou MBTiles.
* **MBTiles** — formato SQLite com tiles XYZ (raster PNG/JPEG) ou vector (Mapbox Vector Tiles). Ótimo para distribuição offline.
* **Vector Tiles (MVT)** — menores, escaláveis, permitem estilização client-side, mas exigem processo diferente (tippecanoe etc.).

Recomendação prática: converta tudo para **MBTiles raster (PNG)** ou **vector tiles (MVT)** dependendo do conteúdo. Para mapas escaneados use raster MBTiles.

---

# 3) Preparar mapas (exemplos de comandos com GDAL)

(assumo que você tem GDAL instalado)

1. **Converter PDF Geo → GeoTIFF** (se necessário)

```bash
gdal_translate -of GTiff input_geopdf.pdf output.tif
```

2. **Reprojetar para WebMercator (EPSG:3857)** — importante para compatibilidade com MapLibre/Mapbox

```bash
gdalwarp -t_srs EPSG:3857 output.tif output_3857.tif
```

3. **Criar MBTiles raster direto com GDAL**

```bash
gdal_translate -of MBTILES output_3857.tif map.mbtiles -co TILE_FORMAT=PNG
# opcional: ajustar níveis de zoom com gdaladdo/gdalwarp antes
```

Alternativa: gerar tiles XYZ com `gdal2tiles.py` e empacotar com `mbutil`, mas o driver MBTILES do GDAL faz direto.

4. **(Vector tiles)**: se tiver dados vetoriais (GeoJSON/Shapefile), use `tippecanoe` para gerar .mbtiles (MVT):

```bash
tippecanoe -o vector.mbtiles -zg --drop-densest-as-needed data.geojson
```

Resultado: `map.mbtiles` pronto pra usar no app.

---

# 4) Projeção e conversões básicas (lat/lon ↔ pixels / tiles)

Se você precisar calcular manualmente posição do marker sobre tiles:

* Converter lat/lon para WebMercator (x,y metros) ou diretamente para tile coordinates (XYZ):

Formula (em pseudo/JS):

```js
// lon, lat em graus; z nivel de zoom
n = 2 ** z
xtile = n * ((lon + 180) / 360)
ytile = n * (1 - (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad)) / Math.PI)) / 2
```

Para pixel dentro do mapa: pixelX = xtile * 256, etc.

Mas se usar MapLibre/Mapbox, a SDK já converte lat/lon → tela; você só fornece a LatLng do usuário.

---

# 5) Arquitetura no app (conceito)

* **Map engine**: MapLibre (open-source fork do Mapbox GL) — funciona tanto em iOS quanto Android e aceita fontes raster/vector.
* **Alternativa Android**: Mapsforge (para mapas offline vetoriais), ou um `TileOverlay` custom lendo MBTiles.
* **Dados offline**: armazene `.mbtiles` no armazenamento do app; ao “adicionar mapa”, o app registra o arquivo como fonte de tiles.

Fluxo:

1. Activity/View inicia com MapView usando **estilo vazio** (sem tiles). Só mostra marker do usuário (layer de símbolos).
2. Ao adicionar mapa offline:

   * abra MBTiles (SQLite), ative TileProvider que responde requisições `/z/x/y` lendo tile blob do MBTiles; registre essa fonte no MapLibre como raster source (ou vector source).
   * adicione camada raster/vector para renderizar os tiles naquela view.
3. Permitir toggles: visibilidade on/off, opacidade, order (baixo sobreponha marcadores), etc.

---

# 6) Exemplo Android (Kotlin) com MapLibre e MBTiles (simplificado)

Este exemplo mostra:

* MapView com estilo vazio;
* Marker de usuário;
* Como adicionar MBTiles via `TileOverlay` custom (uma forma simples se não usar MapLibre tile source diretamente).

Obs.: MapLibre aceita fontes raster/vector via URL. MBTiles não é servido por URL local por padrão; então uma abordagem é:

* Implementar `TileProvider` que lê MBTiles e usar `TileOverlay` da Google Maps SDK (se optar por Google Maps).
* Ou, mais elegante: implementar um servidor HTTP local (p.ex. `NanoHTTPD`) que serve tiles `http://localhost:8080/{z}/{x}/{y}.png` lendo MBTiles, e apontar MapLibre raster source para essa URL template.

Vou mostrar a abordagem do servidor local + MapLibre.

1. Dependências (build.gradle)

```gradle
implementation 'org.maplibre.gl:android-sdk:9.6.2' // ajuste versão
implementation 'org.nanohttpd:nanohttpd:2.3.1' // servidor local leve
implementation 'org.xerial:sqlite-jdbc:3.36.0' // se quiser acesso SQLite nativo (ou use android.database.sqlite)
```

2. Servidor simples que lê MBTiles (pseudocódigo Kotlin):

```kotlin
class MbTilesServer(val mbtilesPath: String) : NanoHTTPD(8080) {
    val db = SQLiteDatabase.openDatabase(mbtilesPath, null, SQLiteDatabase.OPEN_READONLY)
    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri // e.g. /tiles/10/345/400.png or /{z}/{x}/{y}.png
        val parts = uri.trim('/').split('/')
        if (parts.size < 3) return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "not found")
        val z = parts[0].toInt(); val x = parts[1].toInt(); val yWithExt = parts[2]
        val y = yWithExt.substringBefore('.').toInt()
        // MBTiles stores TMS Y (flipped). Convert: tileRow = (2^z - 1) - y
        val tileRow = (1 shl z) - 1 - y
        val cursor = db.rawQuery("SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?", arrayOf("$z","$x","$tileRow"))
        if (cursor.moveToFirst()) {
            val blob = cursor.getBlob(0)
            cursor.close()
            val mime = "image/png" // or detect
            return newFixedLengthResponse(Response.Status.OK, mime, ByteArrayInputStream(blob), blob.size.toLong())
        } else {
            cursor.close()
            return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "not found")
        }
    }
}
```

3. MapLibre: iniciar com estilo vazio e adicionar raster source apontando pra `http://localhost:8080/{z}/{x}/{y}.png`

```kotlin
mapView.getMapAsync { map ->
    // estilo vazio
    val style = Style.Builder().fromUri("blank") // ou criar um style minimal
    map.setStyle(style) { s ->
        // adicionar camada de usuário (símbolo)
        val userLayer = SymbolLayer("user-layer","user-source")
        // ... configurar
    }
}
```

Para MapLibre, você precisa criar uma `RasterSource`:

```kotlin
val rasterSource = RasterSource("offline-map-source", TileSet("tileset", "http://localhost:8080/{z}/{x}/{y}.png"), 256)
style.addSource(rasterSource)
val rasterLayer = RasterLayer("offline-map-layer", "offline-map-source")
rasterLayer.setProperties(PropertyFactory.rasterOpacity(0.9f))
style.addLayerBelow(rasterLayer,"user-layer") // abaixo do marcador
```

Quando o usuário remove o mapa, basta `style.removeLayer(rasterLayer); style.removeSource(rasterSource)`.

---

# 7) Exemplo iOS (Swift) — MapLibre / Mapbox style

Fluxo idêntico: servidor local que serve tiles do MBTiles, ou usar Mapbox SDK offline packs (mas Mapbox SDK tem licença). Exemplo usando servidor local:

* Use `GCDWebServer` para servir tiles do .mbtiles.
* Criar `raster` or `rasterDemSource` apontando para `http://localhost:8080/{z}/{x}/{y}.png`.
* Adicionar `MGLRasterStyleLayer` (Mapbox) ou equivalente MapLibre.

Sketch Swift (pseudocódigo):

```swift
// start GCDWebServer reading mbtiles sqlite and serving tile blobs
let options = [GCDWebServerOption_AutomaticallySuspendInBackground: false]
webServer.start(withPort: 8080, bonjourName: nil)

// Map setup
let mapView = MapView(frame: view.bounds, styleURL: nil) // estilo vazio
let rasterSource = RasterSource(identifier: "offline-source", tileSize: 256, tiles: ["http://localhost:8080/{z}/{x}/{y}.png"])
mapView.style?.addSource(rasterSource)
let rasterLayer = RasterLayer(id: "offline-layer", source: "offline-source")
mapView.style?.addLayer(rasterLayer)
```

---

# 8) Renderizar sem imagens (campo vazio) e apenas marker

* Inicie o MapView com um **estilo mínimo/vazio**. Em MapLibre/Mapbox você pode criar um style JSON simples com nenhuma camada base.
* Adicione uma camada de símbolos (`SymbolLayer`) que renderiza o ícone do usuário a partir do GPS (update da localização à medida que o dispositivo se move).
* Quando o usuário adicionar um mapa offline, adicione a `RasterSource`/`RasterLayer` vindo do MBTiles local (ou `VectorSource` se for vector tiles). Controle `opacity` para misturar.

Benefício: o app permanece funcional (p.ex. coleta de trilha) mesmo sem base; user pode ativar/desativar mapa.

---

# 9) Performance e recomendações

* **Pré-gere tiles** nos níveis de zoom que quer oferecer (p.ex. z 5–18). Não gere zooms desnecessários — MBTiles muito grandes ocupam espaço.
* **Usar tiles vetoriais** quando possível (menor tamanho, styling dinâmico). Para mapas escaneados, vetorial não é aplicável—use raster.
* **Evite carregar GeoTIFF inteiro em memória**; gere tiles e sirva tiles, ou use uma biblioteca que suporte leitura tiled de GeoTIFF (GDAL virtual raster) no dispositivo (difícil em mobile).
* **Cache local**: mantenha tiles acessados recentemente em cache para performance.
* **Testar em dispositivos reais** para latência do I/O do SQLite.

---

# 10) Ferramentas úteis (resumo)

* GDAL (`gdal_translate`, `gdalwarp`, driver MBTILES) — preparar mapas.
* Tippecanoe — gerar vector MBTiles.
* MapLibre (Android/iOS) — engine open-source para renderização GL.
* NanoHTTPD / GCDWebServer — servidor local para expor MBTiles como tiles HTTP.
* MBTools/mbutil — manipulação MBTiles.
* QGIS (Georeferencer) — georreferenciar PDFs manualmente.

---

# 11) Checklist prático para você executar agora

1. Pegue um mapa (PDF georreferenciado) ou GeoTIFF.
2. Converter → reprojetar para EPSG:3857 → gerar `map.mbtiles` com GDAL:

```bash
gdal_translate -of GTiff input.pdf tmp.tif
gdalwarp -t_srs EPSG:3857 tmp.tif tmp_3857.tif
gdal_translate -of MBTILES tmp_3857.tif map.mbtiles -co TILE_FORMAT=PNG
```

3. Coloque `map.mbtiles` no armazenamento do app.
4. No app, inicie MapLibre com estilo vazio e adicione camada de usuário.
5. Implemente servidor HTTP local que responde `/z/x/y.png` lendo `map.mbtiles`.
6. Ao ativar mapa, registre RasterSource apontando para `http://localhost:8080/{z}/{x}/{y}.png` e adicione RasterLayer.
7. Teste: marker deve permanecer visível; mapa aparece quando ativado; permita toggles/opacidade.

---

Se quiser, eu posso agora (escolha uma das opções) — e eu te entrego prontinho **aqui**:

1. Um **checklist** detalhado com todos os comandos e paths ajustados pro seu sistema (Windows/macOS/Linux).
2. Um **projeto Android Kotlin mínimo** (estrutura de código com o server local + MapLibre) que você possa copiar e compilar.
3. O **script GDAL** exato para converter seu PDF/GeoTIFF em MBTiles com parâmetros de zoom recomendados.
4. Um **snippet iOS Swift** pronto para integrar com GCDWebServer + MapLibre.

Qual opção você quer que eu produza agora? (1, 2, 3 ou 4)
