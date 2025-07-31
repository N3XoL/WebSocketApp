let username = null;
let isPageActive = true;
let lastMessageFrom = null;

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

stompClient.onConnect = (frame) => {
    clearError()
    setConnected(true);
    console.log('Connected: ' + frame);

    stompClient.subscribe('/topic/messages', (message) => {
        showPublicMessage(JSON.parse(message.body));
    });

    stompClient.subscribe('/user/queue/private', (message) => {
        showPrivateMessage(JSON.parse(message.body));
    });

    stompClient.subscribe('/topic/active-users', (message) => {
        updateRecipientsList(JSON.parse(message.body));
    });

    stompClient.subscribe('/user/queue/private/invite', (message) => {
        handlePrivateChatInvite(message.body);
    });

    stompClient.subscribe('/user/queue/private/response', (message) => {
        handlePrivateChatResponse(JSON.parse(message.body));
    })

    //Initial active users list
    stompClient.publish({destination: '/app/active-users'});
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
    username = document.getElementById('name').value.trim();
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
    response.appendChild(p);
}

function showPrivateMessage(message) {
    const response = document.getElementById('privateResponse');
    const p = document.createElement('p');
    lastMessageFrom = message.from;

    p.style.overflowWrap = 'break-word';
    p.appendChild(document.createTextNode("(" + message.time + ")"
        + " " + message.from + ": " + message.text));
    response.appendChild(p);

    if (message.imageData) {
        const image = document.createElement('img');
        image.src = message.imageData;
        image.style.maxWidth = '200px';
        image.style.height = 'auto';
        image.style.marginTop = '5px';
        image.style.display = 'block';
        p.appendChild(image);
    }

    if (!isPageActive && message.from !== username) {
        showNotification(message)
    }
}

function sendPrivateMessage() {
    const from = document.getElementById('name').value;
    const to = document.getElementById('recipients').value;
    const text = document.getElementById('privateText').value;
    const imageInput = document.getElementById('imageInput');
    const imageFile = imageInput.files[0];
    let imageData = null;
    let fileName = null;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageData = e.target.result;
            fileName = imageFile.name;
            sendWithImage(from, text, to, imageData, fileName);
        };
        reader.readAsDataURL(imageFile);
    } else {
        sendWithImage(from, text, to, imageData, fileName);
    }

    document.getElementById('privateText').value = '';
    document.getElementById('imageInput').value = '';
}

function sendPublicMessage() {
    const from = document.getElementById('name').value;
    const text = document.getElementById('text').value;

    stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify({'from': from, 'text': text})
    });

    document.getElementById('text').value = '';
}

function sendWithImage(from, text, to, imageData, fileName) {
    stompClient.publish({
        destination: "/app/private",
        body: JSON.stringify({'from': from, 'text': text, 'to': to, 'imageData': imageData, 'fileName': fileName})
    });
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

function updateRecipientsList(activeUsers) {
    const recipientSelect = document.getElementById('recipients');
    const currentRecipient = recipientSelect.value;
    recipientSelect.innerHTML = `<option value=''></option>`;
    activeUsers.forEach(user => {
        if (user !== username) {
            const option = document.createElement('option');
            option.value = user;
            option.text = user;
            option.selected = (user === currentRecipient);
            recipientSelect.appendChild(option);
        }
    })
}

function sendPrivateChatInvite() {
    const to = document.getElementById('recipients').value;
    const recipientAlert = document.getElementById('recipientAlert');
    const connect = document.getElementById('privateChatConnect');
    const disconnect = document.getElementById('privateChatDisconnect');

    recipientAlert.style.display = 'block';

    if (!to) {
        recipientAlert.className = 'alert alert-danger'
        recipientAlert.textContent = 'Please select a recipient!';
    } else {
        recipientAlert.className = 'alert alert-info'
        recipientAlert.textContent = `Waiting for ${to} to accept an invite!`
        connect.disabled = true;
        disconnect.disabled = false;

        stompClient.publish({
            destination: "/app/private/invite",
            body: JSON.stringify({'from': username, 'to': to})
        })
    }
}

function handlePrivateChatInvite(inviteFrom) {
    const modal = document.getElementById('chatInvitationModal')
    const inviterName = document.getElementById('inviterName');
    const acceptInvite = document.getElementById('acceptInvitation');
    const declineInvite = document.getElementById('declineInvitation');
    const recipients = document.getElementById('recipients');

    const closeModal = () => {
        modal.style.display = 'none';
    }

    if (!isPageActive && inviteFrom.textContent !== username) {
        navigator.serviceWorker.ready.then(function (registration) {
            registration.showNotification(`From: ${inviteFrom}`, {
                body: 'Private chat invite!'
            });
        });
    }

    inviterName.textContent = inviteFrom;
    modal.style.display = 'block';

    acceptInvite.onclick = function () {
        recipients.value = inviterName.textContent;
        sendStatus("ACCEPT", inviterName.textContent);
        closeModal();
    }

    declineInvite.onclick = function () {
        sendStatus("DECLINE", inviterName.textContent);
        closeModal();
    }
}

function sendStatus(responseStatus, to) {
    stompClient.publish({
        destination: "/app/private/response",
        body: JSON.stringify({'from': username, 'to': to, 'status': responseStatus})
    })
}

function handlePrivateChatResponse(message) {
    const isReceiver = message.from !== username;
    switch (message.status) {
        case "ACCEPT": {
            activatePrivateChat();
            handleRecipientAlert(`You are chatting with ${isReceiver ? message.from : message.to}`, 'alert alert-success');
            break;
        }
        case "DECLINE": {
            deactivatePrivateChat();
            if (isReceiver) {
                handleRecipientAlert(`${message.from} declined your invite!`, 'alert alert-danger')
            }
            break;
        }
        case "DISCONNECT": {
            const modal = document.getElementById('chatInvitationModal')
            if (modal.style.display !== 'none') {
                deactivatePrivateChat();
                handleRecipientAlert(`Invitation was cancelled!`, 'alert alert-danger');
            } else {
                deactivatePrivateChat();
                handleRecipientAlert(`Disconnected!`, 'alert alert-danger');
            }
            break;
        }
        case "BUSY": {
            deactivatePrivateChat();
            handleRecipientAlert(`${message.to} is already in private chat!`, 'alert alert-danger');
            break;
        }
    }
}

function handleRecipientAlert(text, className) {
    const recipientAlert = document.getElementById('recipientAlert');
    recipientAlert.style.display = 'block';
    recipientAlert.textContent = text;
    recipientAlert.className = className;
}

function activatePrivateChat() {
    const imageInput = document.getElementById('imageInput');
    const privateText = document.getElementById('privateText');
    const sendPrivateMessage = document.getElementById('sendPrivateMessage');
    const recipientAlert = document.getElementById('recipientAlert');
    const connect = document.getElementById('privateChatConnect');
    const disconnect = document.getElementById('privateChatDisconnect');

    imageInput.style.display = 'block';
    privateText.style.display = 'block';
    sendPrivateMessage.style.display = 'block';
    recipientAlert.style.display = 'block';
    connect.disabled = true;
    disconnect.disabled = false;
}

function deactivatePrivateChat() {
    const imageInput = document.getElementById('imageInput');
    const privateText = document.getElementById('privateText');
    const sendPrivateMessage = document.getElementById('sendPrivateMessage');
    const recipientAlert = document.getElementById('recipientAlert');
    const connect = document.getElementById('privateChatConnect');
    const disconnect = document.getElementById('privateChatDisconnect');
    const recipients = document.getElementById('recipients');
    const privateChat = document.getElementById('privateResponse');

    imageInput.style.display = 'none';
    privateText.style.display = 'none';
    sendPrivateMessage.style.display = 'none';
    recipientAlert.style.display = 'none';
    recipientAlert.className = 'alert alert-info';
    recipientAlert.textContent = '';
    recipients.value = '';
    privateChat.innerHTML = '';
    connect.disabled = false;
    disconnect.disabled = true;
}

function sendDisconnectStatus() {
    const recipient = document.getElementById('recipients').value;
    sendStatus("DISCONNECT", recipient);
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
        sendDisconnectStatus()
        deactivatePrivateChat();
        disconnect();
    })
    document.getElementById('sendPublicMessage').addEventListener('click', () => {
        sendPublicMessage();
    })
    document.getElementById('sendPrivateMessage').addEventListener('click', () => {
        sendPrivateMessage();
    })
    document.getElementById('privateChatConnect').addEventListener('click', () => {
        sendPrivateChatInvite();
    })
    document.getElementById('privateChatDisconnect').addEventListener('click', () => {
        sendDisconnectStatus();
        deactivatePrivateChat();
    })
    document.addEventListener('visibilitychange', () => {
        isPageActive = !document.hidden
    })
    document.getElementById('recipients').addEventListener('change', (e) => {
        if (e.target.value !== lastMessageFrom) {
            document.getElementById('privateResponse').innerHTML = '';
        }
    })
})
