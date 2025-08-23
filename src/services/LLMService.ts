import * as vscode from 'vscode';
import axios from 'axios';

export interface LLMRequest {
	prompt: string;
	problemContext: string;
	language: string;
}

export interface LLMResponse {
	generatedCode: string;
	explanation: string;
	success: boolean;
	error?: string;
}

export class LLMService {
	private getConfiguration() {
		const config = vscode.workspace.getConfiguration('promptPilot');
		return {
			apiKey: config.get<string>('apiKey', ''),
			apiEndpoint: config.get<string>('apiEndpoint', 'https://api.openai.com/v1/chat/completions'),
			model: config.get<string>('model', 'gpt-3.5-turbo')
		};
	}

	async generateCode(request: LLMRequest): Promise<LLMResponse> {
		const config = this.getConfiguration();

		if (!config.apiKey) {
			return {
				generatedCode: '',
				explanation: '',
				success: false,
				error: '请先配置API密钥'
			};
		}

		try {
			const systemPrompt = `你是一个专业的编程助手。请根据用户的prompt和问题描述生成高质量的代码。

要求：
1. 代码应该是完整且可运行的
2. 使用最佳实践和高效算法
3. 包含适当的注释
4. 考虑边界情况和错误处理

问题上下文：${request.problemContext}
编程语言：${request.language}`;

			const response = await axios.post(
				config.apiEndpoint,
				{
					model: config.model,
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: request.prompt
						}
					],
					temperature: 0.7,
					max_tokens: 2000
				},
				{
					headers: {
						'Authorization': `Bearer ${config.apiKey}`,
						'Content-Type': 'application/json'
					},
					timeout: 30000
				}
			);

			const generatedText = response.data.choices[0].message.content;

			// 提取代码块
			const codeMatch = generatedText.match(/```(?:typescript|javascript|ts|js)?\n?([\s\S]*?)\n?```/);
			const generatedCode = codeMatch ? codeMatch[1].trim() : generatedText.trim();

			// 提取说明
			const explanation = generatedText.replace(/```(?:typescript|javascript|ts|js)?\n?[\s\S]*?\n?```/, '').trim();

			return {
				generatedCode,
				explanation,
				success: true
			};

		} catch (error: any) {
			let errorMessage = '生成代码失败';

			if (error.response) {
				errorMessage = `API错误: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`;
			} else if (error.request) {
				errorMessage = '网络连接失败，请检查网络设置';
			} else {
				errorMessage = error.message;
			}

			return {
				generatedCode: '',
				explanation: '',
				success: false,
				error: errorMessage
			};
		}
	}

	async analyzePrompt(prompt: string): Promise<{
		score: number;
		feedback: string;
		improvements: string[];
	}> {
		const config = this.getConfiguration();

		if (!config.apiKey) {
			return {
				score: 0,
				feedback: '请先配置API密钥',
				improvements: []
			};
		}

		try {
			const systemPrompt = `你是一个专业的prompt工程师。请分析用户提供的prompt质量，并给出评分（0-100分）和改进建议。

评分标准：
- 明确性（25分）：问题描述是否清晰
- 完整性（25分）：是否包含必要的上下文和要求
- 结构性（25分）：prompt结构是否合理
- 技术性（25分）：是否包含适当的技术指导

请以JSON格式返回：
{
  "score": 数字,
  "feedback": "详细反馈",
  "improvements": ["改进建议1", "改进建议2"]
}`;

			const response = await axios.post(
				config.apiEndpoint,
				{
					model: config.model,
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: `请分析这个prompt：\n\n${prompt}`
						}
					],
					temperature: 0.3,
					max_tokens: 1000
				},
				{
					headers: {
						'Authorization': `Bearer ${config.apiKey}`,
						'Content-Type': 'application/json'
					}
				}
			);

			const result = JSON.parse(response.data.choices[0].message.content);
			return result;

		} catch (error) {
			return {
				score: 0,
				feedback: '分析失败，请稍后重试',
				improvements: ['请检查网络连接', '确保API密钥正确']
			};
		}
	}
}