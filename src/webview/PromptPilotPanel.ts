import * as vscode from 'vscode';
import * as path from 'path';
import { Problem, PromptSubmission, CustomProblemSubmission } from '../models/Problem';
import { LLMService, LLMRequest } from '../services/LLMService';
import { TestRunner } from '../test-runner/TestRunner';
import { ProblemExplorer } from '../models/ProblemExplorer';
import { APIConfigService } from '../services/APIConfigService';
import { CustomProblemService } from '../services/CustomProblemService';

export class PromptPilotPanel {
	public static currentPanel: PromptPilotPanel | undefined;
	public static readonly viewType = 'promptPilot';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(
		extensionUri: vscode.Uri,
		llmService: LLMService,
		testRunner: TestRunner,
		problemExplorer: ProblemExplorer,
		apiConfigService: APIConfigService,
		customProblemService: CustomProblemService,
		selectedProblem?: Problem
	) {
		const column = vscode.window.activeTextEditor?.viewColumn;

		if (PromptPilotPanel.currentPanel) {
			PromptPilotPanel.currentPanel._panel.reveal(column);
			if (selectedProblem) {
				PromptPilotPanel.currentPanel.loadProblem(selectedProblem);
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			PromptPilotPanel.viewType,
			'Prompt Pilot',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, 'media'),
					vscode.Uri.joinPath(extensionUri, 'out')
				]
			}
		);

		PromptPilotPanel.currentPanel = new PromptPilotPanel(
			panel,
			extensionUri,
			llmService,
			testRunner,
			problemExplorer,
			apiConfigService,
			customProblemService
		);

		if (selectedProblem) {
			PromptPilotPanel.currentPanel.loadProblem(selectedProblem);
		}
	}

	public static showTopPrompts(
		extensionUri: vscode.Uri,
		problem: Problem,
		problemExplorer: ProblemExplorer
	) {
		const column = vscode.window.activeTextEditor?.viewColumn;

		const panel = vscode.window.createWebviewPanel(
			'promptPilotTopPrompts',
			`${problem.title} - TOP3 Prompts`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, 'media')
				]
			}
		);

		panel.webview.html = this.getTopPromptsHtml(panel.webview, extensionUri, problem);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		private llmService: LLMService,
		private testRunner: TestRunner,
		private problemExplorer: ProblemExplorer,
		private apiConfigService: APIConfigService,
		private customProblemService: CustomProblemService
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// WebView状态检查
		console.log('WebView 面板创建中...');

		// 先设置事件监听器，再更新内容
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.onDidChangeViewState(
			() => {
				if (this._panel.visible) {
					console.log('WebView 面板可见，更新内容...');
					// 确保DOM完全加载后再处理
					setTimeout(() => this._update(), 100);
				}
			},
			null,
			this._disposables
		);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				console.log('WebView 收到消息:', message.command);
				try {
					await this.handleMessage(message);
				} catch (error: any) {
					console.error('处理WebView消息时出错:', error);
					this._panel.webview.postMessage({
						command: 'showError',
						message: `消息处理失败: ${error.message}`
					});
				}
			},
			null,
			this._disposables
		);

		// 设置内容并等待WebView就绪
		this._update();

		// 检查WebView是否就绪，增加重试机制
		let retryCount = 0;
		const checkWebViewReady = () => {
			if (this._panel && this._panel.webview) {
				console.log('WebView 已就绪');
				// 发送初始化消息
				this._panel.webview.postMessage({
					command: 'webviewReady',
					message: 'WebView 已成功初始化'
				});
			} else if (retryCount < 5) {
				retryCount++;
				console.log(`WebView 未就绪，重试 ${retryCount}/5`);
				setTimeout(checkWebViewReady, 500);
			} else {
				console.error('WebView 初始化失败，已达最大重试次数');
			}
		};
		setTimeout(checkWebViewReady, 500);
	}

	private async handleMessage(message: any) {
		console.log(`处理WebView消息: ${message.command}`);

		switch (message.command) {
			case 'webviewInitialized':
				console.log('WebView 前端初始化完成');
				// 发送当前配置到前端
				this.sendCurrentConfig();
				break;

			case 'loadProblems':
				try {
					console.log('加载题目列表...');
					const problems = await this.problemExplorer.getProblems();
					console.log(`找到 ${problems.length} 个题目`);
					this._panel.webview.postMessage({
						command: 'problemsLoaded',
						problems: problems
					});
				} catch (error: any) {
					console.warn('⚠️ 加载题目失败，但不影响主页面:', error);
					// 发送空题目列表，不阻塞主页面
					this._panel.webview.postMessage({
						command: 'problemsLoaded',
						problems: [],
						error: error.message
					});
				}
				break;

			case 'loadProblem':
				const problem = await this.problemExplorer.getProblem(message.problemId);
				if (problem) {
					this._panel.webview.postMessage({
						command: 'problemLoaded',
						problem: problem
					});
				}
				break;

			case 'generatePrompt':
				await this.handleGeneratePrompt(message.task);
				break;

			case 'optimizePrompt':
				await this.handleOptimizePrompt(message.prompt);
				break;

			case 'loadSubmissionHistory':
				await this.handleLoadSubmissionHistory();
				break;

			case 'saveConfig':
				await this.saveConfig(message.config);
				break;

			case 'testConfig':
				await this.testConfig(message.config);
				break;

			case 'refreshProblems':
				await this.refreshProblems();
				break;

			case 'viewTopPrompts':
				await this.viewTopPrompts(message.problemId);
				break;

			case 'generateCode':
				await this.generateCode(message.prompt, message.problem);
				break;

			case 'runTests':
				await this.runTests(message.code, message.problem);
				break;

			case 'analyzePrompt':
				await this.analyzePrompt(message.prompt);
				break;

			case 'acceptCode':
				await this.acceptGeneratedCode(message.code, message.problem);
				break;

			case 'submitCustomProblem':
				await this.handleSubmitCustomProblem(message.submission);
				break;

			case 'loadPendingProblems':
				await this.handleLoadPendingProblems();
				break;

			case 'reviewProblem':
				await this.handleReviewProblem(message.problemId, message.review);
				break;

			case 'getUserSubmissions':
				await this.handleGetUserSubmissions(message.author);
				break;

			case 'getProblemStatistics':
				await this.handleGetProblemStatistics();
				break;

			case 'recordPromptUsage':
				await this.handleRecordPromptUsage(message.action, message.stats);
				break;
		}
	}

	private async sendCurrentConfig() {
		try {
			const config = this.apiConfigService.getConfig();

			// 根据当前提供商构建前端需要的扁平配置格式
			let frontendConfig = {
				provider: config.provider,
				apiKey: '',
				apiUrl: '',
				modelId: ''
			};

			// 根据提供商提取对应的配置
			if (config.provider === 'openai') {
				frontendConfig.apiKey = config.openai.apiKey;
				frontendConfig.apiUrl = config.openai.baseUrl;
				frontendConfig.modelId = config.openai.model;
			} else if (config.provider === 'azure') {
				frontendConfig.apiKey = config.azure.apiKey;
				frontendConfig.apiUrl = config.azure.endpoint;
				frontendConfig.modelId = config.azure.deploymentName;
			} else if (config.provider === 'alibaba') {
				frontendConfig.apiKey = config.alibaba.apiKey;
				frontendConfig.apiUrl = config.alibaba.baseUrl;
				frontendConfig.modelId = config.alibaba.model;
			} else if (config.provider === 'moonshot') {
				frontendConfig.apiKey = config.moonshot.apiKey;
				frontendConfig.apiUrl = config.moonshot.baseUrl;
				frontendConfig.modelId = config.moonshot.model;
			} else if (config.provider === 'zhipu') {
				frontendConfig.apiKey = config.zhipu.apiKey;
				frontendConfig.apiUrl = config.zhipu.baseUrl;
				frontendConfig.modelId = config.zhipu.model;
			} else if (config.provider === 'baichuan') {
				frontendConfig.apiKey = config.baichuan.apiKey;
				frontendConfig.apiUrl = config.baichuan.baseUrl;
				frontendConfig.modelId = config.baichuan.model;
			} else if (config.provider === 'custom') {
				frontendConfig.apiKey = config.custom.apiKey;
				frontendConfig.apiUrl = config.custom.baseUrl;
				frontendConfig.modelId = config.custom.model;
			}

			this._panel.webview.postMessage({
				command: 'configLoaded',
				config: frontendConfig
			});
			console.log('✅ 配置加载成功:', frontendConfig);
		} catch (error: any) {
			console.warn('⚠️ 获取配置失败，但不影响主页面加载:', error);
			// 发送默认配置或空配置，不阻塞主页面
			this._panel.webview.postMessage({
				command: 'configLoaded',
				config: {
					provider: 'openai',
					apiKey: '',
					apiUrl: 'https://api.openai.com',
					modelId: 'gpt-3.5-turbo'
				}
			});
		}
	}

	private async saveConfig(config: any) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在保存配置...'
			});

			// 使用VSCode配置 API直接更新
			const configuration = vscode.workspace.getConfiguration('prompt-pilot');
			const updatePromises: Thenable<void>[] = [];

			// 更新提供商
			if (config.provider) {
				updatePromises.push(configuration.update('provider', config.provider, vscode.ConfigurationTarget.Global));
			}

			// 根据提供商更新对应配置
			if (config.provider === 'openai') {
				updatePromises.push(
					configuration.update('openai.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('openai.baseUrl', config.apiUrl || 'https://api.openai.com', vscode.ConfigurationTarget.Global),
					configuration.update('openai.model', config.modelId || 'gpt-3.5-turbo', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'azure') {
				updatePromises.push(
					configuration.update('azure.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.endpoint', config.apiUrl || '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.deploymentName', config.modelId || '', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'alibaba') {
				updatePromises.push(
					configuration.update('alibaba.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.baseUrl', config.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.model', config.modelId || 'qwen-plus', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'moonshot') {
				updatePromises.push(
					configuration.update('moonshot.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.baseUrl', config.apiUrl || 'https://api.moonshot.cn', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.model', config.modelId || 'moonshot-v1-8k', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'zhipu') {
				updatePromises.push(
					configuration.update('zhipu.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.baseUrl', config.apiUrl || 'https://open.bigmodel.cn', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.model', config.modelId || 'glm-4', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'baichuan') {
				updatePromises.push(
					configuration.update('baichuan.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.baseUrl', config.apiUrl || 'https://api.baichuan-ai.com', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.model', config.modelId || 'Baichuan2-Turbo', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'custom') {
				updatePromises.push(
					configuration.update('custom.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.baseUrl', config.apiUrl || '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.model', config.modelId || '', vscode.ConfigurationTarget.Global)
				);
			}

			await Promise.all(updatePromises);

			// 刷新LLM服务配置
			this.llmService.refreshConfig();

			this._panel.webview.postMessage({
				command: 'configSaved',
				message: '配置保存成功!'
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `保存配置失败: ${error.message}`
			});
		}
	}

	private async testConfig(config: any) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在测试API连接...'
			});

			// 保存临时配置用于测试
			const configuration = vscode.workspace.getConfiguration('prompt-pilot');
			const updatePromises: Thenable<void>[] = [];

			// 更新提供商
			if (config.provider) {
				updatePromises.push(configuration.update('provider', config.provider, vscode.ConfigurationTarget.Global));
			}

			// 根据提供商更新对应配置
			if (config.provider === 'openai') {
				updatePromises.push(
					configuration.update('openai.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('openai.baseUrl', config.apiUrl || 'https://api.openai.com', vscode.ConfigurationTarget.Global),
					configuration.update('openai.model', config.modelId || 'gpt-3.5-turbo', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'azure') {
				updatePromises.push(
					configuration.update('azure.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.endpoint', config.apiUrl || '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.deploymentName', config.modelId || '', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'alibaba') {
				updatePromises.push(
					configuration.update('alibaba.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.baseUrl', config.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.model', config.modelId || 'qwen-plus', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'moonshot') {
				updatePromises.push(
					configuration.update('moonshot.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.baseUrl', config.apiUrl || 'https://api.moonshot.cn', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.model', config.modelId || 'moonshot-v1-8k', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'zhipu') {
				updatePromises.push(
					configuration.update('zhipu.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.baseUrl', config.apiUrl || 'https://open.bigmodel.cn', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.model', config.modelId || 'glm-4', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'baichuan') {
				updatePromises.push(
					configuration.update('baichuan.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.baseUrl', config.apiUrl || 'https://api.baichuan-ai.com', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.model', config.modelId || 'Baichuan2-Turbo', vscode.ConfigurationTarget.Global)
				);
			} else if (config.provider === 'custom') {
				updatePromises.push(
					configuration.update('custom.apiKey', config.apiKey || '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.baseUrl', config.apiUrl || '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.model', config.modelId || '', vscode.ConfigurationTarget.Global)
				);
			}

			await Promise.all(updatePromises);
			const result = await this.apiConfigService.validateAPI();

			if (result.isValid) {
				this._panel.webview.postMessage({
					command: 'testResult',
					result: {
						success: true,
						message: `✅ API连接成功!\n\n提供商: ${result.provider}\n模型: ${result.model}\n响应时间: ${result.responseTime}ms`
					}
				});
				// 刷新LLM服务配置
				this.llmService.refreshConfig();
			} else {
				this._panel.webview.postMessage({
					command: 'testResult',
					result: {
						success: false,
						message: `❌ API连接失败\n\n错误: ${result.error}`
					}
				});
			}
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'testResult',
				result: {
					success: false,
					message: `测试失败: ${error.message}`
				}
			});
		}
	}

	private async refreshProblems() {
		try {
			this.problemExplorer.refresh();
			const problems = await this.problemExplorer.getProblems();
			this._panel.webview.postMessage({
				command: 'problemsLoaded',
				problems: problems
			});
			vscode.window.showInformationMessage('题目列表已刷新');
		} catch (error: any) {
			vscode.window.showErrorMessage(`刷新题目失败: ${error.message}`);
		}
	}

	private async viewTopPrompts(problemId: string) {
		try {
			const problem = await this.problemExplorer.getProblem(problemId);
			if (problem) {
				PromptPilotPanel.showTopPrompts(this._extensionUri, problem, this.problemExplorer);
			}
		} catch (error: any) {
			vscode.window.showErrorMessage(`查看TOP3 Prompts失败: ${error.message}`);
		}
	}

	private async generateCode(prompt: string, problem: Problem) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在生成代码...'
			});

			const request: LLMRequest = {
				prompt: prompt,
				problemContext: `问题标题: ${problem.title}\n问题描述: ${problem.description}\n模板代码:\n${problem.templateCode}`,
				language: 'typescript'
			};

			const response = await this.llmService.generateCode(request);

			this._panel.webview.postMessage({
				command: 'codeGenerated',
				response: response
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `生成代码失败: ${error.message}`
			});
		}
	}

	private async runTests(code: string, problem: Problem) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在运行测试...'
			});

			// 检查测试环境
			const env = await this.testRunner.validateEnvironment();
			if (!env.canRunTests) {
				this._panel.webview.postMessage({
					command: 'showError',
					message: '测试环境未就绪。请确保安装了Node.js和TypeScript。'
				});
				return;
			}

			const testResults = await this.testRunner.runTests(code, problem.testCases);

			this._panel.webview.postMessage({
				command: 'testResults',
				results: testResults
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `运行测试失败: ${error.message}`
			});
		}
	}

	private async analyzePrompt(prompt: string) {
		try {
			const analysis = await this.llmService.analyzePrompt(prompt);
			this._panel.webview.postMessage({
				command: 'promptAnalyzed',
				analysis: analysis
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `分析失败: ${error.message}`
			});
		}
	}

	private async acceptGeneratedCode(code: string, problem: Problem) {
		// 在新文档中显示生成的代码
		const doc = await vscode.workspace.openTextDocument({
			content: code,
			language: 'typescript'
		});
		await vscode.window.showTextDocument(doc);

		vscode.window.showInformationMessage('代码已在新文件中打开，您可以进一步编辑和保存。');
	}

	// 新增方法

	// 处理生成Prompt请求
	private async handleGeneratePrompt(task: string) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在生成Prompt...'
			});

			// 使用LLM服务的专门Prompt生成方法
			const result = await this.llmService.generatePrompt(task);

			if (result.success) {
				this._panel.webview.postMessage({
					command: 'promptGenerated',
					prompt: result.generatedPrompt
				});
			} else {
				this._panel.webview.postMessage({
					command: 'showError',
					message: result.error || '生成Prompt失败'
				});
			}
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `生成Prompt失败: ${error.message}`
			});
		}
	}

	// 处理优化Prompt请求
	private async handleOptimizePrompt(prompt: string) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在优化Prompt...'
			});

			// 使用LLM服务优化Prompt
			const optimizedResult = await this.optimizePromptContent(prompt);

			this._panel.webview.postMessage({
				command: 'promptOptimized',
				result: optimizedResult
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `优化Prompt失败: ${error.message}`
			});
		}
	}

	// 处理加载提交历史请求
	private async handleLoadSubmissionHistory() {
		try {
			// 从存储中加载提交历史
			const history = await this.loadSubmissionHistory();

			this._panel.webview.postMessage({
				command: 'submissionHistoryLoaded',
				history: history
			});
		} catch (error: any) {
			console.warn('加载提交历史失败:', error);
			// 发送空历史
			this._panel.webview.postMessage({
				command: 'submissionHistoryLoaded',
				history: []
			});
		}
	}



	// 优化Prompt内容
	private async optimizePromptContent(prompt: string): Promise<{ optimizedPrompt: string, suggestions: string[], explanation: string }> {
		const systemPrompt = `你是一个专业的Prompt优化专家，擅长分析和改进AI Prompt的质量。

请对用户提供的Prompt进行分析和优化，并按照以下格式返回：

{
  "optimizedPrompt": "优化后的Prompt内容",
  "suggestions": ["优化建议1", "优化建议2"],
  "explanation": "优化原理和改进点的详细说明"
}

优化方向包括：
1. 明确性：使指令更加明确具体
2. 结构化：改善信息组织结构
3. 完整性：完善缺失的关键信息
4. 专业性：提高技术精准度`;

		try {
			const response = await this.llmService.generateCode({
				prompt: `请优化以下Prompt：\n\n${prompt}`,
				problemContext: systemPrompt,
				language: 'json'
			});

			try {
				const result = JSON.parse(response.generatedCode || '{}');
				return {
					optimizedPrompt: result.optimizedPrompt || prompt,
					suggestions: result.suggestions || [],
					explanation: result.explanation || '优化完成'
				};
			} catch (parseError) {
				// 如果JSON解析失败，返回原始响应
				return {
					optimizedPrompt: response.generatedCode || prompt,
					suggestions: ['优化建议已包含在优化后的Prompt中'],
					explanation: '优化完成，请查看优化后的Prompt'
				};
			}
		} catch (error) {
			throw new Error(`优化Prompt失败: ${error}`);
		}
	}

	// 加载提交历史
	private async loadSubmissionHistory(): Promise<any[]> {
		// 这里可以从文件系统或数据库加载历史记录
		// 目前返回模拟数据
		return [
			{
				problemId: 'reverse-linked-list',
				problemTitle: '反转链表',
				problemDifficulty: 'Easy',
				bestScore: 85,
				totalAttempts: 3,
				completed: true,
				lastAttemptDate: '2024-01-15'
			},
			{
				problemId: 'valid-parentheses',
				problemTitle: '有效括号',
				problemDifficulty: 'Easy',
				bestScore: 92,
				totalAttempts: 2,
				completed: true,
				lastAttemptDate: '2024-01-14'
			},
			{
				problemId: 'longest-common-prefix',
				problemTitle: '最长公共前缀',
				problemDifficulty: 'Easy',
				bestScore: 78,
				totalAttempts: 5,
				completed: false,
				lastAttemptDate: '2024-01-13'
			}
		];
	}

	public loadProblem(problem: Problem) {
		this._panel.webview.postMessage({
			command: 'problemLoaded',
			problem: problem
		});
	}

	public dispose() {
		PromptPilotPanel.currentPanel = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
		);

		const nonce = this.getNonce();

		return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>Prompt Pilot</title>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🚀 Prompt Pilot</h1>
                        <p>提升你的 Prompt 技能</p>
                    </header>
                    
                    <div class="main-content">
                        <div class="sidebar">
                            <div class="config-section">
                                <h3>⚙️ 配置</h3>
                                <div class="config-panel">
                                    <div class="provider-selection">
                                        <label>API 类型:</label>
                                        <select id="providerSelect">
                                            <option value="openai">OpenAI</option>
                                            <option value="azure">Azure OpenAI</option>
                                            <option value="alibaba">阿里云通义千问</option>
                                            <option value="moonshot">月之暗面 Kimi</option>
                                            <option value="zhipu">智谱 GLM</option>
                                            <option value="baichuan">百川智能</option>
                                            <option value="custom">自定义</option>
                                        </select>
                                    </div>
                                    <div class="config-fields">
                                        <div class="field">
                                            <label for="apiKey">API Key:</label>
                                            <input type="password" id="apiKey" placeholder="输入API Key">
                                        </div>
                                        <div class="field">
                                            <label for="apiUrl">API URL:</label>
                                            <input type="text" id="apiUrl" placeholder="API基础URL">
                                        </div>
                                        <div class="field">
                                            <label for="modelId">模型ID:</label>
                                            <input type="text" id="modelId" placeholder="模型名称">
                                        </div>
                                    </div>
                                    <div class="config-actions">
                                        <button id="saveConfigBtn" class="btn secondary">保存配置</button>
                                        <button id="testConfigBtn" class="btn primary">测试连接</button>
                                    </div>
                                    <div id="configStatus" class="config-status" style="display: none;"></div>
                                </div>
                            </div>
                            
                            <div class="submission-history">
                                <div class="history-header">
                                    <h3>📊 提交历史</h3>
                                    <div class="history-actions">
                                        <button id="refreshHistoryBtn" class="btn secondary small">🔄</button>
                                    </div>
                                </div>
                                <div id="submissionList" class="submission-list">
                                    <div class="empty-history">
                                        <p>暂无提交记录</p>
                                        <small>开始练习题目后会显示提交历史</small>
                                    </div>
                                </div>
                                <div class="history-stats">
                                    <div class="stats-header">
                                        <h4>🏆 统计信息</h4>
                                    </div>
                                    <div id="historyStats" class="stats-content">
                                        <div class="stat-item">
                                            <span class="stat-label">已完成:</span>
                                            <span id="completedCount" class="stat-value">0</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">平均得分:</span>
                                            <span id="averageScore" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">最高分:</span>
                                            <span id="bestScore" class="stat-value">--</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="content-area">
                            <!-- 题目详情页面 -->
                            <div id="problemDetails" class="problem-details" style="display: none;">
                                <div class="problem-header">
                                    <div class="problem-title-section">
                                        <button id="backToWelcomeBtn" class="btn secondary back-btn">← 返回主界面</button>
                                        <h2 id="problemTitle"></h2>
                                        <span id="problemDifficulty" class="difficulty"></span>
                                    </div>
                                </div>
                                <div id="problemDescription" class="problem-description"></div>
                                
                                <div class="prompt-section">
                                    <h3>编写你的 Prompt</h3>
                                    <div class="prompt-tips">
                                        <p>💡 提示：好的prompt应该包含清晰的问题描述、具体的要求和必要的技术细节</p>
                                    </div>
                                    <textarea id="promptInput" placeholder="在这里输入你的prompt..."></textarea>
                                    <div class="prompt-actions">
                                        <button id="analyzePromptBtn" class="btn secondary">分析 Prompt</button>
                                        <button id="generateCodeBtn" class="btn primary">生成代码</button>
                                    </div>
                                    <div id="promptAnalysis" class="prompt-analysis" style="display: none;"></div>
                                </div>
                                
                                <div id="codeSection" class="code-section" style="display: none;">
                                    <h3>生成的代码</h3>
                                    <div class="code-container">
                                        <pre><code id="generatedCode"></code></pre>
                                    </div>
                                    <div class="code-actions">
                                        <button id="acceptCodeBtn" class="btn primary">接受代码</button>
                                        <button id="runTestsBtn" class="btn secondary">运行测试</button>
                                    </div>
                                    <div id="explanation" class="explanation" style="display: none;"></div>
                                </div>
                                
                                <div id="testSection" class="test-section" style="display: none;">
                                    <h3>测试结果</h3>
                                    <div id="testResults" class="test-results"></div>
                                </div>
                                
                                <div class="hints-section">
                                    <h3>💡 提示</h3>
                                    <div id="problemHints" class="hints"></div>
                                </div>
                            </div>
                            
                            <!-- 主界面 -->
                            <div id="welcomeScreen" class="welcome-screen">
                                <div class="welcome-content">
                                    <h2>🚀 Prompt Pilot</h2>
                                    <p>提升 Prompt 技能，掌握 AI 编程</p>
                                    
                                    <!-- 功能卡片布局 -->
                                    <div class="features">
                                        <!-- 操作提示 -->
                                        <div class="action-hint">
                                            <p>💡 点击卡片开始体验</p>
                                        </div>
                                        
                                        <!-- 第一排：精选题目和Prompt助手 -->
                                        <div class="top-row">
                                            <div class="feature" id="featuredProblems">
                                                <div class="feature-icon">🎯</div>
                                                <h4>精选题目</h4>
                                                <p>开始练习</p>
                                                <div class="feature-stats">
                                                    <span><span id="totalProblems">0</span> 道题目可选</span>
                                                </div>
                                            </div>
                                            
                                            <div class="feature" id="promptAssistant">
                                                <div class="feature-icon">🤖</div>
                                                <h4>Prompt 助手</h4>
                                                <p>智能优化</p>
                                                <div class="feature-stats">
                                                    <span>AI 驱动优化</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 第二排：优秀示例（大卡片） -->
                                        <div class="bottom-row">
                                            <div class="feature-large" id="excellentPrompts">
                                                <div class="feature-header">
                                                    <div class="feature-icon">🏆</div>
                                                    <h4>优秀示例</h4>
                                                    <p>学习最佳实践和TOP3优秀Prompt</p>
                                                </div>
                                                <div id="topPromptsPreview" class="top-prompts-preview">
                                                    <div class="loading-placeholder">
                                                        <p>正在加载优秀示例...</p>
                                                        <small>点击查看详细的TOP3 Prompt分析</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="welcome-footer">
                                        <!-- 提示文字已移至卡片上方 -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 题目列表页面 -->
                            <div id="problemListScreen" class="problem-list-screen" style="display: none;">
                                <div class="list-header">
                                    <button id="backFromProblemsBtn" class="btn secondary back-btn">← 返回主界面</button>
                                    <h2>🎯 精选题目</h2>
                                    <div class="list-actions">
                                        <button id="refreshProblemsBtn" class="btn secondary">🔄 刷新</button>
                                    </div>
                                </div>
                                
                                <!-- 题目管理选项卡 -->
                                <div class="problem-tabs">
                                    <button class="tab-btn active" data-tab="problem-list">📚 题目列表</button>
                                    <button class="tab-btn" data-tab="submit-custom">📝 提交题目</button>
                                    <button class="tab-btn" data-tab="manage-problems" id="managementTab" style="display: none;">⚙️ 题目管理</button>
                                </div>
                                
                                <!-- 题目列表标签页 -->
                                <div id="problemListTab" class="tab-pane active">
                                    <div id="problemGrid" class="problem-grid">
                                        <div class="loading">加载中...</div>
                                    </div>
                                </div>
                                
                                <!-- 提交自定义题目标签页 -->
                                <div id="submitCustomTab" class="tab-pane" style="display: none;">
                                    <div class="submission-form-container">
                                        <div class="submission-header">
                                            <h3>📝 提交自定义题目</h3>
                                            <p>分享你的精彩题目，让更多人受益！</p>
                                        </div>
                                        
                                        <div class="submission-form">
                                            <form id="customProblemForm">
                                                <div class="form-section">
                                                    <h4>基本信息</h4>
                                                    <div class="form-group">
                                                        <label for="problemTitle">题目标题 <span class="required">*</span></label>
                                                        <input type="text" id="problemTitle" name="title" required 
                                                               placeholder="例如：两数之和"
                                                               maxlength="100">
                                                        <small>简洁明了的题目名称，不超过100个字符</small>
                                                    </div>
                                                    
                                                    <div class="form-row">
                                                        <div class="form-group">
                                                            <label for="problemDifficulty">难度级别 <span class="required">*</span></label>
                                                            <select id="problemDifficulty" name="difficulty" required>
                                                                <option value="">请选择难度</option>
                                                                <option value="Easy">🟢 Easy - 初级</option>
                                                                <option value="Medium">🟡 Medium - 中级</option>
                                                                <option value="Hard">🔴 Hard - 高级</option>
                                                            </select>
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label for="problemCategory">题目分类 <span class="required">*</span></label>
                                                            <input type="text" id="problemCategory" name="category" required 
                                                                   placeholder="例如：数组、字符串、树"
                                                                   maxlength="50">
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="form-group">
                                                        <label for="problemDescription">题目描述 <span class="required">*</span></label>
                                                        <textarea id="problemDescription" name="description" required 
                                                                  placeholder="请详细描述题目的背景、要求和约束条件..."
                                                                  rows="6"></textarea>
                                                        <small>清晰、准确的问题描述，包含输入输出格式和约束条件</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="form-section">
                                                    <h4>代码模板</h4>
                                                    <div class="form-group">
                                                        <label for="problemTemplate">初始代码模板 <span class="required">*</span></label>
                                                        <textarea id="problemTemplate" name="templateCode" required 
                                                                  placeholder="function solve() {\n    // TODO: 实现你的解决方案\n    return null;\n}"
                                                                  rows="8"></textarea>
                                                        <small>提供函数签名和基本结构，让用户可以快速开始</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="form-section">
                                                    <h4>测试用例</h4>
                                                    <div id="testCasesContainer">
                                                        <div class="test-case" data-index="0">
                                                            <div class="test-case-header">
                                                                <h5>测试用例 1</h5>
                                                                <button type="button" class="btn secondary small remove-test-case" style="display: none;">✖ 删除</button>
                                                            </div>
                                                            <div class="form-row">
                                                                <div class="form-group">
                                                                    <label>输入 <span class="required">*</span></label>
                                                                    <textarea name="testInput" required placeholder="例如：nums = [2,7,11,15], target = 9" rows="2"></textarea>
                                                                </div>
                                                                <div class="form-group">
                                                                    <label>期望输出 <span class="required">*</span></label>
                                                                    <textarea name="testOutput" required placeholder="例如：[0,1]" rows="2"></textarea>
                                                                </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label>用例说明</label>
                                                                <input type="text" name="testDescription" placeholder="解释此测试用例的意义">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button type="button" id="addTestCaseBtn" class="btn secondary">➕ 添加测试用例</button>
                                                </div>
                                                
                                                <div class="form-section">
                                                    <h4>提示信息（可选）</h4>
                                                    <div class="form-group">
                                                        <label for="problemHints">解题提示</label>
                                                        <textarea id="problemHints" name="hints" 
                                                                  placeholder="为用户提供一些解题指导，每行一个提示"
                                                                  rows="4"></textarea>
                                                        <small>每行一个提示，帮助用户理解解题思路</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="form-actions">
                                                    <button type="button" id="previewProblemBtn" class="btn secondary">👁️ 预览</button>
                                                    <button type="submit" class="btn primary">🚀 提交审核</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 题目管理标签页 -->
                                <div id="manageProblemsTab" class="tab-pane" style="display: none;">
                                    <div class="management-container">
                                        <div class="management-header">
                                            <h3>⚙️ 题目管理</h3>
                                            <div class="management-stats" id="managementStats">
                                                <span class="stat-item">待审核: <strong id="pendingCount">0</strong></span>
                                                <span class="stat-item">已通过: <strong id="approvedCount">0</strong></span>
                                                <span class="stat-item">已拒绝: <strong id="rejectedCount">0</strong></span>
                                            </div>
                                        </div>
                                        
                                        <div class="management-tabs">
                                            <button class="mgmt-tab-btn active" data-mgmt-tab="pending">待审核 (<span id="pendingTabCount">0</span>)</button>
                                            <button class="mgmt-tab-btn" data-mgmt-tab="history">审核历史</button>
                                            <button class="mgmt-tab-btn" data-mgmt-tab="my-submissions">我的提交</button>
                                        </div>
                                        
                                        <div class="mgmt-tab-content">
                                            <!-- 待审核页签 -->
                                            <div id="pendingMgmtTab" class="mgmt-tab-pane active">
                                                <div id="pendingProblemsContainer" class="problems-container">
                                                    <div class="loading">加载待审核题目...</div>
                                                </div>
                                            </div>
                                            
                                            <!-- 审核历史页签 -->
                                            <div id="historyMgmtTab" class="mgmt-tab-pane" style="display: none;">
                                                <div id="reviewHistoryContainer" class="history-container">
                                                    <p>审核历史功能开发中...</p>
                                                </div>
                                            </div>
                                            
                                            <!-- 我的提交页签 -->
                                            <div id="mySubmissionsMgmtTab" class="mgmt-tab-pane" style="display: none;">
                                                <div id="userSubmissionsContainer" class="submissions-container">
                                                    <div class="loading">加载我的提交...</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Prompt助手页面 -->
                            <div id="promptAssistantScreen" class="prompt-assistant-screen" style="display: none;">
                                <div class="assistant-header">
                                    <button id="backFromAssistantBtn" class="btn secondary back-btn">← 返回主界面</button>
                                    <h2>🤖 Prompt 助手</h2>
                                </div>
                                
                                <div class="assistant-modes">
                                    <div class="mode-tabs">
                                        <button id="generateModeBtn" class="mode-tab active">生成 Prompt</button>
                                        <button id="optimizeModeBtn" class="mode-tab">优化 Prompt</button>
                                    </div>
                                    
                                    <!-- 生成模式 -->
                                    <div id="generateMode" class="assistant-mode">
                                        <div class="mode-content">
                                            <h3>描述你的任务</h3>
                                            <p>请详细描述你想要完成的任务，我们会为你生成专业的 Prompt。</p>
                                            <textarea id="taskDescription" placeholder="例如：我需要一个函数来判断一个字符串是否为回文，要求使用TypeScript，并且要考虑边界情况..."></textarea>
                                            <button id="generatePromptBtn" class="btn primary">生成 Prompt</button>
                                            <div id="generatedPromptResult" class="result-section" style="display: none;"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- 优化模式 -->
                                    <div id="optimizeMode" class="assistant-mode" style="display: none;">
                                        <div class="mode-content">
                                            <h3>优化你的 Prompt</h3>
                                            <p>输入你已有的 Prompt，我们会分析并提供优化建议。</p>
                                            <textarea id="originalPrompt" placeholder="输入你的 Prompt..."></textarea>
                                            <button id="optimizePromptBtn" class="btn primary">优化 Prompt</button>
                                            <div id="optimizedPromptResult" class="result-section" style="display: none;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="loadingOverlay" class="loading-overlay" style="display: none;">
                        <div class="loading-spinner"></div>
                        <div id="loadingMessage">加载中...</div>
                    </div>
                    
                    <div id="errorMessage" class="error-message" style="display: none;"></div>
                </div>
                
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
	}

	private static getTopPromptsHtml(webview: vscode.Webview, extensionUri: vscode.Uri, problem: Problem): string {
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css')
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'media', 'main.css')
		);

		const topPromptsHtml = problem.topPrompts.map((prompt, index) => `
            <div class="top-prompt">
                <div class="prompt-header">
                    <span class="rank">TOP ${prompt.rank}</span>
                    <span class="score">评分: ${prompt.score}/100</span>
                    <span class="author">作者: ${prompt.author}</span>
                </div>
                <div class="prompt-content">
                    <h4>Prompt:</h4>
                    <pre>${prompt.prompt}</pre>
                </div>
                <div class="prompt-analysis">
                    <h4>技巧分析:</h4>
                    <div class="analysis-section">
                        <h5>结构分析:</h5>
                        <ul>${prompt.analysis.structure.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                    <div class="analysis-section">
                        <h5>使用技巧:</h5>
                        <ul>${prompt.analysis.techniques.map(t => `<li>${t}</li>`).join('')}</ul>
                    </div>
                    <div class="analysis-section">
                        <h5>适用场景:</h5>
                        <ul>${prompt.analysis.scenarios.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                    <div class="analysis-explanation">
                        <h5>专家解析:</h5>
                        <p>${prompt.analysis.explanation}</p>
                    </div>
                </div>
            </div>
        `).join('');

		return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>${problem.title} - TOP3 Prompts</title>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🏆 ${problem.title} - TOP3 Prompts</h1>
                        <p>学习优秀的 Prompt 写作技巧</p>
                    </header>
                    <div class="top-prompts-container">
                        ${topPromptsHtml}
                    </div>
                </div>
            </body>
            </html>`;
	}

	private getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	// === 自定义题目相关方法 ===

	/**
	 * 处理自定义题目提交
	 */
	private async handleSubmitCustomProblem(submission: any) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在提交自定义题目...'
			});

			// 获取当前用户（这里可以从配置或其他地方获取）
			const currentUser = await this.getCurrentUser();

			const problemData = {
				title: submission.title,
				description: submission.description,
				difficulty: submission.difficulty,
				category: submission.category,
				templateCode: submission.templateCode,
				testCases: submission.testCases,
				hints: submission.hints || [],
				author: currentUser
			};

			const problemId = await this.customProblemService.submitCustomProblem(problemData);

			this._panel.webview.postMessage({
				command: 'customProblemSubmitted',
				problemId: problemId,
				message: '题目提交成功！等待管理员审核。'
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `提交题目失败: ${error.message}`
			});
		}
	}

	/**
	 * 加载待审核题目
	 */
	private async handleLoadPendingProblems() {
		try {
			const pendingProblems = await this.customProblemService.getPendingProblems();
			this._panel.webview.postMessage({
				command: 'pendingProblemsLoaded',
				problems: pendingProblems
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `加载待审核题目失败: ${error.message}`
			});
		}
	}

	/**
	 * 处理题目审核
	 */
	private async handleReviewProblem(problemId: string, review: any) {
		try {
			this._panel.webview.postMessage({
				command: 'showLoading',
				message: '正在处理审核...'
			});

			// 获取当前审核员信息
			const currentUser = await this.getCurrentUser();

			const reviewData = {
				reviewerId: currentUser,
				reviewerName: currentUser,
				action: review.action,
				notes: review.notes,
				suggestions: review.suggestions || []
			};

			await this.customProblemService.reviewProblem(problemId, reviewData);

			this._panel.webview.postMessage({
				command: 'problemReviewed',
				problemId: problemId,
				message: `题目已${review.action === 'approve' ? '批准' : '拒绝'}`
			});

			// 重新加载待审核列表
			await this.handleLoadPendingProblems();

			// 刷新主题目列表（如果批准了题目）
			if (review.action === 'approve') {
				await this.refreshProblems();
			}
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `审核题目失败: ${error.message}`
			});
		}
	}

	/**
	 * 获取用户提交历史
	 */
	private async handleGetUserSubmissions(author: string) {
		try {
			const submissions = await this.customProblemService.getUserSubmissions(author);
			this._panel.webview.postMessage({
				command: 'userSubmissionsLoaded',
				submissions: submissions
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `获取提交历史失败: ${error.message}`
			});
		}
	}

	/**
	 * 获取题目统计信息
	 */
	private async handleGetProblemStatistics() {
		try {
			const statistics = await this.customProblemService.getProblemStatistics();
			this._panel.webview.postMessage({
				command: 'problemStatisticsLoaded',
				statistics: statistics
			});
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'showError',
				message: `获取统计信息失败: ${error.message}`
			});
		}
	}

	/**
	 * 处理Prompt使用统计记录
	 */
	private async handleRecordPromptUsage(action: string, stats: any) {
		try {
			console.log(`📊 记录Prompt使用统计: ${action}`, stats);

			// 这里可以将统计数据保存到文件或数据库中
			// 目前先简单地记录到控制台
			const configuration = vscode.workspace.getConfiguration('prompt-pilot');
			const existingStats = configuration.get('usageStats', {});

			// 更新统计数据
			const updatedStats = {
				...existingStats,
				...stats,
				lastUpdated: new Date().toISOString()
			};

			// 保存到VSCode配置
			await configuration.update('usageStats', updatedStats, vscode.ConfigurationTarget.Global);

			// 发送更新成功消息
			this._panel.webview.postMessage({
				command: 'promptUsageStatsUpdated',
				success: true,
				stats: updatedStats
			});
		} catch (error: any) {
			console.error('❌ 保存统计数据失败:', error);
			this._panel.webview.postMessage({
				command: 'promptUsageStatsUpdated',
				success: false,
				error: error.message
			});
		}
	}

	/**
	 * 获取当前用户标识
	 */
	private async getCurrentUser(): Promise<string> {
		// 可以从VSCode配置、Git配置或其他地方获取用户信息
		try {
			// 尝试从Git配置获取用户名
			const gitConfig = vscode.workspace.getConfiguration('git');
			const userName = gitConfig.get<string>('defaultCloneDirectory');

			// 或者从VSCode用户设置获取
			const userConfig = vscode.workspace.getConfiguration('prompt-pilot');
			const configuredUser = userConfig.get<string>('username');

			if (configuredUser) {
				return configuredUser;
			}

			// 默认使用系统用户名或生成匿名用户ID
			return process.env.USERNAME || process.env.USER || `user_${Date.now()}`;
		} catch (error) {
			return `anonymous_${Date.now()}`;
		}
	}
}