import * as vscode from 'vscode';
import * as path from 'path';
import { APIConfigService, APIConfig } from '../services/APIConfigService';

export class ConfigPanel {
	public static currentPanel: ConfigPanel | undefined;
	public static readonly viewType = 'promptPilotConfig';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private apiConfigService: APIConfigService;

	public static createOrShow(extensionUri: vscode.Uri, apiConfigService: APIConfigService) {
		const column = vscode.window.activeTextEditor?.viewColumn;

		if (ConfigPanel.currentPanel) {
			ConfigPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			ConfigPanel.viewType,
			'Prompt Pilot 配置',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, 'media')
				],
				retainContextWhenHidden: true
			}
		);

		ConfigPanel.currentPanel = new ConfigPanel(panel, extensionUri, apiConfigService);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		apiConfigService: APIConfigService
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this.apiConfigService = apiConfigService;

		this._update();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.onDidChangeViewState(
			() => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				await this.handleMessage(message);
			},
			null,
			this._disposables
		);
	}

	private async handleMessage(message: any) {
		console.log('配置面板收到消息:', message.command);

		switch (message.command) {
			case 'getConfig':
				await this.sendCurrentConfig();
				break;

			case 'updateConfig':
				await this.updateConfig(message.config);
				break;

			case 'validateAPI':
				await this.validateAPI();
				break;

			case 'testConnection':
				await this.testConnection(message.config);
				break;

			case 'resetConfig':
				await this.resetConfig();
				break;
		}
	}

	private async sendCurrentConfig() {
		const config = this.apiConfigService.getConfig();
		this._panel.webview.postMessage({
			command: 'configLoaded',
			config: config
		});
	}

	private async updateConfig(newConfig: any) {
		try {
			const configuration = vscode.workspace.getConfiguration('prompt-pilot');

			// 更新所有配置项
			const updatePromises = [];

			if (newConfig.provider) {
				updatePromises.push(configuration.update('provider', newConfig.provider, vscode.ConfigurationTarget.Global));
			}

			// OpenAI 配置
			if (newConfig.openai) {
				Object.keys(newConfig.openai).forEach(key => {
					if (newConfig.openai[key] !== undefined) {
						updatePromises.push(configuration.update(`openai.${key}`, newConfig.openai[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// Azure 配置
			if (newConfig.azure) {
				Object.keys(newConfig.azure).forEach(key => {
					if (newConfig.azure[key] !== undefined) {
						updatePromises.push(configuration.update(`azure.${key}`, newConfig.azure[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 阿里云配置
			if (newConfig.alibaba) {
				Object.keys(newConfig.alibaba).forEach(key => {
					if (newConfig.alibaba[key] !== undefined) {
						updatePromises.push(configuration.update(`alibaba.${key}`, newConfig.alibaba[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 月之暗面配置
			if (newConfig.moonshot) {
				Object.keys(newConfig.moonshot).forEach(key => {
					if (newConfig.moonshot[key] !== undefined) {
						updatePromises.push(configuration.update(`moonshot.${key}`, newConfig.moonshot[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 智谱配置
			if (newConfig.zhipu) {
				Object.keys(newConfig.zhipu).forEach(key => {
					if (newConfig.zhipu[key] !== undefined) {
						updatePromises.push(configuration.update(`zhipu.${key}`, newConfig.zhipu[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 百川配置
			if (newConfig.baichuan) {
				Object.keys(newConfig.baichuan).forEach(key => {
					if (newConfig.baichuan[key] !== undefined) {
						updatePromises.push(configuration.update(`baichuan.${key}`, newConfig.baichuan[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 自定义配置
			if (newConfig.custom) {
				Object.keys(newConfig.custom).forEach(key => {
					if (newConfig.custom[key] !== undefined) {
						updatePromises.push(configuration.update(`custom.${key}`, newConfig.custom[key], vscode.ConfigurationTarget.Global));
					}
				});
			}

			// 通用配置
			['timeout', 'retryAttempts', 'enableDebugLogs'].forEach(key => {
				if (newConfig[key] !== undefined) {
					updatePromises.push(configuration.update(key, newConfig[key], vscode.ConfigurationTarget.Global));
				}
			});

			await Promise.all(updatePromises);

			this._panel.webview.postMessage({
				command: 'configUpdated',
				success: true,
				message: '配置已保存'
			});

			// 通知用户配置已更新
			vscode.window.showInformationMessage('✅ 配置已保存');

		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'configUpdated',
				success: false,
				message: `保存配置失败: ${error.message}`
			});

			vscode.window.showErrorMessage(`保存配置失败: ${error.message}`);
		}
	}

	private async validateAPI() {
		try {
			this._panel.webview.postMessage({
				command: 'validationStarted'
			});

			const result = await this.apiConfigService.validateAPI();

			this._panel.webview.postMessage({
				command: 'validationResult',
				result: result
			});

		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'validationResult',
				result: {
					isValid: false,
					error: `验证过程出错: ${error.message}`
				}
			});
		}
	}

	private async testConnection(config: any) {
		try {
			this._panel.webview.postMessage({
				command: 'testStarted'
			});

			// 创建临时配置进行测试
			// 这里可以实现不保存配置的测试逻辑
			const result = await this.apiConfigService.validateAPI();

			this._panel.webview.postMessage({
				command: 'testResult',
				result: result
			});

		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'testResult',
				result: {
					isValid: false,
					error: `连接测试失败: ${error.message}`
				}
			});
		}
	}

	private async resetConfig() {
		try {
			const choice = await vscode.window.showWarningMessage(
				'确定要重置所有配置吗？这将清除所有已保存的API配置。',
				{ modal: true },
				'确定重置',
				'取消'
			);

			if (choice === '确定重置') {
				const configuration = vscode.workspace.getConfiguration('prompt-pilot');

				// 重置所有配置项为默认值
				const resetPromises = [
					configuration.update('provider', 'openai', vscode.ConfigurationTarget.Global),
					configuration.update('openai.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('openai.model', 'gpt-3.5-turbo', vscode.ConfigurationTarget.Global),
					configuration.update('openai.baseUrl', 'https://api.openai.com', vscode.ConfigurationTarget.Global),
					configuration.update('openai.maxTokens', 2048, vscode.ConfigurationTarget.Global),
					configuration.update('openai.temperature', 0.7, vscode.ConfigurationTarget.Global),
					configuration.update('azure.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.endpoint', '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.deploymentName', '', vscode.ConfigurationTarget.Global),
					configuration.update('azure.apiVersion', '2023-12-01-preview', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.baseUrl', 'https://dashscope.aliyuncs.com', vscode.ConfigurationTarget.Global),
					configuration.update('alibaba.model', 'qwen-turbo', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.baseUrl', 'https://api.moonshot.cn', vscode.ConfigurationTarget.Global),
					configuration.update('moonshot.model', 'moonshot-v1-8k', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.baseUrl', 'https://open.bigmodel.cn', vscode.ConfigurationTarget.Global),
					configuration.update('zhipu.model', 'glm-4', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.baseUrl', 'https://api.baichuan-ai.com', vscode.ConfigurationTarget.Global),
					configuration.update('baichuan.model', 'Baichuan2-Turbo', vscode.ConfigurationTarget.Global),
					configuration.update('custom.baseUrl', '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.apiKey', '', vscode.ConfigurationTarget.Global),
					configuration.update('custom.model', 'llama2', vscode.ConfigurationTarget.Global),
					configuration.update('custom.apiFormat', 'openai', vscode.ConfigurationTarget.Global),
					configuration.update('timeout', 30000, vscode.ConfigurationTarget.Global),
					configuration.update('retryAttempts', 3, vscode.ConfigurationTarget.Global),
					configuration.update('enableDebugLogs', false, vscode.ConfigurationTarget.Global)
				];

				await Promise.all(resetPromises);

				this._panel.webview.postMessage({
					command: 'configReset',
					success: true
				});

				// 重新发送当前配置
				await this.sendCurrentConfig();

				vscode.window.showInformationMessage('✅ 配置已重置');
			}
		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'configReset',
				success: false,
				message: `重置配置失败: ${error.message}`
			});

			vscode.window.showErrorMessage(`重置配置失败: ${error.message}`);
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);

		// 发送当前配置
		setTimeout(() => {
			this.sendCurrentConfig();
		}, 100);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'config.js')
		);
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
		);
		const styleConfigUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'config.css')
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
			<link href="${styleConfigUri}" rel="stylesheet">
			<title>Prompt Pilot 配置</title>
		</head>
		<body>
			<div class="config-container">
				<header class="config-header">
					<h1>🚀 Prompt Pilot 配置</h1>
					<p>选择并配置您的 AI 服务提供商</p>
				</header>

				<div class="config-content">
					<!-- 提供商选择 -->
					<div class="config-section">
						<h2>AI 服务提供商</h2>
						<div class="provider-selector">
							<div class="provider-option" data-provider="openai">
								<div class="provider-icon">🌐</div>
								<div class="provider-info">
									<h3>OpenAI</h3>
									<p>使用 OpenAI 官方 API 服务</p>
								</div>
								<input type="radio" name="provider" value="openai" id="provider-openai">
							</div>
							<div class="provider-option" data-provider="azure">
								<div class="provider-icon">☁️</div>
								<div class="provider-info">
									<h3>Azure OpenAI</h3>
									<p>使用 Microsoft Azure OpenAI 服务</p>
								</div>
								<input type="radio" name="provider" value="azure" id="provider-azure">
							</div>
							<div class="provider-option" data-provider="alibaba">
								<div class="provider-icon">🇨🇳</div>
								<div class="provider-info">
									<h3>阿里云通义千问</h3>
									<p>使用阿里云通义千问模型服务</p>
								</div>
								<input type="radio" name="provider" value="alibaba" id="provider-alibaba">
							</div>
							<div class="provider-option" data-provider="moonshot">
								<div class="provider-icon">🌙</div>
								<div class="provider-info">
									<h3>月之暗面 Kimi</h3>
									<p>使用月之暗面 Kimi 模型服务</p>
								</div>
								<input type="radio" name="provider" value="moonshot" id="provider-moonshot">
							</div>
							<div class="provider-option" data-provider="zhipu">
								<div class="provider-icon">🤖</div>
								<div class="provider-info">
									<h3>智谱 GLM</h3>
									<p>使用智谱 GLM 模型服务</p>
								</div>
								<input type="radio" name="provider" value="zhipu" id="provider-zhipu">
							</div>
							<div class="provider-option" data-provider="baichuan">
								<div class="provider-icon">🌊</div>
								<div class="provider-info">
									<h3>百川智能</h3>
									<p>使用百川智能模型服务</p>
								</div>
								<input type="radio" name="provider" value="baichuan" id="provider-baichuan">
							</div>
							<div class="provider-option" data-provider="custom">
								<div class="provider-icon">🔧</div>
								<div class="provider-info">
									<h3>自定义部署</h3>
									<p>使用自己部署的模型服务</p>
								</div>
								<input type="radio" name="provider" value="custom" id="provider-custom">
							</div>
						</div>
					</div>

					<!-- OpenAI 配置 -->
					<div class="config-section" id="openai-config" style="display: none;">
						<h2>OpenAI 配置</h2>
						<div class="form-group">
							<label for="openai-api-key">API 密钥 *</label>
							<input type="password" id="openai-api-key" placeholder="sk-..." />
							<small>您的 OpenAI API 密钥</small>
						</div>
						<div class="form-group">
							<label for="openai-model">模型</label>
							<select id="openai-model">
								<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
								<option value="gpt-4">GPT-4</option>
								<option value="gpt-4-turbo">GPT-4 Turbo</option>
								<option value="gpt-4o">GPT-4o</option>
								<option value="gpt-4o-mini">GPT-4o Mini</option>
							</select>
						</div>
						<div class="form-group">
							<label for="openai-base-url">基础 URL</label>
							<input type="text" id="openai-base-url" placeholder="https://api.openai.com" />
							<small>如使用代理或其他兼容服务，可修改此项</small>
						</div>
					</div>

					<!-- Azure 配置 -->
					<div class="config-section" id="azure-config" style="display: none;">
						<h2>Azure OpenAI 配置</h2>
						<div class="form-group">
							<label for="azure-api-key">API 密钥 *</label>
							<input type="password" id="azure-api-key" placeholder="Azure API 密钥" />
						</div>
						<div class="form-group">
							<label for="azure-endpoint">端点 *</label>
							<input type="text" id="azure-endpoint" placeholder="https://your-resource.openai.azure.com" />
						</div>
						<div class="form-group">
							<label for="azure-deployment">部署名称 *</label>
							<input type="text" id="azure-deployment" placeholder="your-deployment-name" />
						</div>
						<div class="form-group">
							<label for="azure-api-version">API 版本</label>
							<select id="azure-api-version">
								<option value="2023-12-01-preview">2023-12-01-preview</option>
								<option value="2023-10-01-preview">2023-10-01-preview</option>
								<option value="2023-08-01-preview">2023-08-01-preview</option>
								<option value="2023-06-01-preview">2023-06-01-preview</option>
							</select>
						</div>
					</div>

					<!-- 阿里云配置 -->
					<div class="config-section" id="alibaba-config" style="display: none;">
						<h2>阿里云通义千问配置</h2>
						<div class="form-group">
							<label for="alibaba-api-key">API 密钥 *</label>
							<input type="password" id="alibaba-api-key" placeholder="阿里云 API 密钥" />
						</div>
						<div class="form-group">
							<label for="alibaba-base-url">API 基础 URL</label>
							<input type="text" id="alibaba-base-url" placeholder="https://dashscope.aliyuncs.com" />
							<small>阿里云通义千问 API 的基础 URL</small>
						</div>
						<div class="form-group">
							<label for="alibaba-model">模型</label>
							<select id="alibaba-model">
								<option value="qwen-turbo">Qwen Turbo</option>
								<option value="qwen-plus">Qwen Plus</option>
								<option value="qwen-max">Qwen Max</option>
								<option value="qwen-max-1201">Qwen Max 1201</option>
								<option value="qwen-max-longcontext">Qwen Max Long Context</option>
							</select>
						</div>
					</div>

					<!-- 月之暗面配置 -->
					<div class="config-section" id="moonshot-config" style="display: none;">
						<h2>月之暗面 Kimi 配置</h2>
						<div class="form-group">
							<label for="moonshot-api-key">API 密钥 *</label>
							<input type="password" id="moonshot-api-key" placeholder="月之暗面 API 密钥" />
						</div>
						<div class="form-group">
							<label for="moonshot-base-url">API 基础 URL</label>
							<input type="text" id="moonshot-base-url" placeholder="https://api.moonshot.cn" />
							<small>月之暗面 API 的基础 URL</small>
						</div>
						<div class="form-group">
							<label for="moonshot-model">模型</label>
							<select id="moonshot-model">
								<option value="moonshot-v1-8k">Moonshot v1 8K</option>
								<option value="moonshot-v1-32k">Moonshot v1 32K</option>
								<option value="moonshot-v1-128k">Moonshot v1 128K</option>
							</select>
						</div>
					</div>

					<!-- 智谱配置 -->
					<div class="config-section" id="zhipu-config" style="display: none;">
						<h2>智谱 GLM 配置</h2>
						<div class="form-group">
							<label for="zhipu-api-key">API 密钥 *</label>
							<input type="password" id="zhipu-api-key" placeholder="智谱 API 密钥" />
						</div>
						<div class="form-group">
							<label for="zhipu-base-url">API 基础 URL</label>
							<input type="text" id="zhipu-base-url" placeholder="https://open.bigmodel.cn" />
							<small>智谱 GLM API 的基础 URL</small>
						</div>
						<div class="form-group">
							<label for="zhipu-model">模型</label>
							<select id="zhipu-model">
								<option value="glm-4">GLM-4</option>
								<option value="glm-4v">GLM-4V</option>
								<option value="glm-3-turbo">GLM-3 Turbo</option>
							</select>
						</div>
					</div>

					<!-- 百川配置 -->
					<div class="config-section" id="baichuan-config" style="display: none;">
						<h2>百川智能配置</h2>
						<div class="form-group">
							<label for="baichuan-api-key">API 密钥 *</label>
							<input type="password" id="baichuan-api-key" placeholder="百川智能 API 密钥" />
						</div>
						<div class="form-group">
							<label for="baichuan-base-url">API 基础 URL</label>
							<input type="text" id="baichuan-base-url" placeholder="https://api.baichuan-ai.com" />
							<small>百川智能 API 的基础 URL</small>
						</div>
						<div class="form-group">
							<label for="baichuan-model">模型</label>
							<select id="baichuan-model">
								<option value="Baichuan2-Turbo">Baichuan2 Turbo</option>
								<option value="Baichuan2-Turbo-192k">Baichuan2 Turbo 192K</option>
								<option value="Baichuan3-Turbo">Baichuan3 Turbo</option>
								<option value="Baichuan3-Turbo-128k">Baichuan3 Turbo 128K</option>
							</select>
						</div>
					</div>

					<!-- 自定义配置 -->
					<div class="config-section" id="custom-config" style="display: none;">
						<h2>自定义模型配置</h2>
						<div class="form-group">
							<label for="custom-base-url">服务地址 *</label>
							<input type="text" id="custom-base-url" placeholder="http://localhost:11434" />
							<small>自定义模型服务的基础 URL</small>
						</div>
						<div class="form-group">
							<label for="custom-api-key">API 密钥</label>
							<input type="password" id="custom-api-key" placeholder="如果需要的话" />
							<small>部分自定义服务可能不需要 API 密钥</small>
						</div>
						<div class="form-group">
							<label for="custom-model">模型名称 *</label>
							<input type="text" id="custom-model" placeholder="llama2" />
							<small>要使用的模型名称，如 llama2、codellama 等</small>
						</div>
						<div class="form-group">
							<label for="custom-api-format">API 格式</label>
							<select id="custom-api-format">
								<option value="openai">OpenAI 兼容</option>
								<option value="ollama">Ollama</option>
								<option value="claude">Claude</option>
								<option value="custom">自定义</option>
							</select>
							<small>选择自定义服务使用的 API 格式</small>
						</div>
					</div>

					<!-- 高级设置 -->
					<div class="config-section">
						<h2>高级设置</h2>
						<div class="form-row">
							<div class="form-group">
								<label for="max-tokens">最大令牌数</label>
								<input type="number" id="max-tokens" min="100" max="8192" value="2048" />
							</div>
							<div class="form-group">
								<label for="temperature">温度参数</label>
								<input type="number" id="temperature" min="0" max="2" step="0.1" value="0.7" />
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label for="timeout">超时时间 (ms)</label>
								<input type="number" id="timeout" min="5000" max="120000" value="30000" />
							</div>
							<div class="form-group">
								<label for="retry-attempts">重试次数</label>
								<input type="number" id="retry-attempts" min="0" max="10" value="3" />
							</div>
						</div>
						<div class="form-group">
							<label class="checkbox-label">
								<input type="checkbox" id="enable-debug-logs" />
								<span>启用调试日志</span>
							</label>
						</div>
					</div>

					<!-- 操作按钮 -->
					<div class="config-actions">
						<button class="btn btn-test" id="test-btn">🧪 测试连接</button>
						<button class="btn btn-validate" id="validate-btn">✅ 验证配置</button>
						<button class="btn btn-save" id="save-btn">💾 保存配置</button>
						<button class="btn btn-reset" id="reset-btn">🔄 重置配置</button>
					</div>

					<!-- 状态显示 -->
					<div class="status-section" id="status-section" style="display: none;">
						<div class="status-content" id="status-content"></div>
					</div>
				</div>
			</div>

			<script nonce="${nonce}" src="${scriptUri}"></script>
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

	public dispose() {
		ConfigPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}
}