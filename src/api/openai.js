// src/api.js
export let openaiApiKey = localStorage.getItem('openai_apikey') || '';

export function setApiKey(key) {
    openaiApiKey = key;
    localStorage.setItem('openai_apikey', key);
}

export async function fetchModels(selectedModel, modelSelect) {
    if (!openaiApiKey) return;
    try {
        const res = await fetch("https://api.openai.com/v1/models", {
            headers: {
                "Authorization": "Bearer " + openaiApiKey
            }
        });
        if (!res.ok) return;
        const data = await res.json();
        const models = data.data.map(m => m.id).filter(id => id.startsWith("gpt-"));
        const uniqueModels = [...new Set(models)].sort();
        modelSelect.innerHTML = "";
        uniqueModels.forEach(id => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = id;
            modelSelect.appendChild(opt);
        });
        if (uniqueModels.includes(selectedModel)) {
            modelSelect.value = selectedModel;
        } else {
            selectedModel = modelSelect.value;
        }
    } catch (e) {
        // Ignore errors
    }
}

export async function fetchChatCompletion(selectedModel, messages) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + openaiApiKey
        },
        body: JSON.stringify({
            model: selectedModel,
            messages: messages,
            max_tokens: 512,
            temperature: 0.7
        })
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}