// src/chat.js
import { fetchChatCompletion } from './api/openai.js';

export let chatHistory = [
    {
        role: "system",
        content: "You are Rhymr, an AI assistant built into a songwriting IDE. Your goal is to help users elevate their songwriting techniques by giving constructive feedback, creative suggestions, and answering questions about lyrics, rhyme, structure, and style. Always be supportive, insightful, and focused on helping the user improve their craft."
    }
];

export function addUserMessage(msg, chatMessages, renderMarkdown) {
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-message user';
    userDiv.innerHTML = renderMarkdown(msg);
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function addBotMessage(text, chatMessages, renderMarkdown, isError = false) {
    const botDiv = document.createElement('div');
    botDiv.className = isError ? 'chat-message error' : 'chat-message bot';
    botDiv.innerHTML = renderMarkdown ? renderMarkdown(text) : text;
    chatMessages.appendChild(botDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return botDiv;
}

export async function handleChatSubmit({
    msg,
    chatMessages,
    renderMarkdown,
    latestEditorContent,
    selectedModel
}) {
    let contextMsg = null;
    if (latestEditorContent && latestEditorContent.trim().length > 0) {
        contextMsg = {
            role: "system",
            content: "The following is the current song being written by the user in the editor:\n\n" + latestEditorContent
        };
    }
    let messages = [chatHistory[0]];
    if (contextMsg) messages.push(contextMsg);
    messages = messages.concat(chatHistory.filter(m => m.role !== "system"));
    messages.push({role: "user", content: msg});
    const botDiv = addBotMessage('...', chatMessages);
    try {
        const data = await fetchChatCompletion(selectedModel, messages);
        const reply = data.choices?.[0]?.message?.content?.trim() || "No response.";
        botDiv.innerHTML = renderMarkdown(reply);
        botDiv.className = 'chat-message bot';
        chatHistory.push({role: "user", content: msg});
        chatHistory.push({role: "assistant", content: reply});
    } catch (err) {
        botDiv.textContent = "Error: " + err.message;
        botDiv.className = 'chat-message error';
    }
}