import { DataViewReader } from "./DataViewReader.js";

const VERSION_3 = 0x03 // dBase III without memo file
const VERSION_3_MEMO = 0x83 // dBase III with memo file
const VERSION_4_MEMO = 0x8b // dBase IV with memo file
const VERSION_FOX_9 = 0x30 // Visual FoxPro 9 (may have memo file)
const VERSIONS = [VERSION_3, VERSION_3_MEMO, VERSION_4_MEMO, VERSION_FOX_9]

export class DBaseFile
{
    constructor(data)
    {
        let reader = new DataViewReader(data);
        let version = reader.readUInt8();
        let modification_year = reader.readUInt8(); // number of years after 1900
        let modification_month = reader.readUInt8(); // 1-based
        let modification_day = reader.readUInt8(); // 1-based
        //const dateOfLastUpdate = createDate(lastUpdateY + 1900, lastUpdateM, lastUpdateD);
        let row_count = reader.readInt32(true);
        let header_length = reader.readInt16(true);
        let record_length = reader.readInt16(true);

        if (VERSIONS.indexOf(version) == -1)
        {
            throw "Unknown version";
        }

        this.field_descriptors = DBaseFile._readFieldDescriptors(reader);
        this.rows = DBaseFile._readRows(reader, this.field_descriptors, row_count);
    }

    static _readRows(reader, field_descriptors, row_count)
    {
        let rows = [];

        for (let i = 0; i < row_count; i++)
        {
            let is_deleted = reader.readUInt8();
            let row = [];

            for (let j = 0; j < field_descriptors.length; j++)
            {
                let { type, length } = field_descriptors[j];

                switch (type)
                {
                    case 'C':
                        row[j] = reader.getString(length);
                        break;
                    case 'N':
                        row[j] = reader.getString(length).trim();
                        break;
                    case 'D':
                        row[j] = reader.getString(length);
                        break;
                    default:
                        debugger;
                }

                reader.position += length;
            }

            rows.push(row);
        }

        return rows;
    }

    static _readFieldDescriptors(reader)
    {
        let descriptors = [];
        reader.position = 32;

        while (reader.getUInt8() != 0x0D)
        {
            descriptors.push(DBaseFile._readFieldDescriptor(reader));
        }

        reader.position += 1;
        return descriptors;
    }
    
    static _readFieldDescriptor(reader)
    {
        let name = reader.getString(11);
        let type = String.fromCharCode(reader.getUInt8(11));
        let length = reader.getUInt8(16);
        reader.position += 32;
        return { name, type, length };
    }
}