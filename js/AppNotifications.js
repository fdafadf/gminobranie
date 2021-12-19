
export class AppNotifications
{
    constructor()
    {
        this.element = document.querySelector('#notifications');
        /** @type {HTMLElement} */
        this.element_counter = this.element.querySelector('.counter');
        /** @type {HTMLElement} */
        this.element_notification_container = this.element.querySelector('.notification');
        /** @type {HTMLElement} */
        this.element_notification_label = this.element.querySelector('.notification > div');
        /** @type {HTMLElement} */
        this.element_button = this.element.querySelector('.button');
        this.element_button.addEventListener('click', this._onClick.bind(this));
        /** @type {HTMLAudioElement} */
        this.element_audio_postman = document.querySelector('audio#audio-postman');
    }

    /**
     * @param {string} message 
     */
    async add(message)
    {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.element_counter.innerText = '1';
        this.element_audio_postman.play();
        this.element_notification_label.innerText = message;
        this.element_notification_container.classList.remove('hidden');
        await new Promise(resolve => setTimeout(resolve, 8000));
        this.element_notification_container.classList.add('hidden');
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.element_counter.innerText = '0';
    }

    async _onClick()
    {
        // @ts-ignore
        this.element_audio_postman.cloneNode().play();
    }
} 
