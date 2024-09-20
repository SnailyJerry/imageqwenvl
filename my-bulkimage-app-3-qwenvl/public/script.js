let savedApiKey = '';
let savedModel = 'qwen-vl-max';
let savedDetail = 'auto';
let savedMaxTokens = 300;

// 处理系统设置按钮的显示与隐藏
document.getElementById('systemSettingsBtn').addEventListener('click', function() {
    const systemSettingsPanel = document.getElementById('systemSettingsPanel');
    systemSettingsPanel.classList.toggle('hidden'); // 使用 class 来控制显示和隐藏
});

// 保存 API Key
document.getElementById('saveApiKey').addEventListener('click', function() {
    const apiKeyInput = document.getElementById('apiKey');
    savedApiKey = apiKeyInput.value;
    if (savedApiKey) {
        apiKeyInput.value = '';
        apiKeyInput.classList.add('hidden');
        document.getElementById('saveApiKey').classList.add('hidden');
        document.getElementById('apiKeyStatus').classList.remove('hidden');
        document.getElementById('reenterApiKey').classList.remove('hidden');
    }
});

// 重新输入 API Key
document.getElementById('reenterApiKey').addEventListener('click', function() {
    document.getElementById('apiKey').classList.remove('hidden');
    document.getElementById('saveApiKey').classList.remove('hidden');
    document.getElementById('apiKeyStatus').classList.add('hidden');
    document.getElementById('reenterApiKey').classList.add('hidden');
});

// 保存系统设置
document.getElementById('saveSettings').addEventListener('click', function() {
    savedModel = document.getElementById('modelSelect').value;
    savedDetail = document.getElementById('detailSelect').value;
    savedMaxTokens = document.getElementById('maxTokens').value;
    alert('系统设置已保存！');
});

// 提交按钮事件处理
document.getElementById('submitBtn').addEventListener('click', function() {
    const prompt = document.getElementById('prompt').value;
    const files = document.getElementById('files').files;
    const imageUrlsInput = document.getElementById('imageUrls').value.trim();

    const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/vision/image-chat/chat-completion';

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';

    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.classList.remove('hidden');
    progressBar.value = 0;

    let totalTasks = files.length + (imageUrlsInput ? imageUrlsInput.split(' ').length : 0);
    let completedTasks = 0;

    const updateProgress = () => {
        completedTasks++;
        let progressPercentage = (completedTasks / totalTasks) * 100;
        progressBar.value = progressPercentage;
        if (completedTasks === totalTasks) {
            document.getElementById('progressText').textContent = '处理完成！';
            progressContainer.classList.add('hidden');
        }
    };

    const handleApiResponse = (index, type, interpretation) => {
        const resultElement = document.createElement('p');
        resultElement.textContent = `${type} ${index + 1} 结果: ${interpretation}`;
        resultContainer.appendChild(resultElement);
    };

    const sendRequest = (formData, index, type) => {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${savedApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.output && data.output.choices && data.output.choices.length > 0) {
                const interpretation = data.output.choices[0].message.content[0].text;
                handleApiResponse(index, type, interpretation);
            } else {
                handleApiResponse(index, type, "未返回有效结果");
            }
            updateProgress();
        })
        .catch(error => {
            console.error(`请求 ${type} ${index + 1} 出错:`, error);
            handleApiResponse(index, type, `错误: ${error.message}`);
            updateProgress();
        });
    };

    const processFiles = () => {
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.readAsDataURL(files[i]);
            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];
                const formData = {
                    model: savedModel,
                    input: {
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { image: `data:image/jpeg;base64,${base64Image}` },
                                    { text: prompt }
                                ]
                            }
                        ]
                    },
                    parameters: {
                        result_format: "message",
                        max_tokens: parseInt(savedMaxTokens),
                        detail: savedDetail
                    }
                };
                sendRequest(formData, i, '图片');
            };
        }
    };

    const processUrls = () => {
        const imageUrls = imageUrlsInput.split(' ');
        for (let j = 0; j < imageUrls.length; j++) {
            const formData = {
                model: savedModel,
                input: {
                    messages: [
                        {
                            role: "user",
                            content: [
                                { image: imageUrls[j] },
                                { text: prompt }
                            ]
                        }
                    ]
                },
                parameters: {
                    result_format: "message",
                    max_tokens: parseInt(savedMaxTokens),
                    detail: savedDetail
                }
            };
            sendRequest(formData, j, '图片链接');
        }
    };

    if (files.length > 0) {
        processFiles();
    }
    if (imageUrlsInput) {
        processUrls();
    }

    if (files.length === 0 && !imageUrlsInput) {
        alert('请上传文件或输入图片 URL');
        progressContainer.classList.add('hidden');
    }
});

// 一键复制结果
document.getElementById('copyResultsBtn').addEventListener('click', function() {
    const resultsText = document.getElementById('resultContainer').textContent;
    navigator.clipboard.writeText(resultsText)
        .then(() => alert('所有结果已复制！'))
        .catch(err => console.error('复制失败: ', err));
});
