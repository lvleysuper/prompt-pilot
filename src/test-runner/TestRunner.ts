import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TestCase, TestResult } from '../models/Problem';

export class TestRunner {
	private workspaceRoot: string;

	constructor() {
		this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
	}

	async runTests(code: string, testCases: TestCase[], language: string = 'typescript'): Promise<TestResult[]> {
		const results: TestResult[] = [];

		for (const testCase of testCases) {
			const startTime = Date.now();
			try {
				const result = await this.executeTestCase(code, testCase, language);
				const endTime = Date.now();

				results.push({
					testCaseId: testCase.id,
					passed: result.passed,
					output: result.output,
					error: result.error,
					executionTime: endTime - startTime
				});
			} catch (error: any) {
				const endTime = Date.now();
				results.push({
					testCaseId: testCase.id,
					passed: false,
					output: '',
					error: error.message,
					executionTime: endTime - startTime
				});
			}
		}

		return results;
	}

	private async executeTestCase(code: string, testCase: TestCase, language: string): Promise<{
		passed: boolean;
		output: string;
		error?: string;
	}> {
		// 创建临时文件
		const tempDir = path.join(this.workspaceRoot, '.prompt-pilot-temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const fileName = language === 'typescript' ? 'temp.ts' : 'temp.js';
		const filePath = path.join(tempDir, fileName);

		try {
			// 解析测试用例输入
			const { functionCall, expectedOutput } = this.parseTestCase(testCase);

			// 生成测试代码
			const testCode = this.generateTestCode(code, functionCall, language);

			// 写入临时文件
			fs.writeFileSync(filePath, testCode);

			// 执行测试
			const result = await this.executeFile(filePath, language);

			// 比较结果
			const passed = this.compareResults(result.output, expectedOutput);

			return {
				passed,
				output: result.output,
				error: result.error
			};
		} catch (error: any) {
			return {
				passed: false,
				output: '',
				error: error.message
			};
		} finally {
			// 清理临时文件
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}
	}

	private parseTestCase(testCase: TestCase): { functionCall: string, expectedOutput: string } {
		// 解析形如 "nums = [2,7,11,15], target = 9" 的输入
		// 和 "[0,1]" 的期望输出

		const input = testCase.input;
		const expectedOutput = testCase.expectedOutput;

		// 简单的解析逻辑，实际项目中需要更复杂的解析
		if (input.includes('nums') && input.includes('target')) {
			const numsMatch = input.match(/nums\s*=\s*(\[.*?\])/);
			const targetMatch = input.match(/target\s*=\s*(\d+)/);

			if (numsMatch && targetMatch) {
				const nums = numsMatch[1];
				const target = targetMatch[1];
				return {
					functionCall: `twoSum(${nums}, ${target})`,
					expectedOutput: expectedOutput
				};
			}
		}

		// 默认处理
		return {
			functionCall: `solution(${input})`,
			expectedOutput: expectedOutput
		};
	}

	private generateTestCode(userCode: string, functionCall: string, language: string): string {
		if (language === 'typescript') {
			return `
${userCode}

// 测试执行
try {
    const result = ${functionCall};
    console.log(JSON.stringify(result));
} catch (error) {
    console.error('执行错误:', error.message);
    process.exit(1);
}
`;
		} else {
			return `
${userCode}

// 测试执行
try {
    const result = ${functionCall};
    console.log(JSON.stringify(result));
} catch (error) {
    console.error('执行错误:', error.message);
    process.exit(1);
}
`;
		}
	}

	private async executeFile(filePath: string, language: string): Promise<{
		output: string;
		error?: string;
	}> {
		return new Promise((resolve) => {
			const { spawn } = require('child_process');

			let command: string;
			let args: string[];

			if (language === 'typescript') {
				command = 'npx';
				args = ['ts-node', filePath];
			} else {
				command = 'node';
				args = [filePath];
			}

			const process = spawn(command, args, {
				cwd: this.workspaceRoot,
				shell: true
			});

			let output = '';
			let error = '';

			process.stdout.on('data', (data: Buffer) => {
				output += data.toString();
			});

			process.stderr.on('data', (data: Buffer) => {
				error += data.toString();
			});

			process.on('close', (code: number) => {
				if (code === 0) {
					resolve({ output: output.trim() });
				} else {
					resolve({
						output: output.trim(),
						error: error.trim() || `进程退出码: ${code}`
					});
				}
			});

			// 设置超时
			setTimeout(() => {
				process.kill();
				resolve({
					output: '',
					error: '执行超时'
				});
			}, 10000);
		});
	}

	private compareResults(actual: string, expected: string): boolean {
		try {
			// 尝试JSON解析比较
			const actualObj = JSON.parse(actual);
			const expectedObj = JSON.parse(expected);

			return JSON.stringify(actualObj) === JSON.stringify(expectedObj);
		} catch {
			// 如果不是JSON，进行字符串比较
			return actual.trim() === expected.trim();
		}
	}

	async validateEnvironment(): Promise<{
		hasNodeJS: boolean;
		hasTypeScript: boolean;
		canRunTests: boolean;
	}> {
		const hasNodeJS = await this.checkCommand('node --version');
		const hasTypeScript = await this.checkCommand('npx ts-node --version');

		return {
			hasNodeJS,
			hasTypeScript,
			canRunTests: hasNodeJS && hasTypeScript
		};
	}

	private async checkCommand(command: string): Promise<boolean> {
		return new Promise((resolve) => {
			const { exec } = require('child_process');
			exec(command, (error: any) => {
				resolve(!error);
			});
		});
	}
}