import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Problem, TopPrompt, PromptAnalysis } from './Problem';

export class ProblemExplorer implements vscode.TreeDataProvider<ProblemItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<ProblemItem | undefined | null | void> = new vscode.EventEmitter<ProblemItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ProblemItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private problems: Problem[] = [];

	constructor(private extensionPath: string) {
		this.loadProblems();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ProblemItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ProblemItem): Thenable<ProblemItem[]> {
		if (!element) {
			// 根级别 - 显示所有问题
			return Promise.resolve(this.problems.map(problem =>
				new ProblemItem(problem.title, problem.difficulty, vscode.TreeItemCollapsibleState.None, {
					command: 'prompt-pilot.openPanel',
					title: '打开问题',
					arguments: [problem]
				})
			));
		}
		return Promise.resolve([]);
	}

	async getProblems(): Promise<Problem[]> {
		return this.problems;
	}

	async getProblem(id: string): Promise<Problem | undefined> {
		return this.problems.find(p => p.id === id);
	}

	private async loadProblems(): Promise<void> {
		try {
			const problemsPath = path.join(this.extensionPath, 'data', 'problems');
			if (fs.existsSync(problemsPath)) {
				const files = fs.readdirSync(problemsPath);
				this.problems = [];

				for (const file of files) {
					if (file.endsWith('.json')) {
						const filePath = path.join(problemsPath, file);
						const content = fs.readFileSync(filePath, 'utf8');
						const problem = JSON.parse(content) as Problem;
						this.problems.push(problem);
					}
				}
			} else {
				// 创建示例数据
				await this.createSampleProblems();
			}
		} catch (error) {
			console.error('加载问题失败:', error);
			await this.createSampleProblems();
		}
	}

	private async createSampleProblems(): Promise<void> {
		const problemsDir = path.join(this.extensionPath, 'data', 'problems');

		// 确保目录存在
		if (!fs.existsSync(problemsDir)) {
			fs.mkdirSync(problemsDir, { recursive: true });
		}

		const sampleProblems: Problem[] = [
			{
				id: 'two-sum',
				title: '两数之和',
				description: '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。',
				difficulty: 'Easy',
				category: '数组',
				templateCode: `function twoSum(nums: number[], target: number): number[] {
    // TODO: 实现两数之和
    return [];
}`,
				testCases: [
					{
						id: 'case1',
						input: 'nums = [2,7,11,15], target = 9',
						expectedOutput: '[0,1]',
						description: '因为 nums[0] + nums[1] == 9 ，返回 [0, 1]'
					},
					{
						id: 'case2',
						input: 'nums = [3,2,4], target = 6',
						expectedOutput: '[1,2]',
						description: '因为 nums[1] + nums[2] == 6 ，返回 [1, 2]'
					}
				],
				topPrompts: [
					{
						id: 'prompt1',
						rank: 1,
						prompt: '请实现一个函数来解决两数之和问题。给定一个整数数组和目标值，返回和为目标值的两个数的索引。要求：1）时间复杂度O(n) 2）使用哈希表优化查找 3）处理边界情况',
						author: 'expert_user',
						score: 95,
						analysis: {
							structure: ['问题描述', '性能要求', '技术提示', '边界处理'],
							techniques: ['哈希表优化', '时间复杂度约束', '边界情况处理'],
							scenarios: ['算法优化场景', '数据结构应用'],
							explanation: '该prompt结构清晰，明确了性能要求和实现方式，提供了关键的技术提示'
						},
						createdAt: '2024-01-01'
					}
				],
				hints: ['考虑使用哈希表来优化查找效率', '注意处理重复元素的情况']
			}
		];

		for (const problem of sampleProblems) {
			const filePath = path.join(problemsDir, `${problem.id}.json`);
			fs.writeFileSync(filePath, JSON.stringify(problem, null, 2));
		}

		this.problems = sampleProblems;
	}
}

class ProblemItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly difficulty: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label} - ${difficulty}`;
		this.description = difficulty;

		// 根据难度设置图标颜色
		this.iconPath = this.getDifficultyIcon(difficulty);
	}

	private getDifficultyIcon(difficulty: string): vscode.ThemeIcon {
		switch (difficulty) {
			case 'Easy':
				return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
			case 'Medium':
				return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.yellow'));
			case 'Hard':
				return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.red'));
			default:
				return new vscode.ThemeIcon('circle');
		}
	}
}