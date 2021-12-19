import { ActivityGroup } from "./ActivitiesGroup.js";
import { Activity } from "./Activity.js";

export class ActivitiesGroupCollection 
{
    /**
     * @param {string} title
     * @param {import("./App").ActivitiesYearEntity} entity
     */
    constructor(title, entity) 
    {
        this.title = title;
        /** @type {import("./App").ActivitiesYearEntity} */
        this.entity = entity;
        /** @type {Map<string, ActivityGroup>} */
        this.groups = new Map();
        this.groups.set('gpx', new ActivityGroup());
        this.groups.set('strava', new ActivityGroup());
        /** @type {Map<any, Activity>} */
        this.activities = new Map();
    }

    /**
     * @param {string} community_name
     * @returns {Activity[]}
     */
    findActivitiesInCommunity(community_name)
    {
        return [];
    }

    /**
     * @param {Map<string, boolean>} [communities] 
     * @returns {Map<string, boolean>}
     */
    findVisitedCommunities(communities)
    {
        return communities;
    }
}
