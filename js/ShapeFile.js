import { DataViewReader } from "./DataViewReader.js";

export class ShapeFile
{
    constructor(data)
    {
        let reader = new DataViewReader(data);

        function createItem(reader)
        {
            let number = reader.readInt32(false);
            let length = reader.readInt32(false);
            let type = reader.readInt32(true);
            let points;

            switch (type) 
            {
                case ShapeType.NULL:
                    debugger;
                    break;
                case ShapeType.Point:
                    points = [{ x: reader.readFloat64(true), y: reader.readFloat64(true) }];
                    return { number, length, type, points };
                case ShapeType.Polyline:
                case ShapeType.Polygon:
                    let min_x = reader.readFloat64(true);
                    let min_y = reader.readFloat64(true);
                    let max_x = reader.readFloat64(true);
                    let max_y = reader.readFloat64(true);
                    //reader.position += 16;
                    let parts_num = reader.readInt32(true);
                    let points_num = reader.readInt32(true);
                    let parts = new Int32Array(parts_num);
                    points = new Float64Array(points_num * 2);

                    for (let i = 0; i < parts.length; i++)
                    {
                        parts[i] = reader.readInt32(true);
                    }

                    for (let i = 0; i < points.length; i++) 
                    {
                        points[i] = reader.readFloat64(true);
                    }

                    return { number, length, type, points, parts, min_x, min_y, max_x, max_y };
                default:
                    debugger;
            }

        }

        let file_code = reader.readInt32(false);
        reader.position = 24; // Unused bytes
        let length_in_words = reader.readInt32(false);
        let length_in_bytes = length_in_words * 2;
        this.version = reader.readInt32(true);
        this.shape_type = reader.readInt32(true);
        this.min_x = reader.readFloat64(true);
        this.min_y = reader.readFloat64(true);
        this.max_x = reader.readFloat64(true);
        this.max_y = reader.readFloat64(true);
        this.items = [];
        reader.position = 100;

        while (reader.position < length_in_bytes)
        {
            let item = createItem(reader);
            //reader.position += 8 + item.length * 2;
            this.items.push(item);
        }
    }
}

class ShapeType
{
    static NULL = 0;
    static Point = 1;
    static Polyline = 3;
    static Polygon = 5;
}