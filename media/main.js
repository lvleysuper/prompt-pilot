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
		// 原有元素
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
		errorMessage: document.getElementById('errorMessage'),
		// 配置面板元素
		providerSelect: document.getElementById('providerSelect'),
		apiKey: document.getElementById('apiKey'),
		apiUrl: document.getElementById('apiUrl'),
		modelId: document.getElementById('modelId'),
		saveConfigBtn: document.getElementById('saveConfigBtn'),
		testConfigBtn: document.getElementById('testConfigBtn'),
		configStatus: document.getElementById('configStatus'),
		// 返回按钮
		backToWelcomeBtn: document.getElementById('backToWelcomeBtn'),
		// 统计信息元素
		completedCount: document.getElementById('completedCount'),
		averageScore: document.getElementById('averageScore'),
		bestScore: document.getElementById('bestScore'),
		// 新界面元素
		// 提交历史
		submissionList: document.getElementById('submissionList'),
		refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),
		// 功能版块
		featuredProblems: document.getElementById('featuredProblems'),
		promptAssistant: document.getElementById('promptAssistant'),
		excellentPrompts: document.getElementById('excellentPrompts'),
		// 题目列表页面
		problemListScreen: document.getElementById('problemListScreen'),
		problemGrid: document.getElementById('problemGrid'),
		backFromProblemsBtn: document.getElementById('backFromProblemsBtn'),
		refreshProblemsBtn: document.getElementById('refreshProblemsBtn'),
		// Prompt助手页面
		promptAssistantScreen: document.getElementById('promptAssistantScreen'),
		backFromAssistantBtn: document.getElementById('backFromAssistantBtn'),
		generateModeBtn: document.getElementById('generateModeBtn'),
		optimizeModeBtn: document.getElementById('optimizeModeBtn'),
		generateMode: document.getElementById('generateMode'),
		optimizeMode: document.getElementById('optimizeMode'),
		taskDescription: document.getElementById('taskDescription'),
		generatePromptBtn: document.getElementById('generatePromptBtn'),
		generatedPromptResult: document.getElementById('generatedPromptResult'),
		originalPrompt: document.getElementById('originalPrompt'),
		optimizePromptBtn: document.getElementById('optimizePromptBtn'),
		optimizedPromptResult: document.getElementById('optimizedPromptResult'),
		// 其他
		totalProblems: document.getElementById('totalProblems'),
		// 自定义题目相关元素（整合到题目列表页面）
		problemTabs: document.querySelectorAll('.tab-btn'),
		problemListTab: document.getElementById('problemListTab'),
		submitCustomTab: document.getElementById('submitCustomTab'),
		manageProblemsTab: document.getElementById('manageProblemsTab'),
		managementTab: document.getElementById('managementTab'),
		customProblemForm: document.getElementById('customProblemForm'),
		addTestCaseBtn: document.getElementById('addTestCaseBtn'),
		previewProblemBtn: document.getElementById('previewProblemBtn'),
		pendingProblemsContainer: document.getElementById('pendingProblemsContainer'),
		userSubmissionsContainer: document.getElementById('userSubmissionsContainer'),
		pendingCount: document.getElementById('pendingCount'),
		approvedCount: document.getElementById('approvedCount'),
		rejectedCount: document.getElementById('rejectedCount'),
		mgmtTabs: document.querySelectorAll('.mgmt-tab-btn')
	};

	// 更新元素引用（防止 null 引用）
	function updateElementReferences() {
		// 重新获取所有元素
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
		// 配置面板元素
		elements.providerSelect = document.getElementById('providerSelect');
		elements.apiKey = document.getElementById('apiKey');
		elements.apiUrl = document.getElementById('apiUrl');
		elements.modelId = document.getElementById('modelId');
		elements.saveConfigBtn = document.getElementById('saveConfigBtn');
		elements.testConfigBtn = document.getElementById('testConfigBtn');
		elements.configStatus = document.getElementById('configStatus');
		// 返回按钮
		elements.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
		// 统计信息元素
		elements.completedCount = document.getElementById('completedCount');
		elements.averageScore = document.getElementById('averageScore');
		elements.bestScore = document.getElementById('bestScore');
		// 新界面元素
		elements.submissionList = document.getElementById('submissionList');
		elements.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
		elements.featuredProblems = document.getElementById('featuredProblems');
		elements.promptAssistant = document.getElementById('promptAssistant');
		elements.excellentPrompts = document.getElementById('excellentPrompts');
	}

	// 初始化
	function init() {
		console.log('🚀 Prompt Pilot WebView 正在初始化...');

		// 在页面上显示调试信息
		const debugInfo = document.createElement('div');
		debugInfo.id = 'debugInfo';
		debugInfo.style.cssText = `
			position: fixed;
			top: 10px;
			left: 10px;
			background: #007acc;
			color: white;
			padding: 5px 10px;
			border-radius: 4px;
			font-size: 12px;
			z-index: 9999;
		`;
		debugInfo.textContent = '🚀 开始初始化 WebView';
		document.body.appendChild(debugInfo);

		try {
			// 等待DOM完全加载
			if (document.readyState !== 'complete') {
				console.log('等待DOM完全加载...');
				document.addEventListener('DOMContentLoaded', initAfterDOMReady);
				window.addEventListener('load', initAfterDOMReady);
				return;
			}

			initAfterDOMReady();
		} catch (error) {
			console.error('❌ 初始化失败:', error);
			showError(`初始化失败: ${error.message}`);
		}
	}

	// DOM就绪后的初始化
	function initAfterDOMReady() {
		console.log('DOM已就绪，开始初始化...');

		try {
			// 验证关键 DOM 元素
			const requiredElements = [
				'welcomeScreen', 'loadingOverlay', 'errorMessage',
				'problemDetails', 'problemTitle', 'promptInput',
				'generateCodeBtn', 'analyzePromptBtn', 'submissionList'
			];

			let missingElements = [];
			for (const elementId of requiredElements) {
				const element = document.getElementById(elementId);
				if (!element) {
					console.warn(`⚠️ 元素未找到: ${elementId}`);
					missingElements.push(elementId);
				} else {
					console.log(`✅ 找到元素: ${elementId}`);
					// 确保元素在DOM中并且可测量
					if (element.parentNode && document.body.contains(element)) {
						console.log(`✅ 元素在DOM中: ${elementId}`);
					} else {
						console.warn(`⚠️ 元素不在DOM中: ${elementId}`);
					}
				}
			}

			if (missingElements.length > 0) {
				throw new Error(`缺少关键元素: ${missingElements.join(', ')}`);
			}

			// 重新获取元素引用（防止null引用）
			updateElementReferences();

			// 设置事件监听器
			setupEventListeners();

			// 显示欢迎界面（包含重置状态）
			showWelcomeScreen();

			// 尝试加载TOP3 Prompt预览
			loadTopPromptsPreview();

			// 尝试加载题目（可选，不阻塞主页面）
			tryLoadProblems();

			// 加载提交历史
			refreshHistory();

			console.log('🎉 初始化完成');

			// 更新调试信息
			const debugInfo = document.getElementById('debugInfo');
			if (debugInfo) {
				debugInfo.textContent = '🎉 WebView 初始化完成';
				debugInfo.style.background = '#28a745';

				// 3秒后隐藏调试信息
				setTimeout(() => {
					debugInfo.style.display = 'none';
				}, 3000);
			}

			// 发送初始化确认给扩展
			console.log('📤 发送初始化确认给扩展');
			vscode.postMessage({
				command: 'webviewInitialized'
			});

		} catch (error) {
			console.error('❌ 初始化失败:', error);

			// 在页面上显示错误信息
			const debugInfo = document.getElementById('debugInfo');
			if (debugInfo) {
				debugInfo.textContent = '❌ 初始化失败: ' + error.message;
				debugInfo.style.background = '#dc3545';
			}

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

			// 配置面板事件
			if (elements.providerSelect) {
				elements.providerSelect.addEventListener('change', onProviderChange);
				console.log('✅ providerSelect 事件监听器已设置');
			}

			if (elements.saveConfigBtn) {
				elements.saveConfigBtn.addEventListener('click', saveConfig);
				console.log('✅ saveConfigBtn 事件监听器已设置');
			}

			if (elements.testConfigBtn) {
				elements.testConfigBtn.addEventListener('click', testConfig);
				console.log('✅ testConfigBtn 事件监听器已设置');
			}

			// 操作按钮事件
			if (elements.refreshProblemsBtn) {
				elements.refreshProblemsBtn.addEventListener('click', refreshProblems);
				console.log('✅ refreshProblemsBtn 事件监听器已设置');
			}

			if (elements.viewTopPromptsBtn) {
				elements.viewTopPromptsBtn.addEventListener('click', viewTopPrompts);
				console.log('✅ viewTopPromptsBtn 事件监听器已设置');
			}

			// 返回主界面按钮事件
			if (elements.backToWelcomeBtn) {
				elements.backToWelcomeBtn.addEventListener('click', backToWelcome);
				console.log('✅ backToWelcomeBtn 事件监听器已设置');
			}

			// 欢迎界面按钮事件
			if (elements.welcomeViewTopPromptsBtn) {
				elements.welcomeViewTopPromptsBtn.addEventListener('click', handleWelcomeTopPrompts);
				console.log('✅ welcomeViewTopPromptsBtn 事件监听器已设置');
			}

			// 新功能版块事件
			if (elements.featuredProblems) {
				elements.featuredProblems.addEventListener('click', showProblemList);
				console.log('✅ featuredProblems 事件监听器已设置');
			}

			if (elements.promptAssistant) {
				elements.promptAssistant.addEventListener('click', showPromptAssistant);
				console.log('✅ promptAssistant 事件监听器已设置');
			}

			if (elements.excellentPrompts) {
				elements.excellentPrompts.addEventListener('click', showExcellentPrompts);
				console.log('✅ excellentPrompts 事件监听器已设置');
			}

			// 页面导航事件
			if (elements.backFromProblemsBtn) {
				elements.backFromProblemsBtn.addEventListener('click', backToWelcome);
				console.log('✅ backFromProblemsBtn 事件监听器已设置');
			}

			if (elements.backFromAssistantBtn) {
				elements.backFromAssistantBtn.addEventListener('click', backToWelcome);
				console.log('✅ backFromAssistantBtn 事件监听器已设置');
			}

			if (elements.refreshHistoryBtn) {
				elements.refreshHistoryBtn.addEventListener('click', refreshHistory);
				console.log('✅ refreshHistoryBtn 事件监听器已设置');
			}

			// Prompt助手事件
			if (elements.generateModeBtn) {
				elements.generateModeBtn.addEventListener('click', () => switchAssistantMode('generate'));
				console.log('✅ generateModeBtn 事件监听器已设置');
			}

			if (elements.optimizeModeBtn) {
				elements.optimizeModeBtn.addEventListener('click', () => switchAssistantMode('optimize'));
				console.log('✅ optimizeModeBtn 事件监听器已设置');
			}

			if (elements.generatePromptBtn) {
				elements.generatePromptBtn.addEventListener('click', generatePrompt);
				console.log('✅ generatePromptBtn 事件监听器已设置');
			}

			if (elements.optimizePromptBtn) {
				elements.optimizePromptBtn.addEventListener('click', optimizePrompt);
				console.log('✅ optimizePromptBtn 事件监听器已设置');
			}

			// 题目页面标签切换事件
			if (elements.problemTabs && elements.problemTabs.length > 0) {
				elements.problemTabs.forEach(tab => {
					tab.addEventListener('click', (e) => switchProblemTab(e.target.dataset.tab));
				});
				console.log('✅ problemTabs 事件监听器已设置');
			}

			// 管理标签切换事件
			if (elements.mgmtTabs && elements.mgmtTabs.length > 0) {
				elements.mgmtTabs.forEach(tab => {
					tab.addEventListener('click', (e) => switchManagementTab(e.target.dataset.mgmtTab));
				});
				console.log('✅ mgmtTabs 事件监听器已设置');
			}

			// 自定义题目表单事件
			if (elements.customProblemForm) {
				elements.customProblemForm.addEventListener('submit', handleCustomProblemSubmit);
				console.log('✅ customProblemForm 事件监听器已设置');
			}

			if (elements.addTestCaseBtn) {
				elements.addTestCaseBtn.addEventListener('click', addTestCase);
				console.log('✅ addTestCaseBtn 事件监听器已设置');
			}

			if (elements.previewProblemBtn) {
				elements.previewProblemBtn.addEventListener('click', previewCustomProblem);
				console.log('✅ previewProblemBtn 事件监听器已设置');
			}

			// 为现有的测试用例删除按钮添加事件监听器
			document.querySelectorAll('.remove-test-case').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const testCase = e.target.closest('.test-case');
					if (testCase) {
						removeTestCase(testCase);
					}
				});
			});
			console.log('✅ 测试用例删除按钮事件监听器已设置');

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
		console.log('📨 收到扩展消息:', message.command);

		switch (message.command) {
			case 'webviewReady':
				console.log('🎉 WebView 已就绪，发送初始化确认');
				// 发送初始化确认
				vscode.postMessage({
					command: 'webviewInitialized'
				});
				break;
			case 'problemsLoaded':
				handleProblemsLoaded(message.problems, message.error);
				break;
			case 'problemLoaded':
				handleProblemLoaded(message.problem);
				// 启用TOP3 Prompts按钮
				if (elements.viewTopPromptsBtn) {
					elements.viewTopPromptsBtn.disabled = false;
				}
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
			// 配置相关消息处理
			case 'configLoaded':
				loadConfigToForm(message.config);
				console.log('✅ 配置已加载到表单:', message.config);
				break;
			case 'configSaved':
				hideLoading();
				showConfigStatus(message.message, 'success');
				break;
			case 'testResult':
				hideLoading();
				const result = message.result;
				const statusType = result.success ? 'success' : 'error';
				showConfigStatus(result.message, statusType);
				break;
			// 新消息类型处理
			case 'promptGenerated':
				handlePromptGenerated(message.prompt);
				break;
			case 'promptOptimized':
				handlePromptOptimized(message.result);
				break;
			case 'submissionHistoryLoaded':
				renderSubmissionHistory(message.history);
				break;
			// 自定义题目相关消息处理
			case 'customProblemSubmitted':
				handleCustomProblemSubmitted(message);
				break;
			case 'pendingProblemsLoaded':
				renderPendingProblems(message.problems);
				break;
			case 'problemReviewed':
				handleProblemReviewed(message);
				break;
			case 'userSubmissionsLoaded':
				renderUserSubmissions(message.submissions);
				break;
			case 'problemStatisticsLoaded':
				updateProblemStatistics(message.statistics);
				break;
			// Prompt使用统计相关消息处理
			case 'promptUsageStatsUpdated':
				handlePromptUsageStatsUpdated(message);
				break;
			case 'promptUsageStatsLoaded':
				handlePromptUsageStatsLoaded(message.stats);
				break;
			default:
				console.warn('⚠️ 未知消息类型:', message.command);
				break;
		}
	}

	// 显示欢迎界面
	function showWelcomeScreen() {
		console.log('🏠 显示主界面...');

		// 隐藏加载覆盖层
		hideLoading();

		// 隐藏所有子页面
		if (elements.problemDetails) {
			elements.problemDetails.style.display = 'none';
		}
		if (elements.problemListScreen) {
			elements.problemListScreen.style.display = 'none';
		}
		if (elements.promptAssistantScreen) {
			elements.promptAssistantScreen.style.display = 'none';
		}

		// 显示欢迎界面
		if (elements.welcomeScreen) {
			elements.welcomeScreen.style.display = 'block';
			console.log('✅ 主界面已显示');
		} else {
			console.error('❌ 主界面元素未找到');
		}
	}

	// 尝试加载问题列表（不阻塞主页面）
	function tryLoadProblems() {
		try {
			console.log('🔄 尝试加载题目列表...');
			// 设置超时，防止阻塞主页面
			setTimeout(() => {
				if (problems.length === 0) {
					console.log('⚠️ 题目加载超时，但主页面已正常显示');
					// 在题目网格区域显示提示
					if (elements.problemGrid) {
						elements.problemGrid.innerHTML = '<div class="empty-state">题目加载中...<br><small>若长时间无响应，请检查配置或网络连接</small></div>';
					}
				}
			}, 5000); // 5秒超时

			// 发送加载请求
			vscode.postMessage({
				command: 'loadProblems'
			});
		} catch (error) {
			console.error('❌ 加载题目失败:', error);
			// 不阻塞主页面，只显示提示
			if (elements.problemGrid) {
				elements.problemGrid.innerHTML = '<div class="empty-state">题目加载失败<br><small>请检查配置或网络连接</small><br><button onclick="tryLoadProblems()" class="btn secondary">重试</button></div>';
			}
		}
	}

	// 加载问题列表
	function loadProblems() {
		vscode.postMessage({
			command: 'loadProblems'
		});
	}

	// 处理问题列表加载完成
	function handleProblemsLoaded(loadedProblems, error) {
		problems = loadedProblems || [];

		if (error) {
			console.warn('⚠️ 题目加载失败:', error);
			// 显示错误信息和重试按钮
			if (elements.problemGrid) {
				elements.problemGrid.innerHTML = `
					<div class="empty-state">
						题目加载失败
						<br><small>错误: ${error}</small>
						<br><button onclick="tryLoadProblems()" class="btn secondary">重试加载</button>
					</div>
				`;
			}
			return;
		}

		renderProblemGrid(problems);
	}

	// 渲染问题列表（已废弃，改用renderProblemGrid）
	function renderProblemList() {
		console.log('renderProblemList已废弃，使用renderProblemGrid代替');
		renderProblemGrid(problems);
	}

	// 选择问题
	function selectProblem(problemId) {
		// 如果传入的是问题对象而不是ID，直接处理
		if (typeof problemId === 'object') {
			const problem = problemId;
			console.log('选择题目:', problem.title);
			currentProblem = problem;
			renderProblemDetails(problem);
			elements.welcomeScreen.style.display = 'none';
			elements.problemDetails.style.display = 'block';
			resetSections();
			return;
		}

		// 更新选中状态（如果problemGrid存在）
		if (elements.problemGrid) {
			elements.problemGrid.querySelectorAll('.problem-card').forEach(card => {
				card.classList.remove('active');
			});

			const selectedCard = elements.problemGrid.querySelector(`[data-problem-id="${problemId}"]`);
			if (selectedCard) {
				selectedCard.classList.add('active');
			}
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
		if (elements.problemTitle) {
			elements.problemTitle.textContent = problem.title;
		}
		if (elements.problemDifficulty) {
			elements.problemDifficulty.textContent = problem.difficulty;
			elements.problemDifficulty.className = `difficulty ${problem.difficulty}`;
		}
		if (elements.problemDescription) {
			elements.problemDescription.textContent = problem.description;
		}

		// 渲染提示
		if (elements.problemHints) {
			if (problem.hints && problem.hints.length > 0) {
				const hintsHtml = problem.hints.map(hint => `<li>${hint}</li>`).join('');
				elements.problemHints.innerHTML = `<ul>${hintsHtml}</ul>`;
			} else {
				elements.problemHints.innerHTML = '<p>暂无提示</p>';
			}
		}

		// 清空之前的输入
		if (elements.promptInput) {
			elements.promptInput.value = '';
		}
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

	// 安全地转义HTML内容
	function escapeHtml(str) {
		return str.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// 将反馈内容格式化为指定格式
	function formatFeedbackAsMarkdown(analysis) {
		if (!analysis || !analysis.feedback || analysis.feedback === '暂无详细反馈') {
			return '<div class="no-feedback">💡 暂无详细反馈</div>';
		}

		// 获取评分
		const score = analysis.score || 0;

		// 格式化改进建议
		let improvementsText = '';
		if (analysis.improvements && analysis.improvements.length > 0) {
			improvementsText = analysis.improvements.map((improvement, index) =>
				`${index + 1}. ${improvement}`
			).join('\n');
		} else {
			improvementsText = '暂无改进建议';
		}

		// 构建格式化文本
		const formattedText = `
1. 评分：${score}/100
2. 详细反馈：${analysis.feedback}
3. 改建建议：
${improvementsText}
`;

		// 转义HTML并保持换行格式
		return `<pre class="feedback-formatted">${escapeHtml(formattedText)}</pre>`;
	}

	// 处理Prompt分析结果
	function handlePromptAnalyzed(analysis) {
		hideLoading();

		if (!elements.promptAnalysis) return;

		// 创建结构化的分析结果
		const resultContainer = document.createElement('div');
		resultContainer.className = 'prompt-analysis-result';

		// 分数等级判断
		const score = analysis.score || 0;
		let scoreLevel = 'low';
		let scoreIcon = '🔴';
		let scoreText = '需要改进';

		if (score >= 80) {
			scoreLevel = 'high';
			scoreIcon = '🟢';
			scoreText = '优秀';
		} else if (score >= 60) {
			scoreLevel = 'medium';
			scoreIcon = '🟡';
			scoreText = '良好';
		}

		resultContainer.innerHTML = `
			<div class="analysis-header">
				<h4><i class="icon">📊</i> Prompt 质量分析报告</h4>
				<div class="analysis-timestamp">🕰️ ${new Date().toLocaleString()}</div>
			</div>

			<div class="analysis-score-card">
				<div class="score-circle ${scoreLevel}">
					<div class="score-number">${score}</div>
					<div class="score-total">/100</div>
				</div>
				<div class="score-details">
					<div class="score-level">${scoreIcon} ${scoreText}</div>
					<div class="score-description">综合评估结果</div>
				</div>
			</div>

			<div class="analysis-sections">
				<div class="analysis-section">
					<div class="section-header">
						<i class="icon">📝</i>
						<h5>详细反馈</h5>
					</div>
					<div class="section-content">
						<div class="feedback-markdown">
							${formatFeedbackAsMarkdown(analysis)}
						</div>
					</div>
				</div>

				<div class="analysis-section">
					<div class="section-header">
						<i class="icon">🚀</i>
						<h5>改进建议</h5>
						<span class="improvement-count">(${analysis.improvements ? analysis.improvements.length : 0} 项)</span>
					</div>
					<div class="section-content">
						<ul class="improvements-list">
							${analysis.improvements ? analysis.improvements.map((improvement, index) => `
								<li class="improvement-item">
									<span class="improvement-number">${index + 1}</span>
									<span class="improvement-text">${escapeHtml(improvement)}</span>
								</li>
							`).join('') : '<li class="no-improvements">暂无改进建议</li>'}
						</ul>
					</div>
				</div>

				<div class="analysis-section">
					<div class="section-header">
						<i class="icon">💵</i>
						<h5>评分细分</h5>
					</div>
					<div class="section-content">
						<div class="score-breakdown">
							<div class="breakdown-item">
								<span class="breakdown-label">🎯 明确性</span>
								<div class="breakdown-bar">
									<div class="breakdown-fill" style="width: ${Math.min(score + 10, 100)}%"></div>
								</div>
								<span class="breakdown-score">${Math.round(score * 0.25)}/25</span>
							</div>
							<div class="breakdown-item">
								<span class="breakdown-label">📄 完整性</span>
								<div class="breakdown-bar">
									<div class="breakdown-fill" style="width: ${Math.min(score + 5, 100)}%"></div>
								</div>
								<span class="breakdown-score">${Math.round(score * 0.25)}/25</span>
							</div>
							<div class="breakdown-item">
								<span class="breakdown-label">🏧 结构性</span>
								<div class="breakdown-bar">
									<div class="breakdown-fill" style="width: ${Math.min(score - 5, 100)}%"></div>
								</div>
								<span class="breakdown-score">${Math.round(score * 0.25)}/25</span>
							</div>
							<div class="breakdown-item">
								<span class="breakdown-label">🔧 技术性</span>
								<div class="breakdown-bar">
									<div class="breakdown-fill" style="width: ${score}%"></div>
								</div>
								<span class="breakdown-score">${Math.round(score * 0.25)}/25</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="analysis-footer">
				<div class="next-steps">
					<h6>📈 下一步操作建议</h6>
					<div class="next-step-buttons">
						<button class="btn secondary small" onclick="generateCode()">🚀 直接生成代码</button>
						<button class="btn primary small" onclick="optimizeCurrentPrompt()">✨ 优化 Prompt</button>
					</div>
				</div>
			</div>
		`;

		// 更新显示
		elements.promptAnalysis.innerHTML = '';
		elements.promptAnalysis.appendChild(resultContainer);
		elements.promptAnalysis.style.display = 'block';

		// 滚动到分析结果
		elements.promptAnalysis.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

		// 创建结构化的代码生成结果
		const resultContainer = document.createElement('div');
		resultContainer.className = 'code-generation-result';

		// 分析代码统计信息
		const codeLines = generatedCode.split('\n').length;
		const codeSize = new Blob([generatedCode]).size;
		const functions = (generatedCode.match(/function\s+\w+|\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
		const classes = (generatedCode.match(/class\s+\w+/g) || []).length;

		// 分析代码质量指标
		const hasComments = /\/\*[\s\S]*?\*\/|\/\/.*$/m.test(generatedCode);
		const hasErrorHandling = /try\s*{|catch\s*\(|throw\s+/i.test(generatedCode);
		const hasTypeAnnotations = /:.*?\s*[={;]/g.test(generatedCode);
		const hasAsync = /async\s+|await\s+/i.test(generatedCode);

		resultContainer.innerHTML = `
			<div class="code-header">
				<h4><i class="icon">🚀</i> 代码生成完成</h4>
				<div class="code-meta">
					<span>🕰️ ${new Date().toLocaleTimeString()}</span>
					<span>📏 ${codeLines} 行</span>
					<span>📦 ${(codeSize / 1024).toFixed(1)} KB</span>
				</div>
			</div>

			<div class="code-stats">
				<div class="stat-item">
					<span class="stat-value">${functions}</span>
					<span class="stat-label">函数数量</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">${classes}</span>
					<span class="stat-label">类数量</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">${codeLines}</span>
					<span class="stat-label">代码行数</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">${(codeSize / 1024).toFixed(1)}</span>
					<span class="stat-label">文件大小(KB)</span>
				</div>
			</div>

			<div class="code-content">
				<div class="quality-indicators">
					${hasComments ? '<div class="quality-badge excellent">💬 包含注释</div>' : '<div class="quality-badge needs-improvement">⚠️ 缺少注释</div>'}
					${hasErrorHandling ? '<div class="quality-badge excellent">🛡️ 异常处理</div>' : '<div class="quality-badge needs-improvement">⚠️ 缺少异常处理</div>'}
					${hasTypeAnnotations ? '<div class="quality-badge excellent">🏷️ 类型注解</div>' : '<div class="quality-badge good">💡 建议添加类型</div>'}
					${hasAsync ? '<div class="quality-badge good">⚡ 异步操作</div>' : ''}
				</div>

				<div class="code-block">
					<div class="code-block-header">
						<span class="code-language">TypeScript</span>
						<button class="copy-code-btn" onclick="copyGeneratedCode()">📋 复制代码</button>
					</div>
					<pre>${escapeHtml(generatedCode)}</pre>
				</div>

				${response.explanation ? `
				<div class="analysis-grid">
					<div class="analysis-card">
						<h6>📝 代码说明</h6>
						<div class="section-content">
							${escapeHtml(response.explanation)}
						</div>
					</div>
					<div class="analysis-card">
						<h6>🔧 技术要点</h6>
						<ul>
							<li>代码遵循 TypeScript 最佳实践</li>
							<li>实现了题目要求的核心功能</li>
							<li>${hasErrorHandling ? '包含完善的错误处理机制' : '建议添加错误处理逻辑'}</li>
							<li>${hasComments ? '代码注释清晰明了' : '建议添加详细注释说明'}</li>
						</ul>
					</div>
				</div>
				` : ''}

				<div class="analysis-grid">
					<div class="analysis-card">
						<h6>✅ 优点分析</h6>
						<ul>
							<li>代码结构清晰，逻辑合理</li>
							<li>实现了题目的核心功能要求</li>
							${functions > 0 ? '<li>函数拆分合理，职责单一</li>' : ''}
							${classes > 0 ? '<li>类设计符合面向对象原则</li>' : ''}
							${hasComments ? '<li>注释充分，便于理解和维护</li>' : ''}
						</ul>
					</div>
					<div class="analysis-card">
						<h6>🔍 改进建议</h6>
						<ul>
							${!hasComments ? '<li>建议添加详细的函数和类注释</li>' : ''}
							${!hasErrorHandling ? '<li>建议增加异常处理和边界情况检查</li>' : ''}
							${!hasTypeAnnotations ? '<li>建议添加更完整的类型注解</li>' : ''}
							<li>考虑添加单元测试确保代码质量</li>
							<li>可以考虑性能优化和内存使用优化</li>
						</ul>
					</div>
				</div>
			</div>

			<div class="code-actions">
				<button class="btn secondary" onclick="copyGeneratedCode()">📋 复制代码</button>
				<button class="btn primary" onclick="acceptCode()">✅ 接受代码</button>
				<button class="btn secondary" onclick="runTests()">🧪 运行测试</button>
				<button class="btn secondary" onclick="regenerateCode()">🔄 重新生成</button>
			</div>
		`;

		// 更新显示
		elements.codeSection.innerHTML = '';
		elements.codeSection.appendChild(resultContainer);
		elements.codeSection.style.display = 'block';

		// 隐藏旧的explanation区域
		if (elements.explanation) {
			elements.explanation.style.display = 'none';
		}

		// 滚动到代码区域
		elements.codeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

	// 复制生成的代码
	function copyGeneratedCode() {
		if (!generatedCode) {
			showError('没有可复制的代码');
			return;
		}

		// 使用已有的copyPrompt函数复制代码
		copyPrompt(generatedCode);
		showConfigStatus('📋 代码已复制到剪贴板', 'success');
	}

	// 重新生成代码
	function regenerateCode() {
		const prompt = elements.promptInput.value.trim();
		if (!prompt || !currentProblem) {
			showError('请输入Prompt并选择题目');
			return;
		}

		// 显示确认对话框
		if (confirm('确定要重新生成代码吗？当前的代码将被替换。')) {
			generateCode();
		}
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

		if (elements.testResults) {
			elements.testResults.innerHTML = html;
		}
		if (elements.testSection) {
			elements.testSection.style.display = 'block';
		}

		// 统计结果
		const passedCount = results.filter(r => r.passed).length;
		const totalCount = results.length;

		if (passedCount === totalCount) {
			showSuccess(`🎉 恭喜！所有测试用例都通过了！(${passedCount}/${totalCount})`);
		} else {
			showError(`测试未完全通过 (${passedCount}/${totalCount})`);
		}

		// 滚动到测试结果
		if (elements.testSection) {
			elements.testSection.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// 显示加载状态
	function showLoading(message = '加载中...') {
		if (elements.loadingMessage) {
			elements.loadingMessage.textContent = message;
		}
		if (elements.loadingOverlay) {
			elements.loadingOverlay.style.display = 'flex';
		}
	}

	// 隐藏加载状态
	function hideLoading() {
		if (elements.loadingOverlay) {
			elements.loadingOverlay.style.display = 'none';
		}
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

	// ======= 配置面板相关函数 =======

	// API类型默认配置
	const providerDefaults = {
		openai: {
			apiUrl: 'https://api.openai.com',
			modelId: 'gpt-3.5-turbo'
		},
		azure: {
			apiUrl: 'https://your-azure-endpoint.openai.azure.com',
			modelId: 'gpt-35-turbo'
		},
		alibaba: {
			apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
			modelId: 'qwen-plus'
		},
		moonshot: {
			apiUrl: 'https://api.moonshot.cn',
			modelId: 'moonshot-v1-8k'
		},
		zhipu: {
			apiUrl: 'https://open.bigmodel.cn',
			modelId: 'glm-4'
		},
		baichuan: {
			apiUrl: 'https://api.baichuan-ai.com',
			modelId: 'Baichuan2-Turbo'
		},
		custom: {
			apiUrl: '',
			modelId: ''
		}
	};

	// 处理提供商选择变化
	function onProviderChange() {
		const provider = elements.providerSelect.value;
		const defaults = providerDefaults[provider];

		if (defaults) {
			// 如果当前字段为空，填充默认值
			if (!elements.apiUrl.value) {
				elements.apiUrl.value = defaults.apiUrl;
			}
			if (!elements.modelId.value) {
				elements.modelId.value = defaults.modelId;
			}
		}
	}

	// 获取当前配置
	function getCurrentConfig() {
		return {
			provider: elements.providerSelect.value,
			apiKey: elements.apiKey.value.trim(),
			apiUrl: elements.apiUrl.value.trim(),
			modelId: elements.modelId.value.trim()
		};
	}

	// 加载配置到表单
	function loadConfigToForm(config) {
		if (!config) return;

		if (config.provider) {
			elements.providerSelect.value = config.provider;
		}
		if (config.apiKey) {
			elements.apiKey.value = config.apiKey;
		}
		if (config.apiUrl) {
			elements.apiUrl.value = config.apiUrl;
		}
		if (config.modelId) {
			elements.modelId.value = config.modelId;
		}
	}

	// 保存配置
	function saveConfig() {
		const config = getCurrentConfig();

		// 验证配置
		if (!config.apiKey) {
			showConfigStatus('请输入API Key', 'error');
			return;
		}
		if (!config.apiUrl) {
			showConfigStatus('请输入API URL', 'error');
			return;
		}
		if (!config.modelId) {
			showConfigStatus('请输入模型ID', 'error');
			return;
		}

		vscode.postMessage({
			command: 'saveConfig',
			config: config
		});
	}

	// 测试配置
	function testConfig() {
		const config = getCurrentConfig();

		// 验证配置
		if (!config.apiKey || !config.apiUrl || !config.modelId) {
			showConfigStatus('请完整填写配置信息', 'error');
			return;
		}

		showConfigStatus('正在测试连接...', 'loading');

		vscode.postMessage({
			command: 'testConfig',
			config: config
		});
	}

	// 刷新题目列表
	function refreshProblems() {
		vscode.postMessage({
			command: 'refreshProblems'
		});
	}

	// 查看TOP3 Prompts
	function viewTopPrompts() {
		if (!currentProblem) {
			showError('请先选择一个题目');
			return;
		}

		vscode.postMessage({
			command: 'viewTopPrompts',
			problemId: currentProblem.id
		});
	}

	// 返回主界面
	function backToWelcome() {
		console.log('🏠 返回主界面');

		// 强制隐藏所有子页面
		const allPages = [
			'problemDetails',
			'problemListScreen',
			'promptAssistantScreen'
		];

		allPages.forEach(pageId => {
			const element = document.getElementById(pageId);
			if (element) {
				element.style.display = 'none';
				console.log(`✅ 隐藏页面: ${pageId}`);
			}
		});

		// 确保主界面显示
		const welcomeScreen = document.getElementById('welcomeScreen');
		if (welcomeScreen) {
			welcomeScreen.style.display = 'block';
			console.log('✅ 主界面已显示');
		} else {
			console.error('❌ 主界面元素未找到');
		}

		// 重置当前题目
		currentProblem = null;

		// 重置各区域
		resetSections();

		console.log('✅ 已返回主界面');
	}

	// 更新统计信息
	function updateStats(submissions) {
		const completed = submissions.filter(s => s.completed);
		const scores = completed.filter(s => s.score !== null).map(s => s.score);

		// 更新完成数量
		if (elements.completedCount) {
			elements.completedCount.textContent = completed.length;
		}

		// 更新平均得分
		if (elements.averageScore) {
			if (scores.length > 0) {
				const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
				elements.averageScore.textContent = `${avg}分`;
			} else {
				elements.averageScore.textContent = '--';
			}
		}

		// 更新最高分
		if (elements.bestScore) {
			if (scores.length > 0) {
				const best = Math.max(...scores);
				elements.bestScore.textContent = `${best}分`;
			} else {
				elements.bestScore.textContent = '--';
			}
		}
	}

	// 欢迎界面的TOP3 Prompts处理
	function handleWelcomeTopPrompts() {
		console.log('欢迎界面TOP3 Prompts被点击');

		// 如果有题目列表，选择第一个题目并查看TOP3
		if (problems.length > 0) {
			const firstProblem = problems[0];
			vscode.postMessage({
				command: 'viewTopPrompts',
				problemId: firstProblem.id
			});
		} else {
			// 尝试加载题目
			showLoading('正在加载题目...');
			tryLoadProblems();

			// 等待题目加载完成
			const checkProblemsLoaded = setInterval(() => {
				if (problems.length > 0) {
					clearInterval(checkProblemsLoaded);
					hideLoading();
					const firstProblem = problems[0];
					vscode.postMessage({
						command: 'viewTopPrompts',
						problemId: firstProblem.id
					});
				}
			}, 500);

			// 5秒超时
			setTimeout(() => {
				clearInterval(checkProblemsLoaded);
				if (problems.length === 0) {
					hideLoading();
					showError('题目加载超时，请检查配置或网络连接');
				}
			}, 5000);
		}
	}

	// 显示配置状态
	function showConfigStatus(message, type = 'info') {
		if (!elements.configStatus) return;

		elements.configStatus.textContent = message;
		elements.configStatus.className = `config-status ${type}`;
		elements.configStatus.style.display = 'block';

		// 3秒后自动隐藏（除非是错误）
		if (type !== 'error') {
			setTimeout(() => {
				if (elements.configStatus) {
					elements.configStatus.style.display = 'none';
				}
			}, 3000);
		}
	}

	// 新增功能函数

	// 显示题目列表
	function showProblemList() {
		console.log('🎯 显示题目列表');

		// 隐藏欢迎界面
		if (elements.welcomeScreen) {
			elements.welcomeScreen.style.display = 'none';
		}

		// 显示题目列表页面
		if (elements.problemListScreen) {
			elements.problemListScreen.style.display = 'block';
		}

		// 🔧 修复：确保正确初始化标签页状态
		// 确保题目列表标签页是激活状态
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});
		const problemListTabBtn = document.querySelector('[data-tab="problem-list"]');
		if (problemListTabBtn) {
			problemListTabBtn.classList.add('active');
		}

		// 确保只显示题目列表标签页内容，隐藏其他标签页
		document.querySelectorAll('.tab-pane').forEach(pane => {
			pane.style.display = 'none';
			pane.classList.remove('active');
		});
		const problemListTab = document.getElementById('problemListTab');
		if (problemListTab) {
			problemListTab.style.display = 'block';
			problemListTab.classList.add('active');
			console.log('✅ 题目列表标签页已激活');
		}

		// 加载和显示题目
		loadAndDisplayProblems();
	}

	// 显示Prompt助手
	function showPromptAssistant() {
		console.log('🤖 显示Prompt助手');

		// 隐藏欢迎界面
		if (elements.welcomeScreen) {
			elements.welcomeScreen.style.display = 'none';
		}

		// 显示Prompt助手页面
		if (elements.promptAssistantScreen) {
			elements.promptAssistantScreen.style.display = 'block';
		}

		// 初始化为生成模式
		switchAssistantMode('generate');
	}

	// 显示优秀Prompt展示
	function showExcellentPrompts() {
		console.log('🏆 显示优秀Prompt展示');

		// 如果有题目列表，选择第一个题目并查看TOP3
		if (problems.length > 0) {
			const firstProblem = problems[0];
			vscode.postMessage({
				command: 'viewTopPrompts',
				problemId: firstProblem.id
			});
		} else {
			// 尝试加载题目
			showLoading('正在加载题目...');
			tryLoadProblems();

			// 等待题目加载完成
			const checkProblemsLoaded = setInterval(() => {
				if (problems.length > 0) {
					clearInterval(checkProblemsLoaded);
					hideLoading();
					const firstProblem = problems[0];
					vscode.postMessage({
						command: 'viewTopPrompts',
						problemId: firstProblem.id
					});
				}
			}, 500);

			// 5秒超时
			setTimeout(() => {
				clearInterval(checkProblemsLoaded);
				if (problems.length === 0) {
					hideLoading();
					showError('题目加载超时，请检查配置或网络连接');
				}
			}, 5000);
		}
	}

	// 加载和显示题目
	function loadAndDisplayProblems() {
		if (problems.length === 0) {
			// 尝试加载题目
			showLoading('正在加载题目...');
			vscode.postMessage({ command: 'loadProblems' });
		} else {
			// 直接显示已加载的题目
			renderProblemGrid(problems);
		}
	}

	// 渲染题目网格
	function renderProblemGrid(problemList) {
		if (!elements.problemGrid) return;

		// 更新题目数量
		if (elements.totalProblems) {
			elements.totalProblems.textContent = problemList.length;
		}

		if (problemList.length === 0) {
			elements.problemGrid.innerHTML = '<div class="empty-state">暂无题目，请检查配置</div>';
			return;
		}

		const gridHtml = problemList.map(problem => `
			<div class="problem-card" data-problem-id="${problem.id}">
				<div class="problem-card-header">
					<h3 class="problem-card-title">${problem.title}</h3>
					<span class="difficulty ${problem.difficulty}">${problem.difficulty}</span>
				</div>
				<p class="problem-card-description">${problem.description}</p>
				<div class="problem-card-meta">
					<span class="category">${problem.category || '编程题'}</span>
					<span class="test-count">${problem.testCases?.length || 0} 个测试用例</span>
				</div>
			</div>
		`).join('');

		elements.problemGrid.innerHTML = gridHtml;

		// 为每个题目卡片添加点击事件
		elements.problemGrid.querySelectorAll('.problem-card').forEach(card => {
			card.addEventListener('click', () => {
				const problemId = card.dataset.problemId;
				const problem = problemList.find(p => p.id === problemId);
				if (problem) {
					selectProblem(problem);
				}
			});
		});
	}

	// 选择题目
	function selectProblem(problem) {
		console.log('选择题目:', problem.title);

		// 隐藏题目列表页面
		if (elements.problemListScreen) {
			elements.problemListScreen.style.display = 'none';
		}

		// 加载题目详情
		currentProblem = problem;
		renderProblemDetails(problem);
		elements.welcomeScreen.style.display = 'none';
		elements.problemDetails.style.display = 'block';

		// 重置状态
		resetSections();
	}

	// 切换Prompt助手模式
	function switchAssistantMode(mode) {
		console.log('切换助手模式:', mode);

		// 更新标签状态
		if (elements.generateModeBtn && elements.optimizeModeBtn) {
			elements.generateModeBtn.classList.toggle('active', mode === 'generate');
			elements.optimizeModeBtn.classList.toggle('active', mode === 'optimize');
		}

		// 显示/隐藏对应模式
		if (elements.generateMode && elements.optimizeMode) {
			elements.generateMode.style.display = mode === 'generate' ? 'block' : 'none';
			elements.optimizeMode.style.display = mode === 'optimize' ? 'block' : 'none';
		}
	}

	// 生成Prompt
	function generatePrompt() {
		if (!elements.taskDescription) return;

		const task = elements.taskDescription.value.trim();
		if (!task) {
			showError('请输入任务描述');
			return;
		}

		console.log('生成Prompt，任务:', task);
		showLoading('正在生成Prompt...');

		// 更新统计
		promptUsageStats.generateCount++;

		// 发送到后端处理
		vscode.postMessage({
			command: 'generatePrompt',
			task: task
		});

		// 发送统计数据
		sendUsageStats('generate');
	}

	// 优化Prompt
	function optimizePrompt() {
		if (!elements.originalPrompt) return;

		const prompt = elements.originalPrompt.value.trim();
		if (!prompt) {
			showError('请输入要优化的Prompt');
			return;
		}

		console.log('优化Prompt:', prompt);
		showLoading('正在优化Prompt...');

		// 更新统计
		promptUsageStats.optimizeCount++;

		// 发送到后端处理
		vscode.postMessage({
			command: 'optimizePrompt',
			prompt: prompt
		});

		// 发送统计数据
		sendUsageStats('optimize');
	}

	// 刷新提交历史
	function refreshHistory() {
		console.log('刷新提交历史');

		// 发送到后端加载历史
		vscode.postMessage({
			command: 'loadSubmissionHistory'
		});
	}

	// 渲染提交历史
	function renderSubmissionHistory(historyList) {
		if (!elements.submissionList) return;

		if (!historyList || historyList.length === 0) {
			elements.submissionList.innerHTML = `
				<div class="empty-history">
					<p>暂无提交记录</p>
					<small>开始练习题目后会显示提交历史</small>
				</div>
			`;
			return;
		}

		const historyHtml = historyList.map(item => `
			<div class="submission-item" data-problem-id="${item.problemId}">
				<div class="submission-header">
					<span class="submission-title">${item.problemTitle}</span>
					<span class="submission-score">${item.bestScore}分</span>
				</div>
				<div class="submission-meta">
					<span class="submission-difficulty ${item.problemDifficulty}">${item.problemDifficulty}</span>
					<span class="submission-attempts">尝试 ${item.totalAttempts} 次</span>
					<span class="submission-status">${item.completed ? '✅' : '🔄'}</span>
				</div>
			</div>
		`).join('');

		elements.submissionList.innerHTML = historyHtml;

		// 更新统计信息
		updateHistoryStats(historyList);

		// 为每个历史项添加点击事件
		elements.submissionList.querySelectorAll('.submission-item').forEach(item => {
			item.addEventListener('click', () => {
				const problemId = item.dataset.problemId;
				// 加载题目详情
				vscode.postMessage({
					command: 'loadProblem',
					problemId: problemId
				});
			});
		});
	}

	// 更新历史统计信息
	function updateHistoryStats(historyList) {
		const completed = historyList.filter(h => h.completed);
		const scores = completed.filter(h => h.bestScore > 0).map(h => h.bestScore);

		// 更新完成数量
		if (elements.completedCount) {
			elements.completedCount.textContent = completed.length;
		}

		// 更新平均得分
		if (elements.averageScore) {
			if (scores.length > 0) {
				const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
				elements.averageScore.textContent = `${avg}分`;
			} else {
				elements.averageScore.textContent = '--';
			}
		}

		// 更新最高分
		if (elements.bestScore) {
			if (scores.length > 0) {
				const best = Math.max(...scores);
				elements.bestScore.textContent = `${best}分`;
			} else {
				elements.bestScore.textContent = '--';
			}
		}
	}

	// 处理Prompt生成结果
	function handlePromptGenerated(prompt) {
		hideLoading();

		if (!elements.generatedPromptResult) return;

		// 创建按钮元素，避免字符串转义问题
		const resultContainer = document.createElement('div');
		resultContainer.innerHTML = `
			<h4>生成的 Prompt</h4>
			<pre>${escapeHtml(prompt)}</pre>
			<div class="result-actions" id="promptActions"></div>
		`;

		// 创建复制按钮
		const copyButton = document.createElement('button');
		copyButton.className = 'btn secondary';
		copyButton.innerHTML = '📋 复制';
		copyButton.addEventListener('click', () => copyPrompt(prompt));

		// 创建使用按钮
		const useButton = document.createElement('button');
		useButton.className = 'btn primary';
		useButton.innerHTML = '✅ 使用此 Prompt';
		useButton.addEventListener('click', () => usePrompt(prompt));

		// 添加按钮到容器
		const actionsContainer = resultContainer.querySelector('#promptActions');
		actionsContainer.appendChild(copyButton);
		actionsContainer.appendChild(useButton);

		// 更新显示
		elements.generatedPromptResult.innerHTML = '';
		elements.generatedPromptResult.appendChild(resultContainer);
		elements.generatedPromptResult.style.display = 'block';
	}

	// 处理Prompt优化结果
	function handlePromptOptimized(result) {
		hideLoading();

		if (!elements.optimizedPromptResult) return;

		// 创建结果容器
		const resultContainer = document.createElement('div');
		resultContainer.innerHTML = `
			<h4>优化后的 Prompt</h4>
			<pre>${escapeHtml(result.optimizedPrompt)}</pre>
			
			<h4>优化建议</h4>
			<ul>
				${result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
			</ul>
			
			<h4>优化说明</h4>
			<p>${escapeHtml(result.explanation)}</p>
			
			<div class="result-actions" id="optimizedPromptActions"></div>
		`;

		// 创建复制按钮
		const copyButton = document.createElement('button');
		copyButton.className = 'btn secondary';
		copyButton.innerHTML = '📋 复制';
		copyButton.addEventListener('click', () => copyPrompt(result.optimizedPrompt));

		// 创建使用按钮
		const useButton = document.createElement('button');
		useButton.className = 'btn primary';
		useButton.innerHTML = '✅ 使用优化后的 Prompt';
		useButton.addEventListener('click', () => usePrompt(result.optimizedPrompt));

		// 添加按钮到容器
		const actionsContainer = resultContainer.querySelector('#optimizedPromptActions');
		actionsContainer.appendChild(copyButton);
		actionsContainer.appendChild(useButton);

		// 更新显示
		elements.optimizedPromptResult.innerHTML = '';
		elements.optimizedPromptResult.appendChild(resultContainer);
		elements.optimizedPromptResult.style.display = 'block';
	}

	// 统计数据存储
	let promptUsageStats = {
		generateCount: 0,
		copyCount: 0,
		useCount: 0,
		optimizeCount: 0
	};

	// 复制Prompt到剪贴板
	function copyPrompt(prompt) {
		console.log('🔄 正在复制Prompt到剪贴板...');

		// 更新统计
		promptUsageStats.copyCount++;

		// 尝试使用现代API复制
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(prompt).then(() => {
				console.log('✅ Prompt已复制到剪贴板');
				showConfigStatus('📋 Prompt已复制到剪贴板', 'success');
				// 发送统计数据
				sendUsageStats('copy');
			}).catch(err => {
				console.error('❌ 复制失败:', err);
				fallbackCopy(prompt);
			});
		} else {
			// 降级方案
			fallbackCopy(prompt);
		}
	}

	// 降级复制方案
	function fallbackCopy(prompt) {
		try {
			// 创建临时文本区域
			const textArea = document.createElement('textarea');
			textArea.value = prompt;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();

			const successful = document.execCommand('copy');
			document.body.removeChild(textArea);

			if (successful) {
				console.log('✅ Prompt已复制到剪贴板（降级方案）');
				showConfigStatus('📋 Prompt已复制到剪贴板', 'success');
				sendUsageStats('copy');
			} else {
				throw new Error('execCommand failed');
			}
		} catch (err) {
			console.error('❌ 降级复制也失败:', err);
			// 显示手动复制提示
			showManualCopyDialog(prompt);
		}
	}

	// 显示手动复制对话框
	function showManualCopyDialog(prompt) {
		const modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0,0,0,0.5);
			z-index: 10000;
			display: flex;
			align-items: center;
			justify-content: center;
		`;

		const dialog = document.createElement('div');
		dialog.style.cssText = `
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-widget-border);
			border-radius: 8px;
			padding: 20px;
			max-width: 500px;
			width: 90%;
			max-height: 400px;
		`;

		dialog.innerHTML = `
			<h3 style="margin-top: 0; color: var(--vscode-foreground);">手动复制 Prompt</h3>
			<p style="color: var(--vscode-descriptionForeground);">请手动选择并复制以下内容：</p>
			<textarea readonly style="
				width: 100%;
				height: 200px;
				border: 1px solid var(--vscode-input-border);
				background: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				padding: 10px;
				border-radius: 4px;
				resize: vertical;
			">${prompt}</textarea>
			<div style="text-align: right; margin-top: 15px;">
				<button id="copyDialogClose" class="btn secondary">关闭</button>
			</div>
		`;

		modal.appendChild(dialog);
		document.body.appendChild(modal);

		// 自动选中文本
		const textarea = dialog.querySelector('textarea');
		setTimeout(() => {
			textarea.select();
			textarea.focus();
		}, 100);

		// 关闭按钮事件
		dialog.querySelector('#copyDialogClose').addEventListener('click', () => {
			document.body.removeChild(modal);
		});

		// 点击背景关闭
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
			}
		});
	}

	// 使用生成的Prompt
	function usePrompt(prompt) {
		console.log('🚀 使用生成的Prompt...');

		// 更新统计
		promptUsageStats.useCount++;

		// 复制内容到剪贴板
		copyPrompt(prompt);

		// 发送使用统计
		sendUsageStats('use');

		// 显示接纳确认
		showConfigStatus('✅ Prompt已接纳并复制到剪贴板', 'success');

		// 显示统计信息
		const ratio = getUsageRatio();
		console.log(`📊 接纳统计: 接纳次数 ${ratio.totalUsed}, 接纳率 ${ratio.useRatio}%`);
	}

	// 发送使用统计数据
	function sendUsageStats(action) {
		try {
			// 发送统计数据到后端
			vscode.postMessage({
				command: 'recordPromptUsage',
				action: action,
				stats: promptUsageStats,
				timestamp: new Date().toISOString()
			});
			console.log(`📊 统计数据已发送: ${action}`, promptUsageStats);
		} catch (error) {
			console.error('❌ 发送统计数据失败:', error);
		}
	}

	// 获取使用统计占比
	function getUsageRatio() {
		const totalGenerated = promptUsageStats.generateCount + promptUsageStats.optimizeCount;
		const totalUsed = promptUsageStats.useCount;
		const totalCopied = promptUsageStats.copyCount;

		// 计算接纳率（使用次数 / 生成次数）
		const acceptanceRate = totalGenerated === 0 ? 0 : Math.round((totalUsed / totalGenerated) * 100);
		// 计算复制率（复制次数 / 生成次数）
		const copyRate = totalGenerated === 0 ? 0 : Math.round((totalCopied / totalGenerated) * 100);

		return {
			useRatio: acceptanceRate,        // 接纳率
			copyRatio: copyRate,             // 复制率
			totalGenerated: totalGenerated,  // 总生成次数
			totalUsed: totalUsed,            // 总接纳次数
			totalCopied: totalCopied,        // 总复制次数
			acceptanceRate: acceptanceRate   // 接纳率（别名）
		};
	}

	// 加载TOP3 Prompt预览
	function loadTopPromptsPreview() {
		console.log('🏆 加载TOP3 Prompt预览...');

		// 如果有题目数据，加载第一个题目的TOP3
		if (problems.length > 0) {
			loadTopPromptsForProblem(problems[0]);
			return;
		}

		// 设置超时检查题目加载状态
		const checkInterval = setInterval(() => {
			if (problems.length > 0) {
				clearInterval(checkInterval);
				loadTopPromptsForProblem(problems[0]);
			}
		}, 500);

		// 3秒后超时
		setTimeout(() => {
			clearInterval(checkInterval);
			if (problems.length === 0) {
				renderTopPromptsPreviewPlaceholder();
			}
		}, 3000);
	}

	// 为特定题目加载TOP3 Prompts
	function loadTopPromptsForProblem(problem) {
		// 模拟TOP3数据（实际应该从后端获取）
		const mockTopPrompts = [
			{
				rank: 1,
				score: 95,
				author: '张三',
				prompt: '请设计一个高效的回文字符串检测算法，要求时间复杂度为O(n)，空间复杂度为O(1)...',
				highlights: ['清晰的需求描述', '明确的复杂度要求', '考虑边界情况']
			},
			{
				rank: 2,
				score: 92,
				author: '李四',
				prompt: '实现一个回文判断函数，需要处理空字符串、单字符和标准情况...',
				highlights: ['完整的测试用例', '代码注释要求', '错误处理']
			},
			{
				rank: 3,
				score: 88,
				author: '王五',
				prompt: '编写TypeScript回文检测函数，包含类型定义和单元测试...',
				highlights: ['类型安全', '单元测试', '文档完整']
			}
		];

		renderTopPromptsPreview(mockTopPrompts, problem);
	}

	// 渲染TOP3 Prompts预览
	function renderTopPromptsPreview(topPrompts, problem) {
		const previewContainer = document.getElementById('topPromptsPreview');
		if (!previewContainer) return;

		const html = `
			<div class="top-prompts-list">
				${topPrompts.map(prompt => `
					<div class="prompt-preview-item">
						<div class="prompt-meta">
							<span class="rank-badge">TOP ${prompt.rank}</span>
							<span class="score">${prompt.score}分</span>
							<span class="author">@${prompt.author}</span>
						</div>
						<div class="prompt-content">
							<p class="prompt-text">${prompt.prompt.length > 80 ? prompt.prompt.substring(0, 80) + '...' : prompt.prompt}</p>
							<div class="highlights">
								${prompt.highlights.map(highlight => `<span class="highlight-tag">${highlight}</span>`).join('')}
							</div>
						</div>
					</div>
				`).join('')}
			</div>
			<div class="preview-footer">
				<p>💡 点击查看完整的TOP3优秀Prompt分析</p>
			</div>
		`;

		previewContainer.innerHTML = html;
	}

	// 渲染占位符
	function renderTopPromptsPreviewPlaceholder() {
		const previewContainer = document.getElementById('topPromptsPreview');
		if (!previewContainer) return;

		previewContainer.innerHTML = `
			<div class="loading-placeholder">
				<p>暂无优秀示例数据</p>
				<small>完成题目练习后会显示优秀Prompt案例</small>
			</div>
		`;
	}

	// 键盘快捷键
	document.addEventListener('keydown', (e) => {
		// Ctrl+Enter 生成代码
		if (e.ctrlKey && e.key === 'Enter' && elements.generateCodeBtn && !elements.generateCodeBtn.disabled) {
			e.preventDefault();
			generateCode();
		}

		// Escape 关闭错误消息
		if (e.key === 'Escape' && elements.errorMessage) {
			elements.errorMessage.style.display = 'none';
		}
	});

	// 页面加载完成后初始化
	if (document.readyState === 'loading') {
		// 文档正在加载中
		document.addEventListener('DOMContentLoaded', init);
	} else if (document.readyState === 'interactive') {
		// 文档已加载完成，但可能还有其他资源在加载
		window.addEventListener('load', init);
	} else {
		// 文档已完全加载
		init();
	}

	// === 注意：旧的独立页面功能已移除，现在使用标签页结构 ===
	// showCustomProblemSubmission() 和 showProblemManagement() 已被 switchProblemTab() 替代

	// 隐藏所有页面（更新为适应标签页结构）
	function hideAllScreens() {
		const screens = [
			elements.welcomeScreen,
			elements.problemListScreen,
			elements.promptAssistantScreen,
			elements.problemDetails
		];
		screens.forEach(screen => {
			if (screen) screen.style.display = 'none';
		});
	}



	// === 标签页切换功能 ===

	// 切换题目页面标签页
	function switchProblemTab(tabName) {
		console.log('切换题目标签页:', tabName);

		// 更新标签按钮状态
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});
		document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

		// 隐藏所有标签页内容
		document.querySelectorAll('.tab-pane').forEach(pane => {
			pane.style.display = 'none';
			pane.classList.remove('active');
		});

		// 显示目标标签页
		let targetPane;
		switch (tabName) {
			case 'problem-list':
				targetPane = document.getElementById('problemListTab');
				break;
			case 'submit-custom':
				targetPane = document.getElementById('submitCustomTab');
				break;
			case 'manage-problems':
				targetPane = document.getElementById('manageProblemsTab');
				// 加载管理数据
				loadManagementData();
				break;
			default:
				console.warn('未知的标签页:', tabName);
				return;
		}

		if (targetPane) {
			targetPane.style.display = 'block';
			targetPane.classList.add('active');
			console.log(`✅ 已切换到标签页: ${tabName}`);
		} else {
			console.error(`❌ 标签页元素未找到: ${tabName}`);
		}
	}

	// 切换管理标签页
	function switchManagementTab(tabName) {
		console.log('切换管理标签页:', tabName);

		// 更新管理标签按钮状态
		document.querySelectorAll('.mgmt-tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});
		document.querySelector(`[data-mgmt-tab="${tabName}"]`)?.classList.add('active');

		// 隐藏所有管理标签页内容
		document.querySelectorAll('.mgmt-tab-pane').forEach(pane => {
			pane.style.display = 'none';
			pane.classList.remove('active');
		});

		// 显示目标管理标签页
		let targetPane;
		switch (tabName) {
			case 'pending':
				targetPane = document.getElementById('pendingMgmtTab');
				// 加载待审核题目
				loadPendingProblems();
				break;
			case 'history':
				targetPane = document.getElementById('historyMgmtTab');
				break;
			case 'my-submissions':
				targetPane = document.getElementById('mySubmissionsMgmtTab');
				// 加载用户提交
				loadUserSubmissions();
				break;
			default:
				console.warn('未知的管理标签页:', tabName);
				return;
		}

		if (targetPane) {
			targetPane.style.display = 'block';
			targetPane.classList.add('active');
			console.log(`✅ 已切换到管理标签页: ${tabName}`);
		} else {
			console.error(`❌ 管理标签页元素未找到: ${tabName}`);
		}
	}

	// === 自定义题目数据加载功能 ===

	// 加载待审核题目
	function loadPendingProblems() {
		console.log('加载待审核题目...');
		vscode.postMessage({
			command: 'loadPendingProblems'
		});
	}

	// 加载用户提交
	function loadUserSubmissions() {
		console.log('加载用户提交...');
		const currentUser = 'current_user'; // 实际应该从配置获取
		vscode.postMessage({
			command: 'getUserSubmissions',
			author: currentUser
		});
	}

	// 加载管理统计数据
	function loadManagementData() {
		console.log('加载管理数据...');
		// 加载统计信息
		vscode.postMessage({
			command: 'getProblemStatistics'
		});
		// 加载待审核题目
		loadPendingProblems();
	}

	// === 自定义题目表单处理 ===

	// 添加测试用例
	function addTestCase() {
		console.log('添加测试用例');
		const container = document.getElementById('testCasesContainer');
		if (!container) return;

		const existingCases = container.querySelectorAll('.test-case');
		const newIndex = existingCases.length;

		const testCaseHtml = `
			<div class="test-case" data-index="${newIndex}">
				<div class="test-case-header">
					<h5>测试用例 ${newIndex + 1}</h5>
					<button type="button" class="btn secondary small remove-test-case">✖ 删除</button>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>输入 <span class="required">*</span></label>
						<textarea name="testInput" required placeholder="例如：nums = [2,7,11,15], target = 9" rows="2"></textarea>
					</div>
					<div class="form-group">
						<label>期望输出 <span class="required">*</span></label>
						<textarea name="testOutput" required placeholder="例如：[0,1]" rows="2"></textarea>
					</div>
				</div>
				<div class="form-group">
					<label>用例说明</label>
					<input type="text" name="testDescription" placeholder="解释此测试用例的意义">
				</div>
			</div>
		`;

		container.insertAdjacentHTML('beforeend', testCaseHtml);

		// 为新的删除按钮添加事件监听器
		const newTestCase = container.lastElementChild;
		const removeBtn = newTestCase.querySelector('.remove-test-case');
		if (removeBtn) {
			removeBtn.addEventListener('click', () => removeTestCase(newTestCase));
		}

		// 显示所有删除按钮（当有多个测试用例时）
		updateTestCaseDeleteButtons();
	}

	// 删除测试用例
	function removeTestCase(testCaseElement) {
		const container = document.getElementById('testCasesContainer');
		if (!container) return;

		const testCases = container.querySelectorAll('.test-case');
		if (testCases.length <= 1) {
			showError('至少需要保留一个测试用例');
			return;
		}

		testCaseElement.remove();
		updateTestCaseNumbers();
		updateTestCaseDeleteButtons();
	}

	// 更新测试用例编号
	function updateTestCaseNumbers() {
		const container = document.getElementById('testCasesContainer');
		if (!container) return;

		const testCases = container.querySelectorAll('.test-case');
		testCases.forEach((testCase, index) => {
			testCase.dataset.index = index;
			const header = testCase.querySelector('h5');
			if (header) {
				header.textContent = `测试用例 ${index + 1}`;
			}
		});
	}

	// 更新删除按钮显示状态
	function updateTestCaseDeleteButtons() {
		const container = document.getElementById('testCasesContainer');
		if (!container) return;

		const testCases = container.querySelectorAll('.test-case');
		const shouldShowDelete = testCases.length > 1;

		testCases.forEach(testCase => {
			const deleteBtn = testCase.querySelector('.remove-test-case');
			if (deleteBtn) {
				deleteBtn.style.display = shouldShowDelete ? 'inline-block' : 'none';
			}
		});
	}

	// 预览题目
	function previewCustomProblem() {
		console.log('预览题目');
		showError('预览功能开发中...');
	}

	// 处理自定义题目表单提交
	function handleCustomProblemSubmit(event) {
		event.preventDefault();
		console.log('提交自定义题目表单');

		const formData = new FormData(event.target);
		const submission = {
			title: formData.get('title'),
			difficulty: formData.get('difficulty'),
			category: formData.get('category'),
			description: formData.get('description'),
			templateCode: formData.get('templateCode'),
			hints: formData.get('hints') ? formData.get('hints').split('\n').filter(h => h.trim()) : [],
			testCases: []
		};

		// 收集测试用例数据
		const testCases = document.querySelectorAll('.test-case');
		testCases.forEach(testCase => {
			const input = testCase.querySelector('[name="testInput"]')?.value?.trim();
			const output = testCase.querySelector('[name="testOutput"]')?.value?.trim();
			const description = testCase.querySelector('[name="testDescription"]')?.value?.trim();

			if (input && output) {
				submission.testCases.push({
					input: input,
					expectedOutput: output,
					description: description || ''
				});
			}
		});

		// 基本验证
		if (!submission.title || !submission.difficulty || !submission.category ||
			!submission.description || !submission.templateCode || submission.testCases.length === 0) {
			showError('请填写所有必填字段并至少添加一个测试用例');
			return;
		}

		// 发送到后端
		vscode.postMessage({
			command: 'submitCustomProblem',
			submission: submission
		});
	}

	// 处理消息函数
	function handleCustomProblemSubmitted(message) {
		hideLoading();
		showConfigStatus(message.message, 'success');
		// 清空表单并切换到题目列表
		resetCustomProblemForm();
		switchProblemTab('problem-list');
	}

	function renderPendingProblems(problems) {
		console.log('渲染待审核题目:', problems);
		const container = document.getElementById('pendingProblemsContainer');
		if (!container) return;

		if (!problems || problems.length === 0) {
			container.innerHTML = '<div class="empty-state">暂无待审核题目</div>';
			return;
		}

		const html = problems.map(problem => `
			<div class="pending-problem-card" data-problem-id="${problem.id}">
				<div class="problem-header">
					<h4>${problem.title}</h4>
					<span class="difficulty ${problem.difficulty}">${problem.difficulty}</span>
				</div>
				<p class="problem-description">${problem.description.substring(0, 200)}${problem.description.length > 200 ? '...' : ''}</p>
				<div class="problem-meta">
					<span>作者: ${problem.author}</span>
					<span>提交时间: ${new Date(problem.submittedAt).toLocaleDateString()}</span>
				</div>
				<div class="problem-actions">
					<button class="btn secondary small" onclick="viewProblemDetails('${problem.id}')">📋 查看详情</button>
					<button class="btn success small" onclick="reviewProblem('${problem.id}', 'approve')">✅ 通过</button>
					<button class="btn danger small" onclick="reviewProblem('${problem.id}', 'reject')">❌ 拒绝</button>
				</div>
			</div>
		`).join('');

		container.innerHTML = html;
	}

	function handleProblemReviewed(message) {
		console.log('题目审核完成:', message);
		hideLoading();
		showConfigStatus(message.message, 'success');
		// 重新加载待审核列表
		loadPendingProblems();
		// 更新统计信息
		vscode.postMessage({ command: 'getProblemStatistics' });
	}

	function renderUserSubmissions(submissions) {
		console.log('渲染用户提交:', submissions);
		const container = document.getElementById('userSubmissionsContainer');
		if (!container) return;

		if (!submissions || submissions.length === 0) {
			container.innerHTML = '<div class="empty-state">暂无提交记录</div>';
			return;
		}

		const html = submissions.map(submission => `
			<div class="submission-card" data-submission-id="${submission.id}">
				<div class="submission-header">
					<h4>${submission.title}</h4>
					<span class="status ${submission.status}">${submission.status === 'pending' ? '⏳ 待审核' : submission.status === 'approved' ? '✅ 已通过' : '❌ 已拒绝'}</span>
				</div>
				<div class="submission-meta">
					<span>提交时间: ${new Date(submission.submittedAt).toLocaleDateString()}</span>
					${submission.reviewedAt ? `<span>审核时间: ${new Date(submission.reviewedAt).toLocaleDateString()}</span>` : ''}
				</div>
				${submission.reviewNotes ? `<div class="review-notes">审核意见: ${submission.reviewNotes}</div>` : ''}
			</div>
		`).join('');

		container.innerHTML = html;
	}

	function updateProblemStatistics(statistics) {
		console.log('更新统计信息:', statistics);
		// 更新页面统计数字
		const pendingCountEl = document.getElementById('pendingCount');
		const approvedCountEl = document.getElementById('approvedCount');
		const rejectedCountEl = document.getElementById('rejectedCount');
		const pendingTabCountEl = document.getElementById('pendingTabCount');

		if (pendingCountEl) pendingCountEl.textContent = statistics.pending;
		if (approvedCountEl) approvedCountEl.textContent = statistics.approved;
		if (rejectedCountEl) rejectedCountEl.textContent = statistics.rejected;
		if (pendingTabCountEl) pendingTabCountEl.textContent = statistics.pending;
	}

	// === 题目审核操作 ===

	// 查看题目详情
	function viewProblemDetails(problemId) {
		console.log('查看题目详情:', problemId);
		showError('题目详情查看功能开发中...');
	}

	// 审核题目
	function reviewProblem(problemId, action) {
		console.log('审核题目:', problemId, action);

		const notes = prompt(`请输入审核意见 (${action === 'approve' ? '通过' : '拒绝'}):`);
		if (notes === null) return; // 用户取消

		vscode.postMessage({
			command: 'reviewProblem',
			problemId: problemId,
			review: {
				action: action,
				notes: notes || '无审核意见'
			}
		});
	}

	// === Prompt使用统计处理函数 ===

	// 处理统计数据更新
	function handlePromptUsageStatsUpdated(message) {
		console.log('📊 统计数据已更新:', message);
		if (message.success) {
			console.log('✅ 统计数据保存成功');
		} else {
			console.error('❌ 统计数据保存失败:', message.error);
		}
	}

	// 处理统计数据加载
	function handlePromptUsageStatsLoaded(stats) {
		console.log('📊 统计数据已加载:', stats);
		if (stats) {
			// 更新本地统计数据
			promptUsageStats.generateCount = stats.generateCount || 0;
			promptUsageStats.copyCount = stats.copyCount || 0;
			promptUsageStats.useCount = stats.useCount || 0;
			promptUsageStats.optimizeCount = stats.optimizeCount || 0;

			// 显示统计信息（如果有统计面板的话）
			displayUsageStatistics();
		}
	}

	// 显示使用统计信息
	function displayUsageStatistics() {
		const ratio = getUsageRatio();
		console.log('📊 当前使用统计:', {
			生成次数: ratio.totalGenerated,
			使用次数: ratio.totalUsed,
			复制次数: ratio.totalCopied,
			使用占比: ratio.useRatio + '%',
			复制占比: ratio.copyRatio + '%'
		});

		// 如果有统计显示元素，更新它们
		const statsElement = document.getElementById('promptUsageStats');
		if (statsElement) {
			statsElement.innerHTML = `
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">生成次数</span>
						<span class="stat-value">${ratio.totalGenerated}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">使用次数</span>
						<span class="stat-value">${ratio.totalUsed}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">复制次数</span>
						<span class="stat-value">${ratio.totalCopied}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">使用占比</span>
						<span class="stat-value">${ratio.useRatio}%</span>
					</div>
				</div>
			`;
		}
	}

	// 重置自定义题目表单
	function resetCustomProblemForm() {
		const form = document.getElementById('customProblemForm');
		if (form) {
			form.reset();
			// 重置测试用例容器，保留一个默认测试用例
			const container = document.getElementById('testCasesContainer');
			if (container) {
				const testCases = container.querySelectorAll('.test-case');
				// 删除除第一个外的所有测试用例
				for (let i = 1; i < testCases.length; i++) {
					testCases[i].remove();
				}
				// 重置第一个测试用例的内容
				const firstCase = container.querySelector('.test-case');
				if (firstCase) {
					firstCase.querySelectorAll('textarea, input').forEach(input => {
						input.value = '';
					});
				}
				updateTestCaseDeleteButtons();
			}
		}
	}

})();