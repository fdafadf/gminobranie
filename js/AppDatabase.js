import { Activity } from "./Activity.js";
import { ActivitiesYear } from "./ActivitiesYear.js";
import { Database } from "./Database.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";

export class AppDatabase extends Database
{
    constructor()
    {
        super(['Routes', 'Activities', 'ActivitiesYear', 'ActivityStreams']);
    }

    /**
     * @param {number} year 
     * @returns 
     */
    async getActivitiesYear(year)
    {
        let entity = await this.get('ActivitiesYear', year);
        return entity ? new ActivitiesYear(entity) : null;
    }

    async getActivities()
    {
        let activities = [];
        let entities = await this.items('Activities');

        for (let id in entities)
        {
            activities.push(new Activity(entities[id]))
        }

        return activities;
    }

    async getActivityStreams()
    {
        /** @type {import("./App.js").ActivityStreamsEntity[]} */
        let streams = [];
        let entities = await this.items('ActivityStreams');

        for (let id in entities)
        {
            streams.push(entities[id])
        }

        return streams;
    }

    /**
     * @param {Activity} activity 
     */
    async addActivity(activity)
    {
        await this.add('Activities', activity.entity);
    }

    /**
     * @param {Activity} activity 
     */
    async updateActivity(activity)
    {
        await this.update('Activities', activity.entity);
    }

    /**
     * @param {Activity} activity 
     */
    async removeActivity(activity)
    {
        await this.delete('Activities', activity.entity.id);
    }
    
    /**
     * @param {{ id: any, latlng: any }} activity_streams 
     */
    async addActivityStreams(activity_streams)
    {
        await this.add('ActivityStreams', activity_streams);
    }

    /**
     * @param {{ id: any, latlng: any }} activity_streams 
     */
    async removeActivityStreams(activity_streams)
    {
        await this.delete('ActivityStreams', activity_streams.id);
    }

    /**
     * @param {ActivitiesGroupCollection} activities_year 
     */
    async updateActivitiesYear(activities_year)
    {
        await this.update('ActivitiesYear', activities_year.entity);
    }
}