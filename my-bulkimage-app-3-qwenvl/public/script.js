document.addEventListener('DOMContentLoaded', function() {

    let savedApiKey = '';
    let savedModel = 'qwen-vl-max';
    let savedDetail = 'auto';
    let savedMaxTokens = 300;

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
            console.log("API Key 已保存");
        } else {
            alert('请输入有效的 API Key');
        }
    });

    // 重新输入 API Key
    document.getElementById('reenterApiKey').addEventListener('click', function() {
        document.getElementById('apiKey').classList.remove('hidden');
        document.getElementById('saveApiKey').classList.remove('hidden');
        document.getElementById('apiKeyStatus').classList.add('hidden');
        document.getElementById('reenterApiKey').classList.add('hidden');
        console.log("重新输入 API Key");
    });

    // 保存系统设置
    document.getElementById('saveSettings').addEventListener('click', function() {
        savedModel = document.getElementById('modelSelect').value;
        savedDetail = document.getElementById('detailSelect').value;
        savedMaxTokens = document.getElementById('maxTokens').value;
        alert('系统设置已保存！');
        console.log("系统设置已保存", {
            model: savedModel,
            detail: savedDetail,
            maxTokens: savedMaxTokens
        });
    });

    // 提交按钮事件处理
    document.getElementById('submitBtn').addEventListener('click', async function() {
        const prompt = document.getElementById('prompt').value;
        const files = document.getElementById('files').files;
        const imageUrlsInput = document.getElementById('imageUrls').value.trim();

        // 更新 API URL 为你给出的 endpoint
        const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

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

        const sendRequest = async (formData, index, type) => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${savedApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.choices && data.choices.length > 0) {
                    const interpretation = data.choices[0].message.content;
                    handleApiResponse(index, type, interpretation);
                } else {
                    handleApiResponse(index, type, "未返回有效结果");
                }

                updateProgress();
            } catch (error) {
                console.error(`请求 ${type} ${index + 1} 出错:`, error);
                handleApiResponse(index, type, `错误: ${error.message}`);
                updateProgress();
            }
        };

        // 并发处理文件请求
        const processFiles = () => {
            return Array.from(files).map((file, index) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function () {
                        const base64Image = reader.result.split(',')[1];
                        const formData = {
                            model: savedModel,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { image: `data:image/jpeg;base64,${base64Image}` },
                                        { text: prompt }
                                    ]
                                }
                            ],
                            max_tokens: parseInt(savedMaxTokens),
                            detail: savedDetail
                        };
                        resolve(sendRequest(formData, index, '图片'));
                    };
                });
            });
        };

        // 并发处理URL请求
        const processUrls = () => {
            const imageUrls = imageUrlsInput.split(' ');
            return imageUrls.map((url, index) => {
                const formData = {
                    model: savedModel,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { image: url },
                                { text: prompt }
                            ]
                        }
                    ],
                    max_tokens: parseInt(savedMaxTokens),
                    detail: savedDetail
                };
                return sendRequest(formData, index, '图片链接');
            });
        };

        const filePromises = processFiles();
        const urlPromises = processUrls();

        // 并发处理所有请求
        await Promise.all([...filePromises, ...urlPromises]);

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

});
