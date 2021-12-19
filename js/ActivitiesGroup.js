import { Activity } from "./Activity.js";

export class ActivityGroup 
{
    constructor() 
    {
        /** @type {Activity[]} */
        this.activities = [];
        this.new_activities_count = 0;
    }

    /**
     * @param {Activity} activity
     */
    add(activity) 
    {
        this.activities.push(activity);
        this.new_activities_count++;
    }

    /**
     * @param {Activity} activity
     */
    remove(activity) 
    {
        let index = this.activities.findIndex(a => a === activity);

        if (index > -1) 
        {
            this.activities.splice(index, 1);
        }
    }

    /**
     * @param {string} community_name
     */
    findActivitiesInCommunity(community_name) 
    {
        /** @type {Activity[]} */
        let activities = [];

        for (let activity of this.activities) 
        {
            if (activity.entity.visited_communities?.indexOf(community_name) > -1) 
            {
                if (activity.is_accepted)
                {
                    activities.push(activity);
                }
            }
        }

        return activities;
    }
}
