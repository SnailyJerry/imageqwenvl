document.getElementById('submitBtn').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const prompt = document.getElementById('prompt').value;
    const files = document.getElementById('files').files;

    if (!apiKey || !prompt || files.length === 0) {
        alert('请填写所有字段并选择图片文件。');
        return;
    }

    // 将每个文件转换为Base64编码
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]); // 返回Base64部分
        reader.onerror = error => reject(error);
    });

    // API URL 变更为通义千问VL
    const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    // 遍历上传的所有文件
    const processImages = async () => {
        try {
            const images = [];
            for (let i = 0; i < files.length; i++) {
                const base64Image = await toBase64(files[i]);
                images.push({
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}` // Base64编码的图片数据
                    }
                });
            }

            // 构建请求体
            const body = {
                model: "qwen-vl-max-0809",  // 根据需要选择具体的模型
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },  // 加入用户的文本提示
                            ...images  // 添加图片数据
                        ]
                    }
                ],
                top_p: 0.8,  // 可选参数，影响模型输出多样性
                stream: true,  // 开启流式输出
                stream_options: { "include_usage": true }  // 包含使用情况
            };

            // 发送请求到通义千问VL API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`  // 使用用户输入的API Key
                },
                body: JSON.stringify(body)
            });

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                console.log(text);  // 处理流式数据
                alert(`API返回: ${text}`);
            }

        } catch (error) {
            console.error('错误:', error);
            alert('请求失败，请检查API密钥或网络连接。');
        }
    };

    // 调用图片处理函数
    processImages();
});
