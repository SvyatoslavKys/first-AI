document.getElementById("send-button").addEventListener("click", sendMessage);

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const userMessage = userInput.value;

    if (userMessage.trim() === "") return;

    // Отображение пользовательского сообщения
    displayMessage(userMessage, "user-message");
    userInput.value = "";

    // Здесь можно добавить логику для обработки ответа ИИ
    const botResponse = getBotResponse(userMessage);
    displayMessage(botResponse, "bot-message");
}

function displayMessage(message, className) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Прокрутка вниз
}

function getBotResponse(userMessage) {
    // Простейшая логика ответов ИИ
    const responses = {
        "привет": "Здравствуйте!",
        "как дела?": "У меня всё хорошо, спасибо!",
        "что ты можешь делать?": "Я могу отвечать на вопросы.",
        "пока": "До свидания!"
    };

    return responses[userMessage.toLowerCase()] || "Извините, я не понимаю.";
}
