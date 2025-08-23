// Prompt Pilot WebView 主要 JavaScript 文件

// 全局错误处理
window.addEventListener('error', function (e) {
	console.error('🚫 全局错误:', e.error);
	const errorDiv = document.getElementById('errorMessage');
	if (errorDiv) {
		errorDiv.textContent = '页面加载出错: ' + (e.error?.message || '未知错误');
		errorDiv.style.display = 'block';
	}
});

// 资源加载失败处理
window.addEventListener('load', function () {
	console.log('🎉 页面加载完成');
});

(function () {
	const vscode = acquireVsCodeApi();

	// 状态管理
	let currentProblem = null;
	let problems = [];
	let generatedCode = '';

	// DOM 元素
	const elements = {
		problemList: document.getElementById('problemList'),
		problemDetails: document.getElementById('problemDetails'),
		problemTitle: document.getElementById('problemTitle'),
		problemDifficulty: document.getElementById('problemDifficulty'),
		problemDescription: document.getElementById('problemDescription'),
		problemHints: document.getElementById('problemHints'),
		promptInput: document.getElementById('promptInput'),
		analyzePromptBtn: document.getElementById('analyzePromptBtn'),
		generateCodeBtn: document.getElementById('generateCodeBtn'),
		promptAnalysis: document.getElementById('promptAnalysis'),
		codeSection: document.getElementById('codeSection'),
		generatedCode: document.getElementById('generatedCode'),
		explanation: document.getElementById('explanation'),
		acceptCodeBtn: document.getElementById('acceptCodeBtn'),
		runTestsBtn: document.getElementById('runTestsBtn'),
		testSection: document.getElementById('testSection'),
		testResults: document.getElementById('testResults'),
		welcomeScreen: document.getElementById('welcomeScreen'),
		loadingOverlay: document.getElementById('loadingOverlay'),
		loadingMessage: document.getElementById('loadingMessage'),
		errorMessage: document.getElementById('errorMessage')
	};

	// 更新元素引用（防止 null 引用）
	function updateElementReferences() {
		// 重新获取所有元素
		elements.problemList = document.getElementById('problemList');
		elements.problemDetails = document.getElementById('problemDetails');
		elements.problemTitle = document.getElementById('problemTitle');
		elements.problemDifficulty = document.getElementById('problemDifficulty');
		elements.problemDescription = document.getElementById('problemDescription');
		elements.problemHints = document.getElementById('problemHints');
		elements.promptInput = document.getElementById('promptInput');
		elements.analyzePromptBtn = document.getElementById('analyzePromptBtn');
		elements.generateCodeBtn = document.getElementById('generateCodeBtn');
		elements.promptAnalysis = document.getElementById('promptAnalysis');
		elements.codeSection = document.getElementById('codeSection');
		elements.generatedCode = document.getElementById('generatedCode');
		elements.explanation = document.getElementById('explanation');
		elements.acceptCodeBtn = document.getElementById('acceptCodeBtn');
		elements.runTestsBtn = document.getElementById('runTestsBtn');
		elements.testSection = document.getElementById('testSection');
		elements.testResults = document.getElementById('testResults');
		elements.welcomeScreen = document.getElementById('welcomeScreen');
		elements.loadingOverlay = document.getElementById('loadingOverlay');
		elements.loadingMessage = document.getElementById('loadingMessage');
		elements.errorMessage = document.getElementById('errorMessage');
	}

	// 初始化
	function init() {
		console.log('🚀 Prompt Pilot WebView 正在初始化...');

		try {
			// 验证关键 DOM 元素
			const requiredElements = [
				'problemList', 'problemDetails', 'welcomeScreen',
				'loadingOverlay', 'errorMessage', 'problemTitle',
				'promptInput', 'generateCodeBtn', 'analyzePromptBtn'
			];

			for (const elementId of requiredElements) {
				const element = document.getElementById(elementId);
				if (!element) {
					console.warn(`⚠️ 元素未找到: ${elementId}`);
				} else {
					console.log(`✅ 找到元素: ${elementId}`);
				}
			}

			// 重新获取元素引用（防止null引用）
			updateElementReferences();

			setupEventListeners();
			loadProblems();
			console.log('🎉 初始化完成');

		} catch (error) {
			console.error('❌ 初始化失败:', error);
			showError(`初始化失败: ${error.message}`);
		}
	}

	// 设置事件监听器
	function setupEventListeners() {
		console.log('设置事件监听器...');

		try {
			// 按钮事件（添加空值检查）
			if (elements.analyzePromptBtn) {
				elements.analyzePromptBtn.addEventListener('click', analyzePrompt);
				console.log('✅ analyzePromptBtn 事件监听器已设置');
			} else {
				console.warn('⚠️ analyzePromptBtn 元素未找到');
			}

			if (elements.generateCodeBtn) {
				elements.generateCodeBtn.addEventListener('click', generateCode);
				console.log('✅ generateCodeBtn 事件监听器已设置');
			} else {
				console.warn('⚠️ generateCodeBtn 元素未找到');
			}

			if (elements.acceptCodeBtn) {
				elements.acceptCodeBtn.addEventListener('click', acceptCode);
				console.log('✅ acceptCodeBtn 事件监听器已设置');
			}

			if (elements.runTestsBtn) {
				elements.runTestsBtn.addEventListener('click', runTests);
				console.log('✅ runTestsBtn 事件监听器已设置');
			}

			// Prompt输入事件
			if (elements.promptInput) {
				elements.promptInput.addEventListener('input', onPromptInput);
				console.log('✅ promptInput 事件监听器已设置');
			}

			// 监听来自扩展的消息
			window.addEventListener('message', handleExtensionMessage);
			console.log('✅ 扩展消息监听器已设置');

		} catch (error) {
			console.error('❌ 事件监听器设置失败:', error);
		}
	}

	// 处理扩展消息
	function handleExtensionMessage(event) {
		const message = event.data;

		switch (message.command) {
			case 'problemsLoaded':
				handleProblemsLoaded(message.problems);
				break;
			case 'problemLoaded':
				handleProblemLoaded(message.problem);
				break;
			case 'codeGenerated':
				handleCodeGenerated(message.response);
				break;
			case 'testResults':
				handleTestResults(message.results);
				break;
			case 'promptAnalyzed':
				handlePromptAnalyzed(message.analysis);
				break;
			case 'showLoading':
				showLoading(message.message);
				break;
			case 'showError':
				showError(message.message);
				break;
		}
	}

	// 加载问题列表
	function loadProblems() {
		vscode.postMessage({
			command: 'loadProblems'
		});
	}

	// 处理问题列表加载完成
	function handleProblemsLoaded(loadedProblems) {
		problems = loadedProblems;
		renderProblemList();
	}

	// 渲染问题列表
	function renderProblemList() {
		if (problems.length === 0) {
			elements.problemList.innerHTML = '<div class="no-problems">暂无题目</div>';
			return;
		}

		const html = problems.map(problem => `
            <div class="problem-item" data-problem-id="${problem.id}">
                <div class="title">${problem.title}</div>
                <div class="difficulty ${problem.difficulty}">${problem.difficulty}</div>
                <div class="category">${problem.category}</div>
            </div>
        `).join('');

		elements.problemList.innerHTML = html;

		// 为问题项添加点击事件
		elements.problemList.querySelectorAll('.problem-item').forEach(item => {
			item.addEventListener('click', () => {
				const problemId = item.dataset.problemId;
				selectProblem(problemId);
			});
		});
	}

	// 选择问题
	function selectProblem(problemId) {
		// 更新选中状态
		elements.problemList.querySelectorAll('.problem-item').forEach(item => {
			item.classList.remove('active');
		});

		const selectedItem = elements.problemList.querySelector(`[data-problem-id="${problemId}"]`);
		if (selectedItem) {
			selectedItem.classList.add('active');
		}

		// 加载问题详情
		vscode.postMessage({
			command: 'loadProblem',
			problemId: problemId
		});
	}

	// 处理问题加载完成
	function handleProblemLoaded(problem) {
		currentProblem = problem;
		renderProblemDetails(problem);
		elements.welcomeScreen.style.display = 'none';
		elements.problemDetails.style.display = 'block';

		// 重置状态
		resetSections();
	}

	// 渲染问题详情
	function renderProblemDetails(problem) {
		elements.problemTitle.textContent = problem.title;
		elements.problemDifficulty.textContent = problem.difficulty;
		elements.problemDifficulty.className = `difficulty ${problem.difficulty}`;
		elements.problemDescription.textContent = problem.description;

		// 渲染提示
		if (problem.hints && problem.hints.length > 0) {
			const hintsHtml = problem.hints.map(hint => `<li>${hint}</li>`).join('');
			elements.problemHints.innerHTML = `<ul>${hintsHtml}</ul>`;
		} else {
			elements.problemHints.innerHTML = '<p>暂无提示</p>';
		}

		// 清空之前的输入
		elements.promptInput.value = '';
		updateGenerateButton();
	}

	// 重置各个区域
	function resetSections() {
		elements.codeSection.style.display = 'none';
		elements.testSection.style.display = 'none';
		elements.promptAnalysis.style.display = 'none';
		elements.explanation.style.display = 'none';
		generatedCode = '';
	}

	// Prompt输入处理
	function onPromptInput() {
		updateGenerateButton();
	}

	// 更新生成按钮状态
	function updateGenerateButton() {
		const hasPrompt = elements.promptInput.value.trim().length > 0;
		elements.generateCodeBtn.disabled = !hasPrompt;
		elements.analyzePromptBtn.disabled = !hasPrompt;
	}

	// 分析Prompt
	function analyzePrompt() {
		const prompt = elements.promptInput.value.trim();
		if (!prompt) {
			showError('请输入Prompt');
			return;
		}

		vscode.postMessage({
			command: 'analyzePrompt',
			prompt: prompt
		});
	}

	// 处理Prompt分析结果
	function handlePromptAnalyzed(analysis) {
		hideLoading();

		const html = `
            <div class="analysis-score">
                <span class="score-badge">${analysis.score}/100</span>
                <span>Prompt质量评分</span>
            </div>
            <div class="analysis-feedback">
                <h4>详细反馈:</h4>
                <p>${analysis.feedback}</p>
            </div>
            <div class="improvements">
                <h4>改进建议:</h4>
                <ul>
                    ${analysis.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                </ul>
            </div>
        `;

		elements.promptAnalysis.innerHTML = html;
		elements.promptAnalysis.style.display = 'block';
	}

	// 生成代码
	function generateCode() {
		const prompt = elements.promptInput.value.trim();
		if (!prompt || !currentProblem) {
			showError('请输入Prompt并选择题目');
			return;
		}

		vscode.postMessage({
			command: 'generateCode',
			prompt: prompt,
			problem: currentProblem
		});
	}

	// 处理代码生成结果
	function handleCodeGenerated(response) {
		hideLoading();

		if (!response.success) {
			showError(response.error || '生成代码失败');
			return;
		}

		generatedCode = response.generatedCode;
		elements.generatedCode.textContent = generatedCode;
		elements.codeSection.style.display = 'block';

		if (response.explanation) {
			elements.explanation.innerHTML = `<h4>代码说明:</h4><p>${response.explanation}</p>`;
			elements.explanation.style.display = 'block';
		}

		// 滚动到代码区域
		elements.codeSection.scrollIntoView({ behavior: 'smooth' });
	}

	// 接受代码
	function acceptCode() {
		if (!generatedCode || !currentProblem) {
			showError('没有可接受的代码');
			return;
		}

		vscode.postMessage({
			command: 'acceptCode',
			code: generatedCode,
			problem: currentProblem
		});
	}

	// 运行测试
	function runTests() {
		if (!generatedCode || !currentProblem) {
			showError('没有可测试的代码');
			return;
		}

		vscode.postMessage({
			command: 'runTests',
			code: generatedCode,
			problem: currentProblem
		});
	}

	// 处理测试结果
	function handleTestResults(results) {
		hideLoading();

		const html = results.map(result => {
			const statusClass = result.passed ? 'passed' : 'failed';
			const statusText = result.passed ? '通过' : '失败';

			return `
                <div class="test-result ${statusClass}">
                    <span class="test-status ${statusClass}">${statusText}</span>
                    <span class="test-description">测试用例 ${result.testCaseId}</span>
                    <span class="test-time">${result.executionTime}ms</span>
                    ${result.error ? `<div class="test-error">错误: ${result.error}</div>` : ''}
                    ${result.output ? `<div class="test-output">输出: ${result.output}</div>` : ''}
                </div>
            `;
		}).join('');

		elements.testResults.innerHTML = html;
		elements.testSection.style.display = 'block';

		// 统计结果
		const passedCount = results.filter(r => r.passed).length;
		const totalCount = results.length;

		if (passedCount === totalCount) {
			showSuccess(`🎉 恭喜！所有测试用例都通过了！(${passedCount}/${totalCount})`);
		} else {
			showError(`测试未完全通过 (${passedCount}/${totalCount})`);
		}

		// 滚动到测试结果
		elements.testSection.scrollIntoView({ behavior: 'smooth' });
	}

	// 显示加载状态
	function showLoading(message = '加载中...') {
		elements.loadingMessage.textContent = message;
		elements.loadingOverlay.style.display = 'flex';
	}

	// 隐藏加载状态
	function hideLoading() {
		elements.loadingOverlay.style.display = 'none';
	}

	// 显示错误消息
	function showError(message) {
		console.error('❌ 错误:', message);
		hideLoading();

		// 尝试多种方式显示错误
		const errorElement = elements.errorMessage || document.getElementById('errorMessage');

		if (errorElement) {
			errorElement.textContent = message;
			errorElement.style.display = 'block';
			console.log('✅ 错误消息已显示');

			// 3秒后自动隐藏
			setTimeout(() => {
				errorElement.style.display = 'none';
			}, 3000);
		} else {
			// 如果错误元素不存在，使用 alert 作为备用方案
			console.warn('⚠️ 错误元素未找到，使用 alert');
			alert('错误: ' + message);
		}

		// 在控制台显示堆栈信息
		if (typeof message === 'object' && message.stack) {
			console.error('堆栈信息:', message.stack);
		}
	}

	// 显示成功消息
	function showSuccess(message) {
		// 使用VSCode的信息通知
		vscode.postMessage({
			command: 'showSuccess',
			message: message
		});
	}

	// 键盘快捷键
	document.addEventListener('keydown', (e) => {
		// Ctrl+Enter 生成代码
		if (e.ctrlKey && e.key === 'Enter' && !elements.generateCodeBtn.disabled) {
			e.preventDefault();
			generateCode();
		}

		// Escape 关闭错误消息
		if (e.key === 'Escape') {
			elements.errorMessage.style.display = 'none';
		}
	});

	// 页面加载完成后初始化
	document.addEventListener('DOMContentLoaded', init);

	// 如果DOMContentLoaded已经触发，立即初始化
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();