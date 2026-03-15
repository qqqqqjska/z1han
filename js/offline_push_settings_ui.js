(function() {
    function getDom() {
        return {
            enabledToggle: document.getElementById('offline-push-enabled-toggle'),
            apiBaseUrlInput: document.getElementById('offline-push-api-base-url'),
            userIdInput: document.getElementById('offline-push-user-id'),
            vapidInput: document.getElementById('offline-push-vapid-public-key'),
            disableLocalToggle: document.getElementById('offline-push-disable-local-toggle'),
            saveBtn: document.getElementById('offline-push-save-btn'),
            enableBtn: document.getElementById('offline-push-enable-btn'),
            syncBtn: document.getElementById('offline-push-sync-btn'),
            healthBtn: document.getElementById('offline-push-health-btn'),
            status: document.getElementById('offline-push-status')
        };
    }

    function setStatus(text, type) {
        const dom = getDom();
        if (!dom.status) return;
        dom.status.textContent = text;
        dom.status.style.color = type === 'error' ? '#d93025' : (type === 'success' ? '#0f9d58' : '#666');
    }

    function readForm() {
        const dom = getDom();
        return {
            enabled: !!(dom.enabledToggle && dom.enabledToggle.checked),
            apiBaseUrl: dom.apiBaseUrlInput ? String(dom.apiBaseUrlInput.value || '').trim() : '',
            userId: dom.userIdInput ? String(dom.userIdInput.value || '').trim() : '',
            vapidPublicKey: dom.vapidInput ? String(dom.vapidInput.value || '').trim() : '',
            disableLocalActiveReplyScheduler: !!(dom.disableLocalToggle && dom.disableLocalToggle.checked)
        };
    }

    function writeForm() {
        const dom = getDom();
        const state = window.offlinePushSync && window.offlinePushSync.getState ? window.offlinePushSync.getState() : ((window.iphoneSimState || {}).offlinePushSync || {});
        if (dom.enabledToggle) dom.enabledToggle.checked = !!state.enabled;
        if (dom.apiBaseUrlInput) dom.apiBaseUrlInput.value = state.apiBaseUrl || '';
        if (dom.userIdInput) dom.userIdInput.value = state.userId || 'default-user';
        if (dom.vapidInput) dom.vapidInput.value = state.vapidPublicKey || '';
        if (dom.disableLocalToggle) dom.disableLocalToggle.checked = !!state.disableLocalActiveReplyScheduler;
        const permission = state.pushPermission || (window.Notification ? Notification.permission : 'unsupported');
        const apiLabel = state.apiBaseUrl ? `后端：${state.apiBaseUrl}` : '后端未填写';
        setStatus(`状态：${state.enabled ? '已启用' : '未启用'}；通知权限：${permission}；${apiLabel}`);
    }

    function persistForm() {
        const state = window.offlinePushSync && window.offlinePushSync.getState ? window.offlinePushSync.getState() : null;
        if (!state) return null;
        const form = readForm();
        Object.assign(state, form);
        if (!state.userId) state.userId = 'default-user';
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
        writeForm();
        return state;
    }

    async function handleEnable() {
        try {
            const form = readForm();
            if (!form.apiBaseUrl) {
                setStatus('请先填写 Railway 后端网址', 'error');
                return;
            }
            if (!form.userId) {
                setStatus('请先填写用户 ID', 'error');
                return;
            }
            setStatus('正在启用离线消息并请求通知权限...');
            await window.offlinePushSync.enableWithConfig(form);
            writeForm();
            setStatus('离线消息已启用，当前设备已尝试完成绑定', 'success');
        } catch (err) {
            console.error(err);
            setStatus(`启用失败：${err.message || err}`, 'error');
        }
    }

    async function handleSync() {
        try {
            persistForm();
            setStatus('正在同步离线消息...');
            const result = await window.offlinePushSync.syncMessages();
            setStatus(`同步完成：新增 ${result && typeof result.added === 'number' ? result.added : 0} 条消息`, 'success');
        } catch (err) {
            console.error(err);
            setStatus(`同步失败：${err.message || err}`, 'error');
        }
    }

    async function handleHealthCheck() {
        try {
            const form = readForm();
            if (!form.apiBaseUrl) {
                setStatus('请先填写 Railway 后端网址', 'error');
                return;
            }
            setStatus('正在测试后端...');
            const response = await fetch(`${form.apiBaseUrl.replace(/\/$/, '')}/health`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setStatus(`后端可用：${data.ok ? '正常' : '异常'}，时间戳 ${data.now || '-'}`, 'success');
        } catch (err) {
            console.error(err);
            setStatus(`后端测试失败：${err.message || err}`, 'error');
        }
    }

    function bindEvents() {
        const dom = getDom();
        if (dom.saveBtn) {
            dom.saveBtn.addEventListener('click', () => {
                persistForm();
                setStatus('离线消息配置已保存', 'success');
            });
        }
        if (dom.enableBtn) {
            dom.enableBtn.addEventListener('click', handleEnable);
        }
        if (dom.syncBtn) {
            dom.syncBtn.addEventListener('click', handleSync);
        }
        if (dom.healthBtn) {
            dom.healthBtn.addEventListener('click', handleHealthCheck);
        }
        ['enabledToggle', 'apiBaseUrlInput', 'userIdInput', 'vapidInput', 'disableLocalToggle'].forEach((key) => {
            const el = dom[key];
            if (!el) return;
            el.addEventListener('change', persistForm);
            el.addEventListener('input', () => {
                if (key === 'apiBaseUrlInput' || key === 'userIdInput' || key === 'vapidInput') {
                    persistForm();
                }
            });
        });
    }

    function initOfflinePushSettingsUi() {
        if (!window.offlinePushSync || typeof window.offlinePushSync.getState !== 'function') return;
        writeForm();
        bindEvents();
    }

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initOfflinePushSettingsUi);
    }
})();
