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
	// 自定义题目相关字段
	isCustom?: boolean;  // 是否为用户自定义题目
	author?: string;     // 题目作者
	submittedAt?: string; // 提交时间
	status?: 'pending' | 'approved' | 'rejected'; // 审核状态
	reviewedBy?: string;  // 审核员
	reviewedAt?: string;  // 审核时间
	reviewNotes?: string; // 审核备注
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
	completed: boolean;
	attempts: number;
}

// 用户提交历史记录
export interface UserSubmissionHistory {
	problemId: string;
	problemTitle: string;
	problemDifficulty: 'Easy' | 'Medium' | 'Hard';
	submissions: SubmissionRecord[];
	bestScore: number;
	totalAttempts: number;
	completed: boolean;
	lastAttemptDate: string;
}

// 单次提交记录
export interface SubmissionRecord {
	id: string;
	prompt: string;
	generatedCode: string;
	score: number;
	testsPassed: number;
	totalTests: number;
	timestamp: string;
	executionTime: number;
}

// Prompt助手任务
export interface PromptAssistantTask {
	id: string;
	taskDescription: string;
	generatedPrompt: string;
	optimizedPrompt?: string;
	timestamp: string;
	status: 'draft' | 'generated' | 'optimized';
}

export interface TestResult {
	testCaseId: string;
	passed: boolean;
	output: string;
	error?: string;
	executionTime: number;
}

// 自定义题目提交接口
export interface CustomProblemSubmission {
	id: string;
	title: string;
	description: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	category: string;
	templateCode: string;
	testCases: TestCase[];
	hints: string[];
	author: string;
	submittedAt: string;
	status: 'pending' | 'approved' | 'rejected';
	reviewNotes?: string;
}

// 题目审核接口
export interface ProblemReview {
	problemId: string;
	reviewerId: string;
	reviewerName: string;
	action: 'approve' | 'reject' | 'request_changes';
	notes: string;
	reviewedAt: string;
	suggestions?: ProblemSuggestion[];
}

// 题目修改建议
export interface ProblemSuggestion {
	field: string; // 字段名
	currentValue: string;
	suggestedValue: string;
	reason: string;
}