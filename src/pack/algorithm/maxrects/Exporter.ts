import Jimp from "jimp";
const fs = require("fs");
const path = require("path");

import { AtlasFormat } from "../enums/AtlasFormat";
import { MaxRectsPacker } from "./Packer";

export class Exporter {
  private _format: AtlasFormat;

  get format(): AtlasFormat {
    return this._format;
  }

  set format(val: AtlasFormat) {
    this._format = val;
  }

  constructor(format: AtlasFormat) {
    this._format = format;
  }

  async export(version: string, output: string, packer: MaxRectsPacker) {
    switch (this.format) {
      case AtlasFormat.Oasis:
        return this._exportToOasis(version, output, packer);
      default:
        return this._exportToOasis(version, output, packer);
    }
  }

  private async _exportToOasis(version: string, output: string, packer: MaxRectsPacker) {
    const res = { atlasItems: <any>[], version: version, format: 1};
    const imageFile = await this._generatePackedImage(output, packer);
    const item = {
      "img": `./${output}.png`,
      "sprites": <any>[]
    };
    res.atlasItems.push(item);
    const { packedRects } = packer;
    const { sprites } = item;
    for (let i = 0, l = packedRects.length; i < l; ++i) {
      const rect = packedRects[i];
      sprites.push({
        "name": rect.name,
        "atlasRotated": rect.isRotated,
        "atlasRegion": {
          "x": rect.x,
          "y": rect.y,
          "w": rect.width,
          "h": rect.height
        },
        "originalSize": {
          "w": rect.width,
          "h": rect.height
        }
      });
    }

    try {
      const atlasStr = JSON.stringify(res);
      const atlasFile = path.resolve(`${output}.atlas`);
      await fs.writeFileSync(atlasFile, atlasStr);
      return {
        'imageFile': imageFile,
        'atlasFile': atlasFile
      };
    } catch (error) {
      throw new Error(`jsonParseErr【${output}】`);
    }
  }

  private async _generatePackedImage(output: string, packer: MaxRectsPacker) {
    const { packedWidth, packedHeight, packedRects, images } = packer;
    const packedImage = new Jimp(packedWidth, packedHeight);
    for (let i = 0, l = packedRects.length; i < l; ++i) {
      const rect = packedRects[i];
      const name = rect.name;
      const image = <Jimp>images[name];
      if (image) {
        const { width, height } = image.bitmap;
        const startX = rect.x;
        const startY = rect.y;
        for (let i = 0; i < width; ++i) {
          for (let j = 0; j < height; ++j) {
            const x = startX + i;
            const y = startY + j;
            packedImage.setPixelColor(image.getPixelColor(i, j), x, y);
          }
        }
      }
    }

    const imageFile = path.resolve(`${output}.png`);
    await packedImage.writeAsync(imageFile);

    return imageFile;
  }
}
