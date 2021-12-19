import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";
import { Activity } from "./Activity.js";

export class ActivitiesYearCollection extends ActivitiesGroupCollection
{
    constructor() 
    {
        super('All', { id: 0 });
        /** @type {Map<number, ActivitiesYear>} */
        this.items = new Map();
    }

    /**
     * @param {number} year
     * @returns {ActivitiesYear}
     */
    get(year) 
    {
        return this.items.get(year);
    }

    /**
     * @param {ActivitiesYear} activities_year
     */
    add(activities_year) 
    {
        this.items.set(activities_year.entity.id, activities_year);
    }

    /**
     * @param {Activity} activity 
     */
    addActivity(activity)
    {
        this.activities.set(activity.entity.id, activity);
        this.items.get(activity.year)._add(activity);
    }

    /**
     * @param {string} community_name
     */
    findActivitiesInCommunity(community_name) 
    {
        /** @type {Activity[]} */
        let activities = [];

        for (let activity_year of this.items.values()) 
        {
            activities = activities.concat(activity_year.findActivitiesInCommunity(community_name));
        }

        return activities;
    }

    /**
     * @param {Map<string, boolean>} [communities] 
     * @returns 
     */
    findVisitedCommunities(communities)
    {
        communities = communities ?? new Map();

        for (let activity_year of this.items.values()) 
        {
            activity_year.findVisitedCommunities(communities)
        }

        return communities;
    }

    /**
     * @param {Activity} activity
     * @returns
     */
    removeActivity(activity) 
    {
        for (let item of this.items.values()) 
        {
            item._remove(activity);
        }
    }

    /**
     * @param {any} id
     * @returns
     */
    findActivity(id) 
    {
        for (let item of this.items.values()) 
        {
            let activity = item.activities.get(id);

            if (activity) 
            {
                return activity;
            }
        }
    }

    /**
     * @param {any} id
     * @returns
     */
    containsActivityId(id) 
    {
        for (let item of this.items.values()) 
        {
            if (item.containsActivityId(id)) 
            {
                return true;
            }
        }
    }
}
