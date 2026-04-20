(function () {
    const GROUP_CHAT_CONTACT_GROUP = '群聊';
    const GROUP_MEMORY_MODE_LABELS = {
        group_only: '群聊独立',
        group_to_direct: '群到单聊',
        bidirectional: '双向同步'
    };
    const GROUP_ROLE_LABELS = {
        owner: '群主',
        admin: '管理员',
        member: '成员'
    };

    const createState = {
        selectedMemberIds: [],
        avatarDataUrl: ''
    };
    let currentSettingsGroupId = null;

    function showGroupToast(text) {
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(text, 2200);
            return;
        }
        alert(text);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeParticipantId(value) {
        if (value === 'me') return 'me';
        const raw = String(value === undefined || value === null ? '' : value).trim();
        if (!raw) return '';
        const asNumber = Number(raw);
        return Number.isFinite(asNumber) && /^-?\d+(?:\.0+)?$/.test(raw) ? asNumber : raw;
    }

    function getContactById(contactId) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        return contacts.find(contact => String(contact && contact.id) === String(contactId)) || null;
    }

    function getGroupContact(contactOrId) {
        const contact = typeof contactOrId === 'object' && contactOrId
            ? contactOrId
            : getContactById(contactOrId);
        if (!contact || contact.chatType !== 'group') return null;
        if (typeof window.ensureContactChatTypeFields === 'function') {
            window.ensureContactChatTypeFields(contact);
        }
        return contact;
    }

    function isGroupActive(contactOrId) {
        const contact = getGroupContact(contactOrId);
        return !!(contact && contact.groupMeta && contact.groupMeta.status === 'active');
    }

    function getUserBaseName(contact) {
        if (contact && contact.userPersonaId && Array.isArray(window.iphoneSimState && window.iphoneSimState.userPersonas)) {
            const persona = window.iphoneSimState.userPersonas.find(item => String(item && item.id) === String(contact.userPersonaId));
            if (persona && persona.name) return String(persona.name).trim();
        }
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return String(profile && profile.name ? profile.name : '我').trim() || '我';
    }

    function getGroupMemberNickname(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !group.groupMeta.memberNicknames) return '';
        const safeId = normalizeParticipantId(participantId);
        return String(group.groupMeta.memberNicknames[String(safeId)] || '').trim();
    }

    function getParticipantBaseName(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (safeId === 'me') return getUserBaseName(group);
        const contact = getContactById(safeId);
        if (contact) {
            return String(contact.remark || contact.nickname || contact.name || fallback || '群成员').trim() || '群成员';
        }
        return String(fallback || '群成员').trim() || '群成员';
    }

    function getUserDisplayName(contact) {
        const nickname = getGroupMemberNickname(contact, 'me');
        return nickname || getUserBaseName(contact);
    }

    function getUserAvatar(contact) {
        if (contact && contact.myAvatar) return contact.myAvatar;
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return profile && profile.avatar ? profile.avatar : '';
    }

    function getGroupMemberIds(groupContact) {
        const group = getGroupContact(groupContact);
        return group && group.groupMeta && Array.isArray(group.groupMeta.memberIds)
            ? [...group.groupMeta.memberIds]
            : [];
    }

    function getGroupMemberContacts(groupContact) {
        return getGroupMemberIds(groupContact)
            .map(id => getContactById(id))
            .filter(contact => contact && contact.chatType !== 'group');
    }

    function getGroupChatDisplayName(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return '';
        return String(group.groupMeta && group.groupMeta.name ? group.groupMeta.name : (group.remark || group.name || '群聊')).trim() || '群聊';
    }

    function getGroupRole(groupContact, participantId = 'me') {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return 'member';
        const safeId = normalizeParticipantId(participantId);
        if (String(group.groupMeta.ownerId) === String(safeId)) return 'owner';
        if (Array.isArray(group.groupMeta.adminIds) && group.groupMeta.adminIds.some(id => String(id) === String(safeId))) {
            return 'admin';
        }
        return 'member';
    }

    function canCurrentUserManageMembers(groupContact) {
        const role = getGroupRole(groupContact, 'me');
        return role === 'owner' || role === 'admin';
    }

    function canCurrentUserManageAdmins(groupContact) {
        return getGroupRole(groupContact, 'me') === 'owner';
    }

    function getParticipantName(groupContact, participantId, fallback = '') {
        const nickname = getGroupMemberNickname(groupContact, participantId);
        return nickname || getParticipantBaseName(groupContact, participantId, fallback);
    }

    function getGroupMemberTitle(groupContact, participantId) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || !group.groupMeta.memberTitles) return '';
        const safeId = normalizeParticipantId(participantId);
        return String(group.groupMeta.memberTitles[String(safeId)] || '').trim();
    }

    function applyGroupMemberNickname(groupContact, targetId, nextNickname) {
        const group = getGroupContact(groupContact);
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeTargetId) {
            return { ok: false, reason: 'invalid_target' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }
        const normalizedNickname = String(nextNickname || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (!group.groupMeta.memberNicknames || typeof group.groupMeta.memberNicknames !== 'object') {
            group.groupMeta.memberNicknames = {};
        }
        const previousNickname = getGroupMemberNickname(group, safeTargetId);
        if (normalizedNickname) {
            group.groupMeta.memberNicknames[String(safeTargetId)] = normalizedNickname;
        } else {
            delete group.groupMeta.memberNicknames[String(safeTargetId)];
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: previousNickname !== normalizedNickname, nickname: normalizedNickname };
    }

    function canParticipantRenameGroup(groupContact, participantId = 'me') {
        const role = getGroupRole(groupContact, participantId);
        return role === 'owner' || role === 'admin';
    }

    function canParticipantManageTitles(groupContact, participantId = 'me') {
        return getGroupRole(groupContact, participantId) === 'owner';
    }

    function applyGroupRename(groupContact, actorId, nextName, options = {}) {
        const group = getGroupContact(groupContact);
        if (!group || !canParticipantRenameGroup(group, actorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        const normalizedName = String(nextName || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (!normalizedName) {
            return { ok: false, reason: 'empty' };
        }
        const previousName = getGroupChatDisplayName(group);
        if (normalizedName === previousName) {
            return { ok: true, changed: false, name: normalizedName };
        }
        group.groupMeta.name = normalizedName;
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, actorId, actorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            pushVisibleGroupSystemNotice(group.id, `${actorName} 修改群名为“${normalizedName}”`);
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: true, name: normalizedName };
    }

    function applyGroupMemberTitle(groupContact, actorId, targetId, nextTitle, options = {}) {
        const group = getGroupContact(groupContact);
        const safeTargetId = normalizeParticipantId(targetId);
        if (!group || !safeTargetId || !canParticipantManageTitles(group, actorId)) {
            return { ok: false, reason: 'forbidden' };
        }
        if (safeTargetId !== 'me' && !getGroupMemberIds(group).some(id => String(id) === String(safeTargetId))) {
            return { ok: false, reason: 'missing_target' };
        }
        const normalizedTitle = String(nextTitle || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        if (!group.groupMeta.memberTitles || typeof group.groupMeta.memberTitles !== 'object') {
            group.groupMeta.memberTitles = {};
        }
        const previousTitle = getGroupMemberTitle(group, safeTargetId);
        if (normalizedTitle) {
            group.groupMeta.memberTitles[String(safeTargetId)] = normalizedTitle;
        } else {
            delete group.groupMeta.memberTitles[String(safeTargetId)];
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        if (String(window.iphoneSimState.currentChatContactId || '') === String(group.id) && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(group.id, true);
        }
        if (options.showNotice !== false) {
            const actorName = String(options.actorName || getParticipantName(group, actorId, actorId === 'me' ? '你' : '群成员')).trim() || '群成员';
            const targetName = getParticipantName(group, safeTargetId, '群成员');
            if (normalizedTitle) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 给 ${targetName} 设置了群头衔“${normalizedTitle}”`);
            } else if (previousTitle) {
                pushVisibleGroupSystemNotice(group.id, `${actorName} 取消了 ${targetName} 的群头衔`);
            }
        }
        if (String(currentSettingsGroupId || '') === String(group.id)) {
            renderGroupChatSettings(group);
        }
        return { ok: true, changed: previousTitle !== normalizedTitle, title: normalizedTitle };
    }

    function getParticipantAvatar(groupContact, participantId, fallback = '') {
        const group = getGroupContact(groupContact);
        const safeId = normalizeParticipantId(participantId);
        if (safeId === 'me') return getUserAvatar(group) || fallback || '';
        const contact = getContactById(safeId);
        return (contact && contact.avatar) || fallback || '';
    }

    function buildDefaultGroupName(memberContacts) {
        const names = (Array.isArray(memberContacts) ? memberContacts : [])
            .map(contact => String(contact && (contact.remark || contact.nickname || contact.name) || '').trim())
            .filter(Boolean);
        if (names.length <= 3) return names.join('、') || '新群聊';
        return `${names.slice(0, 3).join('、')}等${names.length}人`;
    }

    function buildGroupAvatarSvg(memberContacts) {
        const contacts = (Array.isArray(memberContacts) ? memberContacts : []).slice(0, 4);
        const urls = contacts.map(contact => String(contact && contact.avatar || '').trim()).filter(Boolean);
        if (urls.length === 0) return '';

        const size = 120;
        const slotsByCount = {
            1: [{ x: 0, y: 0, width: 120, height: 120 }],
            2: [
                { x: 0, y: 0, width: 60, height: 120 },
                { x: 60, y: 0, width: 60, height: 120 }
            ],
            3: [
                { x: 0, y: 0, width: 60, height: 60 },
                { x: 60, y: 0, width: 60, height: 60 },
                { x: 30, y: 60, width: 60, height: 60 }
            ],
            4: [
                { x: 0, y: 0, width: 60, height: 60 },
                { x: 60, y: 0, width: 60, height: 60 },
                { x: 0, y: 60, width: 60, height: 60 },
                { x: 60, y: 60, width: 60, height: 60 }
            ]
        };

        const slots = slotsByCount[urls.length] || slotsByCount[4];
        const images = urls.map((url, index) => {
            const slot = slots[index];
            return `<image href="${escapeHtml(url)}" x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" preserveAspectRatio="xMidYMid slice" />`;
        }).join('');

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" rx="28" fill="#f3f4f7" />
                <clipPath id="group-avatar-clip">
                    <rect width="${size}" height="${size}" rx="28" />
                </clipPath>
                <g clip-path="url(#group-avatar-clip)">
                    ${images}
                </g>
                <path d="M60 0V120M0 60H120" stroke="rgba(255,255,255,0.9)" stroke-width="4" />
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' ').trim())}`;
    }

    function ensureGroupTabRegistered() {
        if (!Array.isArray(window.iphoneSimState.contactGroups)) {
            window.iphoneSimState.contactGroups = [];
        }
        if (!window.iphoneSimState.contactGroups.includes(GROUP_CHAT_CONTACT_GROUP)) {
            window.iphoneSimState.contactGroups.push(GROUP_CHAT_CONTACT_GROUP);
        }
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    function generateGroupChatId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    function getEligibleDirectContacts(excludeIds = []) {
        const blacklist = new Set((Array.isArray(excludeIds) ? excludeIds : []).map(id => String(id)));
        return (Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [])
            .filter(contact => contact && contact.chatType !== 'group' && !blacklist.has(String(contact.id)));
    }

    function renderSelectedMembersPreview() {
        const container = document.getElementById('group-chat-selected-members');
        if (!container) return;

        const contacts = createState.selectedMemberIds
            .map(id => getContactById(id))
            .filter(Boolean);

        if (contacts.length === 0) {
            container.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">至少选择 2 位联系人</div>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="list-item" style="display:flex;align-items:center;gap:12px;">
                <img src="${escapeHtml(contact.avatar || '')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:15px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.remark || contact.nickname || contact.name || '联系人')}</div>
                    <div style="font-size:12px;color:#8e8e93;">${escapeHtml(contact.name || '')}</div>
                </div>
            </div>
        `).join('');
    }

    function closeGroupCreateModal() {
        const modal = document.getElementById('group-chat-create-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openGroupCreateModal() {
        if (typeof window.closeAddContactModeChooser === 'function') {
            window.closeAddContactModeChooser();
        }

        createState.selectedMemberIds = [];
        createState.avatarDataUrl = '';

        const nameInput = document.getElementById('group-chat-name');
        const avatarPreview = document.getElementById('group-chat-avatar-preview');
        const avatarInput = document.getElementById('group-chat-avatar-upload');
        const modal = document.getElementById('group-chat-create-modal');
        if (nameInput) nameInput.value = '';
        if (avatarPreview) {
            avatarPreview.style.backgroundImage = '';
            avatarPreview.innerHTML = '<i class="fas fa-users"></i>';
        }
        if (avatarInput) avatarInput.value = '';
        renderSelectedMembersPreview();
        if (modal) modal.classList.remove('hidden');
    }

    function bindModalMaskClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        if (!modal || modal.dataset.maskBound === '1') return;
        modal.dataset.maskBound = '1';
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeFn();
        });
    }

    function openContactMultiPicker(options = {}) {
        const modal = document.getElementById('contact-picker-modal');
        const list = document.getElementById('contact-picker-list');
        const sendBtn = document.getElementById('contact-picker-send-btn');
        const closeBtn = document.getElementById('close-contact-picker');
        if (!modal || !list || !sendBtn || !closeBtn) return;

        const title = String(options.title || '选择联系人').trim() || '选择联系人';
        const confirmText = String(options.confirmText || '确认').trim() || '确认';
        const initialSelectedIds = new Set((Array.isArray(options.initialSelectedIds) ? options.initialSelectedIds : []).map(id => String(id)));
        const contacts = Array.isArray(options.contacts) ? options.contacts : getEligibleDirectContacts(options.excludeIds || []);
        const header = modal.querySelector('.modal-header h3');
        if (header) header.textContent = title;

        if (contacts.length === 0) {
            list.innerHTML = '<div class="list-item center-content" style="color:#8e8e93;">暂无可选联系人</div>';
        } else {
            list.innerHTML = contacts.map(contact => `
                <div class="list-item" data-contact-id="${escapeHtml(contact.id)}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div class="list-content" style="display:flex;align-items:center;min-width:0;">
                        <img src="${escapeHtml(contact.avatar || '')}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:12px;flex-shrink:0;">
                        <div style="min-width:0;">
                            <div style="font-size:15px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.remark || contact.nickname || contact.name || '联系人')}</div>
                            <div style="font-size:12px;color:#8e8e93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(contact.name || '')}</div>
                        </div>
                    </div>
                    <input type="checkbox" name="group-chat-contact-picker" value="${escapeHtml(contact.id)}" style="width:20px;height:20px;" ${initialSelectedIds.has(String(contact.id)) ? 'checked' : ''}>
                </div>
            `).join('');
        }

        list.querySelectorAll('.list-item').forEach(item => {
            const input = item.querySelector('input[name="group-chat-contact-picker"]');
            if (!input) return;
            item.addEventListener('click', (event) => {
                if (event.target !== input) {
                    input.checked = !input.checked;
                }
            });
        });

        const nextSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(nextSendBtn, sendBtn);
        nextSendBtn.textContent = confirmText;
        nextSendBtn.onclick = () => {
            const checkedIds = Array.from(list.querySelectorAll('input[name="group-chat-contact-picker"]:checked'))
                .map(input => normalizeParticipantId(input.value))
                .filter(Boolean);
            if (typeof options.onConfirm === 'function') {
                options.onConfirm(checkedIds);
            }
        };

        const nextCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(nextCloseBtn, closeBtn);
        nextCloseBtn.onclick = () => modal.classList.add('hidden');
        bindModalMaskClose('contact-picker-modal', () => modal.classList.add('hidden'));
        modal.classList.remove('hidden');
    }

    function openGroupCreateMemberPicker() {
        openContactMultiPicker({
            title: '选择群成员',
            confirmText: '确认成员',
            initialSelectedIds: createState.selectedMemberIds,
            onConfirm: (memberIds) => {
                createState.selectedMemberIds = memberIds;
                const modal = document.getElementById('contact-picker-modal');
                if (modal) modal.classList.add('hidden');
                renderSelectedMembersPreview();
                const nameInput = document.getElementById('group-chat-name');
                if (nameInput && !nameInput.value.trim()) {
                    const contacts = memberIds.map(id => getContactById(id)).filter(Boolean);
                    nameInput.value = buildDefaultGroupName(contacts);
                }
            }
        });
    }
    async function handleCreateGroupChat() {
        const memberIds = [...createState.selectedMemberIds];
        if (memberIds.length < 2) {
            showGroupToast('至少选择 2 位联系人');
            return;
        }

        const memberContacts = memberIds.map(id => getContactById(id)).filter(Boolean);
        const nameInput = document.getElementById('group-chat-name');
        const rawName = nameInput ? nameInput.value.trim() : '';
        const groupName = rawName || buildDefaultGroupName(memberContacts);
        const avatar = createState.avatarDataUrl || buildGroupAvatarSvg(memberContacts);
        const groupId = generateGroupChatId();
        const contact = {
            id: groupId,
            name: groupName,
            remark: groupName,
            nickname: groupName,
            avatar: avatar || '',
            persona: '',
            style: '正常',
            activeReplyEnabled: false,
            activeReplyInterval: 60,
            restWindowEnabled: false,
            restWindowStart: '',
            restWindowEnd: '',
            restWindowAwakenedAt: null,
            restWindowUpcomingNoticeForStartMs: null,
            restWindowWakeReplyForStartMs: null,
            autoItineraryEnabled: false,
            userPerception: [],
            thoughtDisplayMode: 'title',
            thoughtPetImage: '',
            thoughtPetSize: 88,
            thoughtPetPosition: { xRatio: 0.86, yRatio: 0.72 },
            group: GROUP_CHAT_CONTACT_GROUP,
            source: 'group_chat',
            chatType: 'group',
            groupMeta: {
                name: groupName,
                avatar: avatar || '',
                memberIds,
                ownerId: 'me',
                adminIds: ['me'],
                memberNicknames: {},
                memberTitles: {},
                memoryMode: 'group_only',
                status: 'active'
            }
        };

        if (typeof window.ensureContactChatTypeFields === 'function') {
            window.ensureContactChatTypeFields(contact);
        }

        if (!Array.isArray(window.iphoneSimState.contacts)) {
            window.iphoneSimState.contacts = [];
        }
        window.iphoneSimState.contacts.push(contact);
        if (!window.iphoneSimState.chatHistory) {
            window.iphoneSimState.chatHistory = {};
        }
        if (!Array.isArray(window.iphoneSimState.chatHistory[groupId])) {
            window.iphoneSimState.chatHistory[groupId] = [];
        }
        ensureGroupTabRegistered();
        if (typeof saveConfig === 'function') {
            saveConfig();
        }
        if (typeof window.sendMessage === 'function') {
            window.sendMessage(`[系统消息]: 你创建了群聊“${groupName}”，成员：${memberContacts.map(item => item.remark || item.nickname || item.name).join('、')}`, false, 'text', null, groupId, {
                ignoreReplyingState: true,
                bypassWechatBlock: true,
                showNotification: false
            });
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        closeGroupCreateModal();
        if (typeof window.openChat === 'function') {
            window.openChat(groupId);
        }
    }

    function resolveGroupSpeakerContactId(rawSpeaker, groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return '';
        const safeSpeaker = normalizeParticipantId(rawSpeaker);
        if (safeSpeaker === 'me') return 'me';
        if (getGroupMemberIds(group).some(id => String(id) === String(safeSpeaker))) {
            return safeSpeaker;
        }

        const speakerText = String(rawSpeaker || '').trim();
        if (!speakerText) return '';
        const lower = speakerText.toLowerCase();
        const matchedContact = getGroupMemberContacts(group).find(contact => {
            const candidates = [
                getGroupMemberNickname(group, contact.id),
                contact.remark,
                contact.nickname,
                contact.name
            ]
                .map(item => String(item || '').trim())
                .filter(Boolean);
            return candidates.some(name => name.toLowerCase() === lower);
        });
        return matchedContact ? matchedContact.id : '';
    }

    function decorateGroupChatMessageMeta(msg, groupContact, isUser, meta = {}) {
        const group = getGroupContact(groupContact);
        if (!group) return {};
        if (isUser) {
            return {
                speakerContactId: 'me',
                speakerNameSnapshot: getUserDisplayName(group),
                speakerAvatarSnapshot: getUserAvatar(group)
            };
        }

        const rawSpeaker = meta.speakerContactId || meta.speaker_contact_id || msg.speakerContactId || '';
        const speakerContactId = resolveGroupSpeakerContactId(rawSpeaker, group);
        return {
            speakerContactId: speakerContactId || '',
            speakerNameSnapshot: String(meta.speakerNameSnapshot || getParticipantName(group, speakerContactId, '群成员')).trim() || '群成员',
            speakerAvatarSnapshot: String(meta.speakerAvatarSnapshot || getParticipantAvatar(group, speakerContactId, '')).trim()
        };
    }

    function getGroupMessageSpeakerMeta(groupId, msgId) {
        const group = getGroupContact(groupId);
        if (!group || !msgId) return null;
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        const message = history.find(item => item && String(item.id) === String(msgId));
        if (!message) return null;
        const rawSpeaker = message.speakerContactId || message.speakerNameSnapshot || '';
        const speakerContactId = resolveGroupSpeakerContactId(rawSpeaker, group) || normalizeParticipantId(message.speakerContactId || '');
        const currentName = getParticipantName(group, speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员');
        const name = String(currentName || message.speakerNameSnapshot || '').trim();
        const avatar = String(message.speakerAvatarSnapshot || getParticipantAvatar(group, speakerContactId, '')).trim();
        const title = String(getGroupMemberTitle(group, speakerContactId) || '').trim();
        return {
            speakerContactId: speakerContactId || '',
            name: name || (message.role === 'user' ? getUserDisplayName(group) : '群成员'),
            title: title || '',
            avatar: avatar || '',
            role: message.role || 'assistant'
        };
    }

    function buildMirrorMessageContent(groupContact, message) {
        const group = getGroupContact(groupContact);
        if (!group || !message) return '';

        const groupName = getGroupChatDisplayName(group);
        const speakerName = String(getParticipantName(group, message.speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员') || message.speakerNameSnapshot || '').trim() || '群成员';
        let body = '';
        if (message.type === 'image' || message.type === 'virtual_image') {
            body = '[图片]';
        } else if (message.type === 'sticker') {
            body = '[表情包]';
        } else if (message.type === 'voice') {
            body = '[语音]';
        } else if (typeof message.content === 'string' && message.content.trim()) {
            body = message.content.trim();
        } else {
            body = '[消息]';
        }

        const replyPrefix = message.replyTo && typeof message.replyTo === 'object'
            ? `（回复 ${String(message.replyTo.name || '消息').trim() || '消息'}）`
            : '';

        return `[群聊:${groupName}] ${speakerName}${replyPrefix}: ${body}`;
    }

    function appendHiddenGroupMirrorEvent(contactId, groupId, content, time) {
        if (!contactId || !content) return;
        if (!window.iphoneSimState.chatHistory) {
            window.iphoneSimState.chatHistory = {};
        }
        if (!Array.isArray(window.iphoneSimState.chatHistory[contactId])) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }

        window.iphoneSimState.chatHistory[contactId].push({
            id: `${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
            time: Number(time) || Date.now(),
            role: 'system',
            content,
            type: 'system_event',
            includeInAiContext: true,
            hiddenFromUi: true,
            sourceGroupId: groupId,
            channel: 'wechat'
        });
    }

    function syncGroupRoundToDirectThreads(groupContact, roundMessages) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta) return;
        const memoryMode = String(group.groupMeta.memoryMode || 'group_only');
        if (memoryMode === 'group_only') return;
        const messages = (Array.isArray(roundMessages) ? roundMessages : [])
            .filter(message => message && message.type !== 'system_event' && !message.hiddenFromUi);
        if (messages.length === 0) return;

        getGroupMemberIds(group).forEach((memberId) => {
            messages.forEach((message) => {
                appendHiddenGroupMirrorEvent(memberId, group.id, buildMirrorMessageContent(group, message), message.time || Date.now());
            });
        });

        if (typeof saveConfig === 'function') {
            saveConfig();
        }
    }

    function getRecentVisibleDirectMessages(contactId, currentGroupId) {
        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId])
            ? window.iphoneSimState.chatHistory[contactId]
            : [];
        const visible = history.filter(message => {
            if (!message || message.hiddenFromUi || message._hiddenBySanitizer) return false;
            if (message.type === 'system_event') return false;
            if (message.sourceGroupId && String(message.sourceGroupId) === String(currentGroupId)) return false;
            if (typeof window.shouldHideChatSyncMsg === 'function' && window.shouldHideChatSyncMsg(message)) return false;
            return message.role === 'user' || message.role === 'assistant';
        });
        return visible.slice(-6);
    }

    function buildBidirectionalGroupContext(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !group.groupMeta || group.groupMeta.memoryMode !== 'bidirectional') return '';

        const lines = ['【成员单聊补充背景】'];
        const memberContacts = getGroupMemberContacts(group);
        memberContacts.forEach((member) => {
            const snippets = getRecentVisibleDirectMessages(member.id, group.id)
                .map(message => {
                    let content = String(message.content || '').trim();
                    if (message.type === 'image' || message.type === 'virtual_image') content = '[图片]';
                    else if (message.type === 'sticker') content = '[表情包]';
                    else if (message.type === 'voice') content = '[语音]';
                    if (!content) content = '[消息]';
                    return `- ${message.role === 'user' ? getParticipantName(group, 'me') : getParticipantName(group, member.id, 'TA')}: ${content}`;
                });
            if (snippets.length === 0) return;
            lines.push(`【${getParticipantName(group, member.id, '成员')} 的单聊近况】`);
            lines.push(...snippets);
        });
        return lines.length > 1 ? `${lines.join('\n')}\n` : '';
    }

    function buildGroupContextPrefix(message, groupContact) {
        const group = getGroupContact(groupContact);
        if (!group || !message) return '';
        const speakerContactId = normalizeParticipantId(message.speakerContactId || (message.role === 'user' ? 'me' : ''));
        const speakerName = String(getParticipantName(group, speakerContactId, message.role === 'user' ? getUserDisplayName(group) : '群成员') || message.speakerNameSnapshot || '').trim();
        const speakerTitle = getGroupMemberTitle(group, speakerContactId);
        return `[group_msg msg_id="${escapeHtml(message.id || '')}" timestamp="${escapeHtml(message.time || '')}" speaker_contact_id="${escapeHtml(speakerContactId || '')}" speaker_name="${escapeHtml(speakerName || '')}" speaker_title="${escapeHtml(speakerTitle || '')}" role="${escapeHtml(message.role || '')}" type="${escapeHtml(message.type || 'text')}"]`;
    }

    function buildGroupReplyPrefix(replyTo) {
        if (!replyTo || typeof replyTo !== 'object') return '';
        return `[reply_to msg_id="${escapeHtml(replyTo.targetMsgId || '')}" timestamp="${escapeHtml(replyTo.targetTimestamp || '')}" name="${escapeHtml(replyTo.name || '')}" content="${escapeHtml(replyTo.content || '')}"]`;
    }

    function normalizeGroupContextMessage(message, groupContact) {
        const prefix = buildGroupContextPrefix(message, groupContact);
        const replyPrefix = buildGroupReplyPrefix(message.replyTo);
        const parts = [prefix, replyPrefix].filter(Boolean);
        let body = '';

        if (message.type === 'image' || message.type === 'virtual_image') {
            body = '[图片]';
        } else if (message.type === 'sticker') {
            body = `[表情包${message.description ? `: ${message.description}` : ''}]`;
        } else if (message.type === 'voice') {
            body = '[语音]';
        } else if (typeof message.content === 'string' && message.content.trim()) {
            body = message.content.trim();
        } else {
            body = '[消息]';
        }

        const finalText = [...parts, body].filter(Boolean).join(' ');
        if (message.role === 'assistant' && /^\[系统消息\]:/.test(body)) {
            return { role: 'system', content: finalText };
        }
        return {
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: finalText
        };
    }

    function buildGroupAiPromptMessages(contactId, instruction = null, options = {}) {
        const group = getGroupContact(contactId);
        if (!group) return [];

        const history = Array.isArray(window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[group.id])
            ? window.iphoneSimState.chatHistory[group.id]
            : [];
        const promptTailMessages = Array.isArray(options && options.promptTailMessages)
            ? options.promptTailMessages.filter(item => item && item.role === 'user' && typeof item.content === 'string' && item.content.trim())
            : [];
        const memoryMode = String(group.groupMeta && group.groupMeta.memoryMode || 'group_only');
        const memberContacts = getGroupMemberContacts(group);
        const memberLines = [
            `- speaker_contact_id=me｜名字=${getParticipantName(group, 'me')}｜身份=${GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员'}｜群头衔=${getGroupMemberTitle(group, 'me') || '无'}｜这是用户本人`
        ];
        memberLines.push(...memberContacts.map(member => {
            const role = GROUP_ROLE_LABELS[getGroupRole(group, member.id)] || '成员';
            const title = getGroupMemberTitle(group, member.id);
            const persona = String(member.persona || '无').replace(/\s+/g, ' ').trim();
            return `- speaker_contact_id=${member.id}｜名字=${getParticipantName(group, member.id, '成员')}｜身份=${role}｜群头衔=${title || '无'}｜人设=${persona || '无'}`;
        }));
        const directContext = buildBidirectionalGroupContext(group);
        const limit = Number.isFinite(Number(group.contextLimit)) && Number(group.contextLimit) > 0 ? Number(group.contextLimit) : 40;
        const contextMessages = history
            .filter(message => message && !message.hiddenFromUi && !message._hiddenBySanitizer)
            .slice(-limit)
            .map(message => normalizeGroupContextMessage(message, group));

        const systemPrompt = [
            `你现在不是在扮演单个联系人，而是在模拟微信群聊“${getGroupChatDisplayName(group)}”里的多位真实成员。`,
            `用户本人名字：${getParticipantName(group, 'me')}。用户是群里的${GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员'}。`,
            '【群成员名单】',
            memberLines.length > 0 ? memberLines.join('\n') : '- 当前暂无群成员。',
            '【输出协议】',
            '- 你必须只输出一个 JSON 数组，不要输出解释、不要输出 Markdown 代码块。',
            '- 允许的可见 type 只有：text_message、quote_reply、sticker_message、voice、image。',
            '- 每一条可见消息都必须带 speaker_contact_id，且必须精确使用上面成员名单里的某个值。',
            '- quote_reply 格式：{"type":"quote_reply","speaker_contact_id":"成员ID","target_msg_id":"消息ID","target_timestamp":消息时间戳,"reply_content":"回复内容"}。优先使用 target_msg_id。',
            '- text_message 格式：{"type":"text_message","speaker_contact_id":"成员ID","content":"回复内容"}。',
            '- sticker_message 格式：{"type":"sticker_message","speaker_contact_id":"成员ID","sticker":"表情描述"}。',
            '- voice 格式：{"type":"voice","speaker_contact_id":"成员ID","duration":3,"content":"语音内容"}。',
            '- image 格式：{"type":"image","speaker_contact_id":"成员ID","content":"图片描述"}。',
            '- 允许额外输出管理动作 action，但仅限两种：',
            '- 改群名：{"type":"action","speaker_contact_id":"成员ID","command":"RENAME_GROUP","payload":"新群名"}。只有管理员或群主能这样做。',
            '- 设群头衔：{"type":"action","speaker_contact_id":"成员ID","command":"SET_MEMBER_TITLE","payload":{"target_member_id":"成员ID","title":"群头衔"}}。只有群主能这样做；若要取消群头衔，title 传空字符串。',
            '- 一次把整轮群成员要说的话按顺序写完整，不能依赖第二次生成补说话。',
            '- 除上面两种管理动作外，禁止输出 thought_state、转账、改资料、下单、一起听、屏幕操作等任何副作用指令。',
            '- 谁更可能接话、是否多人连续回复、是否引用消息，都由你一次性自然决定。',
            `【记忆模式】当前模式：${GROUP_MEMORY_MODE_LABELS[memoryMode] || GROUP_MEMORY_MODE_LABELS.group_only}。`,
            directContext || ''
        ].filter(Boolean).join('\n\n');

        const messages = [
            { role: 'system', content: systemPrompt },
            ...contextMessages
        ];

        if (promptTailMessages.length > 0) {
            messages.push(...promptTailMessages.map(item => ({ role: 'user', content: item.content.trim() })));
        }

        if (instruction) {
            messages.push({ role: 'system', content: `[系统提示]: ${instruction}` });
        }

        return messages;
    }
    function pushVisibleGroupSystemNotice(groupId, text) {
        if (!text || typeof window.sendMessage !== 'function') return null;
        return window.sendMessage(`[系统消息]: ${text}`, false, 'text', null, groupId, {
            ignoreReplyingState: true,
            bypassWechatBlock: true,
            showNotification: false
        });
    }

    function refreshGroupChatVisualState(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return;
        group.name = group.groupMeta.name;
        group.remark = group.groupMeta.name;
        if (group.groupMeta.avatar) {
            group.avatar = group.groupMeta.avatar;
        }
        if (String(window.iphoneSimState.currentChatContactId) === String(group.id)) {
            const title = document.getElementById('chat-title');
            if (title) title.textContent = getGroupChatDisplayName(group);
            if (typeof window.applyChatTopbarAppearance === 'function') {
                window.applyChatTopbarAppearance(group);
            }
        }
    }

    function renderGroupChatSettings(groupContact) {
        const group = getGroupContact(groupContact);
        if (!group) return;
        currentSettingsGroupId = group.id;
        const canRename = canParticipantRenameGroup(group, 'me');
        const canManageTitles = canParticipantManageTitles(group, 'me');
        const nameInput = document.getElementById('group-settings-name');
        const memorySelect = document.getElementById('group-settings-memory-mode');
        const roleBox = document.getElementById('group-settings-my-role');
        const avatarPreview = document.getElementById('group-settings-avatar-preview');
        const memberList = document.getElementById('group-chat-member-list');
        const dissolveBtn = document.getElementById('group-settings-dissolve-btn');
        const exitBtn = document.getElementById('group-settings-exit-btn');

        if (nameInput) nameInput.value = getGroupChatDisplayName(group);
        if (nameInput) {
            nameInput.disabled = !canRename;
            nameInput.placeholder = canRename ? '输入群名称' : '仅管理员或群主可修改群名';
            nameInput.style.opacity = canRename ? '1' : '0.65';
        }
        if (memorySelect) memorySelect.value = String(group.groupMeta.memoryMode || 'group_only');
        if (roleBox) roleBox.textContent = GROUP_ROLE_LABELS[getGroupRole(group, 'me')] || '成员';
        if (avatarPreview) {
            if (group.groupMeta.avatar || group.avatar) {
                avatarPreview.style.backgroundImage = `url(${group.groupMeta.avatar || group.avatar})`;
                avatarPreview.innerHTML = '';
            } else {
                avatarPreview.style.backgroundImage = '';
                avatarPreview.innerHTML = '<i class="fas fa-users"></i>';
            }
        }
        if (dissolveBtn) dissolveBtn.style.display = getGroupRole(group, 'me') === 'owner' ? '' : 'none';
        if (exitBtn) exitBtn.textContent = getGroupRole(group, 'me') === 'owner' ? '转让群主后才能退出' : '退出群聊';

        const rows = [];
        rows.push({
            id: 'me',
            name: getUserDisplayName(group),
            baseName: getUserBaseName(group),
            nickname: getGroupMemberNickname(group, 'me'),
            avatar: getUserAvatar(group),
            role: getGroupRole(group, 'me'),
            title: getGroupMemberTitle(group, 'me'),
            isSelf: true
        });
        getGroupMemberContacts(group).forEach((member) => {
            rows.push({
                id: member.id,
                name: member.remark || member.nickname || member.name || '成员',
                baseName: getParticipantBaseName(group, member.id, '成员'),
                nickname: getGroupMemberNickname(group, member.id),
                avatar: member.avatar || '',
                role: getGroupRole(group, member.id),
                title: getGroupMemberTitle(group, member.id),
                isSelf: false,
                contact: member
            });
        });

        if (!memberList) return;
        memberList.innerHTML = '';

        rows.forEach((row) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.display = 'block';

            const actionHtml = [];
            actionHtml.push(`<button type="button" class="ios-btn-block secondary group-member-action" data-action="set-nickname" data-target-id="${escapeHtml(row.id)}" style="margin-top:8px;">${row.nickname ? '修改群昵称' : '设置群昵称'}</button>`);
            if (!row.isSelf) {
                if (canCurrentUserManageAdmins(group) && row.role !== 'owner') {
                    actionHtml.push(`<button type="button" class="ios-btn-block secondary group-member-action" data-action="toggle-admin" data-target-id="${escapeHtml(row.id)}" style="margin-top:8px;">${row.role === 'admin' ? '取消管理员' : '设为管理员'}</button>`);
                    actionHtml.push(`<button type="button" class="ios-btn-block secondary group-member-action" data-action="transfer-owner" data-target-id="${escapeHtml(row.id)}" style="margin-top:8px;">转让群主</button>`);
                }
                if (canCurrentUserManageMembers(group) && row.role !== 'owner') {
                    actionHtml.push(`<button type="button" class="ios-btn-block secondary group-member-action" data-action="remove-member" data-target-id="${escapeHtml(row.id)}" style="margin-top:8px;">移出群聊</button>`);
                }
                if (canManageTitles) {
                    actionHtml.push(`<button type="button" class="ios-btn-block secondary group-member-action" data-action="set-title" data-target-id="${escapeHtml(row.id)}" style="margin-top:8px;">${row.title ? '修改群头衔' : '设置群头衔'}</button>`);
                }
            }

            item.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <img src="${escapeHtml(row.avatar || '')}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span style="font-size:15px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(row.nickname || row.name)}${row.isSelf ? '（我）' : ''}</span>
                            <span style="font-size:11px;color:#2563eb;background:#eff6ff;border-radius:999px;padding:2px 8px;">${escapeHtml(GROUP_ROLE_LABELS[row.role] || '成员')}</span>
                        </div>
                        ${row.nickname ? `<div style="margin-top:6px;font-size:12px;color:#6b7280;">原名：${escapeHtml(row.baseName)}</div>` : ''}
                        ${row.title ? `<div style="margin-top:6px;font-size:12px;color:#6b7280;">群头衔：${escapeHtml(row.title)}</div>` : ''}
                        ${actionHtml.join('')}
                    </div>
                </div>
            `;

            item.querySelectorAll('.group-member-action').forEach((button) => {
                button.addEventListener('click', () => {
                    const targetId = normalizeParticipantId(button.dataset.targetId);
                    const action = button.dataset.action;
                    if (action === 'set-nickname') {
                        handleSetGroupMemberNickname(group.id, targetId);
                    } else if (action === 'toggle-admin') {
                        handleToggleGroupAdmin(group.id, targetId);
                    } else if (action === 'transfer-owner') {
                        handleTransferGroupOwner(group.id, targetId);
                    } else if (action === 'remove-member') {
                        handleRemoveGroupMember(group.id, targetId);
                    } else if (action === 'set-title') {
                        handleSetGroupMemberTitle(group.id, targetId);
                    }
                });
            });

            memberList.appendChild(item);
        });
    }

    function closeGroupChatSettings() {
        const modal = document.getElementById('group-chat-settings-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openGroupChatSettings(groupId = window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        renderGroupChatSettings(group);
        const modal = document.getElementById('group-chat-settings-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function persistGroupSettings() {
        const group = getGroupContact(currentSettingsGroupId);
        if (!group) return;
        const nameInput = document.getElementById('group-settings-name');
        const memorySelect = document.getElementById('group-settings-memory-mode');
        const nextName = String(nameInput && nameInput.value ? nameInput.value : '').trim() || getGroupChatDisplayName(group);
        const nextMemoryMode = String(memorySelect && memorySelect.value ? memorySelect.value : 'group_only');
        group.groupMeta.memoryMode = nextMemoryMode;
        let renamed = false;
        if (canParticipantRenameGroup(group, 'me')) {
            const renameResult = applyGroupRename(group, 'me', nextName, { actorName: '你', showNotice: nextName !== getGroupChatDisplayName(group) });
            renamed = !!(renameResult && renameResult.ok && renameResult.changed);
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        refreshGroupChatVisualState(group);
        if (typeof saveConfig === 'function') saveConfig();
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
        showGroupToast(renamed ? '群资料已保存' : '群设置已保存');
        renderGroupChatSettings(group);
    }

    function handleSetGroupMemberNickname(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        const currentNickname = getGroupMemberNickname(group, targetId);
        const targetName = getParticipantBaseName(group, targetId, '群成员');
        const nextNickname = prompt(`给 ${targetName}${targetId === 'me' ? '（你自己）' : ''} 设置群昵称（留空为取消）`, currentNickname || '');
        if (nextNickname === null) return;
        const result = applyGroupMemberNickname(group, targetId, nextNickname);
        if (!result || !result.ok) {
            showGroupToast('设置群昵称失败');
            return;
        }
        showGroupToast(result.nickname ? '群昵称已更新' : '群昵称已取消');
    }

    function handleSetGroupMemberTitle(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canParticipantManageTitles(group, 'me')) return;
        const currentTitle = getGroupMemberTitle(group, targetId);
        const targetName = getParticipantName(group, targetId, '群成员');
        const nextTitle = prompt(`给 ${targetName} 设置群头衔（留空为取消）`, currentTitle || '');
        if (nextTitle === null) return;
        const result = applyGroupMemberTitle(group, 'me', targetId, nextTitle, { actorName: '你', showNotice: true });
        if (!result || !result.ok) {
            showGroupToast('设置群头衔失败');
            return;
        }
        showGroupToast(result.title ? '群头衔已更新' : '群头衔已取消');
    }

    function handleInviteGroupMembers(groupId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        const eligibleContacts = getEligibleDirectContacts(getGroupMemberIds(group));
        if (eligibleContacts.length === 0) {
            showGroupToast('没有可邀请的新联系人');
            return;
        }
        openContactMultiPicker({
            title: '邀请联系人进群',
            confirmText: '邀请加入',
            contacts: eligibleContacts,
            onConfirm: (memberIds) => {
                const modal = document.getElementById('contact-picker-modal');
                if (modal) modal.classList.add('hidden');
                const nextIds = memberIds.filter(id => !getGroupMemberIds(group).some(existing => String(existing) === String(id)));
                if (nextIds.length === 0) {
                    showGroupToast('请选择至少一位新成员');
                    return;
                }
                group.groupMeta.memberIds = [...getGroupMemberIds(group), ...nextIds];
                if (typeof window.ensureGroupChatMeta === 'function') {
                    window.ensureGroupChatMeta(group);
                }
                const names = nextIds.map(id => getParticipantName(group, id)).join('、');
                pushVisibleGroupSystemNotice(group.id, `${names} 加入了群聊`);
                if (typeof saveConfig === 'function') saveConfig();
                renderGroupChatSettings(group);
                if (typeof window.renderContactList === 'function') {
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
            }
        });
    }

    function handleToggleGroupAdmin(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canCurrentUserManageAdmins(group)) return;
        if (!targetId || String(targetId) === String(group.groupMeta.ownerId)) return;
        const exists = Array.isArray(group.groupMeta.adminIds) && group.groupMeta.adminIds.some(id => String(id) === String(targetId));
        if (exists) {
            group.groupMeta.adminIds = group.groupMeta.adminIds.filter(id => String(id) !== String(targetId));
            pushVisibleGroupSystemNotice(group.id, `${getParticipantName(group, targetId)} 不再是管理员`);
        } else {
            group.groupMeta.adminIds.push(targetId);
            pushVisibleGroupSystemNotice(group.id, `${getParticipantName(group, targetId)} 成为了管理员`);
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        renderGroupChatSettings(group);
    }

    function handleTransferGroupOwner(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || getGroupRole(group, 'me') !== 'owner') return;
        if (!targetId || !confirm(`确认把群主转让给 ${getParticipantName(group, targetId)}？`)) return;
        group.groupMeta.ownerId = targetId;
        if (!Array.isArray(group.groupMeta.adminIds)) {
            group.groupMeta.adminIds = [];
        }
        if (!group.groupMeta.adminIds.some(id => String(id) === 'me')) {
            group.groupMeta.adminIds.push('me');
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        pushVisibleGroupSystemNotice(group.id, `${getParticipantName(group, targetId)} 成为了新群主`);
        if (typeof saveConfig === 'function') saveConfig();
        renderGroupChatSettings(group);
    }

    function handleRemoveGroupMember(groupId, targetId) {
        const group = getGroupContact(groupId);
        if (!group || !canCurrentUserManageMembers(group)) return;
        if (!targetId || String(targetId) === String(group.groupMeta.ownerId)) {
            showGroupToast('不能直接移除群主');
            return;
        }
        const name = getParticipantName(group, targetId);
        if (!confirm(`确认将 ${name} 移出群聊？`)) return;
        group.groupMeta.memberIds = getGroupMemberIds(group).filter(id => String(id) !== String(targetId));
        group.groupMeta.adminIds = (Array.isArray(group.groupMeta.adminIds) ? group.groupMeta.adminIds : []).filter(id => String(id) !== String(targetId));
        if (group.groupMeta.memberNicknames && typeof group.groupMeta.memberNicknames === 'object') {
            delete group.groupMeta.memberNicknames[String(targetId)];
        }
        if (group.groupMeta.memberTitles && typeof group.groupMeta.memberTitles === 'object') {
            delete group.groupMeta.memberTitles[String(targetId)];
        }
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        pushVisibleGroupSystemNotice(group.id, `${name} 被移出了群聊`);
        if (typeof saveConfig === 'function') saveConfig();
        renderGroupChatSettings(group);
    }

    function leaveOrCloseGroupChat(groupId, reason = 'left') {
        const group = getGroupContact(groupId);
        if (!group) return;
        group.groupMeta.status = reason === 'dissolved' ? 'dissolved' : 'left';
        if (typeof window.ensureGroupChatMeta === 'function') {
            window.ensureGroupChatMeta(group);
        }
        if (typeof saveConfig === 'function') saveConfig();
        closeGroupChatSettings();
        if (String(window.iphoneSimState.currentChatContactId) === String(group.id)) {
            const chatScreen = document.getElementById('chat-screen');
            if (chatScreen) chatScreen.classList.add('hidden');
            window.iphoneSimState.currentChatContactId = null;
        }
        if (typeof window.renderContactList === 'function') {
            window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        }
    }

    function handleExitGroup(groupId) {
        const group = getGroupContact(groupId);
        if (!group) return;
        if (getGroupRole(group, 'me') === 'owner') {
            showGroupToast('请先转让群主或直接解散群聊');
            return;
        }
        pushVisibleGroupSystemNotice(group.id, '你退出了群聊');
        leaveOrCloseGroupChat(group.id, 'left');
    }

    function handleDissolveGroup(groupId) {
        const group = getGroupContact(groupId);
        if (!group || getGroupRole(group, 'me') !== 'owner') return;
        if (!confirm(`确认解散群聊“${getGroupChatDisplayName(group)}”？`)) return;
        pushVisibleGroupSystemNotice(group.id, '群聊已解散');
        leaveOrCloseGroupChat(group.id, 'dissolved');
    }

    function bindGroupChatUi() {
        const openBtn = document.getElementById('choose-create-group-chat');
        const closeCreateBtn = document.getElementById('close-group-chat-create');
        const selectMembersBtn = document.getElementById('group-chat-select-members-btn');
        const createBtn = document.getElementById('group-chat-create-btn');
        const createAvatarPreview = document.getElementById('group-chat-avatar-preview');
        const createAvatarInput = document.getElementById('group-chat-avatar-upload');
        const closeSettingsBtn = document.getElementById('close-group-chat-settings');
        const saveSettingsBtn = document.getElementById('group-settings-save-btn');
        const inviteBtn = document.getElementById('group-settings-invite-btn');
        const exitBtn = document.getElementById('group-settings-exit-btn');
        const dissolveBtn = document.getElementById('group-settings-dissolve-btn');
        const settingsAvatarPreview = document.getElementById('group-settings-avatar-preview');
        const settingsAvatarInput = document.getElementById('group-settings-avatar-upload');

        if (openBtn) openBtn.addEventListener('click', openGroupCreateModal);
        if (closeCreateBtn) closeCreateBtn.addEventListener('click', closeGroupCreateModal);
        if (selectMembersBtn) selectMembersBtn.addEventListener('click', openGroupCreateMemberPicker);
        if (createBtn) createBtn.addEventListener('click', handleCreateGroupChat);

        if (createAvatarPreview && createAvatarInput) {
            createAvatarPreview.addEventListener('click', () => createAvatarInput.click());
            createAvatarInput.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                try {
                    const dataUrl = await readFileAsDataUrl(file);
                    createState.avatarDataUrl = dataUrl;
                    createAvatarPreview.style.backgroundImage = `url(${dataUrl})`;
                    createAvatarPreview.innerHTML = '';
                } catch (error) {
                    console.error('群头像读取失败', error);
                    showGroupToast('群头像读取失败');
                }
            });
        }

        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeGroupChatSettings);
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', persistGroupSettings);
        if (inviteBtn) inviteBtn.addEventListener('click', () => handleInviteGroupMembers(currentSettingsGroupId));
        if (exitBtn) exitBtn.addEventListener('click', () => handleExitGroup(currentSettingsGroupId));
        if (dissolveBtn) dissolveBtn.addEventListener('click', () => handleDissolveGroup(currentSettingsGroupId));

        if (settingsAvatarPreview && settingsAvatarInput) {
            settingsAvatarPreview.addEventListener('click', () => settingsAvatarInput.click());
            settingsAvatarInput.addEventListener('change', async (event) => {
                const group = getGroupContact(currentSettingsGroupId);
                const file = event.target.files && event.target.files[0];
                if (!group || !file) return;
                try {
                    const dataUrl = await readFileAsDataUrl(file);
                    group.groupMeta.avatar = dataUrl;
                    if (typeof window.ensureGroupChatMeta === 'function') {
                        window.ensureGroupChatMeta(group);
                    }
                    refreshGroupChatVisualState(group);
                    if (typeof saveConfig === 'function') saveConfig();
                    renderGroupChatSettings(group);
                } catch (error) {
                    console.error('群头像更新失败', error);
                    showGroupToast('群头像更新失败');
                }
            });
        }

        bindModalMaskClose('group-chat-create-modal', closeGroupCreateModal);
        bindModalMaskClose('group-chat-settings-modal', closeGroupChatSettings);
    }

    window.GROUP_CHAT_CONTACT_GROUP = GROUP_CHAT_CONTACT_GROUP;
    window.getGroupChatDisplayName = getGroupChatDisplayName;
    window.getGroupRole = getGroupRole;
    window.getGroupMessageSpeakerMeta = getGroupMessageSpeakerMeta;
    window.getGroupMemberContacts = getGroupMemberContacts;
    window.getGroupMemberNickname = getGroupMemberNickname;
    window.getGroupMemberTitle = getGroupMemberTitle;
    window.canGroupParticipantRenameGroup = canParticipantRenameGroup;
    window.canGroupParticipantManageTitles = canParticipantManageTitles;
    window.applyGroupMemberNickname = applyGroupMemberNickname;
    window.applyGroupRename = applyGroupRename;
    window.applyGroupMemberTitle = applyGroupMemberTitle;
    window.resolveGroupSpeakerContactId = resolveGroupSpeakerContactId;
    window.decorateGroupChatMessageMeta = decorateGroupChatMessageMeta;
    window.buildGroupAiPromptMessages = buildGroupAiPromptMessages;
    window.syncGroupRoundToDirectThreads = syncGroupRoundToDirectThreads;
    window.openGroupChatSettings = openGroupChatSettings;
    window.isGroupChatActive = isGroupActive;

    bindGroupChatUi();
})();
