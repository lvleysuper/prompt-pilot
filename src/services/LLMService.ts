import * as vscode from 'vscode';
import axios from 'axios';
import { APIConfigService, APIConfig } from './APIConfigService';

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
	private apiConfigService: APIConfigService;
	private mockMode: boolean = false;

	constructor(apiConfigService: APIConfigService) {
		this.apiConfigService = apiConfigService;

		// 检查是否有API密钥配置
		if (!this.apiConfigService.hasValidConfig()) {
			console.log('⚠️ 未配置API密钥，启用模拟模式');
			this.mockMode = true;

			// 显示配置提示
			vscode.window.showWarningMessage(
				'🔑 Prompt Pilot: 未检测到有效的API配置，当前为模拟模式。',
				'立即配置', '查看指南', '稍后配置'
			).then(selection => {
				if (selection === '立即配置') {
					vscode.commands.executeCommand('prompt-pilot.configureAPI');
				} else if (selection === '查看指南') {
					vscode.commands.executeCommand('workbench.action.openSettings', 'prompt-pilot');
				}
			});
		} else {
			console.log('✅ API配置有效，使用真实模式');
			this.mockMode = false;
		}
	}

	/**
	 * 检查是否为模拟模式
	 */
	public isMockMode(): boolean {
		return this.mockMode;
	}

	/**
	 * 刷新配置状态
	 */
	public refreshConfig(): void {
		const wasInMockMode = this.mockMode;
		this.mockMode = !this.apiConfigService.hasValidConfig();

		if (wasInMockMode && !this.mockMode) {
			console.log('✅ 检测到有效API配置，切换到真实模式');
			vscode.window.showInformationMessage('🎉 API配置生效，现在可以使用真实AI服务了！');
		} else if (!wasInMockMode && this.mockMode) {
			console.log('⚠️ API配置失效，切换到模拟模式');
			vscode.window.showWarningMessage('⚠️ API配置无效，已切换到模拟模式');
		}
	}

	async generateCode(request: LLMRequest): Promise<LLMResponse> {
		// 如果是模拟模式，返回示例代码
		if (this.mockMode) {
			return this.getMockCodeResponse(request);
		}

		const config = this.apiConfigService.getConfig();

		try {
			const systemPrompt = `你是一个专业的编程助手。请根据用户的prompt和问题描述生成高质量的代码。

要求：
1. 代码应该是完整且可运行的
2. 使用最佳实践和高效算法
3. 包含适当的注释
4. 考虑边界情况和错误处理

问题上下文：${request.problemContext}
编程语言：${request.language}`;

			if (config.provider === 'openai') {
				return await this.generateCodeWithOpenAI(request, systemPrompt, config);
			} else if (config.provider === 'azure') {
				return await this.generateCodeWithAzure(request, systemPrompt, config);
			} else if (config.provider === 'alibaba') {
				return await this.generateCodeWithAlibaba(request, systemPrompt, config);
			} else if (config.provider === 'moonshot') {
				return await this.generateCodeWithMoonshot(request, systemPrompt, config);
			} else if (config.provider === 'zhipu') {
				return await this.generateCodeWithZhipu(request, systemPrompt, config);
			} else if (config.provider === 'baichuan') {
				return await this.generateCodeWithBaichuan(request, systemPrompt, config);
			} else if (config.provider === 'custom') {
				return await this.generateCodeWithCustom(request, systemPrompt, config);
			} else {
				return {
					generatedCode: '',
					explanation: '',
					success: false,
					error: '不支持的API提供商'
				};
			}

		} catch (error: any) {
			return {
				generatedCode: '',
				explanation: '',
				success: false,
				error: `生成代码失败: ${error.message}`
			};
		}
	}

	private async generateCodeWithOpenAI(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const url = `${config.openai.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.openai.model,
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
				temperature: config.openai.temperature,
				max_tokens: config.openai.maxTokens
			},
			{
				headers: {
					'Authorization': `Bearer ${config.openai.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	private async generateCodeWithAzure(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const url = `${config.azure.endpoint}/openai/deployments/${config.azure.deploymentName}/chat/completions?api-version=${config.azure.apiVersion}`;

		const response = await axios.post(
			url,
			{
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
				temperature: config.openai.temperature,
				max_tokens: config.openai.maxTokens
			},
			{
				headers: {
					'api-key': config.azure.apiKey,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	/**
	 * 阿里云通义千问代码生成
	 */
	private async generateCodeWithAlibaba(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const { apiKey, baseUrl, model } = config.alibaba;

		// 判断是否使用兼容模式
		const isCompatibleMode = baseUrl.includes('compatible-mode');
		const url = isCompatibleMode
			? `${baseUrl}/chat/completions`
			: `${baseUrl}/api/v1/services/aigc/text-generation/generation`;

		let requestData: any;
		if (isCompatibleMode) {
			// OpenAI兼容模式
			requestData = {
				model: model,
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
				max_tokens: 2048
			};
		} else {
			// 阿里云原生模式
			requestData = {
				model: model,
				input: {
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: request.prompt
						}
					]
				},
				parameters: {
					temperature: 0.7,
					max_tokens: 2048
				}
			};
		}

		const response = await axios.post(
			url,
			requestData,
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		if (isCompatibleMode) {
			return this.processLLMResponse(response.data);
		} else {
			// 处理阿里云原生格式响应
			const generatedText = response.data.output.text;
			const codeMatch = generatedText.match(/```(?:typescript|javascript|ts|js)?\n?([\s\S]*?)\n?```/);
			const generatedCode = codeMatch ? codeMatch[1].trim() : generatedText.trim();
			const explanation = generatedText.replace(/```(?:typescript|javascript|ts|js)?\n?[\s\S]*?\n?```/, '').trim();

			return {
				generatedCode,
				explanation,
				success: true
			};
		}
	}

	/**
	 * 月之暗面 Kimi 代码生成
	 */
	private async generateCodeWithMoonshot(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const url = `${config.moonshot.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.moonshot.model,
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
				max_tokens: 2048
			},
			{
				headers: {
					'Authorization': `Bearer ${config.moonshot.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	/**
	 * 智谱 GLM 代码生成
	 */
	private async generateCodeWithZhipu(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const url = `${config.zhipu.baseUrl}/api/paas/v4/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.zhipu.model,
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
				max_tokens: 2048
			},
			{
				headers: {
					'Authorization': `Bearer ${config.zhipu.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	/**
	 * 百川智能代码生成
	 */
	private async generateCodeWithBaichuan(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		const url = `${config.baichuan.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.baichuan.model,
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
				max_tokens: 2048
			},
			{
				headers: {
					'Authorization': `Bearer ${config.baichuan.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	/**
	 * 自定义API代码生成
	 */
	private async generateCodeWithCustom(request: LLMRequest, systemPrompt: string, config: APIConfig): Promise<LLMResponse> {
		// 默认使用OpenAI格式，可根据需要调整
		const url = `${config.custom.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.custom.model,
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
				max_tokens: 2048
			},
			{
				headers: {
					'Authorization': `Bearer ${config.custom.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return this.processLLMResponse(response.data);
	}

	private processLLMResponse(data: any): LLMResponse {
		const generatedText = data.choices[0].message.content;

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
	}

	/**
	 * 生成Prompt（专门方法，不提取代码块）
	 */
	async generatePrompt(taskDescription: string): Promise<{
		generatedPrompt: string;
		explanation: string;
		success: boolean;
		error?: string;
	}> {
		if (this.mockMode) {
			return this.getMockPromptResponse(taskDescription);
		}

		const config = this.apiConfigService.getConfig();

		try {
			const systemPrompt = `你是一个专业的Prompt工程师，擅长将用户的任务描述转化为高质量的AI Prompt。

请根据用户的任务描述，生成一个结构化、清晰、具体的Prompt。

好的Prompt应该包含：
1. 明确的任务描述
2. 具体的要求和约束
3. 期望的输出格式
4. 相关的技术细节和优化提示

请直接返回Prompt内容，不需要额外的解释或代码块包装。`;

			const userPrompt = `请为以下任务生成一个专业的Prompt：\n\n${taskDescription}`;

			let response;
			if (config.provider === 'openai') {
				response = await this.callOpenAIForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'azure') {
				response = await this.callAzureForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'alibaba') {
				response = await this.callAlibabaForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'moonshot') {
				response = await this.callMoonshotForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'zhipu') {
				response = await this.callZhipuForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'baichuan') {
				response = await this.callBaichuanForPrompt(userPrompt, systemPrompt, config);
			} else if (config.provider === 'custom') {
				response = await this.callCustomForPrompt(userPrompt, systemPrompt, config);
			} else {
				return {
					generatedPrompt: '',
					explanation: '',
					success: false,
					error: '不支持的API提供商'
				};
			}

			return {
				generatedPrompt: response || '生成失败，请重试',
				explanation: 'Prompt已成功生成，可以直接使用或进一步调整',
				success: true
			};

		} catch (error: any) {
			return {
				generatedPrompt: '',
				explanation: '',
				success: false,
				error: `生成Prompt失败: ${error.message}`
			};
		}
	}

	// 专门的Prompt生成API调用方法（不提取代码块）
	private async callOpenAIForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.openai.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.openai.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'Authorization': `Bearer ${config.openai.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	private async callAzureForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.azure.endpoint}/openai/deployments/${config.azure.deploymentName}/chat/completions?api-version=${config.azure.apiVersion}`;

		const response = await axios.post(
			url,
			{
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'api-key': config.azure.apiKey,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	private async callAlibabaForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const { apiKey, baseUrl, model } = config.alibaba;
		const isCompatibleMode = baseUrl.includes('compatible-mode');
		const url = isCompatibleMode
			? `${baseUrl}/chat/completions`
			: `${baseUrl}/api/v1/services/aigc/text-generation/generation`;

		let requestData: any;
		if (isCompatibleMode) {
			requestData = {
				model: model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			};
		} else {
			requestData = {
				model: model,
				input: {
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt }
					]
				},
				parameters: {
					temperature: 0.7,
					max_tokens: 1024
				}
			};
		}

		const response = await axios.post(
			url,
			requestData,
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		if (isCompatibleMode) {
			return response.data.choices[0].message.content.trim();
		} else {
			return response.data.output.text.trim();
		}
	}

	private async callMoonshotForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.moonshot.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.moonshot.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'Authorization': `Bearer ${config.moonshot.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	private async callZhipuForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.zhipu.baseUrl}/api/paas/v4/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.zhipu.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'Authorization': `Bearer ${config.zhipu.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	private async callBaichuanForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.baichuan.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.baichuan.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'Authorization': `Bearer ${config.baichuan.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	private async callCustomForPrompt(userPrompt: string, systemPrompt: string, config: APIConfig): Promise<string> {
		const url = `${config.custom.baseUrl}/v1/chat/completions`;

		const response = await axios.post(
			url,
			{
				model: config.custom.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.7,
				max_tokens: 1024
			},
			{
				headers: {
					'Authorization': `Bearer ${config.custom.apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: config.timeout
			}
		);

		return response.data.choices[0].message.content.trim();
	}

	// 模拟Prompt生成响应
	private getMockPromptResponse(taskDescription: string): Promise<{
		generatedPrompt: string;
		explanation: string;
		success: boolean;
	}> {
		return new Promise(resolve => {
			setTimeout(() => {
				let mockPrompt = '';

				if (taskDescription.includes('计算器') || taskDescription.includes('calculator')) {
					mockPrompt = `请你作为一名专业的前端开发工程师，创建一个功能完整的计算器应用。

## 功能要求：
1. 基本运算：加法(+)、减法(-)、乘法(×)、除法(÷)
2. 高级功能：清零(C)、删除(DEL)、小数点支持
3. 界面设计：现代化UI，响应式布局
4. 交互体验：键盘支持、错误处理

## 技术规范：
- 使用HTML5、CSS3、JavaScript
- 采用Grid布局设计按钮
- 实现键盘快捷键操作
- 添加动画效果和视觉反馈

## 输出要求：
请提供完整的HTML文件，包含内联CSS和JavaScript，确保可以直接在浏览器中运行。`;
				} else if (taskDescription.includes('排序') || taskDescription.includes('sort')) {
					mockPrompt = `请你作为一名算法专家，实现一个高效的排序算法解决方案。

## 任务描述：
${taskDescription}

## 实现要求：
1. 算法选择：根据数据特征选择最优排序算法
2. 性能优化：考虑时间复杂度和空间复杂度
3. 边界处理：空数组、单元素、重复元素等情况
4. 代码质量：清晰的注释、良好的可读性

## 技术细节：
- 使用TypeScript编写
- 包含完整的类型定义
- 提供详细的算法分析
- 添加性能测试用例

## 输出格式：
请提供完整的代码实现，包括算法核心逻辑、测试用例和性能分析说明。`;
				} else {
					// 通用Prompt模板
					mockPrompt = `请你作为一名专业的软件开发工程师，完成以下任务：

## 任务描述：
${taskDescription}

## 实现要求：
1. 功能完整性：确保满足所有基本需求
2. 代码质量：遵循最佳实践和编码规范
3. 错误处理：完善的异常处理和边界情况考虑
4. 用户体验：直观易用的交互设计

## 技术规范：
- 选择合适的技术栈和工具
- 编写清晰的代码注释
- 遵循SOLID设计原则
- 考虑可维护性和可扩展性

## 输出要求：
请提供完整的实现方案，包括核心代码、使用说明和关键技术点解析。确保代码可以直接运行并达到预期效果。`;
				}

				resolve({
					generatedPrompt: mockPrompt,
					explanation: '🧪 模拟模式：这是一个根据您的任务描述生成的专业Prompt模板。要使用真实AI生成，请配置API密钥。',
					success: true
				});
			}, 1000);
		});
	}

	async analyzePrompt(prompt: string): Promise<{
		score: number;
		feedback: string;
		improvements: string[];
	}> {
		if (this.mockMode) {
			return this.getMockPromptAnalysis(prompt);
		}

		const config = this.apiConfigService.getConfig();

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

			let response;
			if (config.provider === 'openai') {
				const url = `${config.openai.baseUrl}/v1/chat/completions`;
				response = await axios.post(
					url,
					{
						model: config.openai.model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'Authorization': `Bearer ${config.openai.apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'azure') {
				const url = `${config.azure.endpoint}/openai/deployments/${config.azure.deploymentName}/chat/completions?api-version=${config.azure.apiVersion}`;
				response = await axios.post(
					url,
					{
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'api-key': config.azure.apiKey,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'alibaba') {
				const { apiKey, baseUrl, model } = config.alibaba;
				const isCompatibleMode = baseUrl.includes('compatible-mode');
				const url = isCompatibleMode
					? `${baseUrl}/chat/completions`
					: `${baseUrl}/api/v1/services/aigc/text-generation/generation`;

				let requestData: any;
				if (isCompatibleMode) {
					requestData = {
						model: model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					};
				} else {
					requestData = {
						model: model,
						input: {
							messages: [
								{ role: 'system', content: systemPrompt },
								{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
							]
						},
						parameters: {
							temperature: 0.3,
							max_tokens: 1000
						}
					};
				}

				response = await axios.post(
					url,
					requestData,
					{
						headers: {
							'Authorization': `Bearer ${apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'moonshot') {
				const url = `${config.moonshot.baseUrl}/v1/chat/completions`;
				response = await axios.post(
					url,
					{
						model: config.moonshot.model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'Authorization': `Bearer ${config.moonshot.apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'zhipu') {
				const url = `${config.zhipu.baseUrl}/api/paas/v4/chat/completions`;
				response = await axios.post(
					url,
					{
						model: config.zhipu.model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'Authorization': `Bearer ${config.zhipu.apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'baichuan') {
				const url = `${config.baichuan.baseUrl}/v1/chat/completions`;
				response = await axios.post(
					url,
					{
						model: config.baichuan.model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'Authorization': `Bearer ${config.baichuan.apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			} else if (config.provider === 'custom') {
				const url = `${config.custom.baseUrl}/v1/chat/completions`;
				response = await axios.post(
					url,
					{
						model: config.custom.model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `请分析这个prompt：\n\n${prompt}` }
						],
						temperature: 0.3,
						max_tokens: 1000
					},
					{
						headers: {
							'Authorization': `Bearer ${config.custom.apiKey}`,
							'Content-Type': 'application/json'
						},
						timeout: config.timeout
					}
				);
			}

			if (response) {
				let resultText = '';

				if (config.provider === 'alibaba' && !config.alibaba.baseUrl.includes('compatible-mode')) {
					// 阿里云原生模式
					resultText = response.data.output.text;
				} else {
					// OpenAI兼容模式
					resultText = response.data.choices[0].message.content;
				}

				try {
					const result = JSON.parse(resultText);
					return result;
				} catch (parseError) {
					// 如果不是JSON格式，返回默认结果
					// 检测分数信息并提取
					const scoreMatch = resultText.match(/(评分|分数|score)[:：]?\s*(\d+)/i);
					const extractedScore = scoreMatch ? parseInt(scoreMatch[2]) : 75;

					// 检测是否包含JSON内容并进行格式化
					let formattedFeedback = resultText;
					if (resultText.includes('{') && resultText.includes('}')) {
						// 尝试提取和格式化JSON内容
						formattedFeedback = this.formatJsonContent(resultText);
					}

					return {
						score: extractedScore,
						feedback: formattedFeedback,
						improvements: ['请检查prompt格式', '增加更具体的技术要求']
					};
				}
			}

		} catch (error) {
			console.error('Prompt分析失败:', error);
		}

		return {
			score: 0,
			feedback: '分析失败，请稍后重试',
			improvements: ['请检查网络连接', '确保API配置正确']
		};
	}

	private getMockPromptAnalysis(prompt: string): Promise<{
		score: number;
		feedback: string;
		improvements: string[];
	}> {
		return new Promise(resolve => {
			setTimeout(() => {
				const score = Math.floor(Math.random() * 30) + 60; // 60-90分

				// 根据分数生成对应的反馈内容
				let feedback = '';
				if (score >= 85) {
					feedback = `您的Prompt表现优秀（${score}分）！具有清晰的结构和明确的需求描述，技术要求具体，包含了完整的功能需求和技术栈选择。Prompt的组织结构合理，具备良好的可执行性和实用性。建议可以在细节完善方面继续优化。`;
				} else if (score >= 70) {
					feedback = `您的Prompt质量良好（${score}分）。包含了基本的问题描述和主要需求，具有一定的结构性。在技术细节和限制条件方面可以进一步完善，建议添加更具体的技术要求和预期输出格式说明。`;
				} else {
					feedback = `您的Prompt需要改进（${score}分）。虽然包含了基本的问题描述，但在明确性、完整性和技术要求方面还有提升空间。建议重新组织结构，添加更详细的需求说明和技术规范。`;
				}

				resolve({
					score,
					feedback,
					improvements: [
						'增加更具体的技术要求和约束条件',
						'提供示例输入输出以明确期望',
						'指定代码风格和最佳实践要求',
						'添加性能和边界情况考虑'
					]
				});
			}, 800);
		});
	}

	// 模拟模式的示例响应
	private getMockCodeResponse(request: LLMRequest): Promise<LLMResponse> {
		// 模拟网络延迟
		return new Promise(resolve => {
			setTimeout(() => {
				// 根据问题类型返回不同的示例代码
				let mockCode = '';
				let mockExplanation = '';

				if (request.problemContext.includes('两数之和') || request.problemContext.includes('Two Sum')) {
					mockCode = `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}`;
					mockExplanation = '这个解法使用哈希表来存储已遍历的数字及其索引。对于每个元素，我们计算它的补数（target - 当前元素），然后检查这个补数是否在哈希表中。时间复杂度 O(n)，空间复杂度 O(n)。';
				} else if (request.problemContext.includes('反转') || request.problemContext.includes('reverse')) {
					mockCode = `function reverseList(head: ListNode | null): ListNode | null {
    let prev: ListNode | null = null;
    let current = head;
    
    while (current !== null) {
        const next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}`;
					mockExplanation = '使用迭代方法反转链表。维护三个指针：prev、current 和 next。在每次迭代中，我们改变 current.next 的指向，使其指向前一个节点。时间复杂度 O(n)，空间复杂度 O(1)。';
				} else {
					// 通用示例代码
					mockCode = `// 这是一个示例解决方案（模拟模式）
function solveProblem(input: any): any {
    // TODO: 实现具体逻辑
    console.log('输入:', input);
    
    // 示例处理逻辑
    const result = processInput(input);
    
    return result;
}

function processInput(input: any): any {
    // 具体实现根据问题要求而定
    return input;
}`;
					mockExplanation = '这是一个基础的问题解决框架。请根据具体的问题要求完善实现逻辑。建议先理解问题，然后设计算法，最后编写代码。';
				}

				resolve({
					generatedCode: mockCode,
					explanation: `🧪 模拟模式响应：\n\n${mockExplanation}\n\n🔑 要使用真实AI生成，请配置API密钥。点击侧边栏的"配置 API 设置"按钮。`,
					success: true
				});
			}, 1000); // 模拟1秒的网络延迟
		});
	}

	/**
	 * 格式化JSON内容为更易读的Markdown格式
	 */
	private formatJsonContent(content: string): string {
		try {
			// 尝试提取JSON部分
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				return content;
			}

			// 解析JSON
			const jsonStr = jsonMatch[0];
			const parsed = JSON.parse(jsonStr);

			// 转换为更易读的格式
			let formatted = '';

			// 添加分数信息
			if (parsed.score !== undefined) {
				formatted += `**评分: ${parsed.score}/100**\n\n`;
			}

			// 添加反馈内容
			if (parsed.feedback) {
				formatted += `**详细反馈:**\n${parsed.feedback}\n\n`;
			}

			// 添加改进建议
			if (parsed.improvements && Array.isArray(parsed.improvements)) {
				formatted += '**改进建议:**\n';
				parsed.improvements.forEach((improvement: string, index: number) => {
					formatted += `${index + 1}. ${improvement}\n`;
				});
			}

			// 如果有其他内容，保留原始文本
			const beforeJson = content.substring(0, content.indexOf(jsonStr));
			const afterJson = content.substring(content.indexOf(jsonStr) + jsonStr.length);

			let result = beforeJson.trim();
			if (result) result += '\n\n';
			result += formatted;
			if (afterJson.trim()) result += '\n\n' + afterJson.trim();

			return result;
		} catch (error) {
			// 如果格式化失败，返回原始内容
			return content;
		}
	}
}