(function () {
    const HOST = location.origin.replace(/^http/, 'ws'),
        WS = new WebSocket(HOST);

    let userID;

    (function WebSocketHandler() {
        let keepAlive;

        WS.onopen = () => {
            WS.send('{"type": "joining"}');

            keepAlive = setInterval(() => {
                WS.send('{"type": "ping"}');
            }, 30000);
        }

        WS.onmessage = (event) => {
            let parsedMessage = null;

            try {
                parsedMessage = JSON.parse(event.data);
            } catch {
                console.error("Invalid Message - Unparsable JSON", event.data);
            }

            if (parsedMessage != null) {
                actions.executeMessage(parsedMessage);
            }
        };

        WS.onclose = () => {
            clearInterval(keepAlive);
        };
    })();

    let DOMHandler = (function () {
        function writeMessage(message) {
            if (message.userID == userID) {
                htmlElement = `
                        <div class="flex w-full mt-2 gap-3 max-w-xs ml-auto justify-end">
                        <div>
                          <div class="bg-indigo-600 text-white p-3 rounded-l-lg rounded-br-lg text-sm">
                            <p>${message.message}</p>
                          </div>
                          <span class="text-xs text-gray-400 leading-none">${message.dateTime}</span>
                        </div>
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-200"></div>
                      </div>
                      `;
            }
            else {
                htmlElement = `
                        <div class="flex w-full mt-2 gap-3 max-w-xs">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                        <div>
                          <div class="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg text-sm flex flex-col gap-1">
                            <p class="font-semibold text-xs">${message.userName}</p>
                            <p>${message.message}</p>
                          </div>
                          <span class="text-xs text-gray-400 leading-none">${message.dateTime}</span>
                        </div>
                      </div>
                      `;
            }

            elements.messageLog.insertAdjacentHTML('beforeend', htmlElement);
            elements.messageLog.scrollTo(0, elements.messageLog.scrollHeight);
        }

        return {
            writeMessage: writeMessage
        };
    })();

    let actions = (function () {
        function saveSettings() {
            username = elements.username.value;

            if (username == "") {
                username = "Anonymous";
            }

            settingsModal.open = false;
            message.focus();
        }

        function sendMessage() {
            if (elements.message.value.length || false) {
                WS.send(`{
                "type": "message",
                  "data": {
                    "userID": "${userID}",
                    "userName": "${username}",
                    "message": "${elements.message.value}",
                    "dateTime": "${new Date().toLocaleTimeString()}"
                  }
                }`);

                elements.message.value = "";
                elements.message.focus();
            }
        }

        function executeMessage(message) {
            let type = message.type || null,
                data = message.data || null;

            console.log(`${new Date().toLocaleString()} - New Message Received: ${JSON.stringify(message)}`);

            switch (type) {
                case 'joined':
                    userID = data.userID;
                    break;
                case 'message':
                    DOMHandler.writeMessage(data);
                    break;
                case 'pong':
                    break;
                default:
                    console.log("NOT IMPLEMENTED");
                    break;
            }
        }

        return {
            executeMessage: executeMessage,
            saveSettings: saveSettings,
            sendMessage: sendMessage,
        };
    })();

    (function init() {
        function _setupElements() {
            elements = {
                settingsModal: document.getElementById("settingsModal"),
                openSettings: document.getElementById("openSettings"),
                saveSettings: document.getElementById("saveSettings"),
                sendMessage: document.getElementById("sendMessage"),
                messageLog: document.getElementById("messageLog"),
                username: document.getElementById("username"),
                message: document.getElementById("message")
            };
        }

        function _bindEvents() {
            elements.saveSettings.addEventListener("click", (event) => {
                actions.saveSettings();
            });

            elements.sendMessage.addEventListener("click", () => {
                actions.sendMessage();
            });

            elements.openSettings.addEventListener("click", () => {
                elements.settingsModal.open = true;
            });

            document.addEventListener("keydown", (event) => {
                if (event.key == "Enter") {
                    if (settingsModal.open == true) {
                        actions.saveSettings();
                    } else {
                        actions.sendMessage();
                    }
                }
            });
        }

        _setupElements();
        _bindEvents();
    })();
})();
