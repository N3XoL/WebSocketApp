if (!("Notification" in window)) {
    console.error("Przeglądarka nie wspiera powiadomień.");
} else if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
            console.warn("User didnt granted permission");
        }
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(function (registration) {
            console.log('Service worker registered with scope:', registration.scope);
        })
        .catch(function (error) {
            console.error('Registration of service worker failed:', error);
        });
}

const stompClient = new StompJs.Client({
    brokerURL: getCurrentHost(),
});

let username = null;
let isPageActive = true;

stompClient.onConnect = (frame) => {
    setConnected(true);
    clearError()
    console.log('Connected: ' + frame);
    stompClient.subscribe('/topic/messages', (message) => {
        showPublicMessage(JSON.parse(message.body));
    });
    stompClient.subscribe('/user/topic/private-message', (message) => {
        showPrivateMessage(JSON.parse(message.body));
    })
};

stompClient.onWebSocketError = (error) => {
    console.error('Error with websocket', error);
};

stompClient.onStompError = (frame) => {
    const frameBody = frame.body;
    const frameMessage = frame.headers['message'];

    console.error('Broker reported error: ' + frameMessage);
    console.error('Additional details: ' + frameBody);

    if (frameMessage.includes('Username is required!')) {
        showError(frameMessage);
    } else if (frameMessage.includes('Username is taken!')) {
        showError(frameMessage);
    }
    disconnect()
};

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
}

function setConnected(connected) {
    document.getElementById('connect').disabled = connected;
    document.getElementById('disconnect').disabled = !connected;
    document.getElementById('conversationDiv').style.visibility
        = connected ? 'visible' : 'hidden';
    document.getElementById('name').disabled = connected;
    document.getElementById('response').innerHTML = '';
    document.getElementById('privateConversationDiv').style.visibility
        = connected ? 'visible' : 'hidden';
}

function connect() {
    username = document.getElementById('name').value;
    stompClient.connectHeaders = {
        'username': username
    };
    stompClient.activate();
}

function disconnect() {
    stompClient.deactivate();
    setConnected(false);
    console.log("Disconnected");
}

function showPublicMessage(message) {
    const response = document.getElementById('response');
    const p = document.createElement('p');
    p.style.overflowWrap = 'break-word';
    p.appendChild(document.createTextNode("(" + message.time + ")"
        + " " + message.from + ": " + message.text));

    if (message.imageData) {
        const image = document.createElement('img');
        image.src = message.imageData;
        image.style.maxWidth = '200px';
        image.style.height = 'auto';
        image.style.marginTop = '5px';
        image.style.display = 'block';
        p.appendChild(image);
    }

    response.appendChild(p);
}

function showPrivateMessage(message) {
    const response = document.getElementById('privateResponse');
    const p = document.createElement('p');
    p.style.overflowWrap = 'break-word';
    p.appendChild(document.createTextNode("(" + message.time + ")"
        + " " + message.from + ": " + message.text));
    response.appendChild(p);

    if (!isPageActive && message.from !== username) {
        showNotification(message)
    }
}

function sendPrivateMessage() {
    const from = document.getElementById('name').value;
    const to = document.getElementById('recipient').value;
    const text = document.getElementById('privateText').value;

    stompClient.publish({
        destination: "/app/private-chat",
        body: JSON.stringify({'from': from, 'text': text, 'to': to}),
    })

    document.getElementById('privateText').value = '';
}

function sendPublicMessage() {
    const from = document.getElementById('name').value;
    const text = document.getElementById('text').value;
    const imageInput = document.getElementById('imageInput');
    const imageFile = imageInput.files[0];
    let imageData = null;
    let fileName = null;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageData = e.target.result;
            fileName = imageFile.name;
            sendMessageWithImage(from, text, imageData, fileName);
        };
        reader.readAsDataURL(imageFile);
    } else {
        sendMessageWithImage(from, text, null, null);
    }

    document.getElementById('text').value = '';
    document.getElementById('imageInput').value = '';
}

function sendMessageWithImage(from, text, imageData, fileName) {
    stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify({'from': from, 'text': text, 'imageData': imageData, 'fileName': fileName}),
    })
}

function getCurrentHost() {
    const ngrokUrl = window.location.hostname;

    if (ngrokUrl.includes('ngrok')) {
        return `wss://${ngrokUrl}/websocket`;
    }
    return `ws://${window.location.host}/websocket`
}

function showNotification(message) {
    navigator.serviceWorker.ready.then(function (registration) {
        registration.showNotification(`From: ${message.from}`, {
            body: message.text
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    disconnect()
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
    })
    document.getElementById('connect').addEventListener('click', () => {
        connect();
    })
    document.getElementById('disconnect').addEventListener('click', () => {
        disconnect();
    })
    document.getElementById('sendMessage').addEventListener('click', () => {
        sendPublicMessage();
    })
    document.getElementById('sendPrivateMessage').addEventListener('click', () => {
        sendPrivateMessage();
    })
    document.getElementById('text').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendPublicMessage();
        }
    })
})
document.addEventListener('visibilitychange', () => {
    isPageActive = !document.hidden
})