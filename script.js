const botResponses = {
    "привет": "Здравствуйте!",
    "как дела?": "У меня всё хорошо, спасибо!",
    "что ты можешь делать?": "Я могу отвечать на вопросы.",
    "пока": "До свидания!"
};

document.getElementById("send-button").addEventListener("click", sendMessage);

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const userMessage = userInput.value;

    if (userMessage.trim() === "") return;

    // Отображение пользовательского сообщения
    displayMessage(userMessage, "user-message");
    userInput.value = "";

    // Логика получения ответа от бота
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
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Проверка на существующий ответ
    if (botResponses[lowerCaseMessage]) {
        return botResponses[lowerCaseMessage];
    } else {
        // Если бот не знает ответа, предложим пользователю его ввести
        const newResponse = prompt("Я не знаю ответа на этот вопрос. Как бы ты ответил?");
        if (newResponse) {
            // Сохраняем новый вопрос и ответ
            botResponses[lowerCaseMessage] = newResponse;
            return "Спасибо! Я запомнил это.";
        }
        return "Извините, я не понимаю.";
    }
}
