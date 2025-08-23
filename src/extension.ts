import * as vscode from 'vscode';
import { PromptPilotPanel } from './webview/PromptPilotPanel';
import { ProblemExplorer } from './models/ProblemExplorer';
import { LLMService } from './services/LLMService';
import { TestRunner } from './test-runner/TestRunner';

export function activate(context: vscode.ExtensionContext) {
	console.log('Prompt Pilot 插件已激活!');

	// 初始化服务
	const llmService = new LLMService();
	const testRunner = new TestRunner();
	const problemExplorer = new ProblemExplorer(context.extensionPath);

	// 注册命令：打开主面板
	const openPanelCommand = vscode.commands.registerCommand('prompt-pilot.openPanel', () => {
		PromptPilotPanel.createOrShow(context.extensionUri, llmService, testRunner, problemExplorer);
	});

	// 注册命令：选择题目
	const selectProblemCommand = vscode.commands.registerCommand('prompt-pilot.selectProblem', async () => {
		const problems = await problemExplorer.getProblems();
		const items = problems.map(p => ({
			label: p.title,
			description: p.difficulty,
			detail: p.description,
			problem: p
		}));

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: '选择一个编程题目'
		});

		if (selected) {
			PromptPilotPanel.createOrShow(context.extensionUri, llmService, testRunner, problemExplorer, selected.problem);
		}
	});

	// 注册命令：查看TOP3 Prompts
	const viewTopPromptsCommand = vscode.commands.registerCommand('prompt-pilot.viewTopPrompts', async () => {
		const problems = await problemExplorer.getProblems();
		const items = problems.map(p => ({
			label: p.title,
			description: `查看 ${p.title} 的TOP3 Prompts`,
			problem: p
		}));

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: '选择题目查看TOP3 Prompts'
		});

		if (selected) {
			PromptPilotPanel.showTopPrompts(context.extensionUri, selected.problem, problemExplorer);
		}
	});

	// 注册树视图提供器
	const treeDataProvider = problemExplorer;
	vscode.window.createTreeView('promptPilotExplorer', {
		treeDataProvider,
		showCollapseAll: true
	});

	// 添加到订阅列表
	context.subscriptions.push(
		openPanelCommand,
		selectProblemCommand,
		viewTopPromptsCommand
	);
}
