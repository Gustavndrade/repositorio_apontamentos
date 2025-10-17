import { Directory, File } from "expo-file-system";
import * as FileSystem from 'expo-file-system';

export function tileGridForRegion(region: any, minZoom: number, maxZoom: number) {
  let tiles: {
    x: number;
    y: number;
    z: number;
  }[] = [];

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const subTiles = tilesForZoom(region, zoom);
    tiles = [...tiles, ...subTiles];
  }

  const rootFolder = new FileSystem.Directory(FileSystem.Paths.document, 'maps').uri;
  fetchTiles(tiles, rootFolder);

  return tiles;
}


function tilesForZoom(region: any, zoom: any) {
  const minLon = region.longitude - region.longitudeDelta;
  const minLat = region.latitude - region.latitudeDelta;
  const maxLon = region.longitude + region.longitudeDelta;
  const maxLat = region.latitude + region.latitudeDelta;

  let minTileX = lonToTileX(minLon, zoom);
  let maxTileX = lonToTileX(maxLon, zoom);
  let minTileY = latToTileY(maxLat, zoom);
  let maxTileY = latToTileY(minLat, zoom);

  let tiles = [];

  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  return tiles;
}

function degToRad(deg: number) {
  return deg * Math.PI / 180;
}

function lonToTileX(lon: number, zoom: number) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function latToTileY(lat, zoom) {
  return Math.floor(
    (1 - Math.log(Math.tan(degToRad(lat)) + 1 / Math.cos(degToRad(lat))) / Math.PI) / 2 * Math.pow(2, zoom)
  );
}

async function fetchTiles(
  tileGrid,
  rootFolder = new FileSystem.Directory(FileSystem.Paths.document, 'maps').uri,
  tileServerUrl = 'http://c.tile.openstreetmap.org'
) {
  // Create folder structure: {rootFolder}/{z}/{x}
  const createDirectories = tileGrid.map(async (tile) => {
    const folder = `${rootFolder}/${tile.z}/${tile.x}`;
    try {
       new Directory(folder).create({ intermediates: true })
      console.log(new Directory(folder).create({ intermediates: true }));
    } catch (error) {
      // Folder may already exist, ignore error
    }
  });

  await Promise.all(createDirectories);

  const tileDownloads = tileGrid.map(async (tile) => {
    const fetchUrl = `${tileServerUrl}/${tile.z}/${tile.x}/${tile.y}.png`;
    const fsLocation = `${rootFolder}${tile.z}/${tile.x}/${tile.y}.png`;
    console.log( `tiles folder:  ${rootFolder}${tile.z}/${tile.x}/${tile.y}.png` )

    const fileInfo = new File(fsLocation).info;
    if (!fileInfo) {
      try {
        return await File.downloadFileAsync(fetchUrl, new Directory(fsLocation));
      } catch (error) {
        console.warn('Download de Tile:', fetchUrl, error);
      }
    } else {
      return { uri: fsLocation };
    }
  });

  const results = await Promise.all(tileDownloads);
  console.log('Tiles baixados ou já disponíveis:', results.filter(Boolean).length);
  console.log('link local', rootFolder)

}