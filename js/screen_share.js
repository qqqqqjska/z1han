// Screen Share Simulation Logic

window.isScreenSharing = false;

function initScreenShare() {
    console.log('initScreenShare running');
    const exitBtn = document.getElementById('exit-screen-share-btn');
    const minBtn = document.getElementById('fc-minimize-btn');
    const sendBtn = document.getElementById('fc-send-btn');
    const replyBtn = document.getElementById('fc-reply-btn');
    const input = document.getElementById('fc-input');
    const chatWindow = document.getElementById('floating-chat-window');

    if (exitBtn) {
        exitBtn.onclick = () => window.stopScreenShare();
    }

    if (minBtn && chatWindow) {
        minBtn.onclick = () => {
            chatWindow.classList.toggle('minimized');
            minBtn.innerHTML = chatWindow.classList.contains('minimized') ? '<i class="fas fa-window-maximize"></i>' : '<i class="fas fa-window-minimize"></i>';
        };
    }

    const getFloatingChatContactId = () => window.screenShareContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);

    const sendMessage = () => {
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        if (window.sendMessage) {
            const contactId = getFloatingChatContactId();
            if (contactId) {
                window.sendMessage(text, true, 'text', null, contactId);
            }
        }
    };

    const requestAiReply = () => {
        if (!window.generateAiReply) return;
        const contactId = getFloatingChatContactId();
        console.log('[ScreenShare Debug] floating reply requested', {
            contactId,
            isScreenSharing: !!window.isScreenSharing,
            navigationContext: typeof getScreenNavigationContext === 'function'
                ? getScreenNavigationContext()
                : null
        });
        if (contactId) {
            window.generateAiReply(null, contactId);
        }
    };

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (replyBtn) replyBtn.onclick = requestAiReply;
    if (input) {
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        };
    }

    if (chatWindow) {
        makeDraggable(chatWindow, chatWindow.querySelector('.fc-header'));
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#chat-more-screen-share-btn');
    if (btn) {
        console.log('Screen share button clicked via delegation');
        const morePanel = document.getElementById('chat-more-panel');
        if (morePanel) morePanel.classList.remove('slide-in');
        const chatInputArea = document.querySelector('.chat-input-area');
        if (chatInputArea) {
            chatInputArea.classList.remove('push-up');
            chatInputArea.classList.remove('push-up-more');
        }

        window.startScreenShare();
    }
});

window.startScreenShare = function() {
    console.log('startScreenShare called');
    if (window.isScreenSharing) return;

    const overlay = document.getElementById('screen-share-overlay');
    if (!overlay) {
        alert('未找到屏幕共享浮窗');
        return;
    }

    overlay.classList.remove('hidden');
    window.isScreenSharing = true;

    if (window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        window.screenShareContactId = window.iphoneSimState.currentChatContactId;
    }

    const cursor = document.getElementById('ai-cursor');
    if (cursor) {
        cursor.style.top = '50%';
        cursor.style.left = '50%';
    }

    loadFloatingChatHistory();

    const contactId = window.screenShareContactId;
    if (window.iphoneSimState && contactId) {
        const history = window.iphoneSimState.chatHistory[contactId] || [];
        history.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'system',
            content: '[系统]: 屏幕共享已开启。如需操作屏幕，请在回复里输出 ACTION: SCREEN_TAP: 目标名称。你也可以输出高层导航目标，例如“相册”“方亦楷的朋友圈”“测试的聊天”，系统会自动拆成连续点击。不要假设自己已经点击成功，只有输出 ACTION 后系统才会执行。',
            type: 'text'
        });
        if (window.saveConfig) window.saveConfig();
        appendFloatingChatMessage('[系统]: 屏幕共享已开启', false, true);
    }
};

window.stopScreenShare = function() {
    if (!window.isScreenSharing) return;

    const overlay = document.getElementById('screen-share-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    window.isScreenSharing = false;

    const contactId = window.screenShareContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (window.iphoneSimState && contactId) {
        const history = window.iphoneSimState.chatHistory[contactId] || [];
        history.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'system',
            content: '[系统]: 屏幕共享已结束', 
            type: 'text'
        });
        if (window.saveConfig) window.saveConfig();
    }

    window.screenShareContactId = null;
};

function appendFloatingChatMessage(text, isUser, isSystem = false, type = 'text') {
    const body = document.getElementById('fc-body');
    if (!body) return;

    const msgDiv = document.createElement('div');
    if (isSystem) {
        msgDiv.className = 'fc-msg';
        msgDiv.style.alignSelf = 'center';
        msgDiv.style.background = 'transparent';
        msgDiv.style.color = '#8e8e93';
        msgDiv.style.fontSize = '11px';
    } else {
        msgDiv.className = `fc-msg ${isUser ? 'user' : 'ai'}`;
    }

    if (type === 'image' || type === 'sticker' || type === 'virtual_image') {
        msgDiv.innerHTML = `<img src="${text}" style="max-width: 150px; border-radius: 4px; display: block;">`;
        msgDiv.style.padding = '0';
        msgDiv.style.background = 'transparent';
    } else {
        msgDiv.textContent = text;
    }

    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;
}

function loadFloatingChatHistory() {
    const body = document.getElementById('fc-body');
    if (!body) return;
    body.innerHTML = '';

    const contactId = window.screenShareContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (!(window.iphoneSimState && contactId)) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const recent = history.slice(-10);
    recent.forEach(msg => {
        if (msg.type === 'text' && msg.role !== 'system' && !String(msg.content || '').startsWith('[缁崵绮篯:')) {
            appendFloatingChatMessage(msg.content, msg.role === 'user', false, 'text');
        } else if (msg.type === 'image' || msg.type === 'sticker' || msg.type === 'virtual_image') {
            appendFloatingChatMessage(msg.content, msg.role === 'user', false, msg.type);
        } else if (msg.type === 'voice') {
            appendFloatingChatMessage('[鐠囶參鐓禲', msg.role === 'user', false, 'text');
        }
    });
}

window.loadFloatingChatHistory = loadFloatingChatHistory;

function getActiveScreenShareContactId() {
    return window.screenShareContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId) || null;
}

window.syncToFloatingChat = function(msg, sourceContactId = null) {
    if (!window.isScreenSharing) return;

    const activeContactId = getActiveScreenShareContactId();
    const resolvedSourceContactId = sourceContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId) || null;

    if (activeContactId && resolvedSourceContactId && String(activeContactId) !== String(resolvedSourceContactId)) {
        return;
    }

    if (activeContactId && !resolvedSourceContactId) {
        return;
    }

    if (typeof msg === 'string') {
        appendFloatingChatMessage(msg, false);
        return;
    }

    if (!msg || !msg.content) return;

    let content = msg.content;
    let type = msg.type || 'text';
    if (type === 'voice') {
        content = '[鐠囶參鐓禲';
        type = 'text';
    }

    if (!(msg.role === 'system' || String(content).startsWith('[缁崵绮篯:'))) {
        appendFloatingChatMessage(content, msg.role === 'user', false, type);
    }
};

const screenTargets = {
    '微信': '[data-app-id="wechat-app"]',
    '相册': '[data-app-id="album-app"]',
    '手机': '[data-app-id="phone-app"]',
    '购物': '[data-app-id="shopping-app"]',
    '论坛': '[data-app-id="forum-app"]',
    '设置': '[data-app-id="settings-app"]',
    '动态': '#wechat-app .wechat-tab-item[data-tab="moments"]',
    '通讯录': '#wechat-app .wechat-tab-item[data-tab="addressbook"]',
    '聊天列表': '#wechat-app .wechat-tab-item[data-tab="contacts"]',
    '朋友圈': '#ai-moments-entry, #wechat-app .wechat-tab-item[data-tab="moments"]',
    '返回': '.back-btn, #wechat-header-left-btn, #contacts-back-btn, #close-phone-app, #close-forum-app, #close-shopping-app, #close-ai-profile, #close-personal-moments',
    '聊天头像': '#chat-screen .chat-avatar[onclick*="openAiProfile"]',
    '资料页朋友圈': '#ai-moments-entry',
    '退出微信': '#contacts-back-btn',
    '退出相册': '#album-page-title.album-page-exit',
    '退出论坛': '#close-forum-app',
    '退出购物': '#close-shopping-app',
    '退出icity': '#close-icity-app, #icity-app button[onclick*="classList.add(\'hidden\')"]',
    '退出手机': '#close-phone-app',
    '退出照片': '#album-photo-close-btn',
    '收藏照片': '#album-photo-favorite-btn',
    '主屏幕': '.home-indicator',
    '桌面': '.home-indicator'
};

const SCREEN_PAGE = {
    CONTACT_CHAT: 'contact_chat',
    CHAT_LIST: 'chat_list',
    PROFILE: 'profile',
    PERSONAL_MOMENTS: 'personal_moments',
    MOMENTS_FEED: 'moments_feed',
    HOME: 'home',
    ALBUM_APP: 'album_app',
    ICITY_APP: 'icity_app',
    FORUM_APP: 'forum_app',
    SHOPPING_APP: 'shopping_app',
    PHONE_APP: 'phone_app',
    WECHAT_OTHER: 'wechat_other',
    OTHER_APP: 'other_app'
};

const HIGH_LEVEL_APP_TARGETS = {
    'album-app': '相册',
    'icity-app': 'iCity',
    'forum-app': '论坛',
    'shopping-app': '购物'
};

const CANONICAL_SCREEN_TARGET_ALIASES = {
    '返回': ['返回', '后退', 'back'],
    '微信': ['微信', 'wechat'],
    '相册': ['相册', 'album'],
    '手机': ['手机', '查手机', 'phone'],
    '购物': ['购物', 'shop', 'shopping'],
    '论坛': ['论坛', 'forum'],
    'iCity': ['icity', 'icityapp', 'icity应用'],
    '设置': ['设置', 'settings'],
    '动态': ['动态'],
    '通讯录': ['通讯录', '联系人列表', 'contacts'],
    '聊天列表': ['聊天列表', '消息列表', '列表'],
    '朋友圈': ['朋友圈'],
    '退出照片': ['退出照片', '关闭照片', '关闭图片', '退出图片', '关闭当前照片', 'closephoto', 'closephotodetail'],
    '收藏照片': ['收藏照片', '收藏这张照片', '点爱心', '点击爱心', '爱心', '喜欢这张照片', 'favoritephoto', 'favorite', 'likephoto'],
    '主屏幕': ['主屏幕', '桌面', 'home']
};

function normalizeScreenActionText(value) {
    return String(value || '').replace(/\s+/g, '').trim().toLowerCase();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getCanonicalScreenTarget(value) {
    const normalizedValue = normalizeScreenActionText(value);
    for (const [canonical, aliases] of Object.entries(CANONICAL_SCREEN_TARGET_ALIASES)) {
        if (aliases.some(alias => normalizeScreenActionText(alias) === normalizedValue)) {
            return canonical;
        }
    }
    return value;
}

function getScreenActionElementText(el) {
    if (!el) return '';

    const contactContainer = el.closest('.contact-item, .contact-content-wrapper');
    const contactNameEl = contactContainer ? contactContainer.querySelector('.contact-name') : null;

    return (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        (contactNameEl && (contactNameEl.textContent || contactNameEl.innerText)) ||
        el.textContent ||
        el.innerText ||
        ''
    ).trim();
}

function resolveScreenActionClickTarget(el) {
    if (!el) return null;
    return el.closest('.contact-item, .contact-content-wrapper, button, .list-item, .app-item, .nav-item, .wechat-tab-item, .dock-item, .back-btn, .tab-item, .draggable-item, [onclick]') || el;
}

function isVisibleScreenActionEl(el) {
    if (!el) return false;
    if (!document.documentElement.contains(el)) return false;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    return el.getClientRects().length > 0;
}

function findFirstVisibleElement(selectorText) {
    if (!selectorText || typeof selectorText !== 'string') return null;
    const selectors = selectorText.split(',').map(item => item.trim()).filter(Boolean);
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            if (isVisibleScreenActionEl(element)) {
                return element;
            }
        }
    }
    return null;
}

function getScreenActionElementZIndex(el) {
    if (!el) return 0;
    const rawValue = window.getComputedStyle(el).zIndex;
    const parsedValue = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getFrontmostVisibleElement(elements) {
    if (!Array.isArray(elements) || elements.length === 0) return null;

    return elements.reduce((topEl, currentEl) => {
        if (!topEl) return currentEl;

        const topZIndex = getScreenActionElementZIndex(topEl);
        const currentZIndex = getScreenActionElementZIndex(currentEl);
        if (currentZIndex !== topZIndex) {
            return currentZIndex > topZIndex ? currentEl : topEl;
        }

        const position = topEl.compareDocumentPosition(currentEl);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            return currentEl;
        }

        return topEl;
    }, null);
}

function getVisibleScreenAppId() {
    const visibleAppIds = ['wechat-app', 'album-app', 'icity-app', 'forum-app', 'shopping-app', 'phone-app'];

    const visibleApps = visibleAppIds
        .map(appId => document.getElementById(appId))
        .filter(app => app && isVisibleScreenActionEl(app) && !app.classList.contains('hidden'));

    const frontmostApp = getFrontmostVisibleElement(visibleApps);
    return frontmostApp ? frontmostApp.id : null;
}

function getActiveWechatTab() {
    const activeTab = document.querySelector('#wechat-app .wechat-tab-item.active');
    return activeTab ? activeTab.dataset.tab || '' : '';
}

function getScreenNavigationContext() {
    const chatScreen = document.getElementById('chat-screen');
    const profileScreen = document.getElementById('ai-profile-screen');
    const personalMomentsScreen = document.getElementById('personal-moments-screen');
    const wechatApp = document.getElementById('wechat-app');
    const visibleAppId = getVisibleScreenAppId();
    const activeWechatTab = getActiveWechatTab();

    let page = SCREEN_PAGE.HOME;
    if (visibleAppId === 'album-app') {
        page = SCREEN_PAGE.ALBUM_APP;
    } else if (visibleAppId === 'icity-app') {
        page = SCREEN_PAGE.ICITY_APP;
    } else if (visibleAppId === 'forum-app') {
        page = SCREEN_PAGE.FORUM_APP;
    } else if (visibleAppId === 'shopping-app') {
        page = SCREEN_PAGE.SHOPPING_APP;
    } else if (visibleAppId === 'phone-app') {
        page = SCREEN_PAGE.PHONE_APP;
    } else if (personalMomentsScreen && isVisibleScreenActionEl(personalMomentsScreen) && !personalMomentsScreen.classList.contains('hidden')) {
        page = SCREEN_PAGE.PERSONAL_MOMENTS;
    } else if (profileScreen && isVisibleScreenActionEl(profileScreen) && !profileScreen.classList.contains('hidden')) {
        page = SCREEN_PAGE.PROFILE;
    } else if (chatScreen && isVisibleScreenActionEl(chatScreen) && !chatScreen.classList.contains('hidden')) {
        page = SCREEN_PAGE.CONTACT_CHAT;
    } else if (wechatApp && isVisibleScreenActionEl(wechatApp) && !wechatApp.classList.contains('hidden')) {
        if (activeWechatTab === 'moments') {
            page = SCREEN_PAGE.MOMENTS_FEED;
        } else if (activeWechatTab === 'contacts') {
            page = SCREEN_PAGE.CHAT_LIST;
        } else {
            page = SCREEN_PAGE.WECHAT_OTHER;
        }
    }

    return {
        page,
        visibleAppId,
        activeWechatTab,
        currentChatContactId: window.iphoneSimState && window.iphoneSimState.currentChatContactId,
        currentProfileContactId: window.iphoneSimState && window.iphoneSimState.currentAiProfileContactId,
        personalMomentsSource: window.iphoneSimState && window.iphoneSimState.personalMomentsSource
    };
}

function getContactById(contactId) {
    if (!contactId || !window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return null;
    return window.iphoneSimState.contacts.find(contact => String(contact.id) === String(contactId)) || null;
}

function getContactDisplayName(contact) {
    if (!contact) return '';
    return contact.remark || contact.nickname || contact.name || '';
}

function getContactNameVariants(contact) {
    if (!contact) return [];
    return [contact.remark, contact.nickname, contact.name]
        .filter(Boolean)
        .map(name => ({ raw: name, normalized: normalizeScreenActionText(name) }));
}

function getCurrentContextContactId(context = getScreenNavigationContext()) {
    if (!context) return null;
    if (context.page === SCREEN_PAGE.PROFILE || context.page === SCREEN_PAGE.PERSONAL_MOMENTS) {
        return context.currentProfileContactId || context.currentChatContactId || null;
    }
    if (context.page === SCREEN_PAGE.CONTACT_CHAT) {
        return context.currentChatContactId || null;
    }
    return null;
}

function getCurrentContextContact(context = getScreenNavigationContext()) {
    return getContactById(getCurrentContextContactId(context));
}

function isSameContact(contactA, contactB) {
    if (!contactA || !contactB) return false;
    return String(contactA.id) === String(contactB.id);
}

function findContactByScreenActionText(targetDesc) {
    const normalizedTargetDesc = normalizeScreenActionText(targetDesc);
    const contacts = (window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)) ? window.iphoneSimState.contacts : [];

    const getNames = (contact) => getContactNameVariants(contact).map(item => item.normalized);

    return contacts.find(contact => getNames(contact).includes(normalizedTargetDesc))
        || contacts.find(contact => getNames(contact).some(name => name.includes(normalizedTargetDesc) || normalizedTargetDesc.includes(name)))
        || null;
}

function findContactMentionInText(text) {
    const normalizedText = normalizeScreenActionText(text);
    const contacts = (window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)) ? window.iphoneSimState.contacts : [];
    let bestMatch = null;

    contacts.forEach(contact => {
        getContactNameVariants(contact).forEach(variant => {
            if (!variant.normalized || !normalizedText.includes(variant.normalized)) return;
            if (!bestMatch || variant.normalized.length > bestMatch.matchLength) {
                bestMatch = { contact, matchLength: variant.normalized.length };
            }
        });
    });

    return bestMatch ? bestMatch.contact : null;
}

function containsCurrentContactPronoun(normalizedText) {
    return ['他的', '她的', '它的', '这个人', '这人', 'ta的', 'ta', '他', '她', '它'].some(keyword => normalizedText.includes(keyword));
}

function resolveContactReferenceFromText(text, context) {
    const explicitContact = findContactMentionInText(text);
    if (explicitContact) {
        return { contact: explicitContact, ambiguous: false, usedPronoun: false };
    }

    const normalizedText = normalizeScreenActionText(text);
    if (!containsCurrentContactPronoun(normalizedText)) {
        return { contact: null, ambiguous: false, usedPronoun: false };
    }

    const currentContact = getCurrentContextContact(context);
    if (currentContact) {
        return { contact: currentContact, ambiguous: false, usedPronoun: true };
    }

    return { contact: null, ambiguous: true, usedPronoun: true };
}

function textHasAnyKeyword(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function resolveScreenNavigationIntent(targetDesc, context) {
    const normalizedText = normalizeScreenActionText(targetDesc);
    if (!normalizedText) return null;

    const isWechatIntent = textHasAnyKeyword(normalizedText, ['回微信', '去微信', '打开微信']) || normalizedText === '微信' || normalizedText === 'wechat';
    if (isWechatIntent) {
        return { type: 'wechat_chat_list' };
    }

    const isChatListIntent = textHasAnyKeyword(normalizedText, ['看我的聊天', '去聊天列表', '回聊天列表', '打开聊天列表', '消息列表']) || normalizedText === '聊天列表';
    if (isChatListIntent) {
        return { type: 'wechat_chat_list' };
    }

    const isAlbumIntent = textHasAnyKeyword(normalizedText, ['我的相册', '看我的相册', '去相册', '打开相册']) || normalizedText === '相册';
    if (isAlbumIntent) {
        return { type: 'open_app', appId: 'album-app', appLabel: '相册' };
    }

    if (textHasAnyKeyword(normalizedText, ['去论坛', '打开论坛', '论坛app']) || normalizedText === '论坛') {
        return { type: 'open_app', appId: 'forum-app', appLabel: '论坛' };
    }

    if (textHasAnyKeyword(normalizedText, ['去购物', '打开购物', '购物app']) || normalizedText === '购物') {
        return { type: 'open_app', appId: 'shopping-app', appLabel: '购物' };
    }

    if (textHasAnyKeyword(normalizedText, ['閸樼杯city', '閹垫挸绱慽city', '閸樼杯cityapp', '閹垫挸绱慽cityapp']) || normalizedText === 'icity' || normalizedText === 'icityapp') {
        return { type: 'open_app', appId: 'icity-app', appLabel: 'iCity' };
    }

    if (textHasAnyKeyword(normalizedText, ['我的朋友圈', '看我的朋友圈', '我的动态', '看我的动态', '去动态', '打开动态', '进入动态']) || normalizedText === '动态') {
        return { type: 'my_moments' };
    }

    const contactRef = resolveContactReferenceFromText(targetDesc, context);
    const isChatIntent = textHasAnyKeyword(normalizedText, ['聊天', '对话', '消息', '私聊', '聊天页'])
        || (!!contactRef.contact && getContactNameVariants(contactRef.contact).some(variant => variant.normalized === normalizedText));
    const isProfileIntent = textHasAnyKeyword(normalizedText, ['资料', '主页', '个人页', '名片', '资料卡', '信息页']);
    const isMomentsIntent = normalizedText.includes('朋友圈') || normalizedText.includes('个人动态');

    if (contactRef.ambiguous && (isChatIntent || isProfileIntent || isMomentsIntent)) {
        return { type: 'ambiguous', reason: '目标不明确，无法判断当前指的是哪位联系人' };
    }

    if (contactRef.contact && isMomentsIntent) {
        return { type: 'contact_moments', contact: contactRef.contact };
    }

    if (contactRef.contact && isProfileIntent) {
        return { type: 'contact_profile', contact: contactRef.contact };
    }

    if (contactRef.contact && isChatIntent) {
        return { type: 'contact_chat', contact: contactRef.contact };
    }

    return null;
}

function createTapStep(target, options = {}) {
    const label = options.label || target;
    return {
        type: 'tap',
        target,
        label,
        fallback: options.fallback || null,
        failureText: options.failureText || `未找到 ${label} 入口`,
        delay: typeof options.delay === 'number' ? options.delay : 320
    };
}

function createContactStep(contact) {
    const displayName = getContactDisplayName(contact) || '该联系人';
    return createTapStep(displayName, {
        label: displayName,
        fallback: () => {
            if (typeof window.openChat === 'function') {
                window.openChat(contact.id);
                return true;
            }
            return false;
        },
        failureText: `未找到 ${displayName} 的聊天入口`
    });
}

function createOpenWechatStep() {
    return createTapStep('微信', {
        fallback: () => {
            if (typeof window.handleAppClick === 'function') {
                window.handleAppClick('wechat-app', '微信');
                return true;
            }
            const app = document.getElementById('wechat-app');
            if (app) {
                app.classList.remove('hidden');
                return true;
            }
            return false;
        },
        failureText: '未能打开微信'
    });
}

function createHideAppStep(target, appId, failureText) {
    return createTapStep(target, {
        fallback: () => {
            const app = document.getElementById(appId);
            if (!app) return false;
            app.classList.add('hidden');
            return true;
        },
        failureText
    });
}

function createExitWechatStep() {
    return createHideAppStep('退出微信', 'wechat-app', '未能退出微信');
}

function buildPlanToChatList(context) {
    switch (context.page) {
        case SCREEN_PAGE.CHAT_LIST:
            return [];
        case SCREEN_PAGE.CONTACT_CHAT:
            return [createTapStep('返回', { failureText: '未能返回聊天列表' })];
        case SCREEN_PAGE.PROFILE: {
            const plan = [createTapStep('返回', { failureText: '未能关闭资料页' })];
            if (
                context.currentChatContactId
                && context.currentProfileContactId
                && String(context.currentChatContactId) === String(context.currentProfileContactId)
            ) {
                plan.push(createTapStep('返回', { failureText: '未能返回聊天列表' }));
            }
            return plan;
        }
        case SCREEN_PAGE.PERSONAL_MOMENTS: {
            const plan = [createTapStep('返回', { failureText: '未能关闭朋友圈页面' })];
            if (context.personalMomentsSource === 'ai-profile') {
                plan.push(createTapStep('返回', { failureText: '未能关闭资料页' }));
            }
            if (context.currentChatContactId) {
                plan.push(createTapStep('返回', { failureText: '未能返回聊天列表' }));
            }
            return plan;
        }
        case SCREEN_PAGE.MOMENTS_FEED:
        case SCREEN_PAGE.WECHAT_OTHER:
            return [createTapStep('聊天列表', { failureText: '未能回到微信聊天列表' })];
        case SCREEN_PAGE.HOME:
            return [createOpenWechatStep()];
        case SCREEN_PAGE.ALBUM_APP:
        case SCREEN_PAGE.ICITY_APP:
        case SCREEN_PAGE.FORUM_APP:
        case SCREEN_PAGE.SHOPPING_APP:
        case SCREEN_PAGE.PHONE_APP:
        case SCREEN_PAGE.OTHER_APP:
            return [
                ...buildPlanToHome(context),
                createOpenWechatStep()
            ];
        default:
            return [];
    }
}

function buildPlanToHome(context) {
    switch (context.page) {
        case SCREEN_PAGE.HOME:
            return [];
        case SCREEN_PAGE.CHAT_LIST:
            return [createExitWechatStep()];
        case SCREEN_PAGE.CONTACT_CHAT:
        case SCREEN_PAGE.PROFILE:
        case SCREEN_PAGE.PERSONAL_MOMENTS:
        case SCREEN_PAGE.MOMENTS_FEED:
        case SCREEN_PAGE.WECHAT_OTHER:
            return [
                ...buildPlanToChatList(context),
                createExitWechatStep()
            ];
        case SCREEN_PAGE.ALBUM_APP:
            return [createHideAppStep('退出相册', 'album-app', '未能退出相册')];
        case SCREEN_PAGE.ICITY_APP:
            return [createHideAppStep('退出icity', 'icity-app', '未能退出 iCity')];
        case SCREEN_PAGE.FORUM_APP:
            return [createHideAppStep('退出论坛', 'forum-app', '未能退出论坛')];
        case SCREEN_PAGE.SHOPPING_APP:
            return [createHideAppStep('退出购物', 'shopping-app', '未能退出购物')];
        case SCREEN_PAGE.PHONE_APP:
            return [createHideAppStep('退出手机', 'phone-app', '未能退出手机')];
        default:
            return [];
    }
}

function buildPlanToContactChat(contact, context) {
    const currentContact = getCurrentContextContact(context);
    if (context.page === SCREEN_PAGE.CONTACT_CHAT && isSameContact(currentContact, contact)) {
        return [];
    }

    if (
        context.page === SCREEN_PAGE.PROFILE
        && isSameContact(currentContact, contact)
        && context.currentChatContactId
        && String(context.currentChatContactId) === String(contact.id)
    ) {
        return [createTapStep('返回', { failureText: '未能返回聊天页' })];
    }

    if (
        context.page === SCREEN_PAGE.PERSONAL_MOMENTS
        && isSameContact(currentContact, contact)
        && context.currentChatContactId
        && String(context.currentChatContactId) === String(contact.id)
    ) {
        const plan = [createTapStep('返回', { failureText: '未能关闭朋友圈页面' })];
        if (context.personalMomentsSource === 'ai-profile') {
            plan.push(createTapStep('返回', { failureText: '未能返回聊天页' }));
        }
        return plan;
    }

    return [...buildPlanToChatList(context), createContactStep(contact)];
}

function buildPlanToContactProfile(contact, context) {
    const currentContact = getCurrentContextContact(context);
    const displayName = getContactDisplayName(contact) || '该联系人';
    if (context.page === SCREEN_PAGE.PROFILE && isSameContact(currentContact, contact)) {
        return [];
    }
    if (
        context.page === SCREEN_PAGE.PERSONAL_MOMENTS
        && isSameContact(currentContact, contact)
        && context.personalMomentsSource === 'ai-profile'
    ) {
        return [createTapStep('返回', { failureText: `未能返回 ${displayName} 的资料页` })];
    }

    return [
        ...buildPlanToContactChat(contact, context),
        createTapStep('聊天头像', {
            label: `${displayName} 的聊天头像`,
            fallback: () => {
                if (typeof window.openAiProfile === 'function') {
                    window.openAiProfile(contact.id);
                    return true;
                }
                return false;
            },
            failureText: `未找到 ${displayName} 的资料入口`
        })
    ];
}

function buildPlanToContactMoments(contact, context) {
    const currentContact = getCurrentContextContact(context);
    const displayName = getContactDisplayName(contact) || '该联系人';
    if (context.page === SCREEN_PAGE.PERSONAL_MOMENTS && isSameContact(currentContact, contact)) {
        return [];
    }

    const openMomentsStep = createTapStep('资料页朋友圈', {
        label: `${displayName} 的朋友圈入口`,
        fallback: () => {
            if (typeof window.openAiMoments === 'function') {
                window.openAiMoments();
                return true;
            }
            return false;
        },
        failureText: `未找到 ${displayName} 的朋友圈入口`
    });

    if (context.page === SCREEN_PAGE.PROFILE && isSameContact(currentContact, contact)) {
        return [openMomentsStep];
    }

    return [
        ...buildPlanToContactProfile(contact, context),
        openMomentsStep
    ];
}

function buildPlanToMyMoments(context) {
    switch (context.page) {
        case SCREEN_PAGE.MOMENTS_FEED:
            return [];
        case SCREEN_PAGE.CHAT_LIST:
        case SCREEN_PAGE.WECHAT_OTHER:
            return [createTapStep('动态', { failureText: '未找到动态入口' })];
        default:
            return [...buildPlanToChatList(context), createTapStep('动态', { failureText: '未找到动态入口' })];
    }
}

function buildPlanToApp(appId, context) {
    const appLabel = HIGH_LEVEL_APP_TARGETS[appId] || appId;
    const appPageMap = {
        'album-app': SCREEN_PAGE.ALBUM_APP,
        'icity-app': SCREEN_PAGE.ICITY_APP,
        'forum-app': SCREEN_PAGE.FORUM_APP,
        'shopping-app': SCREEN_PAGE.SHOPPING_APP,
        'phone-app': SCREEN_PAGE.PHONE_APP
    };
    if (context.visibleAppId === appId || appPageMap[appId] === context.page) {
        return [];
    }

    return [
        ...buildPlanToHome(context),
        createTapStep(appLabel, {
            fallback: () => {
                if (typeof window.handleAppClick === 'function') {
                    window.handleAppClick(appId, appLabel);
                    return true;
                }
                const app = document.getElementById(appId);
                if (app) {
                    app.classList.remove('hidden');
                    return true;
                }
                return false;
            },
            failureText: `未能打开 ${appLabel}`
        })
    ];
}

function buildScreenNavigationPlan(intent, context) {
    if (!intent) return null;
    switch (intent.type) {
        case 'wechat_chat_list':
            return buildPlanToChatList(context);
        case 'contact_chat':
            return buildPlanToContactChat(intent.contact, context);
        case 'contact_profile':
            return buildPlanToContactProfile(intent.contact, context);
        case 'contact_moments':
            return buildPlanToContactMoments(intent.contact, context);
        case 'my_moments':
            return buildPlanToMyMoments(context);
        case 'open_app':
            return buildPlanToApp(intent.appId, context);
        default:
            return null;
    }
}

function getNavigationSuccessMessage(intent) {
    switch (intent.type) {
        case 'wechat_chat_list':
            return '[系统]: 已回到微信聊天列表';
        case 'contact_chat':
            return `[系统]: 已打开 ${getContactDisplayName(intent.contact)} 的聊天`;
        case 'contact_profile':
            return `[系统]: 已打开 ${getContactDisplayName(intent.contact)} 的资料页`;
        case 'contact_moments':
            return `[系统]: 已打开 ${getContactDisplayName(intent.contact)} 的朋友圈`;
        case 'my_moments':
            return '[系统]: 已打开动态页';
        case 'open_app':
            return `[系统]: 已打开 ${intent.appLabel || HIGH_LEVEL_APP_TARGETS[intent.appId] || intent.appId}`;
        default:
            return '[系统]: 已完成导航';
    }
}

function emitScreenShareSystemMessage(text) {
    appendFloatingChatMessage(text, false, true);
    injectSystemContext(text);
}

function getAlbumBackTarget() {
    const photoView = document.getElementById('album-photo-detail-view');
    if (photoView && photoView.classList.contains('open')) {
        return findFirstVisibleElement('#album-photo-close-btn');
    }

    const detailOverlay = document.getElementById('album-detail-overlay');
    if (detailOverlay && detailOverlay.classList.contains('open')) {
        return findFirstVisibleElement('#album-detail-back-btn');
    }

    return findFirstVisibleElement('#album-page-title.album-page-exit');
}

function parseChineseScreenActionNumber(rawValue) {
    const value = String(rawValue || '').trim();
    if (!value) return NaN;
    if (/^\d+$/.test(value)) return Number.parseInt(value, 10);

    const digitMap = {
        '零': 0,
        '〇': 0,
        '一': 1,
        '二': 2,
        '两': 2,
        '三': 3,
        '四': 4,
        '五': 5,
        '六': 6,
        '七': 7,
        '八': 8,
        '九': 9
    };

    if (value === '十') return 10;
    if (value.startsWith('十')) {
        const tail = value.slice(1);
        return 10 + (digitMap[tail] || 0);
    }
    if (value.endsWith('十')) {
        const head = value.slice(0, -1);
        return (digitMap[head] || 0) * 10;
    }
    if (value.includes('十')) {
        const parts = value.split('十');
        const tens = digitMap[parts[0]] || 0;
        const ones = digitMap[parts[1]] || 0;
        return tens * 10 + ones;
    }

    return digitMap[value] || NaN;
}

function parseAlbumIndexedTarget(targetDesc) {
    const rawText = String(targetDesc || '').trim();
    if (!rawText) return null;

    const patterns = [
        { kind: 'photo', regex: /^图片\s*(\d+)$/i },
        { kind: 'photo', regex: /^照片\s*(\d+)$/i },
        { kind: 'photo', regex: /^第\s*(\d+)\s*(?:张(?:图片|照片|图)?|个图片|个照片)?$/i },
        { kind: 'photo', regex: /^第\s*([一二三四五六七八九十两〇零]+)\s*(?:张(?:图片|照片|图)?|个图片|个照片)?$/ },
        { kind: 'photo', regex: /^([一二三四五六七八九十两〇零]+)\s*(?:张(?:图片|照片|图)?|个图片|个照片)?$/ },
        { kind: 'album', regex: /^相册\s*(\d+)$/i },
        { kind: 'album', regex: /^第\s*(\d+)\s*个相册$/i },
        { kind: 'album', regex: /^第\s*([一二三四五六七八九十两〇零]+)\s*个相册$/ }
    ];

    for (const pattern of patterns) {
        const match = rawText.match(pattern.regex);
        if (!match) continue;
        const index = parseChineseScreenActionNumber(match[1]);
        if (Number.isFinite(index) && index >= 1) {
            return {
                kind: pattern.kind,
                index
            };
        }
    }

    return null;
}

function getAlbumIndexedTargetElement(targetDesc, context = getScreenNavigationContext()) {
    if (!context || context.page !== SCREEN_PAGE.ALBUM_APP) return null;

    const parsedTarget = parseAlbumIndexedTarget(targetDesc);
    if (!parsedTarget) return null;

    const photoView = document.getElementById('album-photo-detail-view');
    const detailOverlay = document.getElementById('album-detail-overlay');
    const isPhotoDetailOpen = !!(photoView && photoView.classList.contains('open'));
    const isAlbumDetailOpen = !!(detailOverlay && detailOverlay.classList.contains('open'));

    let selector = '';
    if (parsedTarget.kind === 'photo') {
        if (isPhotoDetailOpen) {
            selector = '#album-photo-thumbnails .album-photo-thumb[data-photo-id]';
        } else if (isAlbumDetailOpen) {
            selector = '#album-detail-content .album-photo-item[data-photo-id]';
        } else {
            selector = '#album-recent-content .album-photo-item[data-photo-id]';
        }
    } else if (parsedTarget.kind === 'album') {
        selector = '#album-albums-grid .album-card[data-album-id]';
    }

    if (!selector) return null;

    const visibleElements = Array.from(document.querySelectorAll(selector)).filter(isVisibleScreenActionEl);
    return visibleElements[parsedTarget.index - 1] || null;
}

function extractScreenShareActionTargetsFromUserText(text, context = getScreenNavigationContext()) {
    const rawText = String(text || '').trim();
    if (!rawText) return [];

    const normalizedText = normalizeScreenActionText(rawText);
    const targets = [];

    const needsAlbumOpen = textHasAnyKeyword(normalizedText, ['我的相册', '看我的相册', '去相册', '打开相册']) || normalizedText === '相册';
    if (needsAlbumOpen && context.page !== SCREEN_PAGE.ALBUM_APP) {
        targets.push('相册');
    }

    const photoPatterns = [
        /第\s*([一二三四五六七八九十两〇零\d]+)\s*张(?:图片|照片|图)/,
        /(?:图片|照片)\s*([一二三四五六七八九十两〇零\d]+)/
    ];
    for (const pattern of photoPatterns) {
        const match = rawText.match(pattern);
        if (!match) continue;
        const index = parseChineseScreenActionNumber(match[1]);
        if (Number.isFinite(index) && index >= 1) {
            targets.push(`图片${index}`);
            break;
        }
    }

    const albumPatterns = [
        /第\s*([一二三四五六七八九十两〇零\d]+)\s*个相册/,
        /相册\s*([一二三四五六七八九十两〇零\d]+)/
    ];
    for (const pattern of albumPatterns) {
        const match = rawText.match(pattern);
        if (!match) continue;
        const index = parseChineseScreenActionNumber(match[1]);
        if (Number.isFinite(index) && index >= 1) {
            targets.push(`相册${index}`);
            break;
        }
    }

    return targets;
}

window.executeScreenShareUserTextActions = async function(text) {
    if (!window.isScreenSharing) {
        return { executed: false, targets: [] };
    }

    const initialContext = getScreenNavigationContext();
    const targets = extractScreenShareActionTargetsFromUserText(text, initialContext);
    if (!targets.length) {
        return { executed: false, targets: [] };
    }

    console.log('[ScreenShare Debug] inferred user screen actions', {
        text,
        targets,
        initialContext
    });

    for (const target of targets) {
        await executeSingleScreenAction('SCREEN_TAP', target);
        await sleep(260);
    }

    return { executed: true, targets };
};

function getSpecialScreenActionTarget(targetDesc, context = getScreenNavigationContext()) {
    const canonicalTarget = getCanonicalScreenTarget(targetDesc);
    switch (canonicalTarget) {
        case '返回':
            switch (context.page) {
                case SCREEN_PAGE.PERSONAL_MOMENTS:
                    return findFirstVisibleElement('#close-personal-moments');
                case SCREEN_PAGE.PROFILE:
                    return findFirstVisibleElement('#close-ai-profile');
                case SCREEN_PAGE.CONTACT_CHAT:
                    return findFirstVisibleElement('#back-to-contacts');
                case SCREEN_PAGE.MOMENTS_FEED:
                    return findFirstVisibleElement('#wechat-header-left-btn');
                case SCREEN_PAGE.CHAT_LIST:
                    return findFirstVisibleElement('#contacts-back-btn');
                case SCREEN_PAGE.ALBUM_APP:
                    return getAlbumBackTarget();
                case SCREEN_PAGE.ICITY_APP:
                    return findFirstVisibleElement('#close-icity-app, #icity-app button[onclick*="classList.add(\'hidden\')"]');
                case SCREEN_PAGE.FORUM_APP:
                    return findFirstVisibleElement('#close-forum-app');
                case SCREEN_PAGE.SHOPPING_APP:
                    return findFirstVisibleElement('#close-shopping-app');
                case SCREEN_PAGE.PHONE_APP:
                    return findFirstVisibleElement('#close-phone-app');
                default:
                    return findFirstVisibleElement(screenTargets['返回']);
            }
        case '聊天列表':
            if (context.page === SCREEN_PAGE.CONTACT_CHAT) {
                return findFirstVisibleElement('#back-to-contacts');
            }
            return findFirstVisibleElement('#wechat-app .wechat-tab-item[data-tab="contacts"]');
        case '退出微信':
            return findFirstVisibleElement('#contacts-back-btn');
        case '聊天头像':
            return findFirstVisibleElement('#chat-screen .chat-avatar[onclick*="openAiProfile"]');
        case '资料页朋友圈':
            return findFirstVisibleElement('#ai-moments-entry');
        case '朋友圈':
            if (context.page === SCREEN_PAGE.PROFILE) {
                return findFirstVisibleElement('#ai-moments-entry');
            }
            return findFirstVisibleElement('#wechat-app .wechat-tab-item[data-tab="moments"]');
        case '动态':
            return findFirstVisibleElement('#wechat-app .wechat-tab-item[data-tab="moments"]');
        case '通讯录':
            return findFirstVisibleElement('#wechat-app .wechat-tab-item[data-tab="addressbook"]');
        case '收藏照片':
            return findFirstVisibleElement('#album-photo-favorite-btn');
        case '退出照片':
            return findFirstVisibleElement('#album-photo-close-btn');
        case '退出相册':
        case '退出论坛':
        case '退出购物':
        case '退出icity':
        case '退出手机':
            return findFirstVisibleElement(screenTargets[canonicalTarget]);
        default:
            return getAlbumIndexedTargetElement(targetDesc, context);
    }
}

function findScreenActionTargetElement(targetDesc) {
    const canonicalTarget = getCanonicalScreenTarget(targetDesc);
    let targetSelector = screenTargets[canonicalTarget] || screenTargets[targetDesc];
    let targetEl = getSpecialScreenActionTarget(canonicalTarget);

    if (targetEl) {
        return targetEl;
    }

    if (targetSelector && typeof targetSelector === 'string') {
        const selectors = targetSelector.split(',').map(s => s.trim());
        for (const sel of selectors) {
            const elements = document.querySelectorAll(sel);
            for (const el of elements) {
                if (isVisibleScreenActionEl(el)) {
                    targetEl = el;
                    break;
                }
            }
            if (targetEl) break;
        }
    } else if (targetSelector instanceof Element) {
        targetEl = targetSelector;
    }

    if (!targetEl) {
        const elements = Array.from(document.querySelectorAll('button, .list-item, .app-item, .nav-item, .wechat-tab-item, .dock-item, .back-btn, .chat-settings-nav .nav-item, .tab-item, .contact-item, .contact-content-wrapper, .contact-name, #addressbook-list .contact-item, #addressbook-list .contact-name, #contact-list .contact-item, #contact-list .contact-name, .draggable-item, .app-name'));
        const visibleElements = elements.filter(isVisibleScreenActionEl);
        const normalizedTargetDesc = normalizeScreenActionText(canonicalTarget || targetDesc);

        targetEl = visibleElements.find(el => normalizeScreenActionText(getScreenActionElementText(el)) === normalizedTargetDesc);
        if (!targetEl) {
            targetEl = visibleElements.find(el => normalizeScreenActionText(getScreenActionElementText(el)).includes(normalizedTargetDesc));
        }
        targetEl = resolveScreenActionClickTarget(targetEl);
    }

    return targetEl;
}

function simulateScreenTap(cursor, targetEl) {
    return new Promise((resolve) => {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;

        setTimeout(() => {
            cursor.classList.add('clicking');
            setTimeout(() => {
                cursor.classList.remove('clicking');

                const overlay = document.getElementById('screen-share-overlay');
                const previousPointerEvents = overlay ? overlay.style.pointerEvents : '';
                if (overlay) overlay.style.pointerEvents = 'none';

                try {
                    targetEl.click();
                    if (!targetEl.onclick) {
                        const evt = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        targetEl.dispatchEvent(evt);
                    }
                } catch (e) {
                    console.error('Simulated click failed', e);
                }

                setTimeout(() => {
                    if (overlay) overlay.style.pointerEvents = previousPointerEvents;
                    resolve();
                }, 50);
            }, 150);
        }, 500);
    });
}

window.screenActionQueue = [];
window.isExecutingScreenAction = false;

window.executeAIScreenAction = function(action, payload) {
    if (!window.isScreenSharing) return;

    console.log('[ScreenShare Debug] queue AI screen action', {
        action,
        payload
    });

    window.screenActionQueue.push({ action, payload });
    if (!window.isExecutingScreenAction) {
        processScreenActionQueue();
    }
};

function processScreenActionQueue() {
    if (window.screenActionQueue.length === 0) {
        window.isExecutingScreenAction = false;
        return;
    }

    window.isExecutingScreenAction = true;
    const { action, payload } = window.screenActionQueue.shift();

    executeSingleScreenAction(action, payload).then(() => {
        setTimeout(() => {
            processScreenActionQueue();
        }, 800);
    });
}

async function executeNavigationPlan(cursor, plan) {
    for (const step of plan) {
        const targetEl = findScreenActionTargetElement(step.target);
        if (targetEl) {
            await simulateScreenTap(cursor, targetEl);
            await sleep(step.delay);
            continue;
        }

        if (typeof step.fallback === 'function') {
            try {
                const fallbackResult = await Promise.resolve(step.fallback());
                if (fallbackResult !== false) {
                    await sleep(step.delay);
                    continue;
                }
            } catch (error) {
                console.error('Screen share fallback step failed:', error);
            }
        }

        return {
            success: false,
            reason: step.failureText || `未找到 ${step.label || step.target} 入口`
        };
    }

    return { success: true };
}

function executeSingleScreenAction(action, payload) {
    return (async () => {
        const cursor = document.getElementById('ai-cursor');
        if (!cursor || action !== 'SCREEN_TAP') return;

        const targetDesc = String(payload || '').trim();
        if (!targetDesc) return;

        const context = getScreenNavigationContext();
        const intent = resolveScreenNavigationIntent(targetDesc, context);
        if (intent) {
            if (intent.type === 'ambiguous') {
                emitScreenShareSystemMessage(`[系统]: ${intent.reason}`);
                return;
            }

            const plan = buildScreenNavigationPlan(intent, context);
            if (!plan) {
                emitScreenShareSystemMessage('[系统]: 当前无法执行这个导航动作');
                return;
            }

            const result = await executeNavigationPlan(cursor, plan);
            if (result.success) {
                emitScreenShareSystemMessage(getNavigationSuccessMessage(intent));
            } else {
                emitScreenShareSystemMessage(`[系统]: ${result.reason}`);
            }
            return;
        }

        const targetEl = findScreenActionTargetElement(targetDesc);
        if (targetEl) {
            await simulateScreenTap(cursor, targetEl);
            emitScreenShareSystemMessage(`[系统]: 已点击 ${targetDesc}`);
            return;
        }

        const matchedContact = findContactByScreenActionText(targetDesc);
        if (matchedContact && typeof window.openChat === 'function') {
            window.openChat(matchedContact.id);
            emitScreenShareSystemMessage(`[系统]: 已打开 ${getContactDisplayName(matchedContact)} 的聊天`);
            return;
        }

        emitScreenShareSystemMessage(`[系统]: 未找到 ${targetDesc}，无法执行点击`);
    })();
}

function injectSystemContext(text) {
    const contactId = window.screenShareContactId || (window.iphoneSimState && window.iphoneSimState.currentChatContactId);
    if (window.iphoneSimState && contactId) {
        const history = window.iphoneSimState.chatHistory[contactId] || [];
        history.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'system',
            content: text,
            type: 'text'
        });
        if (window.saveConfig) window.saveConfig();
    }
}

function getAlbumScreenShareSummaryText(snapshot) {
    if (!snapshot || snapshot.app !== 'album') return '';

    const visibleCount = Array.isArray(snapshot.items) ? snapshot.items.length : 0;
    switch (snapshot.view) {
        case 'photo_detail':
            return `相册当前在图片详情页，可见图片 ${snapshot.currentPhoto ? 1 : 0} 张${snapshot.detailSourceText ? `，左上角来源文本=${snapshot.detailSourceText}` : ''}，可执行的按钮包括：退出照片、收藏照片`;
        case 'album_detail':
            return `相册当前在相册详情页，当前相册=${snapshot.activeAlbumName || snapshot.title || '未命名相册'}，可见图片 ${visibleCount} 张`;
        case 'albums_grid':
            return `相册当前在相册列表页，标题=${snapshot.title || 'Albums'}，可见相册 ${visibleCount} 个`;
        case 'recent_grid':
        default:
            return `相册当前在最近项目页，标题=${snapshot.title || 'Recent'}，可见图片 ${visibleCount} 张`;
    }
}

function buildAlbumScreenShareItemText(item) {
    if (!item) return '';

    if (item.kind === 'album_cover') {
        const parts = [`相册${item.position}`];
        parts.push(`album=${item.albumName || '未命名相册'}`);
        if (Number.isFinite(Number(item.count))) {
            parts.push(`count=${Number(item.count)}`);
        }
        parts.push('type=album_cover');
        return parts.join(' | ');
    }

    const parts = [`图片${item.position}`];
    if (item.sourceText) parts.push(`sourceText=${item.sourceText}`);
    if (item.location) parts.push(`location=${item.location}`);
    if (item.datetime) parts.push(`datetime=${item.datetime}`);
    if (item.albumName) parts.push(`album=${item.albumName}`);
    return parts.join(' | ');
}

function buildAlbumScreenShareMultimodalContent(snapshot) {
    const items = Array.isArray(snapshot && snapshot.items) ? snapshot.items : [];
    if (!items.length) return null;

    const content = [{
        type: 'text',
        text: '下面是当前相册界面的可见图片/相册内容。若你需要继续操作，请先基于这些可见对象判断，再输出类似 ACTION: SCREEN_TAP: 图片1、ACTION: SCREEN_TAP: 相册1、ACTION: SCREEN_TAP: 退出照片、ACTION: SCREEN_TAP: 收藏照片 的动作。'
    }];

    const seenKeys = new Set();
    items.forEach(item => {
        if (!item || !item.src) return;
        const dedupeKey = [item.kind || 'item', item.photoId || '', item.albumId || '', item.src].join('|');
        if (seenKeys.has(dedupeKey)) return;
        seenKeys.add(dedupeKey);

        const preferredImageUrl = snapshot && snapshot.view === 'photo_detail'
            ? (item.src || item.thumb)
            : (item.thumb || item.src);
        if (!preferredImageUrl) return;

        content.push({
            type: 'text',
            text: buildAlbumScreenShareItemText(item)
        });
        content.push({
            type: 'image_url',
            image_url: { url: preferredImageUrl }
        });
    });

    return content.length > 1 ? content : null;
}

window.getScreenShareAiContextMessages = function() {
    if (!window.isScreenSharing) {
        console.log('[ScreenShare Debug] skipped context build: screen share inactive');
        return null;
    }

    const context = getScreenNavigationContext();
    if (!context || context.page !== SCREEN_PAGE.ALBUM_APP) {
        console.log('[ScreenShare Debug] skipped context build: album app not active', {
            context
        });
        return null;
    }
    if (typeof window.getAlbumScreenShareSnapshot !== 'function') {
        console.log('[ScreenShare Debug] skipped context build: snapshot provider missing');
        return null;
    }

    const snapshot = window.getAlbumScreenShareSnapshot();
    if (!snapshot) {
        console.log('[ScreenShare Debug] skipped context build: snapshot empty');
        return null;
    }

    const summaryText = getAlbumScreenShareSummaryText(snapshot);
    const multimodalContent = buildAlbumScreenShareMultimodalContent(snapshot);
    const imageUrlParts = Array.isArray(multimodalContent)
        ? multimodalContent.filter(part => part && part.type === 'image_url')
        : [];

    console.log('[ScreenShare Debug] built album context', {
        page: context.page,
        view: snapshot.view || null,
        title: snapshot.title || null,
        activeAlbumName: snapshot.activeAlbumName || null,
        itemCount: Array.isArray(snapshot.items) ? snapshot.items.length : 0,
        imageUrlCount: imageUrlParts.length,
        summaryText: summaryText || null,
        items: Array.isArray(snapshot.items)
            ? snapshot.items.map(item => ({
                position: item.position || null,
                kind: item.kind || null,
                src: item.src || item.thumb || null,
                location: item.location || null,
                datetime: item.datetime || null,
                albumName: item.albumName || null,
                count: typeof item.count === 'number' ? item.count : null
            }))
            : []
    });

    if (!summaryText && !multimodalContent) {
        console.log('[ScreenShare Debug] skipped context build: no usable summary or multimodal content');
        return null;
    }

    return {
        summaryText,
        multimodalContent
    };
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;
    handle.ontouchstart = dragTouchStart;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function dragTouchStart(e) {
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDragTouch;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop + element.offsetHeight > window.innerHeight) newTop = window.innerHeight - element.offsetHeight;
        if (newLeft + element.offsetWidth > window.innerWidth) newLeft = window.innerWidth - element.offsetWidth;

        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        element.style.bottom = 'auto';
    }

    function elementDragTouch(e) {
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop + element.offsetHeight > window.innerHeight) newTop = window.innerHeight - element.offsetHeight;
        if (newLeft + element.offsetWidth > window.innerWidth) newLeft = window.innerWidth - element.offsetWidth;

        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        element.style.bottom = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

if (window.appInitFunctions) {
    window.appInitFunctions.push(initScreenShare);
}



