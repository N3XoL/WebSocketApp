const stompClient = new StompJs.Client({
    brokerURL: 'ws://localhost:8080/websocket',
});

stompClient.onConnect = (frame) => {
    setConnected(true);
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
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
};

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
    const username = document.getElementById('name').value;
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
    p.style.overflowWrap = 'break-word';
    p.appendChild(document.createTextNode("(" + message.time + ")"
        + " " + message.from + ": " + message.text));
    response.appendChild(p);
}

function sendPrivateMessage() {
    const from = document.getElementById('name').value;
    const to = document.getElementById('recipient').value;
    const text = document.getElementById('privateText').value;

    stompClient.publish({
        destination: "/app/private-chat",
        body: JSON.stringify({'from':from, 'text':text, 'to':to}),
    })

    document.getElementById('privateText').value = '';
}

function sendPublicMessage() {
    const from = document.getElementById('name').value;
    const text = document.getElementById('text').value;

    stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify({'from':from, 'text':text}),
    });

    document.getElementById('text').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    disconnect()
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
    })
    document.getElementById('connect').addEventListener('click', (e) => {
        connect();
    })
    document.getElementById('disconnect').addEventListener('click', (e) => {
        disconnect();
    })
    document.getElementById('sendMessage').addEventListener('click', (e) => {
        sendPublicMessage();
    })
    document.getElementById('sendPrivateMessage').addEventListener('click', (e) => {
        sendPrivateMessage();
    })
    document.getElementById('text').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendPublicMessage();
        }
    })
})