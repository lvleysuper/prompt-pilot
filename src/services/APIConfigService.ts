import axios from 'axios';
import * as vscode from 'vscode';

export interface APIConfig {
	provider: 'openai' | 'azure' | 'alibaba' | 'moonshot' | 'zhipu' | 'baichuan' | 'custom';
	openai: {
		apiKey: string;
		model: string;
		baseUrl: string;
		maxTokens: number;
		temperature: number;
	};
	azure: {
		apiKey: string;
		endpoint: string;
		deploymentName: string;
		apiVersion: string;
	};
	alibaba: {
		apiKey: string;
		baseUrl: string;
		model: string;
	};
	moonshot: {
		apiKey: string;
		baseUrl: string;
		model: string;
	};
	zhipu: {
		apiKey: string;
		baseUrl: string;
		model: string;
	};
	baichuan: {
		apiKey: string;
		baseUrl: string;
		model: string;
	};
	custom: {
		baseUrl: string;
		apiKey: string;
		model: string;
		apiFormat: string;
	};
	timeout: number;
	retryAttempts: number;
	enableDebugLogs: boolean;
}

export interface APIValidationResult {
	isValid: boolean;
	provider: string;
	model?: string;
	error?: string;
	responseTime?: number;
	details?: any;
}

export class APIConfigService {
	private config: APIConfig;
	private outputChannel: vscode.OutputChannel;

	constructor() {
		this.outputChannel = vscode.window.createOutputChannel('Prompt Pilot - API');
		this.config = this.loadConfig();

		// 监听配置变化
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('prompt-pilot')) {
				this.config = this.loadConfig();
				this.log('配置已更新');
			}
		});
	}

	/**
	 * 加载配置
	 */
	public loadConfig(): APIConfig {
		const config = vscode.workspace.getConfiguration('prompt-pilot');

		return {
			provider: config.get<'openai' | 'azure' | 'alibaba' | 'moonshot' | 'zhipu' | 'baichuan' | 'custom'>('provider', 'openai'),
			openai: {
				apiKey: config.get<string>('openai.apiKey', ''),
				model: config.get<string>('openai.model', 'gpt-3.5-turbo'),
				baseUrl: config.get<string>('openai.baseUrl', 'https://api.openai.com'),
				maxTokens: config.get<number>('openai.maxTokens', 2048),
				temperature: config.get<number>('openai.temperature', 0.7),
			},
			azure: {
				apiKey: config.get<string>('azure.apiKey', ''),
				endpoint: config.get<string>('azure.endpoint', ''),
				deploymentName: config.get<string>('azure.deploymentName', ''),
				apiVersion: config.get<string>('azure.apiVersion', '2023-12-01-preview'),
			},
			alibaba: {
				apiKey: config.get<string>('alibaba.apiKey', ''),
				baseUrl: config.get<string>('alibaba.baseUrl', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
				model: config.get<string>('alibaba.model', 'qwen-plus'),
			},
			moonshot: {
				apiKey: config.get<string>('moonshot.apiKey', ''),
				baseUrl: config.get<string>('moonshot.baseUrl', 'https://api.moonshot.cn'),
				model: config.get<string>('moonshot.model', 'moonshot-v1-8k'),
			},
			zhipu: {
				apiKey: config.get<string>('zhipu.apiKey', ''),
				baseUrl: config.get<string>('zhipu.baseUrl', 'https://open.bigmodel.cn'),
				model: config.get<string>('zhipu.model', 'glm-4'),
			},
			baichuan: {
				apiKey: config.get<string>('baichuan.apiKey', ''),
				baseUrl: config.get<string>('baichuan.baseUrl', 'https://api.baichuan-ai.com'),
				model: config.get<string>('baichuan.model', 'Baichuan2-Turbo'),
			},
			custom: {
				baseUrl: config.get<string>('custom.baseUrl', ''),
				apiKey: config.get<string>('custom.apiKey', ''),
				model: config.get<string>('custom.model', 'llama2'),
				apiFormat: config.get<string>('custom.apiFormat', 'openai'),
			},
			timeout: config.get<number>('timeout', 30000),
			retryAttempts: config.get<number>('retryAttempts', 3),
			enableDebugLogs: config.get<boolean>('enableDebugLogs', false),
		};
	}

	/**
	 * 获取当前配置
	 */
	public getConfig(): APIConfig {
		return this.config;
	}

	/**
	 * 检查是否有有效的API配置
	 */
	public hasValidConfig(): boolean {
		if (this.config.provider === 'openai') {
			return !!this.config.openai.apiKey;
		} else if (this.config.provider === 'azure') {
			return !!(this.config.azure.apiKey && this.config.azure.endpoint && this.config.azure.deploymentName);
		} else if (this.config.provider === 'alibaba') {
			return !!this.config.alibaba.apiKey;
		} else if (this.config.provider === 'moonshot') {
			return !!this.config.moonshot.apiKey;
		} else if (this.config.provider === 'zhipu') {
			return !!this.config.zhipu.apiKey;
		} else if (this.config.provider === 'baichuan') {
			return !!this.config.baichuan.apiKey;
		} else if (this.config.provider === 'custom') {
			return !!(this.config.custom.baseUrl && this.config.custom.model);
		}
		return false;
	}

	/**
	 * 验证API连接
	 */
	public async validateAPI(): Promise<APIValidationResult> {
		const startTime = Date.now();
		this.log('开始验证API连接...');

		if (!this.hasValidConfig()) {
			const result: APIValidationResult = {
				isValid: false,
				provider: this.config.provider,
				error: 'API配置不完整，请检查API密钥等必要配置项'
			};
			this.log(`验证失败: ${result.error}`);
			return result;
		}

		try {
			if (this.config.provider === 'openai') {
				return await this.validateOpenAI(startTime);
			} else if (this.config.provider === 'azure') {
				return await this.validateAzure(startTime);
			} else if (this.config.provider === 'alibaba') {
				return await this.validateAlibaba(startTime);
			} else if (this.config.provider === 'moonshot') {
				return await this.validateMoonshot(startTime);
			} else if (this.config.provider === 'zhipu') {
				return await this.validateZhipu(startTime);
			} else if (this.config.provider === 'baichuan') {
				return await this.validateBaichuan(startTime);
			} else if (this.config.provider === 'custom') {
				return await this.validateCustom(startTime);
			}
		} catch (error: any) {
			const result: APIValidationResult = {
				isValid: false,
				provider: this.config.provider,
				error: `验证过程中出现错误: ${error.message}`,
				responseTime: Date.now() - startTime
			};
			this.log(`验证异常: ${error.message}`);
			return result;
		}

		return {
			isValid: false,
			provider: this.config.provider,
			error: '未知的API提供商'
		};
	}

	/**
	 * 验证OpenAI API
	 */
	private async validateOpenAI(startTime: number): Promise<APIValidationResult> {
		const { apiKey, model, baseUrl } = this.config.openai;
		const url = `${baseUrl}/v1/chat/completions`;

		this.log(`验证OpenAI API: ${url}`);

		try {
			const response = await axios.post(
				url,
				{
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				},
				{
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					},
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'openai',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: response.data.model,
					usage: response.data.usage
				}
			};

			this.log(`OpenAI验证成功 - 响应时间: ${responseTime}ms, 模型: ${response.data.model}`);
			return result;

		} catch (error: any) {
			const responseTime = Date.now() - startTime;
			let errorMessage = '未知错误';

			if (error.response) {
				const status = error.response.status;
				const errorData = error.response.data?.error;

				switch (status) {
					case 401:
						errorMessage = 'API密钥无效或已过期';
						break;
					case 403:
						errorMessage = 'API访问被拒绝，请检查权限';
						break;
					case 404:
						errorMessage = '模型不存在或API端点错误';
						break;
					case 429:
						errorMessage = 'API调用频率超限或余额不足';
						break;
					case 500:
					case 502:
					case 503:
						errorMessage = 'API服务器错误，请稍后重试';
						break;
					default:
						errorMessage = errorData?.message || `HTTP ${status} 错误`;
				}
			} else if (error.request) {
				errorMessage = '网络连接失败，请检查网络设置和API端点';
			} else {
				errorMessage = error.message;
			}

			const result: APIValidationResult = {
				isValid: false,
				provider: 'openai',
				model: model,
				error: errorMessage,
				responseTime: responseTime,
				details: error.response?.data
			};

			this.log(`OpenAI验证失败: ${errorMessage}`);
			return result;
		}
	}

	/**
	 * 验证Azure OpenAI API
	 */
	private async validateAzure(startTime: number): Promise<APIValidationResult> {
		const { apiKey, endpoint, deploymentName, apiVersion } = this.config.azure;
		const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

		this.log(`验证Azure OpenAI API: ${url}`);

		try {
			const response = await axios.post(
				url,
				{
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				},
				{
					headers: {
						'api-key': apiKey,
						'Content-Type': 'application/json'
					},
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'azure',
				model: deploymentName,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: response.data.model,
					usage: response.data.usage
				}
			};

			this.log(`Azure验证成功 - 响应时间: ${responseTime}ms, 部署: ${deploymentName}`);
			return result;

		} catch (error: any) {
			const responseTime = Date.now() - startTime;
			let errorMessage = '未知错误';

			if (error.response) {
				const status = error.response.status;
				const errorData = error.response.data?.error;

				switch (status) {
					case 401:
						errorMessage = 'API密钥无效或已过期';
						break;
					case 403:
						errorMessage = 'API访问被拒绝，请检查权限';
						break;
					case 404:
						errorMessage = '部署不存在或端点错误';
						break;
					case 429:
						errorMessage = 'API调用频率超限或配额不足';
						break;
					case 500:
					case 502:
					case 503:
						errorMessage = 'API服务器错误，请稍后重试';
						break;
					default:
						errorMessage = errorData?.message || `HTTP ${status} 错误`;
				}
			} else if (error.request) {
				errorMessage = '网络连接失败，请检查网络设置和端点配置';
			} else {
				errorMessage = error.message;
			}

			const result: APIValidationResult = {
				isValid: false,
				provider: 'azure',
				model: deploymentName,
				error: errorMessage,
				responseTime: responseTime,
				details: error.response?.data
			};

			this.log(`Azure验证失败: ${errorMessage}`);
			return result;
		}
	}

	/**
	 * 打开配置页面
	 */
	public async openConfigPage(): Promise<void> {
		await vscode.commands.executeCommand('workbench.action.openSettings', 'prompt-pilot');
	}

	/**
	 * 显示API状态
	 */
	public async showAPIStatus(): Promise<void> {
		const config = this.getConfig();
		const hasConfig = this.hasValidConfig();

		let statusMessage = `📊 **Prompt Pilot API 状态**\n\n`;
		statusMessage += `**当前提供商**: ${config.provider === 'openai' ? 'OpenAI' : 'Azure OpenAI'}\n`;
		statusMessage += `**配置状态**: ${hasConfig ? '✅ 已配置' : '❌ 未配置'}\n\n`;

		if (config.provider === 'openai') {
			statusMessage += `**OpenAI 配置**:\n`;
			statusMessage += `- API密钥: ${config.openai.apiKey ? '✅ 已设置' : '❌ 未设置'}\n`;
			statusMessage += `- 模型: ${config.openai.model}\n`;
			statusMessage += `- 基础URL: ${config.openai.baseUrl}\n`;
			statusMessage += `- 最大令牌数: ${config.openai.maxTokens}\n`;
			statusMessage += `- 温度参数: ${config.openai.temperature}\n`;
		} else {
			statusMessage += `**Azure OpenAI 配置**:\n`;
			statusMessage += `- API密钥: ${config.azure.apiKey ? '✅ 已设置' : '❌ 未设置'}\n`;
			statusMessage += `- 端点: ${config.azure.endpoint || '❌ 未设置'}\n`;
			statusMessage += `- 部署名称: ${config.azure.deploymentName || '❌ 未设置'}\n`;
			statusMessage += `- API版本: ${config.azure.apiVersion}\n`;
		}

		statusMessage += `\n**通用设置**:\n`;
		statusMessage += `- 超时时间: ${config.timeout}ms\n`;
		statusMessage += `- 重试次数: ${config.retryAttempts}\n`;
		statusMessage += `- 调试日志: ${config.enableDebugLogs ? '✅ 启用' : '❌ 禁用'}\n`;

		const action = await vscode.window.showInformationMessage(
			statusMessage,
			{ modal: true },
			'打开配置', '验证连接', '关闭'
		);

		if (action === '打开配置') {
			await this.openConfigPage();
		} else if (action === '验证连接') {
			await vscode.commands.executeCommand('prompt-pilot.validateAPI');
		}
	}

	/**
	 * 引导用户配置API
	 */
	public async guideAPISetup(): Promise<boolean> {
		const providerChoice = await vscode.window.showQuickPick([
			{
				label: '$(globe) OpenAI',
				description: '使用OpenAI官方API',
				detail: '需要OpenAI账户和API密钥',
				value: 'openai'
			},
			{
				label: '$(azure) Azure OpenAI',
				description: '使用Azure OpenAI服务',
				detail: '需要Azure订阅和OpenAI服务',
				value: 'azure'
			}
		], {
			title: '选择AI服务提供商',
			placeHolder: '请选择您要使用的AI服务'
		});

		if (!providerChoice) {
			return false;
		}

		// 设置提供商
		await vscode.workspace.getConfiguration('prompt-pilot').update(
			'provider',
			providerChoice.value,
			vscode.ConfigurationTarget.Global
		);

		if (providerChoice.value === 'openai') {
			return await this.setupOpenAI();
		} else {
			return await this.setupAzure();
		}
	}

	/**
	 * 设置OpenAI API
	 */
	private async setupOpenAI(): Promise<boolean> {
		const apiKey = await vscode.window.showInputBox({
			title: '输入OpenAI API密钥',
			prompt: '请输入您的OpenAI API密钥 (sk-...)',
			password: true,
			validateInput: (value) => {
				if (!value) {
					return 'API密钥不能为空';
				}
				if (!value.startsWith('sk-')) {
					return 'OpenAI API密钥应该以 "sk-" 开头';
				}
				return null;
			}
		});

		if (!apiKey) {
			return false;
		}

		// 设置API密钥
		await vscode.workspace.getConfiguration('prompt-pilot').update(
			'openai.apiKey',
			apiKey,
			vscode.ConfigurationTarget.Global
		);

		vscode.window.showInformationMessage('✅ OpenAI API密钥已配置，正在验证连接...');

		// 验证连接
		const validation = await this.validateAPI();
		if (validation.isValid) {
			vscode.window.showInformationMessage('🎉 API连接验证成功！');
			return true;
		} else {
			vscode.window.showErrorMessage(`❌ API验证失败: ${validation.error}`);
			return false;
		}
	}

	/**
	 * 设置Azure OpenAI API
	 */
	private async setupAzure(): Promise<boolean> {
		// API密钥
		const apiKey = await vscode.window.showInputBox({
			title: '输入Azure OpenAI API密钥',
			prompt: '请输入您的Azure OpenAI API密钥',
			password: true,
			validateInput: (value) => {
				if (!value) {
					return 'API密钥不能为空';
				}
				return null;
			}
		});

		if (!apiKey) return false;

		// 端点
		const endpoint = await vscode.window.showInputBox({
			title: '输入Azure OpenAI端点',
			prompt: '请输入您的Azure OpenAI端点 (https://your-resource.openai.azure.com)',
			validateInput: (value) => {
				if (!value) {
					return '端点不能为空';
				}
				if (!value.startsWith('https://')) {
					return '端点应该以 "https://" 开头';
				}
				return null;
			}
		});

		if (!endpoint) return false;

		// 部署名称
		const deploymentName = await vscode.window.showInputBox({
			title: '输入模型部署名称',
			prompt: '请输入您在Azure中创建的模型部署名称',
			validateInput: (value) => {
				if (!value) {
					return '部署名称不能为空';
				}
				return null;
			}
		});

		if (!deploymentName) return false;

		// 保存配置
		const config = vscode.workspace.getConfiguration('prompt-pilot');
		await Promise.all([
			config.update('azure.apiKey', apiKey, vscode.ConfigurationTarget.Global),
			config.update('azure.endpoint', endpoint, vscode.ConfigurationTarget.Global),
			config.update('azure.deploymentName', deploymentName, vscode.ConfigurationTarget.Global)
		]);

		vscode.window.showInformationMessage('✅ Azure OpenAI配置已保存，正在验证连接...');

		// 验证连接
		const validation = await this.validateAPI();
		if (validation.isValid) {
			vscode.window.showInformationMessage('🎉 API连接验证成功！');
			return true;
		} else {
			vscode.window.showErrorMessage(`❌ API验证失败: ${validation.error}`);
			return false;
		}
	}

	/**
	 * 验证阿里云通义千问 API
	 */
	private async validateAlibaba(startTime: number): Promise<APIValidationResult> {
		const { apiKey, baseUrl, model } = this.config.alibaba;

		// 判断是否使用兼容模式
		const isCompatibleMode = baseUrl.includes('compatible-mode');
		const url = isCompatibleMode
			? `${baseUrl}/chat/completions`
			: `${baseUrl}/api/v1/services/aigc/text-generation/generation`;

		this.log(`验证阿里云通义千问 API: ${url} (${isCompatibleMode ? 'OpenAI兼容模式' : '原生模式'})`);

		try {
			let requestData: any;
			if (isCompatibleMode) {
				// OpenAI兼容模式
				requestData = {
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				};
			} else {
				// 阿里云原生模式
				requestData = {
					model: model,
					input: {
						messages: [
							{
								role: 'user',
								content: 'Hello! This is a connection test.'
							}
						]
					},
					parameters: {
						max_tokens: 10,
						temperature: 0.1
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
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'alibaba',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: model,
					usage: response.data.usage,
					mode: isCompatibleMode ? 'compatible' : 'native'
				}
			};

			this.log(`阿里云验证成功 - 响应时间: ${responseTime}ms, 模型: ${model}, 模式: ${isCompatibleMode ? '兼容模式' : '原生模式'}`);
			return result;

		} catch (error: any) {
			return this.handleValidationError(error, 'alibaba', model, startTime);
		}
	}

	/**
	 * 验证月之暗面 Kimi API
	 */
	private async validateMoonshot(startTime: number): Promise<APIValidationResult> {
		const { apiKey, baseUrl, model } = this.config.moonshot;
		const url = `${baseUrl}/v1/chat/completions`;

		this.log(`验证月之暗面 Kimi API: ${url}`);

		try {
			const response = await axios.post(
				url,
				{
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				},
				{
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					},
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'moonshot',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: response.data.model,
					usage: response.data.usage
				}
			};

			this.log(`月之暗面验证成功 - 响应时间: ${responseTime}ms, 模型: ${response.data.model}`);
			return result;

		} catch (error: any) {
			return this.handleValidationError(error, 'moonshot', model, startTime);
		}
	}

	/**
	 * 验证智谱 GLM API
	 */
	private async validateZhipu(startTime: number): Promise<APIValidationResult> {
		const { apiKey, baseUrl, model } = this.config.zhipu;
		const url = `${baseUrl}/api/paas/v4/chat/completions`;

		this.log(`验证智谱 GLM API: ${url}`);

		try {
			const response = await axios.post(
				url,
				{
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				},
				{
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					},
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'zhipu',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: response.data.model,
					usage: response.data.usage
				}
			};

			this.log(`智谱验证成功 - 响应时间: ${responseTime}ms, 模型: ${response.data.model}`);
			return result;

		} catch (error: any) {
			return this.handleValidationError(error, 'zhipu', model, startTime);
		}
	}

	/**
	 * 验证百川智能 API
	 */
	private async validateBaichuan(startTime: number): Promise<APIValidationResult> {
		const { apiKey, baseUrl, model } = this.config.baichuan;
		const url = `${baseUrl}/v1/chat/completions`;

		this.log(`验证百川智能 API: ${url}`);

		try {
			const response = await axios.post(
				url,
				{
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				},
				{
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					},
					timeout: this.config.timeout
				}
			);

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'baichuan',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					model: response.data.model,
					usage: response.data.usage
				}
			};

			this.log(`百川验证成功 - 响应时间: ${responseTime}ms, 模型: ${response.data.model}`);
			return result;

		} catch (error: any) {
			return this.handleValidationError(error, 'baichuan', model, startTime);
		}
	}

	/**
	 * 验证自定义部署 API
	 */
	private async validateCustom(startTime: number): Promise<APIValidationResult> {
		const { apiKey, baseUrl, model, apiFormat } = this.config.custom;

		this.log(`验证自定义部署 API: ${baseUrl}, 格式: ${apiFormat}`);

		try {
			let url = baseUrl;
			let requestData: any;
			let headers: any = {
				'Content-Type': 'application/json'
			};

			// 根据 API 格式设置请求
			if (apiFormat === 'openai') {
				url = `${baseUrl}/v1/chat/completions`;
				requestData = {
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10,
					temperature: 0.1
				};
				if (apiKey) {
					headers['Authorization'] = `Bearer ${apiKey}`;
				}
			} else if (apiFormat === 'ollama') {
				url = `${baseUrl}/api/generate`;
				requestData = {
					model: model,
					prompt: 'Hello! This is a connection test.',
					stream: false
				};
			} else {
				// 默认使用 OpenAI 格式
				url = `${baseUrl}/v1/chat/completions`;
				requestData = {
					model: model,
					messages: [
						{
							role: 'user',
							content: 'Hello! This is a connection test.'
						}
					],
					max_tokens: 10
				};
				if (apiKey) {
					headers['Authorization'] = `Bearer ${apiKey}`;
				}
			}

			const response = await axios.post(url, requestData, {
				headers,
				timeout: this.config.timeout
			});

			const responseTime = Date.now() - startTime;
			const result: APIValidationResult = {
				isValid: true,
				provider: 'custom',
				model: model,
				responseTime: responseTime,
				details: {
					status: response.status,
					apiFormat: apiFormat,
					response: response.data
				}
			};

			this.log(`自定义部署验证成功 - 响应时间: ${responseTime}ms, 模型: ${model}`);
			return result;

		} catch (error: any) {
			return this.handleValidationError(error, 'custom', model, startTime);
		}
	}

	/**
	 * 统一处理验证错误
	 */
	private handleValidationError(error: any, provider: string, model: string, startTime: number): APIValidationResult {
		const responseTime = Date.now() - startTime;
		let errorMessage = '未知错误';

		if (error.response) {
			const status = error.response.status;
			const errorData = error.response.data?.error;

			switch (status) {
				case 401:
					errorMessage = 'API密钥无效或已过期';
					break;
				case 403:
					errorMessage = 'API访问被拒绝，请检查权限';
					break;
				case 404:
					errorMessage = '模型不存在或API端点错误';
					break;
				case 429:
					errorMessage = 'API调用频率超限或余额不足';
					break;
				case 500:
				case 502:
				case 503:
					errorMessage = 'API服务器错误，请稍后重试';
					break;
				default:
					errorMessage = errorData?.message || `HTTP ${status} 错误`;
			}
		} else if (error.request) {
			errorMessage = '网络连接失败，请检查网络设置和API端点';
		} else {
			errorMessage = error.message;
		}

		const result: APIValidationResult = {
			isValid: false,
			provider: provider,
			model: model,
			error: errorMessage,
			responseTime: responseTime,
			details: error.response?.data
		};

		this.log(`${provider}验证失败: ${errorMessage}`);
		return result;
	}

	/**
	 * 日志输出
	 */
	private log(message: string): void {
		const timestamp = new Date().toLocaleTimeString();
		this.outputChannel.appendLine(`[${timestamp}] ${message}`);

		if (this.config.enableDebugLogs) {
			console.log(`[Prompt Pilot API] ${message}`);
		}
	}

	/**
	 * 显示输出面板
	 */
	public showLogs(): void {
		this.outputChannel.show();
	}

	/**
	 * 清理资源
	 */
	public dispose(): void {
		this.outputChannel.dispose();
	}
}