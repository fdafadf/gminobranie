export class DataViewReader
{
    constructor(data)
    {
        this.position = 0;
        this.data = data;
        this.decoder = new TextDecoder("utf-8");
    }

    readInt16(littleEndian)
    {
        let value = this.data.getInt16(this.position, littleEndian);
        this.position += 2;
        return value;
    }

    readInt32(littleEndian)
    {
        let value = this.data.getInt32(this.position, littleEndian);
        this.position += 4;
        return value;
    }
    
    readFloat64(littleEndian)
    {
        let value = this.data.getFloat64(this.position, littleEndian);
        this.position += 8;
        return value;
    }
    
    readFloat32(littleEndian)
    {
        let value = this.data.getFloat32(this.position, littleEndian);
        this.position += 4;
        return value;
    }

    readUInt8()
    {
        let value = this.data.getUint8(this.position);
        this.position += 1;
        return value;
    }

    getUInt8(offset = 0)
    {
        return this.data.getUint8(this.position + offset);
    }

    getString(max_length)
    {
        for (var i = 0; i < max_length; i++)
        {
            if (!this.getUInt8(i))
            {
                break;
            }
        }

        return this.decoder.decode(new DataView(this.data.buffer, this.position, i));
    }
}
