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
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
  });

  // API URL 变更为通义千问VL
  const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  // 遍历上传的所有文件
  const processImages = async () => {
      for (let i = 0; i < files.length; i++) {
          try {
              // 将图片转换为Base64
              const base64Image = await toBase64(files[i]);
              
              // 构建请求体
              const body = {
                  model: "qwen-vl-max-0809",  // 可根据需要选择具体的模型
                  messages: [
                      {
                          role: "user",
                          content: [
                              {
                                  type: "image_url",
                                  image_url: {
                                      url: base64Image  // 将Base64图片数据放入
                                  }
                              },
                              {
                                  type: "text",
                                  text: prompt  // 加入用户的文本提示
                              }
                          ]
                      }
                  ]
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

              const data = await response.json();
              console.log('成功:', data);

              // 处理API返回的数据
              if (data && data.choices && data.choices.length > 0) {
                  const interpretation = data.choices[0].message.content;
                  alert('图片 ' + (i + 1) + ' 解释结果：' + interpretation);
              } else {
                  alert('图片 ' + (i + 1) + ' 解析失败。');
              }
          } catch (error) {
              console.error('错误:', error);
              alert('请求图片 ' + (i + 1) + ' 失败，请检查API密钥或网络连接。');
          }
      }
  };

  // 调用图片处理函数
  processImages();
});
