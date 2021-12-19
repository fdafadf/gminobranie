export class Activity
{
    /**
     * @param {import("./App").ActivityEntity} entity 
     */
    constructor(entity)
    {
        /** @type {import("./App").ActivityEntity} */
        this.entity = entity;
        /** @type {Date} */
        this.start_date = new Date(entity.start_date);
        /** @type {number} */
        this.year = this.start_date.getFullYear();
        /** @type {import("./App").ActivityStreamsEntity} */
        this.streams = null;
        this.selected = false;
    }

    get is_downloaded()
    {
        return this.streams != null || this.entity.error != null;
    }

    get is_accepted()
    {
        return this.streams != null && this.entity.error == null && this.entity?.type != 'VirtualRide';
    }
}