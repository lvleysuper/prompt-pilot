import * as vscode from 'vscode';
import * as path from 'path';
import { Problem, PromptSubmission } from '../models/Problem';
import { LLMService, LLMRequest } from '../services/LLMService';
import { TestRunner } from '../test-runner/TestRunner';
import { ProblemExplorer } from '../models/ProblemExplorer';

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
			problemExplorer
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
		private problemExplorer: ProblemExplorer
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;

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
		switch (message.command) {
			case 'loadProblems':
				const problems = await this.problemExplorer.getProblems();
				this._panel.webview.postMessage({
					command: 'problemsLoaded',
					problems: problems
				});
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
                            <div class="problem-selector">
                                <h3>选择题目</h3>
                                <div id="problemList" class="problem-list">
                                    <div class="loading">加载中...</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="content-area">
                            <div id="problemDetails" class="problem-details" style="display: none;">
                                <div class="problem-header">
                                    <h2 id="problemTitle"></h2>
                                    <span id="problemDifficulty" class="difficulty"></span>
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
                            
                            <div id="welcomeScreen" class="welcome-screen">
                                <div class="welcome-content">
                                    <h2>欢迎使用 Prompt Pilot</h2>
                                    <p>选择一个编程题目开始你的 Prompt 技能提升之旅！</p>
                                    <div class="features">
                                        <div class="feature">
                                            <h4>🎯 精选题目</h4>
                                            <p>涵盖算法、数据结构等核心编程概念</p>
                                        </div>
                                        <div class="feature">
                                            <h4>🤖 AI 代码生成</h4>
                                            <p>基于你的 Prompt 生成高质量代码</p>
                                        </div>
                                        <div class="feature">
                                            <h4>📊 即时测试</h4>
                                            <p>自动运行测试用例验证代码正确性</p>
                                        </div>
                                        <div class="feature">
                                            <h4>🏆 学习优秀 Prompt</h4>
                                            <p>查看和分析 TOP3 优秀 Prompt</p>
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
}