const PROPERTY_ATHLETE = 'strava_athlete';
const PROPERTY_OAUTH = 'strava_oauth';

export class ConnectionManager
{
    constructor(base_path)
    {
        this.client_id = '75097';
        this.client_secret = '705655a2e206c7c42ab9a6fe9e60561568b807eb';
        this.redirect_uri = `${window.location.origin}${base_path}`;
        this.properties = {};
    }

    async checkAuthorizationRedirect()
    {
        let params = new URLSearchParams(window.location.search);

        if (params.has('code'))
        {
            if (new Date().getTime() - params.get('state') < 60000)
            {
                let code = params.get('code');
                await this.loadAccesToken(`https://www.strava.com/api/v3/oauth/token?client_id=${this.client_id}&client_secret=${this.client_secret}&code=${code}&grant_type=authorization_code`);
                await this.getAthlete();
            }
        }
    }

    get athlete()
    {
        return this.getPropertyWithStorage(PROPERTY_ATHLETE);
    }

    get is_connected()
    {
        return this.getPropertyWithStorage(PROPERTY_ATHLETE);
    }

    async connect()
    {
        if (!this.is_connected)
        {
            await this.getAthlete();
        }

        //this.authorize_response = {"token_type":"Bearer","expires_at":1638811516,"expires_in":21600,"refresh_token":"99c70051ac9e869ec7116eb598c6a6f09d7204dc","access_token":"5974257ed99b3d6f57dd8b38bfa2ba85b621cfdf","athlete":{"id":15198869,"username":null,"resource_state":2,"firstname":"Paweł","lastname":"S","bio":"","city":"Wrocław","state":"Lower Silesian Voivodeship","country":"Poland","sex":"M","premium":false,"summit":false,"created_at":"2016-05-15T15:02:05Z","updated_at":"2021-11-30T18:31:25Z","badge_type_id":0,"weight":89.0,"profile_medium":"https://d3nn82uaxijpm6.cloudfront.net/assets/avatar/athlete/medium-bee27e393b8559be0995b6573bcfde897d6af934dac8f392a6229295290e16dd.png","profile":"https://d3nn82uaxijpm6.cloudfront.net/assets/avatar/athlete/large-800a7033cc92b2a5548399e26b1ef42414dd1a9cb13b99454222d38d58fd28ef.png","friend":null,"follower":null}};
        //this.authorize_response.bearer = `Bearer ${this.authorize_response.access_token}`;
        //this.athlete = this.authorize_response.athlete;
        //this.onConnected();
    }

    disconnect()
    {
        this.setPropertyWithStorage(PROPERTY_ATHLETE, null);
    }

    clear()
    {
        this.setPropertyWithStorage(PROPERTY_ATHLETE, null);
        this.setPropertyWithStorage(PROPERTY_OAUTH, null);
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

    async getActivities()
    {
        return await this.fetchJson(`https://www.strava.com/api/v3/athlete/activities`);
    }

    async getActivityStreams(activity_id)
    {
        return await this.fetchJson(`https://www.strava.com/api/v3/activities/${activity_id}/streams?keys=latlng`);
    }

    async getRouteGpx(route_id)
    {
        return await this.fetchText(`https://www.strava.com/api/v3/routes/${route_id}/export_gpx`);
    }
    
    async getCode()
    {
        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}&response_type=code&approval_prompt=auto&scope=activity:read&state=${new Date().getTime()}`;
        throw 'Authorization Redirect';
    }

    async getAccessToken()
    {
        let oauth = this.getPropertyWithStorage(PROPERTY_OAUTH);

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
            let code = await this.getCode();
            oauth = await this.loadAccesToken(`https://www.strava.com/api/v3/oauth/token?client_id=${this.client_id}&client_secret=${this.client_secret}&code=${code}&grant_type=authorization_code`);
        }

        return oauth.bearer;
    }

    async loadAccesToken(url)
    {
        let response = await fetch(url, { method: 'POST' });

        if (response.status == 200)
        {
            let oauth = await response.json();
            oauth.bearer = `Bearer ${oauth.access_token}`;
            this.setPropertyWithStorage(PROPERTY_OAUTH, oauth);
            return oauth;
        }
        else
        {
            throw `Bad Request: https://www.strava.com/api/v3/oauth/token`;
        }
    }

    async fetchJson(url)
    {
        return await (await this.fetch(url)).json();
    }

    async fetchText(url)
    {
        return await (await this.fetch(url)).text();
    }

    async fetchProperty(name, url)
    {
        return this.getPropertyWithStorage(name) || this.setPropertyWithStorage(name, await this.fetchJson(url));
    }
    
    async fetch(url)
    {
        let access_token = await this.getAccessToken();
        let response = await fetch(url, { headers: { Authorization: access_token } });

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

    getPropertyWithStorage(name)
    {
        let value = this.properties[name];

        if (!value)
        {
            try { this.properties[name] = value = JSON.parse(localStorage.getItem(name)); } catch {}
        }

        return value;
    }
    
    setPropertyWithStorage(name, value)
    {
        localStorage.setItem(name, JSON.stringify(this.properties[name] = value));
        return value;
    }
}
