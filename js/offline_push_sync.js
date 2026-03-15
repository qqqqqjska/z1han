(function() {
    const DEFAULT_STATE = {
        enabled: false,
        apiBaseUrl: '',
        vapidPublicKey: '',
        userId: 'default-user',
        deviceId: '',
        lastSyncAt: 0,
        disableLocalActiveReplyScheduler: false,
        pushPermission: 'default'
    };

    function getState() {
        if (!window.iphoneSimState) window.iphoneSimState = {};
        if (!window.iphoneSimState.offlinePushSync || typeof window.iphoneSimState.offlinePushSync !== 'object') {
            window.iphoneSimState.offlinePushSync = Object.assign({}, DEFAULT_STATE);
        } else {
            window.iphoneSimState.offlinePushSync = Object.assign({}, DEFAULT_STATE, window.iphoneSimState.offlinePushSync);
        }
        if (!window.iphoneSimState.offlinePushSync.deviceId) {
            window.iphoneSimState.offlinePushSync.deviceId = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        }
        return window.iphoneSimState.offlinePushSync;
    }

    function saveState() {
        if (typeof window.saveConfig === 'function') {
            try { window.saveConfig(); } catch (err) { console.error(err); }
        }
    }

    function base64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    }

    async function apiFetch(path, init) {
        const state = getState();
        if (!state.apiBaseUrl) throw new Error('offline push apiBaseUrl is not configured');
        const response = await fetch(`${state.apiBaseUrl.replace(/\/$/, '')}${path}`, Object.assign({
            headers: {
                'Content-Type': 'application/json'
            }
        }, init || {}));
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`API ${response.status}: ${text || response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        return contentType.includes('application/json') ? response.json() : response.text();
    }

    function buildLocalMessageFromRemote(remote) {
        return {
            id: remote.id || (`remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            time: remote.time || Date.now(),
            role: remote.role || 'assistant',
            content: remote.content || '',
            type: remote.type || 'text',
            description: remote.description || null,
            source: 'offline-backend',
            remoteId: remote.id || null,
            pushedByBackend: true,
            read: !!remote.read
        };
    }

    function hasRemoteMessage(contactId, remoteId) {
        if (!remoteId) return false;
        const history = (window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId]) || [];
        return history.some(item => item && (item.remoteId === remoteId || item.id === remoteId));
    }

    function injectRemoteMessages(messages) {
        if (!Array.isArray(messages) || !window.iphoneSimState) return 0;
        let added = 0;
        window.iphoneSimState.chatHistory = window.iphoneSimState.chatHistory || {};
        messages.forEach((remote) => {
            const contactId = remote.contactId;
            if (!contactId) return;
            if (!window.iphoneSimState.chatHistory[contactId]) {
                window.iphoneSimState.chatHistory[contactId] = [];
            }
            if (hasRemoteMessage(contactId, remote.id)) return;
            const localMessage = buildLocalMessageFromRemote(remote);
            window.iphoneSimState.chatHistory[contactId].push(localMessage);
            added += 1;
        });
        if (added > 0) {
            try {
                if (typeof window.renderContactList === 'function') {
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
                if (window.iphoneSimState.currentChatContactId && typeof window.renderChatHistory === 'function') {
                    window.renderChatHistory(window.iphoneSimState.currentChatContactId, true);
                }
                saveState();
            } catch (err) {
                console.error('[offline-push-sync] inject render failed', err);
            }
        }
        return added;
    }

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return null;
        const registration = await navigator.serviceWorker.register('js/service-worker.js');
        return registration;
    }

    async function subscribePush() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !state.vapidPublicKey) return null;
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

        const permission = await Notification.requestPermission();
        state.pushPermission = permission;
        saveState();
        if (permission !== 'granted') return null;

        const registration = await registerServiceWorker();
        if (!registration) return null;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(state.vapidPublicKey)
            });
        }

        await apiFetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
                userId: state.userId,
                deviceId: state.deviceId,
                subscription,
                userAgent: navigator.userAgent
            })
        });
        return subscription;
    }

    async function syncMessages() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl) return { added: 0, skipped: true };
        const payload = await apiFetch('/api/messages/sync', {
            method: 'POST',
            body: JSON.stringify({
                userId: state.userId,
                deviceId: state.deviceId,
                since: state.lastSyncAt || 0
            })
        });
        const messages = (payload && payload.messages) || [];
        const added = injectRemoteMessages(messages);
        state.lastSyncAt = Number((payload && payload.serverTime) || Date.now()) || Date.now();
        saveState();
        return { added, skipped: false };
    }

    async function syncActiveReplyConfig() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return;
        const payload = await apiFetch(`/api/contacts/active-reply-config?userId=${encodeURIComponent(state.userId)}`, {
            method: 'GET'
        });
        const contacts = Array.isArray(payload && payload.contacts) ? payload.contacts : [];
        const byId = new Map(contacts.map(item => [String(item.contactId), item]));
        let changed = false;
        (window.iphoneSimState.contacts || []).forEach((contact) => {
            const remote = byId.get(String(contact.id));
            if (!remote) return;
            const nextEnabled = !!remote.active_reply_enabled;
            const nextInterval = Math.max(1, Number(remote.active_reply_interval_sec || 60)) / 60;
            if (contact.activeReplyEnabled !== nextEnabled) {
                contact.activeReplyEnabled = nextEnabled;
                changed = true;
            }
            if (Number(contact.activeReplyInterval || 0) !== nextInterval) {
                contact.activeReplyInterval = nextInterval;
                changed = true;
            }
            if (remote.active_reply_start_time && contact.activeReplyStartTime !== remote.active_reply_start_time) {
                contact.activeReplyStartTime = remote.active_reply_start_time;
                changed = true;
            }
            if (remote.last_triggered_msg_id && contact.lastActiveReplyTriggeredMsgId !== remote.last_triggered_msg_id) {
                contact.lastActiveReplyTriggeredMsgId = remote.last_triggered_msg_id;
                changed = true;
            }
        });
        if (changed) saveState();
    }

    async function uploadContactConfig(contact) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contact) return;
        try {
            await apiFetch('/api/contacts', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId: contact.id,
                    name: contact.remark || contact.nickname || contact.name || '',
                    personaPrompt: contact.persona || '',
                    contextLimit: Number(contact.contextLimit || 0),
                    activeReplyEnabled: !!contact.activeReplyEnabled,
                    activeReplyInterval: Number(contact.activeReplyInterval || 1),
                    activeReplyStartTime: Number(contact.activeReplyStartTime || 0),
                    lastActiveReplyTriggeredMsgId: contact.lastActiveReplyTriggeredMsgId || null
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadContactConfig failed', err);
        }
    }

    async function uploadAiProfile() {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !window.iphoneSimState) return;
        const primary = window.iphoneSimState.aiSettings || {};
        const secondary = window.iphoneSimState.aiSettings2 || {};
        const settings = primary.url ? primary : secondary;
        if (!settings || !settings.url || !settings.key || !settings.model) return;
        try {
            await apiFetch('/api/ai-profile', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    apiUrl: settings.url || '',
                    apiKey: settings.key || '',
                    model: settings.model || '',
                    temperature: Number(settings.temperature || 0.7)
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadAiProfile failed', err);
        }
    }

    async function uploadChatContext(contactId) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId) return;
        const contact = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId))
            : null;
        const contextLimit = contact && Number(contact.contextLimit) > 0 ? Number(contact.contextLimit) : 50;
        const history = ((((window.iphoneSimState || {}).chatHistory || {})[contactId]) || []).slice(-contextLimit);
        try {
            await apiFetch('/api/chat-context', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    contextLimit,
                    messages: history.map((message) => ({
                        id: message && message.id ? message.id : null,
                        role: message && (message.role || (message.isUser ? 'user' : 'assistant')) || 'assistant',
                        content: message && message.content ? message.content : '',
                        type: message && message.type ? message.type : 'text',
                        time: Number(message && message.time ? message.time : Date.now())
                    }))
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadChatContext failed', err);
        }
    }

    async function uploadPromptContext(contactId) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId || !window.iphoneSimState) return;
        const contact = Array.isArray(window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts.find(item => String(item.id) === String(contactId))
            : null;
        if (!contact) return;

        const history = ((((window.iphoneSimState || {}).chatHistory || {})[contactId]) || []);

        let worldbookContext = '';
        if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
            const activeEntries = window.iphoneSimState.worldbook.filter(entry => entry.enabled && contact.linkedWbCategories.includes(entry.categoryId));
            if (activeEntries.length > 0) {
                worldbookContext = activeEntries.map(entry => entry.content).join('\n');
            }
        }

        let memoryContext = '';
        try {
            if (typeof window.buildMemoryContextByPolicy === 'function') {
                memoryContext = window.buildMemoryContextByPolicy(contact, history, 'chat-text') || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildMemoryContextByPolicy failed', err);
        }

        let timeContext = '';
        try {
            if (typeof window.buildRealtimeTimeContext === 'function') {
                timeContext = window.buildRealtimeTimeContext(contact.id) || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildRealtimeTimeContext failed', err);
        }

        let calendarContext = '';
        try {
            if (contact.calendarAwareEnabled !== false && typeof window.buildCalendarPromptContext === 'function') {
                calendarContext = window.buildCalendarPromptContext() || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] buildCalendarPromptContext failed', err);
        }

        let itineraryContext = '';
        try {
            if (typeof window.getCurrentItineraryInfo === 'function') {
                itineraryContext = await window.getCurrentItineraryInfo(contact.id) || '';
            }
        } catch (err) {
            console.error('[offline-push-sync] getCurrentItineraryInfo failed', err);
        }

        let lookusContext = '';
        try {
            if (contact.lookusData) {
                const data = contact.lookusData;
                const lastUpdate = data.lastUpdateTime ? new Date(data.lastUpdateTime).toLocaleTimeString() : '未知';
                let appUsage = '';
                if (Array.isArray(data.appList) && data.appList.length > 0) {
                    appUsage = '\n- 最近使用的APP: ' + data.appList.map(app => `${app.name}(${app.time})`).join(', ');
                }
                lookusContext = `【LookUs 状态 (用户可见)】\n用户可以通过 "LookUs" 应用实时查看你的以下状态 (更新于 ${lastUpdate}):\n- 距离: ${data.distance || '未知'} km\n- 电量: ${data.battery || '未知'}\n- 网络: ${data.network || '未知'}\n- 手机型号: ${data.device || '未知'}\n- 屏幕使用时间: ${data.screenTimeH || 0}小时${data.screenTimeM || 0}分\n- 解锁次数: ${data.unlockCount || 0}\n- 最近解锁: ${data.lastUnlock || '未知'}\n- 停留地点数: ${data.stops || 0}${appUsage}\n⚠️ 你知道用户能看到这些信息。如果用户问起你的位置、电量或你在干什么，请结合这些信息回答。`;
                if (Array.isArray(data.reportLog) && data.reportLog.length > 0) {
                    const userEvents = data.reportLog.filter(item => item.isUserEvent).slice(0, 5);
                    if (userEvents.length > 0) {
                        lookusContext += `\n\n【用户的手机状态通知】\n你同样可以通过 LookUs 看到用户(对方)的手机状态变化：\n`;
                        userEvents.forEach(event => {
                            lookusContext += `- ${event.time}: ${String(event.text || '').replace('📱 ', '')}\n`;
                        });
                        lookusContext += `\n⚠️ 你可以自然地在聊天中提及或关心这些状态，但不要每次都提，要自然。`;
                    }
                }
            }
        } catch (err) {
            console.error('[offline-push-sync] build LookUs context failed', err);
        }

        let meetingContext = '';
        try {
            const meetings = window.iphoneSimState.meetings && window.iphoneSimState.meetings[contact.id];
            if (Array.isArray(meetings) && meetings.length > 0) {
                const syncedMeetings = meetings.filter(item => item && item.syncWithChat === true);
                const lastMeeting = syncedMeetings.length > 0 ? syncedMeetings[syncedMeetings.length - 1] : null;
                if (lastMeeting && Array.isArray(lastMeeting.content) && lastMeeting.content.length > 0) {
                    const meetingTime = new Date(lastMeeting.time || Date.now());
                    const meetingTimeStr = `${meetingTime.getMonth() + 1}月${meetingTime.getDate()}日`;
                    const recentContent = lastMeeting.content.slice(-5).map(item => `${item.role === 'user' ? '用户' : (contact.name || '联系人')}: ${item.text || ''}`).join('\n');
                    meetingContext = `【线下见面记忆】\n你们最近一次见面是在 ${meetingTimeStr} (${lastMeeting.title || '线下见面'})。\n当时发生的剧情片段：\n${recentContent}\n(请知晓你们已经见过面，并根据剧情发展进行聊天)`;
                }
            }
        } catch (err) {
            console.error('[offline-push-sync] build meeting context failed', err);
        }

        const importantStateContext = '';

        try {
            await apiFetch('/api/prompt-context', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    worldbookContext,
                    memoryContext,
                    importantStateContext,
                    lookusContext,
                    meetingContext,
                    timeContext,
                    calendarContext,
                    itineraryContext
                })
            });
        } catch (err) {
            console.error('[offline-push-sync] uploadPromptContext failed', err);
        }
    }

    async function uploadChatSnapshot(contactId) {
        const state = getState();
        if (!state.enabled || !state.apiBaseUrl || !contactId) return;
        const history = (((window.iphoneSimState || {}).chatHistory || {})[contactId]) || [];
        const lastMessage = history.length ? history[history.length - 1] : null;
        if (!lastMessage) return;
        try {
            await apiFetch('/api/messages/snapshot', {
                method: 'POST',
                body: JSON.stringify({
                    userId: state.userId,
                    contactId,
                    lastMessage: {
                        id: lastMessage.id || null,
                        time: Number(lastMessage.time || Date.now()),
                        role: lastMessage.role || (lastMessage.isUser ? 'user' : 'assistant'),
                        content: lastMessage.content || '',
                        type: lastMessage.type || 'text'
                    }
                })
            });
            await uploadChatContext(contactId);
            await uploadPromptContext(contactId);
        } catch (err) {
            console.error('[offline-push-sync] uploadChatSnapshot failed', err);
        }
    }

    function patchSaveConfig() {
        if (window.__offlinePushSavePatched || typeof window.saveConfig !== 'function') return;
        const originalSaveConfig = window.saveConfig;
        window.saveConfig = function() {
            const result = originalSaveConfig.apply(this, arguments);
            try {
                const state = getState();
                if (state.enabled && Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)) {
                    uploadAiProfile();
                    (window.iphoneSimState.contacts || []).forEach((contact) => {
                        uploadContactConfig(contact);
                    });
                    const currentId = window.iphoneSimState.currentChatContactId;
                    if (currentId) uploadChatSnapshot(currentId);
                }
            } catch (err) {
                console.error('[offline-push-sync] save patch failed', err);
            }
            return result;
        };
        window.__offlinePushSavePatched = true;
    }

    function setupVisibilitySync() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                syncMessages().catch(err => console.error(err));
            }
        });
        window.addEventListener('focus', () => {
            syncMessages().catch(err => console.error(err));
        });
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const data = event && event.data;
                if (!data || data.type !== 'offline-push-open-chat') return;
                const payload = data.payload || {};
                syncMessages().catch(err => console.error(err));
                if (payload.contactId && typeof window.openChat === 'function') {
                    try { window.openChat(payload.contactId); } catch (err) { console.error(err); }
                }
            });
        }
    }

    async function initOfflinePushSync() {
        const state = getState();
        patchSaveConfig();
        setupVisibilitySync();
        try {
            const url = new URL(window.location.href);
            const contactId = url.searchParams.get('contactId');
            const shouldOpenChat = url.searchParams.get('openChat') === '1';
            if (contactId && shouldOpenChat && typeof window.openChat === 'function') {
                setTimeout(() => {
                    try { window.openChat(contactId); } catch (err) { console.error(err); }
                }, 300);
            }
        } catch (err) {
            console.error('[offline-push-sync] parse launch params failed', err);
        }
        if (!state.enabled) return;
        try {
            await registerServiceWorker();
        } catch (err) {
            console.error('[offline-push-sync] registerServiceWorker failed', err);
        }
        try {
            await uploadAiProfile();
        } catch (err) {
            console.error('[offline-push-sync] initial uploadAiProfile failed', err);
        }
        try {
            await syncActiveReplyConfig();
        } catch (err) {
            console.error('[offline-push-sync] syncActiveReplyConfig failed', err);
        }
        try {
            await syncMessages();
        } catch (err) {
            console.error('[offline-push-sync] initial sync failed', err);
        }
    }

    async function enableWithConfig(config) {
        const state = getState();
        if (config && typeof config === 'object') {
            Object.assign(state, config);
        }
        state.enabled = true;
        saveState();
        await initOfflinePushSync();
        return subscribePush();
    }

    window.offlinePushSync = {
        getState,
        init: initOfflinePushSync,
        enableWithConfig,
        subscribePush,
        syncMessages,
        syncActiveReplyConfig,
        uploadContactConfig,
        uploadChatSnapshot
    };

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initOfflinePushSync);
    }
})();
