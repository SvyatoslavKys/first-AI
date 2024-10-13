const botResponses = {
    "привет": "Здравствуйте!",
    "как дела?": "У меня всё хорошо, спасибо!",
    "что ты можешь делать?": "Я могу отвечать на вопросы.",
    "пока": "До свидания!"
};

document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const userMessage = userInput.value;

    if (userMessage.trim() === "") return;

    displayMessage(userMessage, "user-message");
    userInput.value = "";

    const botResponse = getBotResponse(userMessage);
    displayMessage(botResponse, "bot-message");
}

function displayMessage(message, className) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getBotResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (botResponses[lowerCaseMessage]) {
        return botResponses[lowerCaseMessage];
    } else {
        const newResponse = prompt("Я не знаю ответа на этот вопрос. Как бы ты ответил?");
        if (newResponse) {
            botResponses[lowerCaseMessage] = newResponse;
            return "Спасибо! Я запомнил это.";
        }
        return "Извините, я не понимаю.";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    document.querySelector(".chat-container").classList.toggle("dark");
}
