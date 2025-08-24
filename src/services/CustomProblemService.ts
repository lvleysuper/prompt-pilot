import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Problem, CustomProblemSubmission, ProblemReview, TestCase } from '../models/Problem';

export class CustomProblemService {
	private extensionPath: string;
	private pendingProblemsPath: string;
	private approvedProblemsPath: string;
	private rejectedProblemsPath: string;
	private reviewsPath: string;

	constructor(extensionPath: string) {
		this.extensionPath = extensionPath;
		this.pendingProblemsPath = path.join(extensionPath, 'data', 'custom-problems', 'pending');
		this.approvedProblemsPath = path.join(extensionPath, 'data', 'custom-problems', 'approved');
		this.rejectedProblemsPath = path.join(extensionPath, 'data', 'custom-problems', 'rejected');
		this.reviewsPath = path.join(extensionPath, 'data', 'custom-problems', 'reviews');
		this.ensureDirectories();
	}

	/**
	 * 确保必要的目录存在
	 */
	private ensureDirectories(): void {
		const dirs = [
			this.pendingProblemsPath,
			this.approvedProblemsPath,
			this.rejectedProblemsPath,
			this.reviewsPath
		];

		dirs.forEach(dir => {
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
		});
	}

	/**
	 * 提交自定义题目
	 */
	async submitCustomProblem(submission: Omit<CustomProblemSubmission, 'id' | 'submittedAt' | 'status'>): Promise<string> {
		try {
			const problemId = this.generateProblemId(submission.title);
			const customSubmission: CustomProblemSubmission = {
				...submission,
				id: problemId,
				submittedAt: new Date().toISOString(),
				status: 'pending'
			};

			// 验证题目数据
			this.validateProblemSubmission(customSubmission);

			// 保存到待审核目录
			const filePath = path.join(this.pendingProblemsPath, `${problemId}.json`);
			fs.writeFileSync(filePath, JSON.stringify(customSubmission, null, 2), 'utf8');

			vscode.window.showInformationMessage(`题目 "${submission.title}" 已提交，等待管理员审核`);
			return problemId;
		} catch (error: any) {
			vscode.window.showErrorMessage(`提交题目失败: ${error.message}`);
			throw error;
		}
	}

	/**
	 * 获取待审核的题目列表
	 */
	async getPendingProblems(): Promise<CustomProblemSubmission[]> {
		try {
			const files = fs.readdirSync(this.pendingProblemsPath);
			const problems: CustomProblemSubmission[] = [];

			for (const file of files) {
				if (file.endsWith('.json')) {
					const filePath = path.join(this.pendingProblemsPath, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const problem = JSON.parse(content) as CustomProblemSubmission;
					problems.push(problem);
				}
			}

			return problems.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
		} catch (error: any) {
			console.error('获取待审核题目失败:', error);
			return [];
		}
	}

	/**
	 * 审核题目
	 */
	async reviewProblem(problemId: string, review: Omit<ProblemReview, 'problemId' | 'reviewedAt'>): Promise<void> {
		try {
			const pendingFilePath = path.join(this.pendingProblemsPath, `${problemId}.json`);

			if (!fs.existsSync(pendingFilePath)) {
				throw new Error('题目不存在或已被处理');
			}

			const content = fs.readFileSync(pendingFilePath, 'utf8');
			const problem = JSON.parse(content) as CustomProblemSubmission;

			// 创建审核记录
			const fullReview: ProblemReview = {
				...review,
				problemId,
				reviewedAt: new Date().toISOString()
			};

			// 保存审核记录
			const reviewFilePath = path.join(this.reviewsPath, `${problemId}-review.json`);
			fs.writeFileSync(reviewFilePath, JSON.stringify(fullReview, null, 2), 'utf8');

			// 更新题目状态
			problem.status = review.action === 'approve' ? 'approved' : 'rejected';
			problem.reviewNotes = review.notes;

			// 移动题目到相应目录
			const targetDir = review.action === 'approve' ? this.approvedProblemsPath : this.rejectedProblemsPath;
			const targetFilePath = path.join(targetDir, `${problemId}.json`);

			if (review.action === 'approve') {
				// 转换为正式题目格式
				const approvedProblem: Problem = {
					id: problem.id,
					title: problem.title,
					description: problem.description,
					difficulty: problem.difficulty,
					category: problem.category,
					templateCode: problem.templateCode,
					testCases: problem.testCases,
					hints: problem.hints,
					topPrompts: [], // 新题目暂无TOP prompts
					isCustom: true,
					author: problem.author,
					submittedAt: problem.submittedAt,
					status: 'approved',
					reviewedBy: review.reviewerName,
					reviewedAt: fullReview.reviewedAt,
					reviewNotes: review.notes
				};

				// 保存到审核通过目录
				fs.writeFileSync(targetFilePath, JSON.stringify(approvedProblem, null, 2), 'utf8');

				// 同时添加到主题目目录，让所有用户可见
				const mainProblemsPath = path.join(this.extensionPath, 'data', 'problems');
				const mainFilePath = path.join(mainProblemsPath, `${problemId}.json`);
				fs.writeFileSync(mainFilePath, JSON.stringify(approvedProblem, null, 2), 'utf8');
			} else {
				// 保存到拒绝目录
				fs.writeFileSync(targetFilePath, JSON.stringify(problem, null, 2), 'utf8');
			}

			// 删除待审核文件
			fs.unlinkSync(pendingFilePath);

			const action = review.action === 'approve' ? '批准' : '拒绝';
			vscode.window.showInformationMessage(`题目 "${problem.title}" 已${action}`);

		} catch (error: any) {
			vscode.window.showErrorMessage(`审核题目失败: ${error.message}`);
			throw error;
		}
	}

	/**
	 * 获取用户提交的所有题目（包括各种状态）
	 */
	async getUserSubmissions(author: string): Promise<CustomProblemSubmission[]> {
		const submissions: CustomProblemSubmission[] = [];

		// 检查所有状态目录
		const dirs = [
			{ path: this.pendingProblemsPath, status: 'pending' as const },
			{ path: this.approvedProblemsPath, status: 'approved' as const },
			{ path: this.rejectedProblemsPath, status: 'rejected' as const }
		];

		for (const dir of dirs) {
			try {
				if (fs.existsSync(dir.path)) {
					const files = fs.readdirSync(dir.path);
					for (const file of files) {
						if (file.endsWith('.json')) {
							const filePath = path.join(dir.path, file);
							const content = fs.readFileSync(filePath, 'utf8');
							const problem = JSON.parse(content) as CustomProblemSubmission;

							if (problem.author === author) {
								submissions.push(problem);
							}
						}
					}
				}
			} catch (error) {
				console.error(`读取${dir.status}目录失败:`, error);
			}
		}

		return submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
	}

	/**
	 * 获取题目统计信息
	 */
	async getProblemStatistics(): Promise<{
		pending: number;
		approved: number;
		rejected: number;
		total: number;
	}> {
		const stats = {
			pending: 0,
			approved: 0,
			rejected: 0,
			total: 0
		};

		try {
			if (fs.existsSync(this.pendingProblemsPath)) {
				stats.pending = fs.readdirSync(this.pendingProblemsPath).filter(f => f.endsWith('.json')).length;
			}
			if (fs.existsSync(this.approvedProblemsPath)) {
				stats.approved = fs.readdirSync(this.approvedProblemsPath).filter(f => f.endsWith('.json')).length;
			}
			if (fs.existsSync(this.rejectedProblemsPath)) {
				stats.rejected = fs.readdirSync(this.rejectedProblemsPath).filter(f => f.endsWith('.json')).length;
			}
			stats.total = stats.pending + stats.approved + stats.rejected;
		} catch (error) {
			console.error('获取统计信息失败:', error);
		}

		return stats;
	}

	/**
	 * 验证题目提交数据
	 */
	private validateProblemSubmission(submission: CustomProblemSubmission): void {
		if (!submission.title.trim()) {
			throw new Error('题目标题不能为空');
		}
		if (!submission.description.trim()) {
			throw new Error('题目描述不能为空');
		}
		if (!submission.templateCode.trim()) {
			throw new Error('模板代码不能为空');
		}
		if (!submission.testCases || submission.testCases.length === 0) {
			throw new Error('至少需要提供一个测试用例');
		}
		if (!submission.author.trim()) {
			throw new Error('作者信息不能为空');
		}

		// 验证测试用例
		submission.testCases.forEach((testCase, index) => {
			if (!testCase.input.trim()) {
				throw new Error(`测试用例 ${index + 1} 的输入不能为空`);
			}
			if (!testCase.expectedOutput.trim()) {
				throw new Error(`测试用例 ${index + 1} 的期望输出不能为空`);
			}
		});
	}

	/**
	 * 生成题目ID
	 */
	private generateProblemId(title: string): string {
		// 将标题转换为URL友好的格式
		const base = title
			.toLowerCase()
			.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
			.replace(/^-+|-+$/g, '');

		// 添加时间戳确保唯一性
		const timestamp = Date.now().toString(36);
		return `custom-${base}-${timestamp}`;
	}
}