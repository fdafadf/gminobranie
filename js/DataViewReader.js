export class DataViewReader
{
    /**
     * @param {DataView} data 
     */
    constructor(data)
    {
        this.position = 0;
        this.data = data;
        this.decoder = new TextDecoder("utf-8");
    }

    /**
     * @param {boolean} little_endian 
     * @returns 
     */
    readInt16(little_endian)
    {
        let value = this.data.getInt16(this.position, little_endian);
        this.position += 2;
        return value;
    }

    /**
     * @param {boolean} little_endian 
     * @returns 
     */
    readInt32(little_endian)
    {
        let value = this.data.getInt32(this.position, little_endian);
        this.position += 4;
        return value;
    }
    
    /**
     * @param {boolean} little_endian 
     * @returns 
     */
    readFloat64(little_endian)
    {
        let value = this.data.getFloat64(this.position, little_endian);
        this.position += 8;
        return value;
    }
    
    /**
     * @param {boolean} little_endian 
     * @returns 
     */
    readFloat32(little_endian)
    {
        let value = this.data.getFloat32(this.position, little_endian);
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

    /**
     * @param {number} max_length 
     * @returns 
     */
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
