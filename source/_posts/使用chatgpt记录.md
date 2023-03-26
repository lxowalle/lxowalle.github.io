---
title: 使用chatgpt记录
date: 2023-09-08 20:48:56
categories: "未分类"
tags:
---

# 使用chatgpt记录

#### 一、注册openai账号

所有chatgpt的操作都是需要一个openai账号，注册方法参考自[ChatGPT国内注册使用攻略](https://zblogs.top/how-to-register-openai-chatgpt-in-china/)

注意：

1. 注册全称要保证有梯子，最好是美国节点
2. openai的账号建议用谷歌账号注册
3. 国外手机验证码可以用[sms-activate](https://sms-activate.org/)获取



#### 二、在openai提供界面上使用

点击[chat.openai.com/chat](https://chat.openai.com/chat)在openai提供的网页使用chatgpt



#### 三、使用python进行openai交流

1. 在[api-key](https://platform.openai.com/account/api-keys)界面创建密钥

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

2. 在[setting](https://platform.openai.com/account/org-settings)界面获取组织编号

3. 编写python脚本

    ```python
    #!/usr/bin/env python
    # -*- coding:utf-8 -*-
    
    import os
    import sys
    import signal
    import readline
    import openai
    
    os.environ["HTTP_PROXY"] = "127.0.0.1:7890"
    os.environ["HTTPS_PROXY"] = "127.0.0.1:7890"
    
    openai.api_key = "sk-EzEv2UuSUn203z2bsg7vT3BlefvdZp29okjn5Kzf3lEYkVnJ"  # 你的 OpenAI API Key
    
    def ask_gpt(prompt, model, temperature=0.5, max_tokens=100):
        response = openai.ChatCompletion.create(
            model=model,
            messages = [
                {'role': 'system', 'content': '回答的结果以中文英文输出'},
                {'role': 'user', 'content': prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            n = 1,
            stop=None
        )
    
        return response['choices'][0]['message']['content']
    
    def exit_handler(signum, frame):
        print("\r\n")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, exit_handler)
    
    while True:
        prompt = input("You: ")
        if prompt:
            print("...")
            response = ask_gpt(prompt, "gpt-3.5-turbo")
            print("ChatGPT: " + response)
    
    ```

    