const CONTROL_CONTENT_TEMPLATE = `
<table>
    <tr>
        <th><img src="images/strava.png" style="margin: -0.5em; width: 2em;" /></th>
        <td class="button action disconnected strava-connect-button">
            <div>
                <div>Connect</div>
                <div class="user-name"></div>
                <div>Disconnect</div>
            </div>
        </td>
    </tr>
</table>
`
export class StravaConnectButton
{
    constructor()
    {
        this.element = document.createElement('div');
        this.element.classList.add('table-container');
        this.element.innerHTML = CONTROL_CONTENT_TEMPLATE;
        this.element_button = this.element.querySelector('.strava-connect-button');
        /** @type {HTMLElement} */
        this.element_user_name = this.element.querySelector('.user-name');
    }
    
    get user_name()
    {
        return this.element_user_name.innerText;
    }

    set user_name(value)
    {
        if (value)
        {
            this.element_button.classList.add('connected');
            this.element_button.classList.remove('disconnected');
        }
        else
        {
            this.element_button.classList.add('disconnected');
            this.element_button.classList.remove('connected');
        }
        
        this.element_user_name.innerText = value ?? '';
    }
}