const socket = io();

const $form = document.querySelector('.chat');
const $inputForm = $form.querySelector('.message')
const $btnForm = $form.querySelector('.send-btn')
const $locationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');


// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height if the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

$form.addEventListener('submit', (e) => {
    e.preventDefault();

    if(!$inputForm.value) return;

    $btnForm.setAttribute('disabled', 'disabled');

    const message = $inputForm.value;
    socket.emit('sendMessage', message, (error) => {
        if(error) {
            return console.log(error)
        }

        $btnForm.removeAttribute('disabled');
        $inputForm.value = '';
        $inputForm.focus();
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    $locationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        socket.emit('sendLocation', { latitude, longitude  }, () => {
            $locationBtn.removeAttribute('disabled')
        })
    })
});

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})
