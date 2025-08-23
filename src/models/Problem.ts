export interface Problem {
	id: string;
	title: string;
	description: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	category: string;
	templateCode: string;
	testCases: TestCase[];
	topPrompts: TopPrompt[];
	hints: string[];
}

export interface TestCase {
	id: string;
	input: string;
	expectedOutput: string;
	description: string;
}

export interface TopPrompt {
	id: string;
	rank: number;
	prompt: string;
	author: string;
	score: number;
	analysis: PromptAnalysis;
	createdAt: string;
}

export interface PromptAnalysis {
	structure: string[];
	techniques: string[];
	scenarios: string[];
	explanation: string;
}

export interface PromptSubmission {
	problemId: string;
	prompt: string;
	generatedCode: string;
	testResults: TestResult[];
	score: number;
	timestamp: string;
}

export interface TestResult {
	testCaseId: string;
	passed: boolean;
	output: string;
	error?: string;
	executionTime: number;
}