// Prompt Pilot 配置页面 JavaScript

(function () {
	const vscode = acquireVsCodeApi();

	let currentConfig = {};
	let currentProvider = 'openai';

	// DOM 元素引用
	const elements = {
		providerOptions: null,
		configSections: null,
		statusSection: null,
		statusContent: null,
		buttons: {}
	};

	// 初始化页面
	function init() {
		initializeElements();
		setupEventListeners();
		requestConfig();
	}

	// 初始化DOM元素
	function initializeElements() {
		elements.providerOptions = document.querySelectorAll('.provider-option');
		elements.configSections = {
			openai: document.getElementById('openai-config'),
			azure: document.getElementById('azure-config'),
			alibaba: document.getElementById('alibaba-config'),
			moonshot: document.getElementById('moonshot-config'),
			zhipu: document.getElementById('zhipu-config'),
			baichuan: document.getElementById('baichuan-config'),
			custom: document.getElementById('custom-config')
		};
		elements.statusSection = document.getElementById('status-section');
		elements.statusContent = document.getElementById('status-content');
		elements.buttons = {
			test: document.getElementById('test-btn'),
			validate: document.getElementById('validate-btn'),
			save: document.getElementById('save-btn'),
			reset: document.getElementById('reset-btn')
		};
	}

	// 设置事件监听器
	function setupEventListeners() {
		// 提供商选择
		elements.providerOptions.forEach(option => {
			option.addEventListener('click', () => {
				const provider = option.dataset.provider;
				selectProvider(provider);
			});
		});

		// 按钮事件
		elements.buttons.test.addEventListener('click', testConnection);
		elements.buttons.validate.addEventListener('click', validateAPI);
		elements.buttons.save.addEventListener('click', saveConfig);
		elements.buttons.reset.addEventListener('click', resetConfig);

		// 监听来自扩展的消息
		window.addEventListener('message', event => {
			const message = event.data;
			handleMessage(message);
		});

		// 表单实时验证
		setupFormValidation();
	}

	// 处理来自扩展的消息
	function handleMessage(message) {
		switch (message.command) {
			case 'configLoaded':
				loadConfig(message.config);
				break;
			case 'configUpdated':
				handleConfigUpdate(message);
				break;
			case 'validationStarted':
				showStatus('正在验证 API 连接...', 'loading');
				setButtonLoading('validate', true);
				break;
			case 'validationResult':
				handleValidationResult(message.result);
				setButtonLoading('validate', false);
				break;
			case 'testStarted':
				showStatus('正在测试连接...', 'loading');
				setButtonLoading('test', true);
				break;
			case 'testResult':
				handleTestResult(message.result);
				setButtonLoading('test', false);
				break;
			case 'configReset':
				handleConfigReset(message);
				break;
		}
	}

	// 选择提供商
	function selectProvider(provider) {
		// 更新选中状态
		elements.providerOptions.forEach(option => {
			option.classList.remove('selected');
			option.querySelector('input[type="radio"]').checked = false;
		});

		const selectedOption = document.querySelector(`[data-provider="${provider}"]`);
		selectedOption.classList.add('selected');
		selectedOption.querySelector('input[type="radio"]').checked = true;

		// 显示/隐藏配置区域
		Object.keys(elements.configSections).forEach(key => {
			const section = elements.configSections[key];
			if (section) {
				section.style.display = key === provider ? 'block' : 'none';
			}
		});

		currentProvider = provider;
		updateFormVisibility();
	}

	// 更新表单可见性
	function updateFormVisibility() {
		// 根据提供商显示相应的高级设置
		const advancedSettings = document.querySelector('.config-section:last-of-type');
		if (advancedSettings) {
			advancedSettings.style.display = 'block';
		}
	}

	// 加载配置
	function loadConfig(config) {
		currentConfig = config;

		// 设置提供商
		if (config.provider) {
			selectProvider(config.provider);
		}

		// 填充表单数据
		fillFormData(config);
	}

	// 填充表单数据
	function fillFormData(config) {
		// OpenAI 配置
		if (config.openai) {
			setFieldValue('openai-api-key', config.openai.apiKey);
			setFieldValue('openai-model', config.openai.model);
			setFieldValue('openai-base-url', config.openai.baseUrl);
		}

		// Azure 配置
		if (config.azure) {
			setFieldValue('azure-api-key', config.azure.apiKey);
			setFieldValue('azure-endpoint', config.azure.endpoint);
			setFieldValue('azure-deployment', config.azure.deploymentName);
			setFieldValue('azure-api-version', config.azure.apiVersion);
		}

		// 阿里云配置
		if (config.alibaba) {
			setFieldValue('alibaba-api-key', config.alibaba.apiKey);
			setFieldValue('alibaba-base-url', config.alibaba.baseUrl);
			setFieldValue('alibaba-model', config.alibaba.model);
		}

		// 月之暗面配置
		if (config.moonshot) {
			setFieldValue('moonshot-api-key', config.moonshot.apiKey);
			setFieldValue('moonshot-base-url', config.moonshot.baseUrl);
			setFieldValue('moonshot-model', config.moonshot.model);
		}

		// 智谱配置
		if (config.zhipu) {
			setFieldValue('zhipu-api-key', config.zhipu.apiKey);
			setFieldValue('zhipu-base-url', config.zhipu.baseUrl);
			setFieldValue('zhipu-model', config.zhipu.model);
		}

		// 百川配置
		if (config.baichuan) {
			setFieldValue('baichuan-api-key', config.baichuan.apiKey);
			setFieldValue('baichuan-base-url', config.baichuan.baseUrl);
			setFieldValue('baichuan-model', config.baichuan.model);
		}

		// 自定义配置
		if (config.custom) {
			setFieldValue('custom-base-url', config.custom.baseUrl);
			setFieldValue('custom-api-key', config.custom.apiKey);
			setFieldValue('custom-model', config.custom.model);
			setFieldValue('custom-api-format', config.custom.apiFormat);
		}

		// 高级设置
		setFieldValue('max-tokens', config.openai?.maxTokens || 2048);
		setFieldValue('temperature', config.openai?.temperature || 0.7);
		setFieldValue('timeout', config.timeout || 30000);
		setFieldValue('retry-attempts', config.retryAttempts || 3);
		setFieldValue('enable-debug-logs', config.enableDebugLogs || false);
	}

	// 设置字段值
	function setFieldValue(fieldId, value) {
		const field = document.getElementById(fieldId);
		if (field) {
			if (field.type === 'checkbox') {
				field.checked = value;
			} else {
				field.value = value || '';
			}
		}
	}

	// 获取字段值
	function getFieldValue(fieldId) {
		const field = document.getElementById(fieldId);
		if (field) {
			if (field.type === 'checkbox') {
				return field.checked;
			} else if (field.type === 'number') {
				return parseFloat(field.value) || 0;
			} else {
				return field.value || '';
			}
		}
		return '';
	}

	// 收集表单数据
	function collectFormData() {
		const config = {
			provider: currentProvider,
			openai: {
				apiKey: getFieldValue('openai-api-key'),
				model: getFieldValue('openai-model'),
				baseUrl: getFieldValue('openai-base-url'),
				maxTokens: getFieldValue('max-tokens'),
				temperature: getFieldValue('temperature')
			},
			azure: {
				apiKey: getFieldValue('azure-api-key'),
				endpoint: getFieldValue('azure-endpoint'),
				deploymentName: getFieldValue('azure-deployment'),
				apiVersion: getFieldValue('azure-api-version')
			},
			alibaba: {
				apiKey: getFieldValue('alibaba-api-key'),
				baseUrl: getFieldValue('alibaba-base-url'),
				model: getFieldValue('alibaba-model')
			},
			moonshot: {
				apiKey: getFieldValue('moonshot-api-key'),
				baseUrl: getFieldValue('moonshot-base-url'),
				model: getFieldValue('moonshot-model')
			},
			zhipu: {
				apiKey: getFieldValue('zhipu-api-key'),
				baseUrl: getFieldValue('zhipu-base-url'),
				model: getFieldValue('zhipu-model')
			},
			baichuan: {
				apiKey: getFieldValue('baichuan-api-key'),
				baseUrl: getFieldValue('baichuan-base-url'),
				model: getFieldValue('baichuan-model')
			},
			custom: {
				baseUrl: getFieldValue('custom-base-url'),
				apiKey: getFieldValue('custom-api-key'),
				model: getFieldValue('custom-model'),
				apiFormat: getFieldValue('custom-api-format')
			},
			timeout: getFieldValue('timeout'),
			retryAttempts: getFieldValue('retry-attempts'),
			enableDebugLogs: getFieldValue('enable-debug-logs')
		};

		return config;
	}

	// 验证表单
	function validateForm() {
		const errors = [];

		switch (currentProvider) {
			case 'openai':
				if (!getFieldValue('openai-api-key')) {
					errors.push('OpenAI API 密钥不能为空');
				}
				break;
			case 'azure':
				if (!getFieldValue('azure-api-key')) {
					errors.push('Azure API 密钥不能为空');
				}
				if (!getFieldValue('azure-endpoint')) {
					errors.push('Azure 端点不能为空');
				}
				if (!getFieldValue('azure-deployment')) {
					errors.push('Azure 部署名称不能为空');
				}
				break;
			case 'alibaba':
				if (!getFieldValue('alibaba-api-key')) {
					errors.push('阿里云 API 密钥不能为空');
				}
				break;
			case 'moonshot':
				if (!getFieldValue('moonshot-api-key')) {
					errors.push('月之暗面 API 密钥不能为空');
				}
				break;
			case 'zhipu':
				if (!getFieldValue('zhipu-api-key')) {
					errors.push('智谱 API 密钥不能为空');
				}
				break;
			case 'baichuan':
				if (!getFieldValue('baichuan-api-key')) {
					errors.push('百川智能 API 密钥不能为空');
				}
				break;
			case 'custom':
				if (!getFieldValue('custom-base-url')) {
					errors.push('自定义服务地址不能为空');
				}
				if (!getFieldValue('custom-model')) {
					errors.push('模型名称不能为空');
				}
				break;
		}

		return errors;
	}

	// 测试连接
	function testConnection() {
		const errors = validateForm();
		if (errors.length > 0) {
			showStatus(`验证失败：${errors.join('，')}`, 'error');
			return;
		}

		const config = collectFormData();
		vscode.postMessage({
			command: 'testConnection',
			config: config
		});
	}

	// 验证 API
	function validateAPI() {
		vscode.postMessage({
			command: 'validateAPI'
		});
	}

	// 保存配置
	function saveConfig() {
		const errors = validateForm();
		if (errors.length > 0) {
			showStatus(`保存失败：${errors.join('，')}`, 'error');
			return;
		}

		const config = collectFormData();
		setButtonLoading('save', true);

		vscode.postMessage({
			command: 'updateConfig',
			config: config
		});
	}

	// 重置配置
	function resetConfig() {
		if (confirm('确定要重置所有配置吗？这将清除所有已保存的设置。')) {
			vscode.postMessage({
				command: 'resetConfig'
			});
		}
	}

	// 处理配置更新结果
	function handleConfigUpdate(message) {
		setButtonLoading('save', false);

		if (message.success) {
			showStatus('✅ 配置保存成功', 'success');
		} else {
			showStatus(`❌ 配置保存失败：${message.message}`, 'error');
		}
	}

	// 处理验证结果
	function handleValidationResult(result) {
		if (result.isValid) {
			showStatus('✅ API 连接验证成功！', 'success');
		} else {
			showStatus(`❌ API 连接验证失败：${result.error}`, 'error');
		}
	}

	// 处理测试结果
	function handleTestResult(result) {
		if (result.isValid) {
			showStatus('✅ 连接测试成功！', 'success');
		} else {
			showStatus(`❌ 连接测试失败：${result.error}`, 'error');
		}
	}

	// 处理配置重置
	function handleConfigReset(message) {
		if (message.success) {
			showStatus('✅ 配置重置成功', 'success');
			// 重新加载默认配置
			setTimeout(() => {
				requestConfig();
			}, 1000);
		} else {
			showStatus(`❌ 配置重置失败：${message.message}`, 'error');
		}
	}

	// 显示状态信息
	function showStatus(message, type = 'info') {
		elements.statusSection.style.display = 'block';
		elements.statusContent.innerHTML = message;
		elements.statusContent.className = `status-content status-${type}`;

		// 自动隐藏成功消息
		if (type === 'success') {
			setTimeout(() => {
				elements.statusSection.style.display = 'none';
			}, 3000);
		}
	}

	// 设置按钮加载状态
	function setButtonLoading(buttonId, loading) {
		const button = elements.buttons[buttonId];
		if (button) {
			button.disabled = loading;

			if (loading) {
				button.innerHTML = button.innerHTML.replace(/^[^\s]+/, '<span class="loading">⟳</span>');
			} else {
				// 恢复原始文本
				switch (buttonId) {
					case 'test':
						button.innerHTML = '🧪 测试连接';
						break;
					case 'validate':
						button.innerHTML = '✅ 验证配置';
						break;
					case 'save':
						button.innerHTML = '💾 保存配置';
						break;
					case 'reset':
						button.innerHTML = '🔄 重置配置';
						break;
				}
			}
		}
	}

	// 设置表单验证
	function setupFormValidation() {
		// 实时验证API密钥格式
		const apiKeyFields = [
			'openai-api-key',
			'azure-api-key',
			'alibaba-api-key'
		];

		apiKeyFields.forEach(fieldId => {
			const field = document.getElementById(fieldId);
			if (field) {
				field.addEventListener('blur', () => {
					validateApiKeyField(field);
				});
			}
		});

		// 验证URL格式
		const urlFields = [
			'openai-base-url',
			'azure-endpoint',
			'custom-base-url'
		];

		urlFields.forEach(fieldId => {
			const field = document.getElementById(fieldId);
			if (field) {
				field.addEventListener('blur', () => {
					validateUrlField(field);
				});
			}
		});
	}

	// 验证API密钥字段
	function validateApiKeyField(field) {
		const value = field.value.trim();
		const fieldGroup = field.closest('.form-group');

		// 移除之前的验证状态
		fieldGroup.classList.remove('valid', 'invalid');

		if (value) {
			if (field.id === 'openai-api-key' && !value.startsWith('sk-')) {
				showFieldError(fieldGroup, 'OpenAI API 密钥应以 "sk-" 开头');
			} else {
				showFieldSuccess(fieldGroup, '格式正确');
			}
		}
	}

	// 验证URL字段
	function validateUrlField(field) {
		const value = field.value.trim();
		const fieldGroup = field.closest('.form-group');

		// 移除之前的验证状态
		fieldGroup.classList.remove('valid', 'invalid');

		if (value) {
			try {
				new URL(value);
				showFieldSuccess(fieldGroup, '格式正确');
			} catch {
				showFieldError(fieldGroup, 'URL 格式无效');
			}
		}
	}

	// 显示字段错误
	function showFieldError(fieldGroup, message) {
		fieldGroup.classList.add('invalid');
		let errorElement = fieldGroup.querySelector('.error-message');
		if (!errorElement) {
			errorElement = document.createElement('div');
			errorElement.className = 'error-message';
			fieldGroup.appendChild(errorElement);
		}
		errorElement.textContent = message;

		// 移除成功消息
		const successElement = fieldGroup.querySelector('.success-message');
		if (successElement) {
			successElement.remove();
		}
	}

	// 显示字段成功
	function showFieldSuccess(fieldGroup, message) {
		fieldGroup.classList.add('valid');
		let successElement = fieldGroup.querySelector('.success-message');
		if (!successElement) {
			successElement = document.createElement('div');
			successElement.className = 'success-message';
			fieldGroup.appendChild(successElement);
		}
		successElement.textContent = message;

		// 移除错误消息
		const errorElement = fieldGroup.querySelector('.error-message');
		if (errorElement) {
			errorElement.remove();
		}
	}

	// 请求当前配置
	function requestConfig() {
		vscode.postMessage({
			command: 'getConfig'
		});
	}

	// 页面加载完成后初始化
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();