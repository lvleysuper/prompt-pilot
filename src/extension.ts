import * as vscode from 'vscode';
import { PromptPilotPanel } from './webview/PromptPilotPanel';
import { ProblemExplorer } from './models/ProblemExplorer';
import { LLMService } from './services/LLMService';
import { TestRunner } from './test-runner/TestRunner';

// 快速操作视图提供器
class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> = new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: QuickActionItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
		if (!element) {
			// 根级别项目
			return Promise.resolve([
				new QuickActionItem('🚀 打开主面板', '开始使用 Prompt Pilot', {
					command: 'prompt-pilot.openPanel',
					title: '打开主面板'
				}),
				new QuickActionItem('🎯 选择题目', '从列表中选择题目', {
					command: 'prompt-pilot.selectProblem',
					title: '选择题目'
				}),
				new QuickActionItem('🏆 TOP3 Prompts', '查看优秀 Prompt 示例', {
					command: 'prompt-pilot.viewTopPrompts',
					title: '查看 TOP3 Prompts'
				})
			]);
		}
		return Promise.resolve([]);
	}
}

class QuickActionItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly tooltip: string,
		public readonly command?: vscode.Command
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = tooltip;
		this.command = command;
	}
}

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

	// 注册命令：刷新题目列表
	const refreshProblemsCommand = vscode.commands.registerCommand('prompt-pilot.refreshProblems', () => {
		problemExplorer.refresh();
		vscode.window.showInformationMessage('题目列表已刷新');
	});

	// 注册树视图提供器
	const problemTreeView = vscode.window.createTreeView('promptPilotExplorer', {
		treeDataProvider: problemExplorer,
		showCollapseAll: true
	});

	// 创建快速操作视图
	const actionsProvider = new QuickActionsProvider();
	const actionsTreeView = vscode.window.createTreeView('promptPilotActions', {
		treeDataProvider: actionsProvider
	});

	// 添加到订阅列表
	context.subscriptions.push(
		openPanelCommand,
		selectProblemCommand,
		viewTopPromptsCommand,
		refreshProblemsCommand,
		problemTreeView,
		actionsTreeView
	);
}
