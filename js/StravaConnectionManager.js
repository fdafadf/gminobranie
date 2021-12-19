const PROPERTY_ATHLETE = 'strava_athlete';
const PROPERTY_OAUTH = 'strava_oauth';

export class StravaConnectionManager
{
    /**
     * @param {string} base_path 
     */
    constructor(base_path)
    {
        this.client_id = '75097';
        this.client_secret = '705655a2e206c7c42ab9a6fe9e60561568b807eb';
        this.redirect_uri = `${window.location.origin}${base_path}`;
        /** @type {Object.<string, *>} */
        this.properties = {};
    }

    async checkAuthorizationRedirect()
    {
        let params = new URLSearchParams(window.location.search);

        if (params.has('code') && params.has('state'))
        {
            let code = params.get('code');
            let state = params.get('state');

            if (state == localStorage.getItem('last_oauth_state'))
            {
                localStorage.removeItem('last_oauth_state');
                await this.loadAccesToken(`https://www.strava.com/api/v3/oauth/token?client_id=${this.client_id}&client_secret=${this.client_secret}&code=${code}&grant_type=authorization_code`);
                await this.getAthlete();
            }
        }
    }

    get athlete()
    {
        return this.getStoragedProperty(PROPERTY_ATHLETE);
    }

    get is_connected()
    {
        return this.getStoragedProperty(PROPERTY_ATHLETE);
    }

    async connect()
    {
        if (!this.is_connected)
        {
            await this.getAthlete();
        }
    }

    disconnect()
    {
        this.setStoragedProperty(PROPERTY_ATHLETE, null);
    }

    clear()
    {
        this.setStoragedProperty(PROPERTY_ATHLETE, null);
        this.setStoragedProperty(PROPERTY_OAUTH, null);
    }

    async getAthlete()
    {
        return this.fetchProperty(PROPERTY_ATHLETE, 'https://www.strava.com/api/v3/athlete');
    }

    async getRoutes(page = 1, per_page = 5)
    {
        let athlete = await this.getAthlete();
        return await this.fetchJson(`https://www.strava.com/api/v3/athletes/${athlete.id}/routes?page=${page}&per_page=${per_page}`);
    }

    /**
     * @param {Object.<string, any>} query 
     * @returns {Promise<import("./App").ActivityEntity[]>}
     */
    async getActivities(query)
    {
        return await this.fetchJson(`https://www.strava.com/api/v3/athlete/activities`, query);
    }

    /**
     * @param {string|number} activity_id 
     * @returns {Promise<{ type: 'latlng' | 'distance', data: number[][] }[]>}
     */
    async getActivityStreams(activity_id)
    {
        return await this.fetchJson(`https://www.strava.com/api/v3/activities/${activity_id}/streams`, { keys: 'latlng' });
    }

    /**
     * @param {string|number} route_id 
     * @returns 
     */
    async getRouteGpx(route_id)
    {
        return await this.fetchText(`https://www.strava.com/api/v3/routes/${route_id}/export_gpx`);
    }

    async getAccessToken()
    {
        let oauth = this.getStoragedProperty(PROPERTY_OAUTH);

        if (oauth)
        {
            let is_expired = new Date().getTime() > oauth.expires_at * 1000;
    
            if (is_expired)
            {
                oauth = await this.loadAccesToken(`https://www.strava.com/api/v3/oauth/token?client_id=${this.client_id}&client_secret=${this.client_secret}&grant_type=refresh_token&refresh_token=${oauth.refresh_token}`);
            }
        }
        else
        {
            let last_oauth_state = new Date().getTime();
            localStorage.setItem('last_oauth_state', `${last_oauth_state}`);
            window.location.href = `https://www.strava.com/oauth/authorize?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}&response_type=code&approval_prompt=auto&scope=activity:read&state=${last_oauth_state}`;
            throw 'Authorization Redirect';
        }

        return oauth.bearer;
    }

    /**
     * @param {string} url 
     * @returns 
     */
    async loadAccesToken(url)
    {
        let response = await fetch(url, { method: 'POST' });

        if (response.status == 200)
        {
            let oauth = await response.json();
            oauth.bearer = `Bearer ${oauth.access_token}`;
            this.setStoragedProperty(PROPERTY_OAUTH, oauth);
            return oauth;
        }
        else
        {
            throw `Bad Request: https://www.strava.com/api/v3/oauth/token`;
        }
    }

    /**
     * @param {string} url 
     * @param {Object.<string, string>} [query]
     * @returns 
     */
    async fetchJson(url, query)
    {
        return await (await this.fetch(url, query)).json();
    }

    /**
     * @param {string} url 
     * @returns 
     */
    async fetchText(url)
    {
        return await (await this.fetch(url)).text();
    }

    /**
     * @param {string} name 
     * @param {string} url 
     * @returns 
     */
    async fetchProperty(name, url)
    {
        return this.getStoragedProperty(name) || this.setStoragedProperty(name, await this.fetchJson(url));
    }
    
    /**
     * @param {string} url 
     * @param {Object.<string, string>} [query]
     * @returns 
     */
    async fetch(url, query)
    {
        // @ts-ignore
        let url_arguments = query ? Object.entries(query).map(q => q[0] + '=' + q[1]).join('&') : undefined;
        let url_with_arguments = url + (query ? `?${url_arguments}` : ''); 
        let access_token = await this.getAccessToken();
        let response = await fetch(url_with_arguments, { headers: { Authorization: access_token } });

        switch (response.status)
        {
            case 200:
                return response;
            case 401:
                //await this.refreshToken();
                throw '401';
            default:
                throw `Bad request: ${response.status}`;
        }
    }

    /**
     * @param {string} name 
     * @returns 
     */
    getStoragedProperty(name)
    {
        let value = this.properties[name];

        if (!value)
        {
            try { this.properties[name] = value = JSON.parse(localStorage.getItem(name)); } catch {}
        }

        return value;
    }
    
    /**
     * 
     * @param {string} name 
     * @param {*} value 
     * @returns 
     */
    setStoragedProperty(name, value)
    {
        localStorage.setItem(name, JSON.stringify(this.properties[name] = value));
        return value;
    }
}
