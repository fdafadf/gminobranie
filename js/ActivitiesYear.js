import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";
import { Activity } from "./Activity.js";

export class ActivitiesYear extends ActivitiesGroupCollection
{
    /**
     * @param {import("./App").ActivitiesYearEntity} entity 
     * */
    constructor(entity) 
    {
        super(entity.id.toString(), entity);
    }

    /**
     * @param {Activity} activity
     */
    _add(activity) 
    {
        this.activities.set(activity.entity.id, activity);
        this.groups.get(activity.entity.source).add(activity);
    }

    /**
     * @param {Activity} activity
     */
    _remove(activity) 
    {
        this.activities.delete(activity.entity.id);
        this.groups.get(activity.entity.source).remove(activity);
    }

    /**
     * @param {any} id
     * @returns
     */
    containsActivityId(id) 
    {
        return this.activities.has(id);
    }

    /**
     * @param {string} community_name
     */
    findActivitiesInCommunity(community_name) 
    {
        /** @type {Activity[]} */
        let activities = [];

        for (let group of this.groups.values()) 
        {
            activities = activities.concat(group.findActivitiesInCommunity(community_name));
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

        for (let activity of this.activities.values()) 
        {
            if (activity.is_accepted)
            {
                activity.entity.visited_communities?.forEach(community => communities.set(community, true));
            }
        }

        return communities;
    }

    calculateCommunitiesVisitCount() 
    {
        return this.findVisitedCommunities().size;
    }
}
