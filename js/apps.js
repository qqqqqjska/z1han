// 其他应用功能模块 (朋友圈, 钱包, 记忆, 行程, 音乐, 拍立得, 表情包, 身份)

let postMomentImages = [];
let currentEditingPersonaId = null;
let currentEditingMemoryId = null;
let currentMemoryFilter = 'all';
let memorySelectMode = false;
let selectedMemoryIds = new Set();

// --- 朋友圈功能 ---

function renderMoments() {
    const container = document.getElementById('moments-container');
    if (!container) return;

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            momentsBgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    const { name, avatar, momentsBgImage } = window.iphoneSimState.userProfile;
    const bg = momentsBgImage || '';

    const coverEl = document.getElementById('moments-cover-trigger');
    if (coverEl) {
        coverEl.style.backgroundImage = `url('${bg}')`;
        coverEl.style.backgroundColor = '';
        
        document.getElementById('moments-user-name').textContent = name;
        document.getElementById('moments-user-avatar').src = avatar;
    } else {
        container.innerHTML = `
            <div class="moments-header">
                <div class="moments-cover" id="moments-cover-trigger" style="background-image: url('${bg}');">
                    <div class="moments-user-info">
                        <span class="moments-user-name" id="moments-user-name">${name}</span>
                        <img class="moments-user-avatar" id="moments-user-avatar" src="${avatar}">
                    </div>
                </div>
            </div>
            <div class="moments-list" id="moments-list-content">
                <!-- 朋友圈列表内容 -->
            </div>
        `;
        
        document.getElementById('moments-cover-trigger').addEventListener('click', () => {
            document.getElementById('moments-bg-input').click();
        });
    }

    renderMomentsList();
}

function renderMomentsList() {
    const listContainer = document.getElementById('moments-list-content');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (!window.iphoneSimState.moments) window.iphoneSimState.moments = [];

    const sortedMoments = [...window.iphoneSimState.moments].sort((a, b) => b.time - a.time);

    sortedMoments.forEach(moment => {
        let avatar, name;
        
        if (moment.contactId === 'me') {
            avatar = window.iphoneSimState.userProfile.avatar;
            name = window.iphoneSimState.userProfile.name;
        } else {
            const contact = window.iphoneSimState.contacts.find(c => c.id === moment.contactId);
            if (contact) {
                avatar = contact.avatar;
                name = contact.remark || contact.nickname || contact.name;
            } else {
                avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
                name = '未知用户';
            }
        }

        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const gridClass = moment.images.length === 1 ? 'single' : 'grid';
            imagesHtml = `<div class="moment-images ${gridClass}">
                ${moment.images.map((img, imgIndex) => {
                    const isVirtual = (typeof img === 'object' && img.isVirtual);
                    
                    if (isVirtual) {
                        const uniqueId = `moment-virtual-${moment.id}-${imgIndex}`;
                        const overlayId = `overlay-${uniqueId}`;
                        const cleanDesc = (img.desc || '').replace(/^\[图片描述\][:：]?\s*/, '');
                        
                        let displaySrc = window.iphoneSimState.defaultMomentVirtualImageUrl;
                        if (!displaySrc) {
                             // Fallback to stored src (placeholder) or default chat virtual image url or hardcoded
                             displaySrc = img.src || window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                        }
                        
                        return `
                        <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: hidden; background-color: #f2f2f7;">
                            <img src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            <div class="virtual-image-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 10px 5px; box-sizing: border-box; pointer-events: none;">
                                <div style="font-size: 12px; color: #fff; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; text-align: left;">${cleanDesc}</div>
                            </div>
                        </div>
                        `;
                    } else {
                        const src = typeof img === 'string' ? img : img.src;
                        return `<img src="${src}" class="moment-img">`;
                    }
                }).join('')}
            </div>`;
        }

        let likesHtml = '';
        if (moment.likes && moment.likes.length > 0) {
            likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
        }

        let commentsHtml = '';
        if (moment.comments && moment.comments.length > 0) {
            commentsHtml = `<div class="moment-comments">
                ${moment.comments.map((c, index) => {
                    let displayName = c.user;
                    if (moment.contactId !== 'me') {
                        const contact = window.iphoneSimState.contacts.find(cnt => cnt.id === moment.contactId);
                        if (contact && contact.remark) {
                            if (c.user === contact.name || c.user === contact.nickname) {
                                displayName = contact.remark;
                            }
                        }
                    }

                    let userHtml = `<span class="moment-comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="moment-comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="moment-comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="moment-comment-content">${c.content}</span></span>
                        <span class="moment-comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
                    </div>`;
                }).join('')}
            </div>`;
        }

        let footerHtml = '';
        if (likesHtml || commentsHtml) {
            footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
        }

        const date = new Date(moment.time);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        item.innerHTML = `
            <img src="${avatar}" class="moment-avatar">
            <div class="moment-content">
                <div class="moment-name">${name}</div>
                <div class="moment-text">${moment.content}</div>
                ${imagesHtml}
                <div class="moment-info">
                    <div style="display: flex; align-items: center;">
                        <span class="moment-time">${timeStr}</span>
                        <span class="moment-delete" onclick="window.deleteMoment(${moment.id})">删除</span>
                    </div>
                    <div style="position: relative;">
                        <button class="moment-action-btn" onclick="window.toggleActionMenu(this, ${moment.id})"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="action-menu" id="action-menu-${moment.id}">
                            <button class="action-menu-btn" onclick="window.toggleLike(${moment.id})"><i class="far fa-heart"></i> 赞</button>
                            <button class="action-menu-btn" onclick="window.showCommentInput(${moment.id})"><i class="far fa-comment"></i> 评论</button>
                        </div>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

function addMoment(contactId, content, images = []) {
    if (!window.iphoneSimState.moments) window.iphoneSimState.moments = [];
    
    const newMoment = {
        id: Date.now(),
        contactId,
        content,
        images,
        time: Date.now(),
        likes: [],
        comments: []
    };
    
    window.iphoneSimState.moments.unshift(newMoment);
    saveConfig();
    renderMomentsList();
}

function handlePostMoment() {
    const content = document.getElementById('post-moment-text').value.trim();
    
    if (!content && postMomentImages.length === 0) {
        alert('请输入内容或选择图片');
        return;
    }

    addMoment('me', content, [...postMomentImages]);

    const momentSummary = content || '[图片动态]';
    let imageTag = postMomentImages.length > 0 ? ` [包含${postMomentImages.length}张图片]` : '';
    
    // Add image descriptions and hidden data for AI
    if (postMomentImages.length > 0) {
        postMomentImages.forEach(img => {
            let desc = typeof img === 'string' ? '' : img.desc;
            if (desc) {
                imageTag += ` [图片描述: ${desc}]`;
            }
            
            let src = typeof img === 'string' ? img : img.src;
            if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
                // Embed image data for AI to see (will be parsed by chat.js)
                imageTag += ` <hidden_img>${src}</hidden_img>`;
            }
        });
    }

    const hiddenMsg = `[发布了动态]: ${momentSummary}${imageTag}`;

    window.iphoneSimState.contacts.forEach(contact => {
        if (!window.iphoneSimState.chatHistory[contact.id]) {
            window.iphoneSimState.chatHistory[contact.id] = [];
        }
        window.iphoneSimState.chatHistory[contact.id].push({
            role: 'user',
            content: hiddenMsg
        });
    });
    
    saveConfig();

    document.getElementById('post-moment-modal').classList.add('hidden');
}

function openPostMoment(isTextOnly) {
    const modal = document.getElementById('post-moment-modal');
    const textInput = document.getElementById('post-moment-text');
    const imageContainer = document.getElementById('post-moment-images');
    
    textInput.value = '';
    postMomentImages = [];
    renderPostMomentImages();
    
    if (isTextOnly) {
        imageContainer.style.display = 'none';
        textInput.placeholder = '这一刻的想法...';
    } else {
        imageContainer.style.display = 'grid';
        textInput.placeholder = '这一刻的想法...';
    }
    
    modal.classList.remove('hidden');
}

function handlePostMomentImages(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        compressImage(file, 800, 0.7).then(base64 => {
            if (postMomentImages.length < 9) {
                // Change to store object with desc
                postMomentImages.push({
                    src: base64,
                    desc: '',
                    isVirtual: false
                });
                renderPostMomentImages();
            }
        }).catch(err => {
            console.error('图片压缩失败', err);
        });
    });
    e.target.value = '';
}

function handleVirtualImage() {
    if (postMomentImages.length >= 9) {
        alert('最多只能添加9张图片');
        return;
    }
    const desc = prompt('请输入图片描述');
    if (desc) {
        const bg = 'eee';
        const fg = '333';
        // Use part of desc as placeholder text
        const text = encodeURIComponent(desc.substring(0, 6)); 
        const src = `https://placehold.co/600x600/${bg}/${fg}?text=${text}`;
        
        postMomentImages.push({
            src: src,
            desc: desc,
            isVirtual: true
        });
        renderPostMomentImages();
    }
}

function handleEditImageDesc(index) {
    if (!postMomentImages[index]) return;
    const imgObj = postMomentImages[index];
    // Backward compatibility if it's a string
    const currentDesc = typeof imgObj === 'string' ? '' : (imgObj.desc || '');
    
    const newDesc = prompt('编辑图片描述：', currentDesc);
    if (newDesc !== null) {
        if (typeof imgObj === 'string') {
            postMomentImages[index] = {
                src: imgObj,
                desc: newDesc,
                isVirtual: false
            };
        } else {
            imgObj.desc = newDesc;
            if (imgObj.isVirtual) {
                 const bg = 'eee';
                 const fg = '333';
                 const text = encodeURIComponent(newDesc.substring(0, 6));
                 imgObj.src = `https://placehold.co/600x600/${bg}/${fg}?text=${text}`;
            }
        }
        renderPostMomentImages();
    }
}

function renderPostMomentImages() {
    const container = document.getElementById('post-moment-images');
    const addBtn = document.getElementById('add-moment-image-btn');
    const virtualBtn = document.getElementById('add-virtual-image-btn');
    
    const oldItems = container.querySelectorAll('.post-image-item');
    oldItems.forEach(item => item.remove());
    
    postMomentImages.forEach((imgData, index) => {
        const item = document.createElement('div');
        item.className = 'post-image-item';
        
        const src = typeof imgData === 'string' ? imgData : imgData.src;
        item.innerHTML = `<img src="${src}">`;
        
        // Click to edit desc
        item.addEventListener('click', () => handleEditImageDesc(index));
        
        // Insert before add buttons
        container.insertBefore(item, addBtn);
    });

    if (postMomentImages.length >= 9) {
        addBtn.style.display = 'none';
        if (virtualBtn) virtualBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'flex';
        if (virtualBtn) virtualBtn.style.display = 'flex';
    }
}

window.deleteMoment = function(id) {
    if (confirm('确定删除这条动态吗？')) {
        window.iphoneSimState.moments = window.iphoneSimState.moments.filter(m => m.id !== id);
        saveConfig();
        renderMomentsList();
    }
};

window.handleCommentClick = function(el, momentId, index, user) {
    const deleteBtn = el.querySelector('.moment-comment-delete-btn');
    
    if (deleteBtn.style.display !== 'none') {
        window.replyToComment(momentId, user);
    } else {
        document.querySelectorAll('.moment-comment-delete-btn').forEach(btn => btn.style.display = 'none');
        document.querySelectorAll('.moment-comment-item').forEach(item => item.style.backgroundColor = '');
        
        deleteBtn.style.display = 'inline-block';
        el.style.backgroundColor = '#e5e5e5';
        
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            window.deleteComment(momentId, index);
        };
        
        const closeDelete = () => {
            deleteBtn.style.display = 'none';
            el.style.backgroundColor = '';
            document.removeEventListener('click', closeDelete);
        };
        setTimeout(() => document.addEventListener('click', closeDelete), 0);
    }
};

window.deleteComment = function(momentId, commentIndex) {
    if (confirm('确定删除这条评论吗？')) {
        const moment = window.iphoneSimState.moments.find(m => m.id === momentId);
        if (moment && moment.comments) {
            moment.comments.splice(commentIndex, 1);
            saveConfig();
            renderMomentsList();
        }
    }
};

window.toggleActionMenu = function(btn, id) {
    document.querySelectorAll('.action-menu.show').forEach(el => {
        if (el.id !== `action-menu-${id}`) el.classList.remove('show');
    });
    
    const menu = document.getElementById(`action-menu-${id}`);
    menu.classList.toggle('show');
    
    const closeMenu = (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

window.toggleLike = function(id, userName = null) {
    const moment = window.iphoneSimState.moments.find(m => m.id === id);
    if (!moment) return;

    if (!moment.likes) moment.likes = [];
    
    const likerName = userName || window.iphoneSimState.userProfile.name;
    const index = moment.likes.indexOf(likerName);
    
    if (index > -1) {
        moment.likes.splice(index, 1);
    } else {
        moment.likes.push(likerName);
    }
    
    saveConfig();
    renderMomentsList();
};

window.showCommentInput = function(id) {
    const content = prompt('请输入评论内容：');
    if (content) {
        window.submitComment(id, content);
    }
    const menu = document.getElementById(`action-menu-${id}`);
    if (menu) menu.classList.remove('show');
};

window.replyToComment = function(momentId, toUser) {
    if (toUser === window.iphoneSimState.userProfile.name) {
        alert('不能回复自己');
        return;
    }
    const content = prompt(`回复 ${toUser}：`);
    if (content) {
        window.submitComment(momentId, content, toUser);
    }
};

window.submitComment = function(id, content, replyTo = null, userName = null) {
    const moment = window.iphoneSimState.moments.find(m => m.id === id);
    if (!moment) return;

    if (!moment.comments) moment.comments = [];
    
    const commenterName = userName || window.iphoneSimState.userProfile.name;

    moment.comments.push({
        user: commenterName,
        content: content,
        replyTo: replyTo
    });

    if (moment.contactId !== 'me' && !userName) {
        const contactId = moment.contactId;
        let momentText = moment.content;
        if (momentText.length > 50) momentText = momentText.substring(0, 50) + '...';
        
        let chatMsg = `[评论了你的动态: "${momentText}"] ${content}`;
        if (replyTo) {
            chatMsg = `[评论了你的动态: "${momentText}"] (回复 ${replyTo}) ${content}`;
        }
        
        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        window.iphoneSimState.chatHistory[contactId].push({
            role: 'user',
            content: chatMsg
        });
        
        if (window.iphoneSimState.currentChatContactId === contactId) {
            if (window.appendMessageToUI) window.appendMessageToUI(chatMsg, true);
            if (window.scrollToBottom) window.scrollToBottom();
        }
    }
    
    saveConfig();
    renderMomentsList();

    if (moment.contactId !== 'me' && !userName) {
        setTimeout(() => {
            generateAiCommentReply(moment, { user: window.iphoneSimState.userProfile.name, content: content, replyTo: replyTo });
        }, 2000);
    }
};

async function generateAiCommentReply(moment, userComment) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === moment.contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return;

    try {
        let contextDesc = `你的朋友 ${userComment.user} 在下面评论说：“${userComment.content}”`;
        if (userComment.replyTo) {
            // Check if replying to the persona itself
            if (userComment.replyTo === contact.name || userComment.replyTo === (contact.remark || contact.nickname)) {
                contextDesc = `你的朋友 ${userComment.user} 回复了你 说：“${userComment.content}”`;
            } else {
                contextDesc = `你的朋友 ${userComment.user} 回复了 ${userComment.replyTo} 说：“${userComment.content}”`;
            }
        }

        // Prepare System Prompt (Text context)
        // Keep explicit text descriptions in system prompt as fallback/context
        let imageDescText = '';
        if (moment.images && moment.images.length > 0) {
            moment.images.forEach((img, idx) => {
                let desc = typeof img === 'string' ? '' : img.desc;
                if (desc) {
                    imageDescText += `\n[图片${idx + 1}描述: ${desc}]`;
                }
            });
        }

        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}

【当前情境】
你发了一条朋友圈：“${moment.content}”${imageDescText}
${contextDesc}

【任务】
请回复 ${userComment.user}。
回复要求：
1. 简短自然，像微信朋友圈回复。
2. 符合你的人设。
3. 直接返回回复内容，不要包含任何解释。`;

        // Construct User Message with Vision capabilities
        let userContent = [];
        userContent.push({ type: 'text', text: '请回复' });

        if (moment.images && moment.images.length > 0) {
            moment.images.forEach(img => {
                let src = typeof img === 'string' ? img : img.src;
                // If it's a real image (Base64) or URL, add to payload for Vision models
                if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
                    userContent.push({
                        type: 'image_url',
                        image_url: {
                            url: src
                        }
                    });
                }
            });
        }

        let messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Determine if we send array content (Vision) or simple string
        const hasImages = userContent.some(c => c.type === 'image_url');
        if (hasImages) {
            messages.push({ role: 'user', content: userContent });
        } else {
            messages.push({ role: 'user', content: '请回复' });
        }

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 300 // Optional limit
            })
        });

        if (!response.ok) {
            console.error('AI Request Failed', response.status);
            return;
        }

        const data = await response.json();
        let replyContent = data.choices[0].message.content.trim();
        
        if ((replyContent.startsWith('"') && replyContent.endsWith('"')) || (replyContent.startsWith('“') && replyContent.endsWith('”'))) {
            replyContent = replyContent.slice(1, -1);
        }

        if (!moment.comments) moment.comments = [];
        moment.comments.push({
            user: contact.remark || contact.name,
            content: replyContent,
            replyTo: userComment.user
        });
        
        saveConfig();
        renderMomentsList();

    } catch (error) {
        console.error('AI回复评论失败:', error);
    }
}

async function generateAiMoment(isSilent = false) {
    if (!window.iphoneSimState.currentChatContactId) {
        if (!isSilent) alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        if (!isSilent) alert('请先在设置中配置AI API');
        return;
    }

    const btn = document.getElementById('trigger-ai-moment-btn');
    let originalText = '';
    if (btn) {
        originalText = btn.textContent;
        btn.textContent = '生成中...';
        btn.disabled = true;
    }

    try {
        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}
请生成一条朋友圈动态内容。
内容要求：
1. 符合你的人设。
2. 像真实的朋友圈，可以是心情、生活分享、吐槽等。
3. 不要太长，通常在100字以内。
4. 直接返回内容文本，不要包含任何解释、引号或前缀后缀。`;

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '发一条朋友圈' }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith('“') && content.endsWith('”'))) {
            content = content.slice(1, -1);
        }

        addMoment(contact.id, content);
        
        if (!isSilent) {
            alert('动态发布成功！');
            document.getElementById('chat-settings-screen').classList.add('hidden');
        }

    } catch (error) {
        console.error('AI生成动态失败:', error);
        if (!isSilent) alert('生成失败，请检查配置');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

function openAiMoments() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    renderPersonalMoments(window.iphoneSimState.currentChatContactId);
    document.getElementById('personal-moments-screen').classList.remove('hidden');
}

function handlePersonalMomentsBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.momentsBg = base64;
        const cover = document.getElementById('personal-moments-cover');
        if (cover) {
            cover.style.backgroundImage = `url(${contact.momentsBg})`;
        }
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function renderPersonalMoments(contactId) {
    const container = document.getElementById('personal-moments-container');
    if (!container) return;

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const bg = contact.momentsBg || contact.profileBg || '';
    const name = contact.remark || contact.name;
    const avatar = contact.avatar;

    container.innerHTML = `
        <div class="moments-header">
            <div class="moments-cover" id="personal-moments-cover" style="background-image: url('${bg}'); background-color: ${bg ? 'transparent' : '#333'}; cursor: pointer;">
                <div class="moments-user-info">
                    <span class="moments-user-name">${name}</span>
                    <img class="moments-user-avatar" src="${avatar}">
                </div>
            </div>
        </div>
        <div class="moments-list" id="personal-moments-list-content">
            <!-- 动态列表 -->
        </div>
    `;

    document.getElementById('personal-moments-cover').addEventListener('click', () => {
        document.getElementById('personal-moments-bg-input').click();
    });

    const listContainer = document.getElementById('personal-moments-list-content');
    
    const personalMoments = window.iphoneSimState.moments.filter(m => m.contactId === contactId);
    
    const sortedMoments = [...personalMoments].sort((a, b) => b.time - a.time);

    if (sortedMoments.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无动态</div>';
        return;
    }

    sortedMoments.forEach(moment => {
        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const gridClass = moment.images.length === 1 ? 'single' : 'grid';
            imagesHtml = `<div class="moment-images ${gridClass}">
                ${moment.images.map((img, imgIndex) => {
                    const isVirtual = (typeof img === 'object' && img.isVirtual);
                    
                    if (isVirtual) {
                        const uniqueId = `moment-virtual-${moment.id}-${imgIndex}`;
                        const overlayId = `overlay-${uniqueId}`;
                        const cleanDesc = (img.desc || '').replace(/^\[图片描述\][:：]?\s*/, '');
                        
                        let displaySrc = window.iphoneSimState.defaultMomentVirtualImageUrl;
                        if (!displaySrc) {
                             displaySrc = img.src || window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                        }
                        
                        return `
                        <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: hidden; background-color: #f2f2f7;">
                            <img src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            <div class="virtual-image-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 10px 5px; box-sizing: border-box; pointer-events: none;">
                                <div style="font-size: 12px; color: #fff; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; text-align: left;">${cleanDesc}</div>
                            </div>
                        </div>
                        `;
                    } else {
                        const src = typeof img === 'string' ? img : img.src;
                        return `<img src="${src}" class="moment-img">`;
                    }
                }).join('')}
            </div>`;
        }

        let likesHtml = '';
        if (moment.likes && moment.likes.length > 0) {
            likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
        }

        let commentsHtml = '';
        if (moment.comments && moment.comments.length > 0) {
            commentsHtml = `<div class="moment-comments">
                ${moment.comments.map((c, index) => {
                    let displayName = c.user;
                    if (contactId !== 'me') {
                        const contact = window.iphoneSimState.contacts.find(cnt => cnt.id === contactId);
                        if (contact && contact.remark) {
                            if (c.user === contact.name || c.user === contact.nickname) {
                                displayName = contact.remark;
                            }
                        }
                    }

                    let userHtml = `<span class="moment-comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="moment-comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="moment-comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="moment-comment-content">${c.content}</span></span>
                        <span class="moment-comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
                    </div>`;
                }).join('')}
            </div>`;
        }

        let footerHtml = '';
        if (likesHtml || commentsHtml) {
            footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
        }

        const date = new Date(moment.time);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        item.innerHTML = `
            <div style="width: 50px; font-size: 20px; font-weight: bold; text-align: right; margin-right: 10px; display: flex; flex-direction: row; align-items: baseline; justify-content: flex-end; line-height: 1.1; margin-top: -4px;">
                <div style="font-size: 24px; margin-right: 2px;">${date.getDate()}</div>
                <div style="font-size: 12px;">${date.getMonth() + 1}月</div>
            </div>
            <div class="moment-content">
                <div class="moment-text">${moment.content}</div>
                ${imagesHtml}
                <div class="moment-info">
                    <div style="display: flex; align-items: center;">
                        <span class="moment-time" style="display: none;">${timeStr}</span>
                    </div>
                    <div style="position: relative;">
                        <button class="moment-action-btn" onclick="window.toggleActionMenu(this, ${moment.id})"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="action-menu" id="action-menu-${moment.id}">
                            <button class="action-menu-btn" onclick="window.toggleLike(${moment.id})"><i class="far fa-heart"></i> 赞</button>
                            <button class="action-menu-btn" onclick="window.showCommentInput(${moment.id})"><i class="far fa-comment"></i> 评论</button>
                        </div>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

// --- 个人资料功能 ---

function renderMeTab() {
    const container = document.getElementById('me-profile-container');
    if (!container) return;

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    const { name, wxid, avatar, bgImage, desc } = window.iphoneSimState.userProfile;
    const bg = bgImage || '';

    container.innerHTML = `
        <div class="me-profile-card">
            <div class="me-bg" id="me-bg-trigger" style="background-image: url('${bg}'); background-color: ${bg ? 'transparent' : '#ccc'};"></div>
            <div class="me-info">
                <div class="me-avatar-row">
                    <img class="me-avatar" id="me-avatar-trigger" src="${avatar}">
                </div>
                <div class="me-name" id="me-name-trigger">${name}</div>
                <div class="me-id">微信号：<span id="me-id-trigger">${wxid}</span></div>
                <div class="me-desc" id="me-desc-trigger">${desc}</div>
            </div>
        </div>
        
        <div class="ios-list-group">
            <div class="list-item" id="open-wallet-btn" style="cursor: pointer;">
                <div class="list-content">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-wallet" style="color: #FF9500; font-size: 20px; width: 24px; text-align: center;"></i>
                        <label style="cursor: pointer;">钱包</label>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            </div>
        </div>
    `;

    const avatarInput = document.getElementById('me-avatar-input');
    const bgInput = document.getElementById('me-bg-input');

    document.getElementById('me-avatar-trigger').addEventListener('click', () => avatarInput.click());
    document.getElementById('me-bg-trigger').addEventListener('click', () => bgInput.click());
    
    document.getElementById('open-wallet-btn').addEventListener('click', () => {
        renderWallet();
        document.getElementById('wallet-screen').classList.remove('hidden');
    });

    avatarInput.onchange = (e) => handleMeImageUpload(e, 'avatar');
    bgInput.onchange = (e) => handleMeImageUpload(e, 'bgImage');

    makeEditable('me-name-trigger', 'name');
    makeEditable('me-id-trigger', 'wxid');
    makeEditable('me-desc-trigger', 'desc');
}

function handleMeImageUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxWidth = type === 'avatar' ? 300 : 800;
    compressImage(file, maxWidth, 0.7).then(base64 => {
        updateUserProfile(type, base64);
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function makeEditable(elementId, field) {
    const el = document.getElementById(elementId);
    el.addEventListener('click', () => {
        const currentText = el.textContent;
        const input = document.createElement(field === 'desc' ? 'textarea' : 'input');
        input.value = currentText === '点击此处添加个性签名' ? '' : currentText;
        input.className = 'editable-input';
        input.style.width = '100%';
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        
        el.replaceWith(input);
        input.focus();

        const save = () => {
            const newValue = input.value.trim();
            updateUserProfile(field, newValue);
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && field !== 'desc') {
                save();
            }
        });
    });
}

function updateUserProfile(field, value) {
    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            momentsBgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }
    
    if (field === 'desc' && !value) {
        value = '点击此处添加个性签名';
    }
    
    window.iphoneSimState.userProfile[field] = value;
    saveConfig();
    renderMeTab();
    renderMoments();
}

// --- 钱包功能 ---

function renderWallet() {
    const balanceEl = document.getElementById('wallet-balance');
    const transactionsEl = document.getElementById('wallet-transactions');
    
    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    
    balanceEl.textContent = `¥${parseFloat(window.iphoneSimState.wallet.balance).toFixed(2)}`;
    
    transactionsEl.innerHTML = '';
    
    if (window.iphoneSimState.wallet.transactions.length === 0) {
        transactionsEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无交易记录</div>';
        return;
    }
    
    window.iphoneSimState.wallet.transactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const date = new Date(t.time);
        const timeStr = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const isIncome = t.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';
        
        item.innerHTML = `
            <div class="transaction-icon-simple">
                <i class="fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${t.title}</div>
                <div class="transaction-time">${timeStr}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountPrefix}${parseFloat(t.amount).toFixed(2)}</div>
        `;
        transactionsEl.appendChild(item);
    });
}

function ensureUnifiedPaymentMethodModal() {
    let modal = document.getElementById('unified-payment-method-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'unified-payment-method-modal';
    modal.className = 'modal hidden';
    modal.style.zIndex = '380';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div class="modal-content" style="height:auto;border-radius:12px;width:86%;max-width:340px;background-color:#fff;">
            <div class="modal-header">
                <h3>选择支付方式</h3>
                <button class="close-btn" id="close-unified-payment-method">&times;</button>
            </div>
            <div class="modal-body">
                <button id="payment-method-wallet" class="ios-btn-block" style="margin-bottom:10px;background:#07C160;">微信余额</button>
                <button id="payment-method-bank-cash" class="ios-btn-block" style="margin-bottom:10px;">银行卡余额</button>
                <button id="payment-method-family-card" class="ios-btn-block secondary">亲属卡</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function chooseUnifiedPaymentMethod() {
    return new Promise((resolve, reject) => {
        const modal = ensureUnifiedPaymentMethodModal();
        const closeBtn = document.getElementById('close-unified-payment-method');
        const walletBtn = document.getElementById('payment-method-wallet');
        const bankCashBtn = document.getElementById('payment-method-bank-cash');
        const familyCardBtn = document.getElementById('payment-method-family-card');

        if (!modal || !walletBtn || !bankCashBtn || !familyCardBtn || !closeBtn) {
            reject(new Error('payment method modal missing'));
            return;
        }

        const cleanup = () => {
            if (closeBtn) closeBtn.onclick = null;
            if (walletBtn) walletBtn.onclick = null;
            if (bankCashBtn) bankCashBtn.onclick = null;
            if (familyCardBtn) familyCardBtn.onclick = null;
            modal.onclick = null;
            modal.classList.add('hidden');
        };
        const pick = (method) => {
            cleanup();
            resolve(method);
        };
        const cancel = () => {
            cleanup();
            reject(new Error('cancelled'));
        };

        closeBtn.onclick = cancel;
        walletBtn.onclick = () => pick('wallet');
        bankCashBtn.onclick = () => pick('bank_cash');
        familyCardBtn.onclick = () => pick('family_card');
        modal.onclick = (e) => {
            if (e.target === modal) cancel();
        };
        modal.classList.remove('hidden');
    });
}
window.openUnifiedPaymentMethodModal = chooseUnifiedPaymentMethod;

function getSceneTitles(scene) {
    if (scene === 'shopping_gift') {
        return { walletTitle: '送礼支付', bankTitle: '购物送礼支付' };
    }
    if (scene === 'xianyu_favorite') {
        return { walletTitle: '闲鱼支付', bankTitle: '闲鱼收藏购买支付' };
    }
    return { walletTitle: '购物支付', bankTitle: '购物支付' };
}

window.resolvePurchasePayment = async function(options = {}) {
    const amount = Number(options.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, reason: 'invalid_amount' };
    }

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    let method = options.method;
    if (!method) {
        try {
            method = await chooseUnifiedPaymentMethod();
        } catch (e) {
            return { ok: false, reason: 'cancelled' };
        }
    }

    const scene = options.scene || 'shopping_self';
    const sceneTitles = getSceneTitles(scene);
    const now = Date.now();

    if (method === 'wallet') {
        const walletBalance = Number(window.iphoneSimState.wallet.balance || 0);
        if (walletBalance < amount) return { ok: false, reason: 'wallet_insufficient' };

        window.iphoneSimState.wallet.balance = Number((walletBalance - amount).toFixed(2));
        if (!Array.isArray(window.iphoneSimState.wallet.transactions)) {
            window.iphoneSimState.wallet.transactions = [];
        }
        window.iphoneSimState.wallet.transactions.unshift({
            id: now,
            type: 'expense',
            amount,
            title: sceneTitles.walletTitle,
            time: now,
            relatedId: options.relatedId || null
        });
        saveConfig();
        if (window.renderWallet) window.renderWallet();
        return { ok: true, method: 'wallet', amount };
    }

    if (method === 'bank_cash') {
        if (typeof window.ensureBankAppState !== 'function') return { ok: false, reason: 'bank_unavailable' };
        const bank = window.ensureBankAppState();
        const cash = Number(bank.cashBalance || 0);
        if (cash < amount) return { ok: false, reason: 'bank_cash_insufficient' };
        bank.cashBalance = Number((cash - amount).toFixed(2));
        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: sceneTitles.bankTitle,
                sourceApp: 'bank',
                sourceType: 'cash',
                sourceKey: 'cash',
                sourceLabel: '银行卡余额'
            });
        }
        saveConfig();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        return { ok: true, method: 'bank_cash', amount, sourceLabel: '银行卡余额' };
    }

    if (method === 'family_card') {
        if (typeof window.selectBankFundingSource !== 'function' || typeof window.applyBankDebit !== 'function') {
            return { ok: false, reason: 'bank_unavailable' };
        }
        let source = null;
        try {
            source = await window.selectBankFundingSource({ amount, onlyFamilyCard: true });
        } catch (e) {
            return { ok: false, reason: 'cancelled' };
        }
        const debitResult = window.applyBankDebit(amount, source);
        if (!debitResult || !debitResult.ok) return { ok: false, reason: 'family_card_insufficient' };

        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: sceneTitles.bankTitle,
                sourceApp: 'family_card',
                sourceType: 'family_card',
                sourceKey: source.key,
                sourceLabel: source.label
            });
        }
        if (typeof window.pushFamilyCardSpendHiddenNotice === 'function') {
            window.pushFamilyCardSpendHiddenNotice({
                sourceKey: source.key,
                sourceLabel: source.label,
                amount,
                scene,
                itemSummary: options.itemSummary || ''
            });
        }
        saveConfig();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        return { ok: true, method: 'family_card', amount, sourceLabel: source.label };
    }

    return { ok: false, reason: 'unsupported_method' };
};

function handleRecharge() {
    const inputAmount = document.getElementById('recharge-amount').value;
    const amount = Number(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        alert('请输入有效的充值金额');
        return;
    }

    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };

    const proceed = (source) => {
        if (!source) return;
        const debitResult = typeof window.applyBankDebit === 'function'
            ? window.applyBankDebit(amount, source)
            : { ok: false, message: '银行功能不可用' };
        if (!debitResult.ok) {
            alert(debitResult.message || '扣款失败');
            return;
        }
        window.iphoneSimState.wallet.balance = Number((Number(window.iphoneSimState.wallet.balance || 0) + amount).toFixed(2));
        const sourceText = source.type === 'cash' ? '银行余额' : (source.label || '亲属卡');
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: `余额充值（来源:${sourceText}）`,
            time: Date.now(),
            relatedId: null
        });
        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: '转出到微信钱包',
                sourceApp: 'wechat_wallet',
                sourceType: source.type === 'family_card' ? 'family_card' : 'cash',
                sourceKey: source.key,
                sourceLabel: source.label
            });
        }
        saveConfig();
        renderWallet();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        document.getElementById('wallet-recharge-modal').classList.add('hidden');
        alert(`成功充值 ¥${amount.toFixed(2)}`);
    };

    if (typeof window.selectBankFundingSource !== 'function') {
        alert('银行资金来源选择不可用');
        return;
    }
    window.selectBankFundingSource({ amount }).then(proceed).catch(() => {});
}

function handleWithdraw() {
    const inputAmount = document.getElementById('withdraw-amount').value;
    const amount = Number(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        alert('请输入有效的提现金额');
        return;
    }
    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (Number(window.iphoneSimState.wallet.balance || 0) < amount) {
        alert('微信钱包余额不足');
        return;
    }

    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    window.iphoneSimState.wallet.balance = Number((Number(window.iphoneSimState.wallet.balance || 0) - amount).toFixed(2));
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: amount,
        title: '余额提现',
        time: Date.now(),
        relatedId: null
    });
    if (typeof window.applyBankCredit === 'function') {
        window.applyBankCredit(amount, '来自微信钱包提现', { sourceApp: 'wechat_wallet', sourceType: 'cash', sourceLabel: '微信钱包' });
    }
    saveConfig();
    renderWallet();
    if (window.renderBankBalance) window.renderBankBalance();
    if (window.renderBankStatementView) window.renderBankStatementView();
    document.getElementById('wallet-withdraw-modal').classList.add('hidden');
    alert(`成功提现 ¥${amount.toFixed(2)}`);
}

function handleAiReturnTransfer(transferId) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let amount = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    amount = parseFloat(data.amount);
                    break;
                }
            } catch (e) {}
        }
    }

    if (amount > 0) {
        if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
        window.iphoneSimState.wallet.balance += amount;
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: '转账退回',
            time: Date.now(),
            relatedId: transferId
        });
        saveConfig();
    }
}

window.handleTransferClick = function(transferId, role) {
    if (!transferId) {
        alert('转账数据无效');
        return;
    }

    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) return;
    
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let transferData = null;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id == transferId) {
                    transferData = data;
                    break;
                }
            } catch (e) {}
        }
    }

    if (!transferData) {
        console.error('未找到转账数据', transferId);
        alert('未找到该转账记录');
        return;
    }

    const status = (transferData.status || 'pending').toLowerCase();

    if (status !== 'pending') {
        let statusText = status;
        if (status === 'accepted') statusText = '已收款';
        if (status === 'returned') statusText = '已退还';
        
        alert(`该转账状态为: ${statusText}`);
        return;
    }

    const isMe = role === 'user';
    const actionSheet = document.createElement('div');
    actionSheet.className = 'modal';
    actionSheet.style.zIndex = '300';
    actionSheet.style.alignItems = 'flex-end';
    
    const amount = parseFloat(transferData.amount).toFixed(2);
    
    actionSheet.innerHTML = `
        <div class="modal-content" style="height: auto; border-radius: 12px 12px 0 0;">
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">${isMe ? '等待对方收款' : '收到转账'}</div>
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">¥${amount}</div>
                <div style="font-size: 14px; color: #999; margin-bottom: 20px;">${transferData.remark}</div>
                
                ${!isMe ? `<button onclick="window.acceptTransfer(${transferData.id})" class="ios-btn-block" style="background-color: #07C160; margin-bottom: 10px;">确认收款</button>` : ''}
                ${!isMe ? `<button onclick="window.returnTransfer(${transferData.id})" class="ios-btn-block secondary" style="color: #FF3B30; margin-bottom: 10px;">退还转账</button>` : ''}
                <button onclick="this.closest('.modal').remove()" class="ios-btn-block secondary">取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(actionSheet);
    
    actionSheet.addEventListener('click', (e) => {
        if (e.target === actionSheet) actionSheet.remove();
    });
};

window.acceptTransfer = function(transferId) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let amount = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    amount = parseFloat(data.amount);
                    break;
                }
            } catch (e) {}
        }
    }

    if (amount > 0) {
        if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
        window.iphoneSimState.wallet.balance += amount;
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: '转账收款',
            time: Date.now(),
            relatedId: transferId
        });
        saveConfig();
    }

    updateTransferStatus(transferId, 'accepted');
    document.querySelector('.modal[style*="z-index: 300"]').remove();
    
    if (window.sendMessage) window.sendMessage('[系统消息]: 用户已收款', true, 'text'); 
};

window.returnTransfer = function(transferId) {
    updateTransferStatus(transferId, 'returned');
    document.querySelector('.modal[style*="z-index: 300"]').remove();
    
    if (window.sendMessage) window.sendMessage('[系统消息]: 转账已退还', true, 'text');
};

function updateTransferStatus(transferId, status) {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let found = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    data.status = status;
                    msg.content = JSON.stringify(data);
                    found = true;
                    break;
                }
            } catch (e) {}
        }
    }
    
    if (found) {
        saveConfig();
        if (window.renderChatHistory) window.renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
}

// --- 记忆功能 ---

const MEMORY_VALID_TAGS = ['refined', 'short_term', 'long_term', 'state', 'fact'];
const MEMORY_FILTER_TO_TAG = {
    refined: 'refined',
    short_term: 'short_term',
    long_term: 'long_term',
    state: 'state',
    fact: 'fact'
};
const MEMORY_TAG_LABELS = {
    refined: 'REFINED',
    short_term: 'SHORT',
    long_term: 'LONG',
    state: 'STATE',
    fact: 'FACT'
};
const FACT_SOURCE_TYPES = ['delivery_share', 'shopping_gift', 'gift_card', 'user_explicit_text', 'refine_extract'];
const CANDIDATE_SOURCE_LABELS = {
    auto_summary: '自动总结',
    call_summary: '通话总结',
    ai_action: '聊天动作'
};
const STATE_REASON_LABELS = {
    health: '健康',
    exam: '考试',
    travel: '出行',
    emotion: '情绪',
    other: '其他'
};
const STATE_TENSE_KEYWORDS = ['正在', '最近', '这几天', '目前', '本周', '这段时间', '刚开始'];
const STATE_RULE_KEYWORDS = {
    health: ['生病', '发烧', '感冒', '不舒服', '疼', '生理期', '例假'],
    exam: ['考试周', '期末', '备考', '复习', '答辩', 'ddl', 'deadline'],
    travel: ['出差', '外地', '旅行', '旅游', '高铁', '飞机', '赶路'],
    emotion: ['焦虑', '低落', '压力大', '崩', 'emo', '情绪不好']
};
const STATE_RESOLVE_KEYWORDS = [
    '好了',
    '恢复了',
    '结束了',
    '过去了',
    '不疼了',
    '不发烧了',
    '考完了',
    '回来了'
];
const STATE_RESOLVE_REASON_HINTS = {
    exam: ['考完了', '答辩完', 'ddl结束', 'deadline过了', '期末结束'],
    travel: ['回来了', '到家了', '回到家', '出差结束', '旅程结束'],
    health: ['好了', '恢复了', '不发烧了', '不疼了', '退烧了', '痊愈'],
    emotion: ['好多了', '不焦虑了', '不emo了', '缓过来了', '心情好了']
};
const STATE_NEGATIVE_PATTERNS = [
    /并没有/,
    /没有/,
    /不是/,
    /没在/,
    /不在/,
    /没生病/,
    /没发烧/,
    /没感冒/,
    /不焦虑/,
    /不难受/,
    /不出差/,
    /不考试/,
    /\bnot\b/i
];
const STATE_GUESS_PATTERNS = [/是不是/, /你在不在/, /我猜/, /\bguess\b/i, /\bmaybe\b/i];
const STATE_GENERIC_EXCLUDE_PATTERNS = [/有点忙/, /有点累/, /有点困/, /太忙了/];
const STATE_EXTRACT_PROCESSED_MSG_LIMIT = 500;
const processedStateExtractMessageIds = new Set();

function escapeHtml(text) {
    return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeStateExtractText(text) {
    const normalizedWidth = String(text || '').replace(/[\uFF01-\uFF5E]/g, ch => {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    }).replace(/\u3000/g, ' ');
    return normalizedWidth
        .replace(/\u3000/g, ' ')
        .replace(/[，。！？；：]/g, match => ({ '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':' }[match] || match))
        .replace(/\s+/g, ' ')
        .trim();
}

function collectMatchedKeywords(sourceText, keywords = []) {
    const text = String(sourceText || '').toLowerCase();
    return keywords.filter(keyword => text.includes(String(keyword).toLowerCase()));
}

function containsAnyKeyword(sourceText, keywords = []) {
    return collectMatchedKeywords(sourceText, keywords).length > 0;
}

function stripStateLeadingSubject(text) {
    return String(text || '')
        .replace(/^(我|用户|我这边|我这儿|本人|最近我|这几天我|目前我)\s*/g, '')
        .replace(/^(现在|最近|这几天|目前|本周|这段时间)\s*/g, '')
        .trim();
}

function inferResolveReasonType(matchedKeywords = []) {
    const normalizedHits = Array.isArray(matchedKeywords)
        ? matchedKeywords.map(item => String(item || '').toLowerCase())
        : [];
    if (normalizedHits.length === 0) return 'other';
    const reasonOrder = ['health', 'exam', 'travel', 'emotion'];
    for (const reason of reasonOrder) {
        const hints = Array.isArray(STATE_RESOLVE_REASON_HINTS[reason]) ? STATE_RESOLVE_REASON_HINTS[reason] : [];
        const loweredHints = hints.map(item => String(item || '').toLowerCase());
        if (normalizedHits.some(hit => loweredHints.some(hint => hit.includes(hint) || hint.includes(hit)))) {
            return reason;
        }
    }
    return 'other';
}

function formatDateTimeForMemory(ts = Date.now()) {
    const date = new Date(ts);
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function capProcessedStateMessageSet(msgId) {
    if (!msgId) return;
    processedStateExtractMessageIds.add(msgId);
    if (processedStateExtractMessageIds.size <= STATE_EXTRACT_PROCESSED_MSG_LIMIT) return;
    const removeCount = processedStateExtractMessageIds.size - STATE_EXTRACT_PROCESSED_MSG_LIMIT;
    const iterator = processedStateExtractMessageIds.values();
    for (let i = 0; i < removeCount; i++) {
        const first = iterator.next();
        if (first.done) break;
        processedStateExtractMessageIds.delete(first.value);
    }
}

function parseJsonFromPossibleText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return null;
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch (error2) {
            return null;
        }
    }
}

function normalizeExactNames(names) {
    if (!Array.isArray(names)) return [];
    const set = new Set();
    const result = [];
    names.forEach(name => {
        const text = String(name || '').trim().replace(/\s+/g, ' ');
        if (!text) return;
        const key = text.toLowerCase();
        if (set.has(key)) return;
        set.add(key);
        result.push(text);
    });
    return result;
}

function splitNamesByJoiners(raw) {
    const source = String(raw || '').trim();
    if (!source) return [];
    let parts = source
        .split(/(?:、|，|,|\/|\\|\s和\s|\s及\s|\s还有\s)/)
        .map(item => item.trim())
        .filter(Boolean);
    if (parts.length <= 1 && source.includes('和') && !source.includes('和牛')) {
        const byHe = source.split('和').map(item => item.trim()).filter(Boolean);
        if (byHe.length > 1 && byHe.every(item => item.length >= 2 && item.length <= 20)) {
            parts = byHe;
        }
    }
    return parts.length > 1 ? parts : [source];
}

function cleanupExtractedName(text) {
    let value = String(text || '').trim();
    if (!value) return '';
    value = value.replace(/^[“"'‘’「『]+|[”"'’」』]+$/g, '').trim();
    value = value.replace(/^(?:了)?(?:一(?:份|碗|杯|盒|束|袋|套|件|张|份儿)|一个|一杯|一份|一碗|一盒|一束|一袋|一套|一件|一张)/, '').trim();
    value = value.replace(/^(?:个|份|杯|碗|盒|束|袋|套|件|张)/, '').trim();
    value = value.replace(/(?:给你|给你们|给你点的|给你买的|给你送的)$/g, '').trim();
    if (value.length > 40) return '';
    if (/^(?:东西|礼物|外卖|吃的|喝的|饭|餐|那个|这个|它|这份|那份|些东西)$/.test(value)) return '';
    return value;
}

function buildExactNamesKey(names) {
    const normalized = normalizeExactNames(names);
    if (normalized.length === 0) return '';
    return normalized.map(item => item.toLowerCase()).sort().join('||');
}

function extractNamesFromFactContent(content) {
    const text = String(content || '').trim();
    if (!text) return [];
    const directMatch = text.match(/具体名称[:：]\s*(.+)$/);
    if (!directMatch || !directMatch[1]) return [];
    const raw = directMatch[1].trim();
    if (!raw) return [];
    const parts = raw.split(/(?:\/|、|，|,)/).map(item => cleanupExtractedName(item)).filter(Boolean);
    return normalizeExactNames(parts);
}

function getMemoryExactNames(memory) {
    if (!memory || typeof memory !== 'object') return [];
    if (memory.factMeta && Array.isArray(memory.factMeta.exactNames) && memory.factMeta.exactNames.length > 0) {
        return normalizeExactNames(memory.factMeta.exactNames);
    }
    return extractNamesFromFactContent(memory.content);
}

function normalizeSceneText(sceneText) {
    let text = String(sceneText || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    text = text.replace(/[，。！？!?；;]+$/g, '');
    if (text.length > 80) text = `${text.slice(0, 80)}...`;
    return text;
}

function extractSceneTextFromFactContent(content) {
    const text = String(content || '').trim();
    if (!text) return '';
    const match = text.match(/^(.+?)[，,]\s*具体名称[:：]/);
    if (!match || !match[1]) return '';
    return normalizeSceneText(match[1]);
}

function inferFactSceneBySource(sourceType, actor = 'user') {
    const safeActor = actor === 'contact' ? 'contact' : 'user';
    const subject = safeActor === 'contact' ? '联系人' : '用户';
    const target = safeActor === 'contact' ? '用户' : '联系人';
    if (sourceType === 'delivery_share') return `${subject}给${target}点过外卖`;
    if (sourceType === 'shopping_gift') return `${subject}给${target}送过礼物`;
    if (sourceType === 'gift_card') return `${subject}给${target}分享过礼品卡`;
    if (sourceType === 'refine_extract') return '从多条历史记忆中提炼出的关键事实';
    return `${subject}在聊天中明确提到过具体名称`;
}

function inferFactSceneFromText(text, actor = 'user') {
    const raw = String(text || '');
    const safeActor = actor === 'contact' ? 'contact' : 'user';
    const subject = safeActor === 'contact' ? '联系人' : '用户';
    const target = safeActor === 'contact' ? '用户' : '联系人';
    if (/点了|下单了|外卖/.test(raw)) return `${subject}给${target}点过外卖`;
    if (/送了|买了|礼物|花束|蛋糕|手办|耳机|口红|奶茶|零食/.test(raw)) return `${subject}给${target}送过礼物`;
    if (/礼品卡|卡券|代金券|红包封面/.test(raw)) return `${subject}给${target}分享过礼品卡`;
    return `${subject}在聊天中明确提到过具体名称`;
}

function buildFactSceneText(sourceType, extraMeta = {}) {
    const safeSourceType = FACT_SOURCE_TYPES.includes(sourceType) ? sourceType : 'user_explicit_text';
    const safeActor = extraMeta.actor === 'contact' ? 'contact' : 'user';
    const provided = normalizeSceneText(extraMeta.sceneText);
    if (provided) return provided;
    if (safeSourceType === 'user_explicit_text') {
        const fromText = normalizeSceneText(inferFactSceneFromText(extraMeta.sourceText, safeActor));
        if (fromText) return fromText;
    }
    return normalizeSceneText(inferFactSceneBySource(safeSourceType, safeActor));
}

function buildFactMemoryContent(names, sourceType, extraMeta = {}) {
    const exactNames = normalizeExactNames(Array.isArray(names) ? names : []);
    if (exactNames.length === 0) return '';
    const sceneText = buildFactSceneText(sourceType, extraMeta);
    const namesText = exactNames.join(' / ');
    if (!sceneText) return `用户提到具体名称：${namesText}`;
    return `${sceneText}，具体名称：${namesText}`;
}

function buildFactMemoryReadableContent(memory) {
    const names = getMemoryExactNames(memory);
    if (names.length === 0) return String((memory && memory.content) || '');
    const sceneText = normalizeSceneText(
        (memory && memory.factMeta && memory.factMeta.sceneText)
            ? memory.factMeta.sceneText
            : extractSceneTextFromFactContent(memory && memory.content)
    );
    if (!sceneText) return `用户提到具体名称：${names.join(' / ')}`;
    return `${sceneText}，具体名称：${names.join(' / ')}`;
}

function normalizeFactMeta(meta, fallbackSourceType = 'user_explicit_text') {
    if (!meta || typeof meta !== 'object') return null;
    const safeSourceType = FACT_SOURCE_TYPES.includes(meta.sourceType) ? meta.sourceType : fallbackSourceType;
    const exactNames = normalizeExactNames(meta.exactNames);
    if (exactNames.length === 0) return null;
    const next = {
        sourceType: safeSourceType,
        exactNames
    };
    if (meta.sourceMsgId !== undefined && meta.sourceMsgId !== null && String(meta.sourceMsgId).trim()) {
        next.sourceMsgId = String(meta.sourceMsgId).trim();
    }
    if (meta.sourceRange !== undefined && meta.sourceRange !== null && String(meta.sourceRange).trim()) {
        next.sourceRange = String(meta.sourceRange).trim();
    }
    const sceneText = normalizeSceneText(meta.sceneText);
    if (sceneText) next.sceneText = sceneText;
    return next;
}

function mergeFactMeta(previous, incoming, fallbackSourceType = 'user_explicit_text') {
    const prev = normalizeFactMeta(previous, fallbackSourceType);
    const next = normalizeFactMeta(incoming, fallbackSourceType);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    const mergedNames = normalizeExactNames([...(prev.exactNames || []), ...(next.exactNames || [])]);
    const merged = {
        sourceType: FACT_SOURCE_TYPES.includes(next.sourceType) ? next.sourceType : prev.sourceType,
        exactNames: mergedNames
    };
    merged.sourceMsgId = next.sourceMsgId || prev.sourceMsgId;
    merged.sourceRange = next.sourceRange || prev.sourceRange;
    merged.sceneText = next.sceneText || prev.sceneText;
    if (!merged.sourceMsgId) delete merged.sourceMsgId;
    if (!merged.sourceRange) delete merged.sourceRange;
    if (!merged.sceneText) delete merged.sceneText;
    return merged;
}

function normalizeRefinedMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const selectedMemoryIds = Array.isArray(meta.selectedMemoryIds)
        ? meta.selectedMemoryIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        : [];
    const keyFactsCount = clampInt(meta.keyFactsCount, 0, 0, 9999);
    if (selectedMemoryIds.length === 0 && keyFactsCount === 0) return null;
    return {
        selectedMemoryIds: Array.from(new Set(selectedMemoryIds)),
        keyFactsCount
    };
}

function mergeRefinedMeta(previous, incoming) {
    const prev = normalizeRefinedMeta(previous);
    const next = normalizeRefinedMeta(incoming);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    return {
        selectedMemoryIds: Array.from(new Set([...(prev.selectedMemoryIds || []), ...(next.selectedMemoryIds || [])])),
        keyFactsCount: Math.max(clampInt(prev.keyFactsCount, 0, 0, 9999), clampInt(next.keyFactsCount, 0, 0, 9999))
    };
}

function normalizeStateExtractMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const matchedKeywords = Array.isArray(meta.matchedKeywords)
        ? meta.matchedKeywords.map(item => String(item || '').trim()).filter(Boolean).slice(0, 20)
        : [];
    return {
        ruleScore: clampFloat(meta.ruleScore, 0.62, 0, 1),
        aiConfidence: Number.isFinite(Number(meta.aiConfidence)) ? clampFloat(meta.aiConfidence, 0.75, 0, 1) : null,
        finalConfidence: clampFloat(meta.finalConfidence, 0.75, 0, 1),
        matchedKeywords,
        detector: ['rule_plus_ai', 'rule_only_fallback'].includes(meta.detector) ? meta.detector : 'rule_only_fallback'
    };
}

function mergeStateExtractMeta(previous, incoming) {
    const prev = normalizeStateExtractMeta(previous);
    const next = normalizeStateExtractMeta(incoming);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    return {
        ruleScore: Math.max(prev.ruleScore, next.ruleScore),
        aiConfidence: next.aiConfidence === null ? prev.aiConfidence : next.aiConfidence,
        finalConfidence: Math.max(prev.finalConfidence, next.finalConfidence),
        matchedKeywords: Array.from(new Set([...(prev.matchedKeywords || []), ...(next.matchedKeywords || [])])).slice(0, 20),
        detector: next.detector || prev.detector
    };
}

function formatCandidateMetaText(candidate) {
    const sourceLabel = CANDIDATE_SOURCE_LABELS[candidate.source] || '自动提取';
    const confidence = (Number(candidate.confidence || 0) * 100).toFixed(0);
    const date = new Date(candidate.createdAt || Date.now());
    const timeText = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const reasonText = String(candidate.reason || '').trim();
    const reasonPart = reasonText ? `，原因：${reasonText}` : '';
    return `来源：${sourceLabel}，可信度约 ${confidence}%${reasonPart}（${timeText}）`;
}

function ensureMemoryCollections() {
    if (!Array.isArray(window.iphoneSimState.memories)) window.iphoneSimState.memories = [];
    if (!Array.isArray(window.iphoneSimState.memoryCandidates)) window.iphoneSimState.memoryCandidates = [];
}

function getDefaultMemorySettingsRuntime() {
    if (typeof window.createDefaultMemorySettingsV2 === 'function') {
        return window.createDefaultMemorySettingsV2();
    }
    return {
        extractMode: 'hybrid',
        injectQuota: { short_term: 2, long_term: 2, state: 2, fact: 2, refined: 1, maxTotal: 7 },
        stateTtlDays: { health: 7, exam: 14, travel: 10, emotion: 3, other: 7 },
        dedupeThreshold: 0.75,
        stateExtractV2: {
            enabled: true,
            strategy: 'rule_plus_ai',
            thresholds: { accept: 0.78, borderline: 0.60, resolve: 0.72 },
            ai: { timeoutMs: 4500, maxTokens: 180, temperature: 0.1 }
        }
    };
}

function clampInt(value, fallback, min = 0, max = 999) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function clampFloat(value, fallback, min = 0, max = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function ensureMemorySettingsV2() {
    const defaults = getDefaultMemorySettingsRuntime();
    const raw = window.iphoneSimState.memorySettingsV2 && typeof window.iphoneSimState.memorySettingsV2 === 'object'
        ? window.iphoneSimState.memorySettingsV2
        : {};
    const inject = raw.injectQuota && typeof raw.injectQuota === 'object' ? raw.injectQuota : {};
    const ttl = raw.stateTtlDays && typeof raw.stateTtlDays === 'object' ? raw.stateTtlDays : {};
    const stateExtract = raw.stateExtractV2 && typeof raw.stateExtractV2 === 'object' ? raw.stateExtractV2 : {};
    const thresholds = stateExtract.thresholds && typeof stateExtract.thresholds === 'object' ? stateExtract.thresholds : {};
    const ai = stateExtract.ai && typeof stateExtract.ai === 'object' ? stateExtract.ai : {};
    const normalized = {
        extractMode: ['hybrid', 'auto', 'manual'].includes(raw.extractMode) ? raw.extractMode : defaults.extractMode,
        injectQuota: {
            short_term: clampInt(inject.short_term, defaults.injectQuota.short_term, 0, 50),
            long_term: clampInt(inject.long_term, defaults.injectQuota.long_term, 0, 50),
            state: clampInt(inject.state, defaults.injectQuota.state, 0, 50),
            fact: clampInt(inject.fact, defaults.injectQuota.fact, 0, 50),
            refined: clampInt(inject.refined, defaults.injectQuota.refined, 0, 50),
            maxTotal: clampInt(inject.maxTotal, defaults.injectQuota.maxTotal, 1, 100)
        },
        stateTtlDays: {
            health: clampInt(ttl.health, defaults.stateTtlDays.health, 1, 365),
            exam: clampInt(ttl.exam, defaults.stateTtlDays.exam, 1, 365),
            travel: clampInt(ttl.travel, defaults.stateTtlDays.travel, 1, 365),
            emotion: clampInt(ttl.emotion, defaults.stateTtlDays.emotion, 1, 365),
            other: clampInt(ttl.other, defaults.stateTtlDays.other, 1, 365)
        },
        dedupeThreshold: clampFloat(raw.dedupeThreshold, defaults.dedupeThreshold, 0.3, 0.99),
        stateExtractV2: {
            enabled: stateExtract.enabled === undefined ? true : !!stateExtract.enabled,
            strategy: ['rule_plus_ai', 'rule_only'].includes(stateExtract.strategy)
                ? stateExtract.strategy
                : defaults.stateExtractV2.strategy,
            thresholds: {
                accept: clampFloat(thresholds.accept, defaults.stateExtractV2.thresholds.accept, 0.3, 0.99),
                borderline: clampFloat(thresholds.borderline, defaults.stateExtractV2.thresholds.borderline, 0.3, 0.99),
                resolve: clampFloat(thresholds.resolve, defaults.stateExtractV2.thresholds.resolve, 0.3, 0.99)
            },
            ai: {
                timeoutMs: clampInt(ai.timeoutMs, defaults.stateExtractV2.ai.timeoutMs, 500, 15000),
                maxTokens: clampInt(ai.maxTokens, defaults.stateExtractV2.ai.maxTokens, 60, 800),
                temperature: clampFloat(ai.temperature, defaults.stateExtractV2.ai.temperature, 0, 1)
            }
        }
    };
    if (normalized.stateExtractV2.thresholds.borderline > normalized.stateExtractV2.thresholds.accept) {
        normalized.stateExtractV2.thresholds.borderline = normalized.stateExtractV2.thresholds.accept;
    }
    window.iphoneSimState.memorySettingsV2 = normalized;
    return normalized;
}

function normalizeMemoryTags(tags, fallback = 'long_term') {
    const next = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : []);
    const normalized = Array.from(new Set(
        next.map(tag => String(tag || '').trim().toLowerCase()).filter(tag => MEMORY_VALID_TAGS.includes(tag))
    ));
    if (normalized.length === 0) normalized.push(fallback);
    return normalized;
}

function inferStateReasonType(text) {
    const value = String(text || '').toLowerCase();
    if (/period|sick|ill|hospital|fever|health/.test(value)) return 'health';
    if (/exam|test|quiz|final|deadline/.test(value)) return 'exam';
    if (/travel|trip|flight|train|away|business/.test(value)) return 'travel';
    if (/anxious|sad|emo|stress|panic|mood|emotion|happy/.test(value)) return 'emotion';
    return 'other';
}

function makeStateMeta(reasonType = 'other', startAt = Date.now(), expiresAt = null) {
    const settings = ensureMemorySettingsV2();
    const safeReason = ['health', 'exam', 'travel', 'emotion', 'other'].includes(reasonType) ? reasonType : 'other';
    const ttlDays = clampInt(settings.stateTtlDays[safeReason], settings.stateTtlDays.other, 1, 365);
    const safeStart = Number.isFinite(Number(startAt)) ? Number(startAt) : Date.now();
    const safeExpires = Number.isFinite(Number(expiresAt)) ? Number(expiresAt) : (safeStart + ttlDays * 24 * 60 * 60 * 1000);
    return {
        phase: Date.now() > safeExpires ? 'expired' : 'active',
        startAt: safeStart,
        expiresAt: safeExpires,
        resolvedAt: null,
        reasonType: safeReason
    };
}

function normalizeStateMetaForMemory(memory) {
    if (!memory || !Array.isArray(memory.memoryTags) || !memory.memoryTags.includes('state')) return false;
    const prev = memory.stateMeta && typeof memory.stateMeta === 'object' ? memory.stateMeta : null;
    if (!prev) {
        memory.stateMeta = makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null);
        return true;
    }
    const reasonType = ['health', 'exam', 'travel', 'emotion', 'other'].includes(prev.reasonType)
        ? prev.reasonType
        : inferStateReasonType(memory.content);
    const startAt = Number.isFinite(Number(prev.startAt)) ? Number(prev.startAt) : (Number(memory.time) || Date.now());
    const normalized = makeStateMeta(reasonType, startAt, prev.expiresAt);
    normalized.phase = prev.phase === 'resolved' ? 'resolved' : normalized.phase;
    normalized.resolvedAt = Number.isFinite(Number(prev.resolvedAt)) ? Number(prev.resolvedAt) : null;
    const changed = JSON.stringify(prev) !== JSON.stringify(normalized);
    memory.stateMeta = normalized;
    return changed;
}

window.extractStateMemoryByRule = function(text) {
    const rawText = String(text || '').trim();
    if (!rawText) return null;
    const normalized = normalizeStateExtractText(rawText);
    if (!normalized) return null;
    const lowered = normalized.toLowerCase();

    const resolveMatches = collectMatchedKeywords(lowered, STATE_RESOLVE_KEYWORDS);
    const isResolve = resolveMatches.length > 0;
    const hasNegative = STATE_NEGATIVE_PATTERNS.some(pattern => pattern.test(normalized) || pattern.test(lowered));
    const isGuessOrQuestion = STATE_GUESS_PATTERNS.some(pattern => pattern.test(normalized) || pattern.test(lowered));

    if (isGuessOrQuestion) return null;
    if (hasNegative && !isResolve) return null;

    const tenseMatches = collectMatchedKeywords(normalized, STATE_TENSE_KEYWORDS);
    const reasonHits = { health: [], exam: [], travel: [], emotion: [] };
    Object.keys(STATE_RULE_KEYWORDS).forEach(reason => {
        reasonHits[reason] = collectMatchedKeywords(lowered, STATE_RULE_KEYWORDS[reason]);
    });
    const allReasonMatches = [];
    Object.keys(reasonHits).forEach(key => {
        reasonHits[key].forEach(item => allReasonMatches.push(item));
    });
    const hasStatusKeyword = allReasonMatches.length > 0;
    if (!hasStatusKeyword && !isResolve) return null;

    if (!hasStatusKeyword && isResolve) {
        const resolveReasonType = inferResolveReasonType(resolveMatches);
        return {
            matched: true,
            rawText,
            normalizedText: stripStateLeadingSubject(normalized) || normalized,
            reasonType: resolveReasonType,
            isResolve: true,
            ruleScore: resolveReasonType === 'other' ? 0.7 : 0.74,
            matchedKeywords: resolveMatches.slice(0, 10)
        };
    }

    let reasonType = 'other';
    let maxReasonCount = 0;
    Object.keys(reasonHits).forEach(reason => {
        const count = reasonHits[reason].length;
        if (count > maxReasonCount) {
            maxReasonCount = count;
            reasonType = reason;
        }
    });
    if (maxReasonCount === 0) reasonType = 'other';
    if (isResolve && reasonType === 'other') {
        reasonType = inferResolveReasonType(resolveMatches);
    }

    if (!isResolve && reasonType === 'other') return null;
    if (STATE_GENERIC_EXCLUDE_PATTERNS.some(pattern => pattern.test(normalized)) && tenseMatches.length === 0 && !isResolve) {
        return null;
    }

    let ruleScore = maxReasonCount > 0 ? 0.62 : 0.58;
    if (tenseMatches.length > 0) ruleScore += 0.12;
    if (maxReasonCount >= 2) ruleScore += 0.05;
    if (isResolve) ruleScore += 0.05;
    if (reasonType === 'other') ruleScore -= 0.08;
    ruleScore = clampFloat(ruleScore, 0.62, 0.4, 0.95);

    const normalizedText = stripStateLeadingSubject(normalized) || normalized;
    const matchedKeywords = Array.from(new Set([
        ...tenseMatches,
        ...allReasonMatches,
        ...resolveMatches
    ])).slice(0, 16);

    return {
        matched: true,
        rawText,
        normalizedText,
        reasonType,
        isResolve,
        ruleScore,
        matchedKeywords
    };
};

window.classifyStateMemoryWithAI = async function(text, ruleResult, contactId) {
    const settings = ensureMemorySettingsV2();
    const stateExtract = settings.stateExtractV2 || {};
    if (stateExtract.strategy !== 'rule_plus_ai') return null;

    const aiSettings = window.iphoneSimState.aiSettings2.url
        ? window.iphoneSimState.aiSettings2
        : window.iphoneSimState.aiSettings;
    if (!aiSettings || !aiSettings.url || !aiSettings.key) return null;

    let fetchUrl = aiSettings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }

    const timeoutMs = clampInt(stateExtract.ai && stateExtract.ai.timeoutMs, 4500, 500, 15000);
    const maxTokens = clampInt(stateExtract.ai && stateExtract.ai.maxTokens, 180, 60, 800);
    const temperature = clampFloat(stateExtract.ai && stateExtract.ai.temperature, 0.1, 0, 1);
    const contact = window.iphoneSimState.contacts.find(item => item && item.id === contactId);
    const contactName = contact && contact.name ? contact.name : '联系人';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiSettings.key}`
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: aiSettings.model,
                messages: [
                    {
                        role: 'system',
                        content: `你是状态记忆判定器。你必须只输出 JSON，不要输出任何额外文本。
任务：判断输入文本是否应记为用户状态记忆。
输出格式：
{
  "is_state": true,
  "reason_type": "health|exam|travel|emotion|other",
  "is_resolve": false,
  "normalized_content": "标准化状态描述",
  "confidence": 0.84,
  "reason": "简短判定依据"
}
规则：
1) confidence 范围 0~1。
2) normalized_content 必须简短具体，不要臆造。
3) 如不是状态信息，is_state=false。`
                    },
                    {
                        role: 'user',
                        content: `联系人：${contactName}
原文：${String(text || '')}
规则初筛：${JSON.stringify({
    reasonType: ruleResult && ruleResult.reasonType ? ruleResult.reasonType : 'other',
    isResolve: !!(ruleResult && ruleResult.isResolve),
    ruleScore: ruleResult && Number.isFinite(Number(ruleResult.ruleScore)) ? Number(ruleResult.ruleScore) : 0.62
})}`
                    }
                ],
                temperature,
                max_tokens: maxTokens
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const content = String(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
        const parsed = parseJsonFromPossibleText(content);
        if (!parsed || typeof parsed !== 'object') return null;

        const safeReasonType = ['health', 'exam', 'travel', 'emotion', 'other'].includes(parsed.reason_type)
            ? parsed.reason_type
            : (ruleResult && ruleResult.reasonType ? ruleResult.reasonType : 'other');
        const normalizedContent = String(parsed.normalized_content || (ruleResult && ruleResult.normalizedText) || '').trim();
        const confidence = clampFloat(parsed.confidence, ruleResult && ruleResult.ruleScore ? ruleResult.ruleScore : 0.62, 0, 1);
        return {
            isState: !!parsed.is_state,
            reasonType: safeReasonType,
            isResolve: !!parsed.is_resolve,
            normalizedContent: normalizedContent || String(text || '').trim(),
            confidence,
            reason: String(parsed.reason || '').trim()
        };
    } catch (error) {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

window.resolveActiveStateMemory = function(contactId, reasonType, text) {
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) return null;
    const activeStates = getContactMemories(cid)
        .filter(memory => {
            const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
            if (!tags.includes('state')) return false;
            normalizeStateMetaForMemory(memory);
            return memory.stateMeta && memory.stateMeta.phase === 'active';
        });
    if (activeStates.length === 0) return null;

    const validReason = ['health', 'exam', 'travel', 'emotion', 'other'].includes(reasonType) ? reasonType : 'other';
    const sameReasonPool = activeStates.filter(memory => {
        return memory.stateMeta && memory.stateMeta.reasonType === validReason;
    });
    const pool = sameReasonPool.length > 0 ? sameReasonPool : activeStates;

    const compareText = String(text || '').trim();
    let best = null;
    let bestScore = -1;
    pool.forEach(memory => {
        const sim = compareText ? diceSimilarity(memory.content, compareText) : 0;
        const freshnessBoost = 1 - Math.min(1, Math.max(0, (Date.now() - (Number(memory.time) || Date.now())) / (14 * 24 * 60 * 60 * 1000)));
        const score = sim * 0.7 + freshnessBoost * 0.3;
        if (score > bestScore) {
            best = memory;
            bestScore = score;
        }
    });
    if (!best) return null;
    if (sameReasonPool.length === 0 && bestScore < 0.18) return null;

    best.stateMeta = best.stateMeta || makeStateMeta(validReason, best.time || Date.now(), null);
    best.stateMeta.reasonType = validReason;
    best.stateMeta.phase = 'resolved';
    best.stateMeta.resolvedAt = Date.now();
    best.time = Date.now();
    syncLegacyPerceptionAndState(cid);
    return best;
};

window.tryExtractStateMemoryFromMessage = async function(contactId, msg, isUser) {
    const cid = Number(contactId);
    if (!Number.isFinite(cid) || !msg || !isUser) return null;
    if (String(msg.type || '') !== 'text') return null;
    const text = String(msg.content || '').trim();
    if (!text || text.includes('ACTION:') || text.startsWith('[')) return null;

    const settings = ensureMemorySettingsV2();
    const stateExtract = settings.stateExtractV2 || {};
    if (stateExtract.enabled === false) return null;

    const msgId = msg.id ? String(msg.id) : '';
    if (msgId && processedStateExtractMessageIds.has(msgId)) return null;
    if (msgId) capProcessedStateMessageSet(msgId);

    const ruleResult = window.extractStateMemoryByRule(text);
    if (!ruleResult || !ruleResult.matched) return null;

    const aiResult = await window.classifyStateMemoryWithAI(text, ruleResult, cid);
    const detector = aiResult ? 'rule_plus_ai' : 'rule_only_fallback';
    const aiConfidence = aiResult && Number.isFinite(Number(aiResult.confidence))
        ? clampFloat(aiResult.confidence, null, 0, 1)
        : null;
    const reasonType = aiResult && aiResult.reasonType ? aiResult.reasonType : ruleResult.reasonType;
    const isResolve = aiResult ? !!aiResult.isResolve : !!ruleResult.isResolve;
    const isState = aiResult ? !!aiResult.isState : true;
    const normalizedContent = String(
        (aiResult && aiResult.normalizedContent)
            ? aiResult.normalizedContent
            : (ruleResult.normalizedText || text)
    ).trim();

    let finalConfidence = 0;
    if (aiConfidence === null) {
        const fallbackPenalty = (ruleResult.isResolve && ruleResult.reasonType && ruleResult.reasonType !== 'other')
            ? 0.02
            : 0.08;
        finalConfidence = clampFloat(ruleResult.ruleScore - fallbackPenalty, ruleResult.ruleScore, 0, 1);
    } else {
        finalConfidence = clampFloat(ruleResult.ruleScore * 0.45 + aiConfidence * 0.55, ruleResult.ruleScore, 0, 1);
    }

    const thresholds = stateExtract.thresholds || {};
    const acceptThreshold = clampFloat(thresholds.accept, 0.78, 0.3, 0.99);
    const borderlineThreshold = clampFloat(thresholds.borderline, 0.6, 0.3, 0.99);
    const resolveThreshold = clampFloat(thresholds.resolve, 0.72, 0.3, 0.99);
    const extractMode = settings.extractMode || 'hybrid';

    if (aiResult && !isState) return null;
    if (finalConfidence < borderlineThreshold) return null;

    if (isResolve) {
        if (extractMode === 'manual') {
            showNotification('手动模式：检测到状态结束，请手动更新', 2200);
            return null;
        }
        if (finalConfidence >= resolveThreshold) {
            const resolved = window.resolveActiveStateMemory(cid, reasonType, normalizedContent);
            if (resolved) {
                saveConfig();
                const memoryApp = document.getElementById('memory-app');
                if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
                showNotification('状态已自动更新为已结束', 1400, 'success');
                return { resolved: true, memory: resolved };
            }
        }
        return null;
    }

    if (extractMode === 'auto' && finalConfidence < acceptThreshold) {
        return null;
    }

    const now = Date.now();
    const reasonLabel = STATE_REASON_LABELS[reasonType] || '其他';
    const candidateReason = `自动状态识别（规则${aiResult ? '+AI' : ''}）：${reasonLabel}类，可信度${Math.round(finalConfidence * 100)}%`;
    const created = createMemoryCandidate(cid, {
        content: `用户当前状态：${normalizedContent}，识别时间：${formatDateTimeForMemory(now)}`,
        suggestedTags: ['state'],
        source: 'ai_action',
        confidence: finalConfidence,
        reason: candidateReason,
        stateMeta: makeStateMeta(reasonType, now, null),
        stateExtractMeta: {
            ruleScore: clampFloat(ruleResult.ruleScore, 0.62, 0, 1),
            aiConfidence,
            finalConfidence,
            matchedKeywords: Array.isArray(ruleResult.matchedKeywords) ? ruleResult.matchedKeywords.slice(0, 20) : [],
            detector
        }
    });

    if (!created && extractMode === 'manual') {
        showNotification('手动模式：检测到状态信息，请手动确认', 2200);
        return null;
    }
    if (created && created.status === 'pending') {
        showNotification('状态记忆待确认', 1500, 'success');
    } else if (created) {
        showNotification('状态记忆已记录', 1500, 'success');
    }
    return created;
};

function normalizeTextForSimilarity(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\s.,!?;:，。！？、；：“”"'`~!@#$%^&*()_+=\-[\]{}<>\\/|]+/g, '');
}

function buildBigrams(text) {
    const normalized = normalizeTextForSimilarity(text);
    if (normalized.length < 2) return [normalized];
    const arr = [];
    for (let i = 0; i < normalized.length - 1; i++) {
        arr.push(normalized.slice(i, i + 2));
    }
    return arr;
}

function diceSimilarity(textA, textB) {
    const a = buildBigrams(textA);
    const b = buildBigrams(textB);
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    const counts = new Map();
    a.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    let overlap = 0;
    b.forEach(item => {
        const n = counts.get(item) || 0;
        if (n > 0) {
            overlap++;
            counts.set(item, n - 1);
        }
    });
    return (2 * overlap) / (a.length + b.length);
}

function computeMemoryRelevance(content, contextText) {
    const c = normalizeTextForSimilarity(content);
    const h = normalizeTextForSimilarity(contextText);
    if (!c || !h) return 0;
    const bigrams = buildBigrams(c);
    if (!bigrams.length) return 0;
    let hit = 0;
    bigrams.forEach(bg => {
        if (!bg) return;
        if (h.includes(bg)) hit++;
    });
    return hit / bigrams.length;
}

function getContactMemories(contactId, includeAll = false) {
    ensureMemoryCollections();
    return window.iphoneSimState.memories.filter(memory => {
        if (!memory || memory.contactId !== contactId) return false;
        if (includeAll) return true;
        return (memory.reviewStatus || 'approved') === 'approved';
    });
}

function getPendingCandidates(contactId) {
    ensureMemoryCollections();
    return window.iphoneSimState.memoryCandidates.filter(candidate =>
        candidate && candidate.contactId === contactId && candidate.status === 'pending'
    );
}

function syncLegacyPerceptionAndState(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    const memories = getContactMemories(contactId).slice().sort((a, b) => (b.time || 0) - (a.time || 0));
    const importantStates = [];
    const userPerception = [];
    memories.forEach(memory => {
        const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
        if (tags.includes('state')) {
            normalizeStateMetaForMemory(memory);
            if (memory.stateMeta && memory.stateMeta.phase === 'active' && !importantStates.includes(memory.content)) {
                importantStates.push(memory.content);
            }
        }
        if (tags.includes('fact') && !userPerception.includes(memory.content)) {
            userPerception.push(memory.content);
        }
    });
    contact.importantStates = importantStates.slice(0, 5);
    contact.userPerception = userPerception.slice(0, 40);
}

function createOrMergeApprovedMemory(payload) {
    ensureMemoryCollections();
    const settings = ensureMemorySettingsV2();
    const contactId = payload && payload.contactId;
    const content = String((payload && payload.content) || '').trim();
    if (!contactId || !content) return { created: false, memory: null };

    const tags = normalizeMemoryTags(payload.memoryTags, content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
    const source = payload.source || 'manual';
    const confidence = clampFloat(payload.confidence, 0.8, 0, 1);
    const dedupeThreshold = clampFloat(settings.dedupeThreshold, 0.75, 0.3, 0.99);
    const now = Date.now();
    const inferredNames = tags.includes('fact') ? extractNamesFromFactContent(content) : [];
    const inferredSceneText = tags.includes('fact') ? extractSceneTextFromFactContent(content) : '';
    const factMetaPayload = normalizeFactMeta(payload.factMeta, 'user_explicit_text')
        || (inferredNames.length > 0
            ? normalizeFactMeta({
                sourceType: 'user_explicit_text',
                exactNames: inferredNames,
                sceneText: inferredSceneText || inferFactSceneBySource('user_explicit_text', 'user')
            }, 'user_explicit_text')
            : null);
    const refinedMetaPayload = normalizeRefinedMeta(payload.refinedMeta);
    const factKeyPayload = tags.includes('fact') && factMetaPayload ? buildExactNamesKey(factMetaPayload.exactNames) : '';

    let duplicate = null;
    let bestScore = 0;
    const approvedMemories = getContactMemories(contactId);

    if (factKeyPayload) {
        const exactHit = approvedMemories.find(memory => {
            const existingTags = normalizeMemoryTags(memory.memoryTags, 'long_term');
            if (!existingTags.includes('fact')) return false;
            return buildExactNamesKey(getMemoryExactNames(memory)) === factKeyPayload;
        });
        if (exactHit) {
            duplicate = exactHit;
            bestScore = 1;
        }
    }

    approvedMemories.forEach(memory => {
        if (duplicate && memory.id === duplicate.id) return;
        const existingTags = normalizeMemoryTags(memory.memoryTags, 'long_term');
        const hasOverlap = tags.some(tag => existingTags.includes(tag));
        if (!hasOverlap) return;
        const score = diceSimilarity(memory.content, content);
        if (score >= dedupeThreshold && score > bestScore) {
            bestScore = score;
            duplicate = memory;
        }
    });

    if (duplicate) {
        duplicate.content = content.length >= String(duplicate.content || '').length ? content : duplicate.content;
        duplicate.time = Math.max(Number(duplicate.time) || 0, Number(payload.time) || now);
        duplicate.title = payload.title || duplicate.title;
        duplicate.range = payload.range || duplicate.range;
        duplicate.type = payload.type || duplicate.type;
        duplicate.source = source || duplicate.source;
        duplicate.confidence = Math.max(clampFloat(duplicate.confidence, 0.6, 0, 1), confidence);
        duplicate.reviewStatus = 'approved';
        duplicate.memoryTags = Array.from(new Set([...normalizeMemoryTags(duplicate.memoryTags, 'long_term'), ...tags]));
        if (payload.refinedFrom && Array.isArray(payload.refinedFrom)) {
            const oldRefs = Array.isArray(duplicate.refinedFrom) ? duplicate.refinedFrom : [];
            duplicate.refinedFrom = Array.from(new Set([...oldRefs, ...payload.refinedFrom]));
        }
        if (duplicate.memoryTags.includes('state')) {
            if (payload.stateMeta && typeof payload.stateMeta === 'object') {
                duplicate.stateMeta = Object.assign({}, payload.stateMeta);
            }
            normalizeStateMetaForMemory(duplicate);
        } else {
            delete duplicate.stateMeta;
        }
        const mergedFactMeta = mergeFactMeta(duplicate.factMeta, factMetaPayload, 'user_explicit_text');
        if (mergedFactMeta) {
            duplicate.factMeta = mergedFactMeta;
        } else if (!duplicate.memoryTags.includes('fact')) {
            delete duplicate.factMeta;
        }
        const mergedRefinedMeta = mergeRefinedMeta(duplicate.refinedMeta, refinedMetaPayload);
        if (mergedRefinedMeta) {
            duplicate.refinedMeta = mergedRefinedMeta;
        } else if (!duplicate.memoryTags.includes('refined')) {
            delete duplicate.refinedMeta;
        }
        syncLegacyPerceptionAndState(contactId);
        return { created: false, memory: duplicate };
    }

    const memory = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        contactId: contactId,
        content: content,
        time: Number(payload.time) || now,
        title: payload.title || '',
        range: payload.range || '',
        type: payload.type || '',
        memoryTags: tags,
        source: source,
        confidence: confidence,
        reviewStatus: 'approved'
    };
    if (payload.refinedFrom && Array.isArray(payload.refinedFrom)) {
        memory.refinedFrom = payload.refinedFrom.slice(0);
    }
    if (factMetaPayload && memory.memoryTags.includes('fact')) {
        memory.factMeta = factMetaPayload;
    }
    if (refinedMetaPayload && memory.memoryTags.includes('refined')) {
        memory.refinedMeta = refinedMetaPayload;
    }
    if (memory.memoryTags.includes('state')) {
        memory.stateMeta = payload.stateMeta && typeof payload.stateMeta === 'object'
            ? Object.assign({}, payload.stateMeta)
            : makeStateMeta(inferStateReasonType(content), memory.time, null);
        normalizeStateMetaForMemory(memory);
    }
    window.iphoneSimState.memories.push(memory);
    syncLegacyPerceptionAndState(contactId);
    return { created: true, memory: memory };
}

function createMemoryCandidate(contactId, payload = {}) {
    ensureMemoryCollections();
    const settings = ensureMemorySettingsV2();
    if (!contactId) return null;
    const content = String(payload.content || '').trim();
    if (!content) return null;

    const tags = normalizeMemoryTags(payload.suggestedTags || payload.memoryTags, 'long_term');
    const source = ['auto_summary', 'call_summary', 'ai_action'].includes(payload.source) ? payload.source : 'auto_summary';
    const confidence = clampFloat(payload.confidence, 0.75, 0, 1);
    const extractMode = settings.extractMode || 'hybrid';
    const now = Date.now();
    const inferredNames = tags.includes('fact') ? extractNamesFromFactContent(content) : [];
    const inferredSceneText = tags.includes('fact') ? extractSceneTextFromFactContent(content) : '';
    const factMetaPayload = normalizeFactMeta(payload.factMeta, 'user_explicit_text')
        || (inferredNames.length > 0
            ? normalizeFactMeta({
                sourceType: 'user_explicit_text',
                exactNames: inferredNames,
                sceneText: inferredSceneText || inferFactSceneBySource('user_explicit_text', 'user')
            }, 'user_explicit_text')
            : null);
    const stateExtractMetaPayload = normalizeStateExtractMeta(payload.stateExtractMeta);
    const factKeyPayload = tags.includes('fact') && factMetaPayload ? buildExactNamesKey(factMetaPayload.exactNames) : '';

    if (extractMode === 'manual') {
        return null;
    }

    const dedupeThreshold = clampFloat(settings.dedupeThreshold, 0.75, 0.3, 0.99);
    const pending = getPendingCandidates(contactId);
    if (factKeyPayload) {
        const exactPending = pending.find(existing => {
            const candidateTags = normalizeMemoryTags(existing.suggestedTags, 'long_term');
            if (!candidateTags.includes('fact')) return false;
            return buildExactNamesKey(getMemoryExactNames(existing)) === factKeyPayload;
        });
        if (exactPending) {
            exactPending.content = content.length > String(exactPending.content || '').length ? content : exactPending.content;
            exactPending.suggestedTags = Array.from(new Set([...normalizeMemoryTags(exactPending.suggestedTags, 'long_term'), ...tags]));
            exactPending.confidence = Math.max(clampFloat(exactPending.confidence, 0.6, 0, 1), confidence);
            exactPending.reason = payload.reason || exactPending.reason;
            exactPending.range = payload.range || exactPending.range;
            exactPending.createdAt = now;
            exactPending.factMeta = mergeFactMeta(exactPending.factMeta, factMetaPayload, 'user_explicit_text');
            if (payload.stateMeta && typeof payload.stateMeta === 'object') {
                exactPending.stateMeta = Object.assign({}, payload.stateMeta);
            } else if (exactPending.suggestedTags.includes('state') && !exactPending.stateMeta) {
                exactPending.stateMeta = makeStateMeta(inferStateReasonType(exactPending.content), now, null);
            }
            exactPending.stateExtractMeta = mergeStateExtractMeta(exactPending.stateExtractMeta, stateExtractMetaPayload);
            saveConfig();
            const memoryApp = document.getElementById('memory-app');
            if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
            return exactPending;
        }
    }
    for (const existing of pending) {
        const score = diceSimilarity(existing.content, content);
        if (score >= dedupeThreshold) {
            existing.content = content.length > String(existing.content || '').length ? content : existing.content;
            existing.suggestedTags = Array.from(new Set([...normalizeMemoryTags(existing.suggestedTags, 'long_term'), ...tags]));
            existing.confidence = Math.max(clampFloat(existing.confidence, 0.6, 0, 1), confidence);
            existing.reason = payload.reason || existing.reason;
            existing.range = payload.range || existing.range;
            existing.createdAt = now;
            existing.factMeta = mergeFactMeta(existing.factMeta, factMetaPayload, 'user_explicit_text');
            if (payload.stateMeta && typeof payload.stateMeta === 'object') {
                existing.stateMeta = Object.assign({}, payload.stateMeta);
            } else if (existing.suggestedTags.includes('state') && !existing.stateMeta) {
                existing.stateMeta = makeStateMeta(inferStateReasonType(existing.content), now, null);
            }
            existing.stateExtractMeta = mergeStateExtractMeta(existing.stateExtractMeta, stateExtractMetaPayload);
            saveConfig();
            const memoryApp = document.getElementById('memory-app');
            if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
            return existing;
        }
    }

    if (extractMode === 'auto') {
        const created = createOrMergeApprovedMemory({
            contactId: contactId,
            content: content,
            memoryTags: tags,
            source: source,
            confidence: confidence,
            range: payload.range || '',
            stateMeta: payload.stateMeta || (tags.includes('state') ? makeStateMeta(inferStateReasonType(content), now, null) : null),
            factMeta: factMetaPayload
        });
        saveConfig();
        const memoryApp = document.getElementById('memory-app');
        if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
        return created.memory;
    }

    const candidate = {
        id: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        contactId: contactId,
        content: content,
        title: payload.title || '',
        suggestedTags: tags,
        source: source,
        confidence: confidence,
        createdAt: now,
        range: payload.range || '',
        reason: payload.reason || '',
        stateMeta: payload.stateMeta && typeof payload.stateMeta === 'object'
            ? Object.assign({}, payload.stateMeta)
            : (tags.includes('state') ? makeStateMeta(inferStateReasonType(content), now, null) : null),
        factMeta: factMetaPayload,
        stateExtractMeta: stateExtractMetaPayload,
        status: 'pending'
    };
    window.iphoneSimState.memoryCandidates.push(candidate);
    saveConfig();
    const memoryApp = document.getElementById('memory-app');
    if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
    return candidate;
}

function approveMemoryCandidate(candidateId, overrides = {}) {
    ensureMemoryCollections();
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return null;
    const memory = createOrMergeApprovedMemory({
        contactId: candidate.contactId,
        content: overrides.content || candidate.content,
        title: overrides.title || candidate.title || '',
        memoryTags: overrides.memoryTags || candidate.suggestedTags,
        source: candidate.source || 'auto_summary',
        confidence: clampFloat(overrides.confidence, candidate.confidence, 0, 1),
        range: overrides.range || candidate.range || '',
        stateMeta: overrides.stateMeta || candidate.stateMeta || null,
        factMeta: overrides.factMeta || candidate.factMeta || null
    });
    candidate.status = 'approved';
    saveConfig();
    renderMemoryList();
    return memory.memory;
}

function rejectMemoryCandidate(candidateId) {
    ensureMemoryCollections();
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return;
    candidate.status = 'rejected';
    saveConfig();
    renderMemoryList();
}

window.getMemorySettingsV2 = ensureMemorySettingsV2;
window.createMemoryCandidate = createMemoryCandidate;
window.createOrMergeApprovedMemory = createOrMergeApprovedMemory;
window.approveMemoryCandidate = approveMemoryCandidate;
window.rejectMemoryCandidate = rejectMemoryCandidate;
window.syncLegacyPerceptionAndState = syncLegacyPerceptionAndState;

function buildLegacyMemoryContext(contact, history) {
    const memories = getContactMemories(contact.id).sort((a, b) => (b.time || 0) - (a.time || 0));
    if (memories.length === 0) return '';
    const limit = contact.memorySendLimit && contact.memorySendLimit > 0 ? contact.memorySendLimit : 5;
    const contextText = history.slice(-20).map(item => String(item.content || '')).join(' ').toLowerCase();
    const recentCount = Math.min(3, limit);
    const recent = memories.slice(0, recentCount);
    const remaining = memories.slice(recentCount);
    const relevant = remaining
        .map(memory => ({ memory, score: computeMemoryRelevance(memory.content, contextText) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(0, limit - recentCount))
        .map(item => item.memory);
    const finalList = [...recent, ...relevant].sort((a, b) => (a.time || 0) - (b.time || 0));
    if (finalList.length === 0) return '';
    let output = '\n【历史记忆 (已知事实)】\n⚠️ 注意：以下内容是你们过去的共同经历或已知事实，请勿重复向用户复述，除非用户主动询问或需要回忆。\n';
    finalList.forEach(memory => {
        const date = new Date(memory.time || Date.now());
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        output += `- [${dateStr}] ${memory.content}\n`;
    });
    return output;
}

function buildMemoryContextByPolicy(contact, history) {
    if (!contact || !contact.id) return '';
    const settings = ensureMemorySettingsV2();
    const all = getContactMemories(contact.id).map(memory => {
        const clone = memory;
        clone.memoryTags = normalizeMemoryTags(clone.memoryTags, clone.content && clone.content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
        if (clone.memoryTags.includes('state')) normalizeStateMetaForMemory(clone);
        return clone;
    });
    if (all.length === 0) return '';

    const historyText = history.slice(-20).map(item => String(item.content || '')).join(' ');
    const now = Date.now();
    const quotaBase = Object.assign({}, settings.injectQuota, contact.memoryInjectQuota || {});
    let maxTotal = clampInt(quotaBase.maxTotal, 7, 1, 100);
    if (contact.memorySendLimit && contact.memorySendLimit > 0) {
        maxTotal = Math.min(maxTotal, clampInt(contact.memorySendLimit, maxTotal, 1, 100));
    }

    const withScore = all.map(memory => {
        const relevance = computeMemoryRelevance(memory.content, historyText);
        const freshness = 1 - Math.min(1, Math.max(0, (now - (Number(memory.time) || now)) / (30 * 24 * 60 * 60 * 1000)));
        const confidence = clampFloat(memory.confidence, 0.7, 0, 1);
        const score = 0.55 * relevance + 0.25 * freshness + 0.20 * confidence;
        return { memory, relevance, freshness, confidence, score };
    });

    const stateList = withScore
        .filter(item => item.memory.memoryTags.includes('state'))
        .filter(item => !item.memory.stateMeta || item.memory.stateMeta.phase === 'active')
        .sort((a, b) => b.score - a.score)
        .slice(0, clampInt(quotaBase.state, 2, 0, 50));
    const shortList = withScore
        .filter(item => item.memory.memoryTags.includes('short_term'))
        .sort((a, b) => (b.freshness + b.relevance) - (a.freshness + a.relevance))
        .slice(0, clampInt(quotaBase.short_term, 2, 0, 50));
    const longList = withScore
        .filter(item => item.memory.memoryTags.includes('long_term'))
        .sort((a, b) => b.score - a.score)
        .slice(0, clampInt(quotaBase.long_term, 2, 0, 50));
    const factList = withScore
        .filter(item => item.memory.memoryTags.includes('fact'))
        .sort((a, b) => (b.relevance + b.confidence) - (a.relevance + a.confidence))
        .slice(0, clampInt(quotaBase.fact, 2, 0, 50));
    const refinedList = withScore
        .filter(item => item.memory.memoryTags.includes('refined'))
        .sort((a, b) => (b.memory.time || 0) - (a.memory.time || 0))
        .slice(0, clampInt(quotaBase.refined, 1, 0, 50));

    let selected = [
        ...stateList.map(item => ({ bucket: 'state', item })),
        ...shortList.map(item => ({ bucket: 'short_term', item })),
        ...longList.map(item => ({ bucket: 'long_term', item })),
        ...factList.map(item => ({ bucket: 'fact', item })),
        ...refinedList.map(item => ({ bucket: 'refined', item }))
    ];
    if (selected.length === 0) return buildLegacyMemoryContext(contact, history);

    if (selected.length > maxTotal) {
        selected = selected.sort((a, b) => b.item.score - a.item.score).slice(0, maxTotal);
    }

    const sections = { state: [], short_term: [], long_term: [], fact: [], refined: [] };
    selected.forEach(entry => sections[entry.bucket].push(entry.item.memory));

    const buildSection = (title, list) => {
        if (!list || list.length === 0) return '';
        let text = `\n【${title}】\n`;
        if (title === '具体信息') {
            const mergedNames = [];
            list.forEach(memory => {
                getMemoryExactNames(memory).forEach(name => mergedNames.push(name));
            });
            const exactNames = normalizeExactNames(mergedNames);
            if (exactNames.length > 0) {
                text += `- 关键名称：${exactNames.join(' / ')}\n`;
                text += '- 规则：涉及这些名称时必须逐字一致，不得改写或混淆。\n';
            }
        }
        list.sort((a, b) => (a.time || 0) - (b.time || 0)).forEach(memory => {
            const date = new Date(memory.time || Date.now());
            const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            const lineContent = title === '具体信息'
                ? buildFactMemoryReadableContent(memory)
                : String(memory.content || '');
            text += `- [${dateStr}] ${lineContent}\n`;
        });
        return text;
    };

    let output = '';
    output += buildSection('状态记忆', sections.state);
    output += buildSection('短期记忆', sections.short_term);
    output += buildSection('长期记忆', sections.long_term);
    output += buildSection('具体信息', sections.fact);
    output += buildSection('精炼记忆', sections.refined);
    if (!output.trim()) {
        return buildLegacyMemoryContext(contact, history);
    }
    return output;
}

window.buildMemoryContextByPolicy = buildMemoryContextByPolicy;

function pruneSelectedMemoryIds(contactId) {
    const idSet = new Set(
        getContactMemories(contactId)
            .filter(memory => memory && Number.isFinite(Number(memory.id)))
            .map(memory => Number(memory.id))
    );
    selectedMemoryIds = new Set(
        Array.from(selectedMemoryIds).filter(id => idSet.has(Number(id)))
    );
}

function getSortedMemoriesForCurrentFilter(memories) {
    const filterTag = MEMORY_FILTER_TO_TAG[currentMemoryFilter] || null;
    const filtered = filterTag
        ? memories.filter(memory => normalizeMemoryTags(memory.memoryTags, 'long_term').includes(filterTag))
        : memories;
    return filtered.sort((a, b) => (b.time || 0) - (a.time || 0));
}

function getSelectableMemoryIdsForCurrentFilter(contactId, limitCount = null) {
    if (!contactId || currentMemoryFilter === 'candidate') return [];
    const sorted = getSortedMemoriesForCurrentFilter(getContactMemories(contactId).slice());
    const limited = Number.isFinite(Number(limitCount)) && Number(limitCount) > 0
        ? sorted.slice(0, Number(limitCount))
        : sorted;
    return limited
        .map(memory => Number(memory.id))
        .filter(id => Number.isFinite(id));
}

function updateMemoryRefineToolbar() {
    const selectToggleBtn = document.getElementById('memory-select-toggle-btn');
    const selectAllBtn = document.getElementById('memory-select-all-btn');
    const selectRecentBtn = document.getElementById('memory-select-recent-btn');
    const selectInvertBtn = document.getElementById('memory-select-invert-btn');
    const selectClearBtn = document.getElementById('memory-select-clear-btn');
    const selectedSummary = document.getElementById('memory-refine-summary');
    const refineBtn = document.getElementById('memory-refine-selected-btn');
    const contactId = window.iphoneSimState.currentChatContactId;
    const currentFilter = currentMemoryFilter;
    const canSelect = !!contactId && currentFilter !== 'candidate';
    const selectedCount = selectedMemoryIds.size;
    const selectableCount = canSelect ? getSelectableMemoryIdsForCurrentFilter(contactId).length : 0;

    if (selectToggleBtn) {
        selectToggleBtn.textContent = memorySelectMode ? '退出多选' : '开启多选';
        selectToggleBtn.disabled = !canSelect;
    }
    if (selectAllBtn) selectAllBtn.disabled = !canSelect || selectableCount === 0;
    if (selectRecentBtn) selectRecentBtn.disabled = !canSelect || selectableCount === 0;
    if (selectInvertBtn) selectInvertBtn.disabled = !canSelect || selectableCount === 0;
    if (selectClearBtn) selectClearBtn.disabled = !memorySelectMode || selectedCount === 0;
    if (selectedSummary) {
        selectedSummary.textContent = memorySelectMode
            ? `已选 ${selectedCount}/${selectableCount} 条记忆，可一键精炼归档`
            : '已关闭多选，可开启后批量精炼归档';
    }
    if (refineBtn) {
        refineBtn.disabled = !memorySelectMode || selectedCount === 0 || !canSelect;
    }
}

function resetMemorySelection() {
    selectedMemoryIds = new Set();
    memorySelectMode = false;
    updateMemoryRefineToolbar();
}

window.toggleMemorySelectMode = function(forceMode) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = typeof forceMode === 'boolean' ? forceMode : !memorySelectMode;
    if (!memorySelectMode) {
        selectedMemoryIds = new Set();
    } else {
        pruneSelectedMemoryIds(contactId);
    }
    renderMemoryList();
};

window.toggleMemorySelection = function(id, checked) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    if (checked) {
        selectedMemoryIds.add(numericId);
    } else {
        selectedMemoryIds.delete(numericId);
    }
    updateMemoryRefineToolbar();
};

window.selectAllMemoriesForRefine = function() {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = true;
    selectedMemoryIds = new Set(getSelectableMemoryIdsForCurrentFilter(contactId));
    renderMemoryList();
};

window.selectRecentMemoriesForRefine = function(count = 10) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    const safeCount = clampInt(count, 10, 1, 100);
    memorySelectMode = true;
    selectedMemoryIds = new Set(getSelectableMemoryIdsForCurrentFilter(contactId, safeCount));
    renderMemoryList();
};

window.invertMemorySelectionForRefine = function() {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = true;
    const visibleIds = getSelectableMemoryIdsForCurrentFilter(contactId);
    const next = new Set();
    visibleIds.forEach(id => {
        if (!selectedMemoryIds.has(id)) next.add(id);
    });
    selectedMemoryIds = next;
    renderMemoryList();
};

window.clearMemorySelectionForRefine = function() {
    selectedMemoryIds = new Set();
    updateMemoryRefineToolbar();
    renderMemoryList();
};

window.extractSpecificNamesFromStructuredMessage = function(type, content, msgId) {
    const safeType = String(type || '').trim();
    if (!['shopping_gift', 'delivery_share', 'gift_card'].includes(safeType)) return [];

    let payload = content;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (error) {
            payload = null;
        }
    }
    if (!payload || typeof payload !== 'object') return [];

    const names = [];
    if ((safeType === 'shopping_gift' || safeType === 'delivery_share') && Array.isArray(payload.items)) {
        payload.items.forEach(item => {
            const title = item && typeof item === 'object' ? String(item.title || '').trim() : '';
            if (title) names.push(title);
        });
    }
    if (safeType === 'gift_card') {
        const title = String(payload.title || '').trim();
        if (title) names.push(title);
    }
    return normalizeExactNames(names);
};

window.extractSpecificNamesFromUserText = function(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    const names = [];

    const quoteRegex = /[“"「『]([^“”"「」『』]{1,40})[”"」』]/g;
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(raw)) !== null) {
        const cleaned = cleanupExtractedName(quoteMatch[1]);
        if (cleaned) names.push(cleaned);
    }

    const actionRegex = /(?:给你(?:点了|买了|送了|下单了)|我(?:刚|刚刚|今天|已经|又)?(?:给你)?(?:点了|买了|送了|下单了)|(?:点了|买了|送了|下单了|给你点了))\s*([^，。！？!\?\n]{1,40})/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(raw)) !== null) {
        splitNamesByJoiners(actionMatch[1]).forEach(part => {
            const cleaned = cleanupExtractedName(part);
            if (cleaned) names.push(cleaned);
        });
    }

    return normalizeExactNames(names);
};

window.createFactMemoryCandidateFromNames = function(contactId, names, sourceType = 'user_explicit_text', extraMeta = {}) {
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) return null;
    const exactNames = normalizeExactNames(Array.isArray(names) ? names : []);
    if (exactNames.length === 0) return null;

    const safeSourceType = FACT_SOURCE_TYPES.includes(sourceType) ? sourceType : 'user_explicit_text';
    const safeActor = extraMeta.actor === 'contact' ? 'contact' : 'user';
    const sceneText = buildFactSceneText(safeSourceType, Object.assign({}, extraMeta, { actor: safeActor }));
    const content = buildFactMemoryContent(exactNames, safeSourceType, Object.assign({}, extraMeta, { actor: safeActor, sceneText }));
    const reason = extraMeta.reason || `${sceneText || '检测到具体场景'}，提取名称：${exactNames.join(' / ')}`;
    const sourceRange = extraMeta.sourceRange !== undefined && extraMeta.sourceRange !== null
        ? String(extraMeta.sourceRange)
        : '';
    const sourceMsgId = extraMeta.sourceMsgId !== undefined && extraMeta.sourceMsgId !== null
        ? String(extraMeta.sourceMsgId)
        : '';
    const confidence = clampFloat(extraMeta.confidence, 0.9, 0, 1);

    const result = createMemoryCandidate(cid, {
        content,
        suggestedTags: ['fact'],
        source: 'ai_action',
        confidence,
        reason,
        range: sourceRange,
        factMeta: {
            sourceType: safeSourceType,
            exactNames,
            sourceMsgId,
            sourceRange,
            sceneText
        }
    });

    if (!result && ensureMemorySettingsV2().extractMode === 'manual' && extraMeta.notifyOnManual) {
        showNotification('手动模式：检测到具体名称，请手动添加', 2200);
    }
    return result;
};

async function callRefineMemoryBatchModel(contact, selectedMemories) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings || !settings.url || !settings.key) return null;

    const records = selectedMemories.map(memory => {
        const date = new Date(memory.time || Date.now());
        const timeText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return `#${memory.id} [${timeText}] ${memory.content}`;
    }).join('\n');

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }

    const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.key}`
        },
        body: JSON.stringify({
            model: settings.model,
            messages: [
                {
                    role: 'system',
                    content: `你是记忆精炼助手。输入是同一联系人的多条记忆，请输出严格 JSON：
{
  "refined_summary": "1-2句总览",
  "key_facts": [{"name":"关键名称","reason":"提取原因"}]
}
要求：
1) 只输出 JSON，不要 Markdown。
2) key_facts.name 只保留原文中的具体名称，不要改写、不要近义替换。
3) 如果没有可提取名称，key_facts 返回空数组。`
                },
                {
                    role: 'user',
                    content: `联系人：${contact && contact.name ? contact.name : '未知联系人'}\n记忆列表：\n${records}`
                }
            ],
            temperature: 0.2
        })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = String(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    if (!content) return null;

    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch (error2) {
            return null;
        }
    }
}

window.refineSelectedMemories = async function(contactId, selectedIds) {
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) return null;
    const uniqueIds = Array.from(new Set((Array.isArray(selectedIds) ? selectedIds : []).map(id => Number(id)).filter(id => Number.isFinite(id))));
    if (uniqueIds.length === 0) {
        showNotification('请先选择要精炼的记忆', 1800);
        return null;
    }

    const selectedMemories = getContactMemories(cid)
        .filter(memory => uniqueIds.includes(Number(memory.id)))
        .sort((a, b) => (a.time || 0) - (b.time || 0));
    if (selectedMemories.length === 0) {
        showNotification('没有可精炼的记忆', 1800);
        return null;
    }

    const contact = window.iphoneSimState.contacts.find(item => item.id === cid);
    showNotification('正在精炼归档...', 1500);

    let result = null;
    try {
        result = await callRefineMemoryBatchModel(contact, selectedMemories);
    } catch (error) {
        console.warn('refineSelectedMemories model call failed', error);
    }

    let refinedSummary = '';
    if (result && typeof result.refined_summary === 'string') {
        refinedSummary = result.refined_summary.trim();
    }
    if (!refinedSummary) {
        refinedSummary = selectedMemories.map(memory => String(memory.content || '').trim()).filter(Boolean).slice(0, 2).join('；');
        if (refinedSummary.length > 140) refinedSummary = `${refinedSummary.slice(0, 140)}...`;
    }
    if (!refinedSummary) {
        showNotification('精炼失败，请稍后重试', 1800);
        return null;
    }

    const rawKeyFacts = Array.isArray(result && result.key_facts) ? result.key_facts : [];
    const extractedNames = normalizeExactNames(
        rawKeyFacts
            .map(item => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') return item.name;
                return '';
            })
            .filter(Boolean)
    );
    const fallbackNameBuffer = [];
    selectedMemories.forEach(memory => {
        getMemoryExactNames(memory).forEach(name => fallbackNameBuffer.push(name));
    });
    const fallbackNames = normalizeExactNames(fallbackNameBuffer);
    const finalNames = extractedNames.length > 0 ? extractedNames : fallbackNames;

    createOrMergeApprovedMemory({
        contactId: cid,
        content: refinedSummary,
        memoryTags: ['refined'],
        source: 'refine',
        confidence: 0.9,
        refinedFrom: uniqueIds,
        refinedMeta: {
            selectedMemoryIds: uniqueIds,
            keyFactsCount: finalNames.length
        }
    });

    finalNames.forEach(name => {
        const factSceneText = buildFactSceneText('refine_extract', {
            actor: 'user',
            sceneText: '从用户选择的历史记忆中提炼出的关键事实'
        });
        createOrMergeApprovedMemory({
            contactId: cid,
            content: buildFactMemoryContent([name], 'refine_extract', {
                actor: 'user',
                sceneText: factSceneText
            }),
            memoryTags: ['fact'],
            source: 'refine',
            confidence: 0.88,
            factMeta: {
                sourceType: 'refine_extract',
                exactNames: [name],
                sourceRange: uniqueIds.join('-'),
                sceneText: factSceneText
            }
        });
    });

    syncLegacyPerceptionAndState(cid);
    saveConfig();
    resetMemorySelection();
    renderMemoryList();
    showNotification(`精炼归档完成：总览 1 条，关键名称 ${finalNames.length} 条`, 2200, 'success');
    return {
        refinedSummary,
        keyFacts: finalNames
    };
};

function openMemoryApp() {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    ensureMemoryCollections();
    ensureMemorySettingsV2();
    syncLegacyPerceptionAndState(contact.id);
    resetMemorySelection();
    pruneSelectedMemoryIds(contact.id);

    const memoryApp = document.getElementById('memory-app');
    
    renderMemoryList();
    memoryApp.classList.remove('hidden');
}

function handleSaveManualMemory() {
    const content = document.getElementById('manual-memory-content').value.trim();
    if (!content) {
        alert('请输入记忆内容');
        return;
    }

    if (!window.iphoneSimState.currentChatContactId) return;

    const checkedTags = Array.from(document.querySelectorAll('#manual-memory-tags input[type="checkbox"]:checked'))
        .map(input => input.value);
    const tags = normalizeMemoryTags(checkedTags, 'long_term');
    let stateMeta = null;
    if (tags.includes('state')) {
        const reason = document.getElementById('manual-memory-state-reason')
            ? document.getElementById('manual-memory-state-reason').value
            : 'other';
        const ttlDays = document.getElementById('manual-memory-state-ttl')
            ? clampInt(document.getElementById('manual-memory-state-ttl').value, 7, 1, 365)
            : 7;
        const start = Date.now();
        stateMeta = makeStateMeta(reason, start, start + ttlDays * 24 * 60 * 60 * 1000);
    }
    let factMeta = null;
    if (tags.includes('fact') && typeof window.extractSpecificNamesFromUserText === 'function') {
        const names = window.extractSpecificNamesFromUserText(content);
        if (Array.isArray(names) && names.length > 0) {
            const sceneText = buildFactSceneText('user_explicit_text', {
                actor: 'user',
                sourceText: content
            });
            factMeta = {
                sourceType: 'user_explicit_text',
                exactNames: normalizeExactNames(names),
                sceneText
            };
        }
    }

    createOrMergeApprovedMemory({
        contactId: window.iphoneSimState.currentChatContactId,
        content: content,
        time: Date.now(),
        memoryTags: tags,
        source: 'manual',
        confidence: 1,
        stateMeta: stateMeta,
        factMeta: factMeta
    });
    saveConfig();
    renderMemoryList();
    document.getElementById('add-memory-modal').classList.add('hidden');
}

function openManualSummary() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    document.getElementById('total-chat-count').textContent = history.length;
    document.getElementById('summary-start-index').value = '';
    document.getElementById('summary-end-index').value = '';
    
    document.getElementById('manual-summary-modal').classList.remove('hidden');
}

async function handleManualSummary() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const start = parseInt(document.getElementById('summary-start-index').value);
    const end = parseInt(document.getElementById('summary-end-index').value);
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
    if (isNaN(start) || isNaN(end) || start < 1 || end > history.length || start > end) {
        alert('请输入有效的楼层范围');
        return;
    }

    const messagesToSummarize = history.slice(start - 1, end);
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    const range = `${start}-${end}`;
    
    document.getElementById('manual-summary-modal').classList.add('hidden');
    showNotification('正在生成详细总结...');
    
    await generateSummary(contact, messagesToSummarize, range, {
        autoExtract: false,
        source: 'manual',
        suggestedTags: ['long_term'],
        reason: '手动详细总结'
    });
}

function openMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    document.getElementById('modal-memory-send-limit').value = contact.memorySendLimit || '';
    const settings = ensureMemorySettingsV2();
    const extractModeEl = document.getElementById('modal-memory-extract-mode');
    if (extractModeEl) extractModeEl.value = settings.extractMode || 'hybrid';
    const map = [
        ['short_term', 'modal-memory-quota-short-term'],
        ['long_term', 'modal-memory-quota-long-term'],
        ['state', 'modal-memory-quota-state'],
        ['fact', 'modal-memory-quota-fact'],
        ['refined', 'modal-memory-quota-refined'],
        ['maxTotal', 'modal-memory-quota-max-total']
    ];
    map.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = settings.injectQuota[key] || '';
    });
    const ttlMap = [
        ['health', 'modal-memory-ttl-health'],
        ['exam', 'modal-memory-ttl-exam'],
        ['travel', 'modal-memory-ttl-travel'],
        ['emotion', 'modal-memory-ttl-emotion'],
        ['other', 'modal-memory-ttl-other']
    ];
    ttlMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = settings.stateTtlDays[key] || '';
    });
    const dedupeEl = document.getElementById('modal-memory-dedupe-threshold');
    if (dedupeEl) dedupeEl.value = settings.dedupeThreshold;
    document.getElementById('memory-settings-modal').classList.remove('hidden');
}

function handleSaveMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    const limit = parseInt(document.getElementById('modal-memory-send-limit').value);
    contact.memorySendLimit = isNaN(limit) ? 0 : limit;

    const settings = ensureMemorySettingsV2();
    const extractModeEl = document.getElementById('modal-memory-extract-mode');
    if (extractModeEl && ['hybrid', 'auto', 'manual'].includes(extractModeEl.value)) {
        settings.extractMode = extractModeEl.value;
    }
    const quotaMap = [
        ['short_term', 'modal-memory-quota-short-term'],
        ['long_term', 'modal-memory-quota-long-term'],
        ['state', 'modal-memory-quota-state'],
        ['fact', 'modal-memory-quota-fact'],
        ['refined', 'modal-memory-quota-refined'],
        ['maxTotal', 'modal-memory-quota-max-total']
    ];
    quotaMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        settings.injectQuota[key] = clampInt(el.value, settings.injectQuota[key], key === 'maxTotal' ? 1 : 0, 100);
    });
    const ttlMap = [
        ['health', 'modal-memory-ttl-health'],
        ['exam', 'modal-memory-ttl-exam'],
        ['travel', 'modal-memory-ttl-travel'],
        ['emotion', 'modal-memory-ttl-emotion'],
        ['other', 'modal-memory-ttl-other']
    ];
    ttlMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        settings.stateTtlDays[key] = clampInt(el.value, settings.stateTtlDays[key], 1, 365);
    });
    const dedupeEl = document.getElementById('modal-memory-dedupe-threshold');
    if (dedupeEl) {
        settings.dedupeThreshold = clampFloat(dedupeEl.value, settings.dedupeThreshold, 0.3, 0.99);
    }
    window.iphoneSimState.memorySettingsV2 = settings;
    
    saveConfig();
    document.getElementById('memory-settings-modal').classList.add('hidden');
    alert('设置已保存');
}

function renderMemoryList() {
    const list = document.getElementById('memory-list');
    const emptyState = document.getElementById('memory-empty');
    const filterButtons = document.querySelectorAll('#memory-filter-bar .memory-filter-btn');
    const candidatePanel = document.getElementById('memory-candidate-panel');
    const candidateList = document.getElementById('memory-candidate-list');
    const candidateCount = document.getElementById('memory-candidate-count');
    if (!list) return;

    list.innerHTML = '';
    if (candidateList) candidateList.innerHTML = '';
    filterButtons.forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.filter === currentMemoryFilter);
    });

    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) {
        updateMemoryRefineToolbar();
        return;
    }

    ensureMemoryCollections();
    pruneSelectedMemoryIds(contactId);
    const contactMemories = getContactMemories(contactId).slice();
    let stateChanged = false;
    contactMemories.forEach(memory => {
        if (normalizeStateMetaForMemory(memory)) stateChanged = true;
    });
    if (stateChanged) {
        syncLegacyPerceptionAndState(contactId);
        saveConfig();
    }

    const pendingCandidates = getPendingCandidates(contactId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (candidateCount) candidateCount.textContent = String(pendingCandidates.length);
    if (candidatePanel) {
        if (pendingCandidates.length === 0 && currentMemoryFilter !== 'candidate') {
            candidatePanel.style.display = 'none';
        } else {
            candidatePanel.style.display = '';
        }
    }
    if (candidateList) {
        pendingCandidates.forEach(candidate => {
            const item = document.createElement('div');
            item.className = 'memory-candidate-card';
            const tags = normalizeMemoryTags(candidate.suggestedTags, 'long_term')
                .map(tag => `<span class="memory-tag-badge tag-${tag}">${MEMORY_TAG_LABELS[tag] || tag}</span>`)
                .join('');
            item.innerHTML = `
                <div class="memory-candidate-content">${escapeHtml(candidate.content || '')}</div>
                <div class="memory-tag-wrap" style="justify-content: flex-start; margin-bottom: 6px;">${tags}</div>
                <div class="memory-candidate-meta">${escapeHtml(formatCandidateMetaText(candidate))}</div>
                <div class="memory-candidate-actions">
                    <button class="approve-btn" onclick="window.approveMemoryCandidate('${candidate.id}'); showNotification('已存档', 1200, 'success');">存档</button>
                    <button onclick="window.editAndApproveMemoryCandidate('${candidate.id}')">改一下再存档</button>
                    <button class="reject-btn" onclick="window.rejectMemoryCandidate('${candidate.id}')">不保存</button>
                </div>
            `;
            candidateList.appendChild(item);
        });
    }

    if (currentMemoryFilter === 'candidate') {
        if (emptyState) {
            emptyState.style.display = pendingCandidates.length > 0 ? 'none' : 'flex';
            emptyState.textContent = pendingCandidates.length > 0 ? '' : '暂无待确认记忆';
        }
        updateMemoryRefineToolbar();
        return;
    }

    const sortedMemories = getSortedMemoriesForCurrentFilter(contactMemories);

    if (sortedMemories.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.textContent = '暂无记忆';
        }
        updateMemoryRefineToolbar();
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    sortedMemories.forEach(memory => {
        const item = document.createElement('div');
        item.className = 'archive-card';
        const date = new Date(memory.time || Date.now());
        const timeStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const memoryType = memory.type && memory.type !== '线上聊天' ? memory.type : 'Log';
        const title = memory.title || String(memory.content || '').slice(0, 12) || 'Memory Fragment';
        const tags = normalizeMemoryTags(memory.memoryTags, memory.content && memory.content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
        const refText = memory.range || (memory.id ? String(memory.id).slice(-4) : '0000');
        let stateBadge = '';
        if (tags.includes('state')) {
            const phase = memory.stateMeta && memory.stateMeta.phase ? memory.stateMeta.phase : 'active';
            stateBadge = `<span class="memory-state-pill ${phase}">STATE-${String(phase).toUpperCase()}</span>`;
        }
        const tagHtml = tags.map(tag => `<span class="memory-tag-badge tag-${tag}">${MEMORY_TAG_LABELS[tag] || tag}</span>`).join('');
        const selected = selectedMemoryIds.has(Number(memory.id));
        const selectControl = memorySelectMode
            ? `<label class="memory-select-wrap" title="选择用于精炼归档">
                    <input type="checkbox" ${selected ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleMemorySelection('${String(memory.id)}', this.checked)">
                    <span>选择</span>
               </label>`
            : '';

        item.innerHTML = `
            <div class="card-top">
                <div style="display: flex; align-items: center;">${selectControl}<span class="ref-id">REF // ${refText}</span></div>
                <div class="memory-tag-wrap">${stateBadge}${tagHtml}<span class="status">${memoryType}</span></div>
            </div>
            <div class="card-body" onclick="this.querySelector('p').classList.toggle('expanded'); event.stopPropagation();">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(memory.content || '')}</p>
            </div>
            <div class="card-footer">
                <div class="archive-actions" style="position: relative;">
                    <span style="cursor: pointer; margin-right: 10px; font-family: monospace; font-size: 10px; border: 1px solid #ccc; padding: 2px 5px; border-radius: 4px;" onclick="event.stopPropagation(); window.toggleMemoryActions(this, ${memory.id})">OPTS</span>
                    <div class="memory-action-menu" id="memory-action-${memory.id}" style="display: none; position: absolute; left: 0; bottom: 100%; background: white; border: 1px solid #eee; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 5px; z-index: 100;">
                        <div onclick="event.stopPropagation(); window.editMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">EDIT</div>
                        <div onclick="event.stopPropagation(); window.retagMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">RETAG</div>
                        <div onclick="event.stopPropagation(); window.refineMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">REFINE</div>
                        ${tags.includes('state') ? `<div onclick="event.stopPropagation(); window.resolveStateMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">RESOLVE</div>
                        <div onclick="event.stopPropagation(); window.extendStateMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">EXTEND</div>` : ''}
                        <div onclick="event.stopPropagation(); window.deleteMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #ff3b30;">DELETE</div>
                    </div>
                </div>
                <span>DATE: ${timeStr}</span>
            </div>
        `;

        item.addEventListener('click', function(e) {
            if (e.target.closest('.archive-actions') || e.target.closest('.memory-action-menu')) return;
            const isActive = this.classList.contains('is-active');
            document.querySelectorAll('.archive-card').forEach(card => card.classList.remove('is-active'));
            if (!isActive) this.classList.add('is-active');
        });

        list.appendChild(item);
    });
    updateMemoryRefineToolbar();
}

window.toggleMemoryActions = function(element, id) {
    const allMenus = document.querySelectorAll('.memory-action-menu');
    allMenus.forEach(menu => {
        if (menu.id !== `memory-action-${id}`) menu.style.display = 'none';
    });
    const menu = document.getElementById(`memory-action-${id}`);
    if (!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    if (menu.style.display !== 'block') return;
    const closeMenu = function(e) {
        if (!menu.contains(e.target) && (!element || !element.contains(e.target))) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

window.editMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    currentEditingMemoryId = id;
    document.getElementById('edit-memory-content').value = memory.content || '';
    const editTagCheckboxes = document.querySelectorAll('#edit-memory-tags input[type="checkbox"]');
    const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
    editTagCheckboxes.forEach(input => {
        input.checked = tags.includes(input.value);
    });
    const stateBlock = document.getElementById('edit-memory-state-options');
    if (stateBlock) stateBlock.style.display = tags.includes('state') ? '' : 'none';
    if (tags.includes('state')) {
        normalizeStateMetaForMemory(memory);
        const reasonInput = document.getElementById('edit-memory-state-reason');
        if (reasonInput) reasonInput.value = (memory.stateMeta && memory.stateMeta.reasonType) || 'other';
        const ttlInput = document.getElementById('edit-memory-state-ttl');
        if (ttlInput && memory.stateMeta && memory.stateMeta.expiresAt && memory.stateMeta.startAt) {
            const ttl = Math.max(1, Math.round((memory.stateMeta.expiresAt - memory.stateMeta.startAt) / (24 * 60 * 60 * 1000)));
            ttlInput.value = ttl;
        }
    }
    document.getElementById('edit-memory-modal').classList.remove('hidden');
};

window.editAndApproveMemoryCandidate = function(candidateId) {
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return;
    const edited = prompt('改一下内容再存档：', candidate.content || '');
    if (edited === null) return;
    const text = String(edited).trim();
    if (!text) return alert('内容不能为空');
    const overrides = { content: text };
    const candidateTags = normalizeMemoryTags(candidate.suggestedTags, 'long_term');
    if (candidateTags.includes('fact')) {
        const extracted = window.extractSpecificNamesFromUserText ? window.extractSpecificNamesFromUserText(text) : [];
        const fallback = getMemoryExactNames(candidate);
        const exactNames = normalizeExactNames(extracted.length > 0 ? extracted : fallback);
        if (exactNames.length > 0) {
            overrides.factMeta = {
                sourceType: (candidate.factMeta && FACT_SOURCE_TYPES.includes(candidate.factMeta.sourceType))
                    ? candidate.factMeta.sourceType
                    : 'user_explicit_text',
                exactNames,
                sourceMsgId: candidate.factMeta && candidate.factMeta.sourceMsgId ? candidate.factMeta.sourceMsgId : '',
                sourceRange: candidate.factMeta && candidate.factMeta.sourceRange ? candidate.factMeta.sourceRange : ''
            };
        }
    }
    approveMemoryCandidate(candidateId, overrides);
    showNotification('已存档', 1200, 'success');
};

function handleSaveEditedMemory() {
    if (!currentEditingMemoryId) return;
    const content = document.getElementById('edit-memory-content').value.trim();
    if (!content) {
        alert('记忆内容不能为空');
        return;
    }
    const memory = window.iphoneSimState.memories.find(m => m.id === currentEditingMemoryId);
    if (memory) {
        memory.content = content;
        const tags = Array.from(document.querySelectorAll('#edit-memory-tags input[type="checkbox"]:checked')).map(input => input.value);
        memory.memoryTags = normalizeMemoryTags(tags, 'long_term');
        if (memory.memoryTags.includes('state')) {
            const reason = document.getElementById('edit-memory-state-reason')
                ? document.getElementById('edit-memory-state-reason').value
                : inferStateReasonType(memory.content);
            const ttl = document.getElementById('edit-memory-state-ttl')
                ? clampInt(document.getElementById('edit-memory-state-ttl').value, 7, 1, 365)
                : 7;
            const startAt = memory.stateMeta && Number.isFinite(Number(memory.stateMeta.startAt))
                ? Number(memory.stateMeta.startAt)
                : Date.now();
            memory.stateMeta = makeStateMeta(reason, startAt, startAt + ttl * 24 * 60 * 60 * 1000);
        } else {
            delete memory.stateMeta;
        }
        if (memory.memoryTags.includes('fact')) {
            if (!memory.factMeta || !Array.isArray(memory.factMeta.exactNames) || memory.factMeta.exactNames.length === 0) {
                const inferred = window.extractSpecificNamesFromUserText ? window.extractSpecificNamesFromUserText(memory.content) : [];
                if (Array.isArray(inferred) && inferred.length > 0) {
                    const sceneText = buildFactSceneText('user_explicit_text', {
                        actor: 'user',
                        sourceText: memory.content
                    });
                    memory.factMeta = {
                        sourceType: 'user_explicit_text',
                        exactNames: normalizeExactNames(inferred),
                        sceneText
                    };
                }
            }
        } else {
            delete memory.factMeta;
        }
        if (!memory.memoryTags.includes('refined')) {
            delete memory.refinedMeta;
        }
        syncLegacyPerceptionAndState(memory.contactId);
        saveConfig();
        renderMemoryList();
        document.getElementById('edit-memory-modal').classList.add('hidden');
    }
    currentEditingMemoryId = null;
}

window.deleteMemory = function(id) {
    if (!confirm('确定要删除这条记忆吗？')) return;
    window.iphoneSimState.memories = window.iphoneSimState.memories.filter(m => m.id !== id);
    selectedMemoryIds.delete(Number(id));
    const contactId = window.iphoneSimState.currentChatContactId;
    if (contactId) syncLegacyPerceptionAndState(contactId);
    saveConfig();
    renderMemoryList();
};

window.retagMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    const current = normalizeMemoryTags(memory.memoryTags, 'long_term').join(', ');
    const input = prompt('输入标签（refined, short_term, long_term, state, fact）\n逗号分隔：', current);
    if (input === null) return;
    const tags = normalizeMemoryTags(String(input).split(','), 'long_term');
    memory.memoryTags = tags;
    if (tags.includes('state')) {
        memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null);
        normalizeStateMetaForMemory(memory);
    } else {
        delete memory.stateMeta;
    }
    if (!tags.includes('fact')) {
        delete memory.factMeta;
    }
    if (!tags.includes('refined')) {
        delete memory.refinedMeta;
    }
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.resolveStateMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    memory.memoryTags = normalizeMemoryTags(memory.memoryTags, 'state');
    if (!memory.memoryTags.includes('state')) memory.memoryTags.push('state');
    memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null);
    memory.stateMeta.phase = 'resolved';
    memory.stateMeta.resolvedAt = Date.now();
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.extendStateMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    const addDaysInput = prompt('延长状态有效期（天）：', '3');
    if (addDaysInput === null) return;
    const addDays = clampInt(addDaysInput, 3, 1, 365);
    memory.memoryTags = normalizeMemoryTags(memory.memoryTags, 'state');
    if (!memory.memoryTags.includes('state')) memory.memoryTags.push('state');
    memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null);
    const base = Number(memory.stateMeta.expiresAt) || Date.now();
    memory.stateMeta.expiresAt = base + addDays * 24 * 60 * 60 * 1000;
    if (memory.stateMeta.phase === 'resolved') memory.stateMeta.phase = 'active';
    normalizeStateMetaForMemory(memory);
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.refineMemory = async function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    await window.refineSelectedMemories(memory.contactId, [memory.id]);
};

async function checkAndSummarize(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact || !contact.summaryLimit || contact.summaryLimit <= 0) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    
    if (!contact.lastSummaryIndex) contact.lastSummaryIndex = 0;
    
    const newMessagesCount = history.length - contact.lastSummaryIndex;
    
    if (newMessagesCount >= contact.summaryLimit) {
        const messagesToSummarize = history.slice(contact.lastSummaryIndex);
        
        const startFloor = contact.lastSummaryIndex + 1;
        const endFloor = history.length;
        const range = `${startFloor}-${endFloor}`;

        contact.lastSummaryIndex = history.length;
        saveConfig();

        showNotification('正在生成详细总结...');
        await generateSummary(contact, messagesToSummarize, range, {
            autoExtract: true,
            source: 'auto_summary',
            suggestedTags: ['long_term'],
            reason: '聊天自动详细总结'
        });
    }
}

async function generateSummary(contact, messages, range, options = {}) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) {
        console.log('未配置副API，无法自动总结');
        showNotification('未配置API', 2000);
        return;
    }

    const textMessages = messages.filter(m => m.type === 'text' && !m.content.startsWith('['));
    if (textMessages.length === 0) {
        const summaryEl = document.getElementById('summary-notification');
        if (summaryEl) summaryEl.classList.add('hidden');
        return;
    }

    let userName = '用户';
    if (contact.userPersonaId) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
        if (p) userName = p.name;
    } else if (window.iphoneSimState.userProfile) {
        userName = window.iphoneSimState.userProfile.name;
    }

    const chatText = textMessages.map(m => `${m.role === 'user' ? userName : contact.name}: ${m.content}`).join('\n');

    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const detailModeHint = options.autoExtract === false
        ? '当前是用户主动发起的手动总结，请覆盖更完整的上下文。'
        : '当前是自动总结，请在保证完整的前提下控制冗余。';
    const systemPrompt = `你是一个即时通讯软件的聊天记录总结助手。
请阅读以下聊天记录，生成一条“详细记忆”，用于后续长期记忆检索。

${detailModeHint}

输出要求（严格执行）：
1. 输出 3~4 行中文，不要使用 Markdown 列表，不要输出 JSON。
2. 每行使用固定前缀（至少前三行）：
【时间与背景】...
【关键经过】...
【结果与状态】...
可选第四行： 【后续关注】...
3. 长度建议 120~260 字，信息要具体，不要只写一句泛化结论。
4. 至少包含一个明确时间点（YYYY年MM月DD日 HH:mm），并将“今天/刚才/昨天”等相对时间换算成绝对时间。
5. 涉及具体名称（如礼物名、餐品名、地点名、人名）必须逐字保留，不得改写。
6. 只能基于聊天内容，不得杜撰。若确实没有可记忆内容，返回“无”。
7. 不要出现“聊天记录显示”“用户说”这类提示语，直接陈述事实。

参考时间：${dateStr} ${timeStr}
对话双方：${userName} 与 ${contact.name}`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: chatText }
                ],
                temperature: 0.35,
                max_tokens: 420
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let summary = data.choices[0].message.content.trim();

        if (summary && summary !== '无' && summary !== '无。') {
            const autoExtract = options.autoExtract !== false;
            if (autoExtract) {
                const candidate = createMemoryCandidate(contact.id, {
                    content: summary,
                    suggestedTags: Array.isArray(options.suggestedTags) ? options.suggestedTags : ['long_term'],
                    source: options.source || 'auto_summary',
                    confidence: clampFloat(options.confidence, 0.78, 0, 1),
                    range: range,
                    reason: options.reason || '自动提取'
                });
                if (candidate && candidate.status === 'pending') {
                    showNotification('已加入待确认记忆', 2000, 'success');
                } else if (candidate) {
                    showNotification('已提取记忆', 2000, 'success');
                } else {
                    const mode = ensureMemorySettingsV2().extractMode;
                    if (mode === 'manual') {
                        showNotification('手动模式：未自动写入记忆', 2200);
                    } else {
                        showNotification('已提取记忆', 2000, 'success');
                    }
                }
            } else {
                createOrMergeApprovedMemory({
                    contactId: contact.id,
                    content: summary,
                    time: Date.now(),
                    range: range,
                    source: options.source || 'manual',
                    memoryTags: Array.isArray(options.suggestedTags) ? options.suggestedTags : ['long_term'],
                    confidence: clampFloat(options.confidence, 0.9, 0, 1)
                });
                showNotification('总结完成', 2000, 'success');
            }
            saveConfig();
            
            if (!document.getElementById('memory-app').classList.contains('hidden')) {
                renderMemoryList();
            }
        } else {
            showNotification('未提取到重要信息', 2000);
        }

    } catch (error) {
        console.error('自动总结失败:', error);
        showNotification('总结出错', 2000);
    }
}

// --- 行程功能 ---

async function generateDailyItinerary(forceRefresh = false) {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
    const storedItinerary = window.iphoneSimState.itineraries[contact.id];
    
    if (!forceRefresh) {
        if (storedItinerary && storedItinerary.generatedDate === today) {
            renderItinerary(storedItinerary.events);
            return;
        }
    }

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置AI API');
        return;
    }

    const container = document.getElementById('agendaList');
    if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;"><i class="fas fa-spinner fa-spin"></i> 正在生成行程...</div>';
    
    const refreshBtn = document.getElementById('refresh-location-btn');
    if (refreshBtn) refreshBtn.innerText = 'GENERATING...';

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
        const activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled && contact.linkedWbCategories.includes(e.categoryId));
        if (activeEntries.length > 0) {
            worldbookContext = activeEntries.map(e => e.content).join('\n');
        }
    }

    let chatContext = '';
    const history = window.iphoneSimState.chatHistory[contact.id] || [];
    if (history.length > 0) {
        chatContext = history.slice(-10).map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const systemPrompt = `你是一个行程生成助手。请根据以下信息，生成${contact.name}今天从起床到现在的日常行程。`;
    const userPrompt = `角色设定：${contact.persona || '无'}
关联背景：${worldbookContext || '无'}
最近的对话：${chatContext || '无'}

请生成5-8个行程事件，每个事件包含时间段（如08:00-09:00）、地点（如家中、公司）和描述（约50字，第三人称叙述）。
重要要求：
1. 行程必须是连续的。
2. 最后一条行程的结束时间必须完全准确地是 ${currentTime} (现在的时间)。

请直接返回JSON数组格式，不要包含Markdown代码块标记。
JSON格式示例：
[
  {
    "time": "08:00-08:30",
    "location": "家中",
    "description": "起床洗漱..."
  }
]`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let events = [];
        try {
            events = JSON.parse(content);
            if (!Array.isArray(events)) {
                if (events.events && Array.isArray(events.events)) {
                    events = events.events;
                } else {
                    throw new Error('返回格式不是数组');
                }
            }
        } catch (e) {
            console.error('JSON解析失败', e);
            alert('生成的数据格式有误，请重试');
            if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请重试</div>';
            return;
        }

        const itineraryData = {
            generatedDate: today,
            events: events
        };
        window.iphoneSimState.itineraries[contact.id] = itineraryData;
        saveConfig();

        renderItinerary(events);

    } catch (error) {
        console.error('生成行程失败:', error);
        alert(`生成失败: ${error.message}`);
        if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请检查网络或配置</div>';
    } finally {
        if (refreshBtn) refreshBtn.innerText = 'IN PROGRESS';
    }
}

async function generateNewItinerary(contact) {
    if (!contact) return;
    if (contact.isGeneratingItinerary) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return;

    contact.isGeneratingItinerary = true;
    showItineraryNotification('正在生成行程...');

    const today = new Date().toISOString().split('T')[0];
    
    if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
    const storedItinerary = window.iphoneSimState.itineraries[contact.id];
    
    let existingEvents = [];
    if (storedItinerary && storedItinerary.generatedDate === today) {
        existingEvents = storedItinerary.events || [];
    }

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
        const activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled && contact.linkedWbCategories.includes(e.categoryId));
        if (activeEntries.length > 0) {
            worldbookContext = activeEntries.map(e => e.content).join('\n');
        }
    }

    let chatContext = '';
    const history = window.iphoneSimState.chatHistory[contact.id] || [];
    const newMessages = history.slice(contact.lastItineraryIndex || 0);
    if (newMessages.length > 0) {
        chatContext = newMessages.map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    } else {
        chatContext = history.slice(-5).map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    }

    let lastEventTime = "09:00";
    if (existingEvents.length > 0) {
        const sortedEvents = [...existingEvents].sort((a, b) => {
            const timeA = a.time.split('-')[0];
            const timeB = b.time.split('-')[0];
            return timeA.localeCompare(timeB);
        });
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        if (lastEvent && lastEvent.time) {
            lastEventTime = lastEvent.time.split('-')[1] || lastEvent.time.split('-')[0];
        }
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const systemPrompt = `你是一个行程生成助手。请根据以下信息，为${contact.name}生成一条新的行程事件。`;
    const userPrompt = `角色设定：${contact.persona || '无'}
关联背景：${worldbookContext || '无'}
最近的对话：${chatContext || '无'}
上一条行程结束时间：${lastEventTime}
现在时间：${currentTime}

请生成 1 条新的行程事件，接续在上一条行程之后。
包含时间段（如${lastEventTime}-${currentTime}）、地点和描述（约30字，第三人称叙述）。
重要要求：结束时间必须完全准确地是 ${currentTime}。

请直接返回JSON对象格式（不是数组），不要包含Markdown代码块标记。
JSON格式示例：
{
  "time": "10:00-10:30",
  "location": "公司",
  "description": "到达公司开始工作..."
}`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let newEvent = null;
        try {
            newEvent = JSON.parse(content);
            if (Array.isArray(newEvent)) {
                newEvent = newEvent[0];
            }
        } catch (e) {
            console.error('JSON解析失败', e);
            return;
        }

        if (newEvent) {
            newEvent.generatedAt = Date.now();
            
            existingEvents.push(newEvent);
            
            window.iphoneSimState.itineraries[contact.id] = {
                generatedDate: today,
                events: existingEvents
            };

            contact.lastItineraryIndex = history.length;
            contact.messagesSinceLastItinerary = 0;
            saveConfig();

            if (window.iphoneSimState.currentChatContactId === contact.id && !document.getElementById('location-app').classList.contains('hidden')) {
                renderItinerary(existingEvents);
            }
            
            showItineraryNotification('行程生成成功', 2000, 'success');
        }

    } catch (error) {
        console.error('生成新行程失败:', error);
        showItineraryNotification('生成失败', 2000, 'error');
    } finally {
        contact.isGeneratingItinerary = false;
    }
}

function renderItinerary(events) {
    const container = document.getElementById('agendaList');
    if (!container) return;

    // Recreate progress line
    container.innerHTML = '';
    const progressLine = document.createElement('div');
    progressLine.className = 'agenda-progress';
    progressLine.id = 'progressLine';
    container.appendChild(progressLine);

    if (!events || events.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.style.color = '#999';
        emptyDiv.textContent = '暂无行程';
        container.appendChild(emptyDiv);
        return;
    }

    // Re-sort chronologically for proper display
    events.sort((a, b) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
    });

    // Determine current time in minutes
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse time string "HH:MM" to minutes
    function toMinutes(timeStr) {
        const parts = (timeStr || '').trim().split(':');
        if (parts.length < 2) return -1;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Find which event is currently active (current time falls within its range)
    let activeIndex = -1;
    events.forEach((event, index) => {
        const timeParts = event.time.split('-');
        const startMin = toMinutes(timeParts[0]);
        const endMin = toMinutes(timeParts[1]);
        if (startMin >= 0 && endMin >= 0 && nowMinutes >= startMin && nowMinutes <= endMin) {
            activeIndex = index;
        }
    });

    // If no active event found, use the last event whose start time has passed
    if (activeIndex === -1) {
        for (let i = events.length - 1; i >= 0; i--) {
            const startMin = toMinutes(events[i].time.split('-')[0]);
            if (startMin >= 0 && nowMinutes >= startMin) {
                activeIndex = i;
                break;
            }
        }
    }

    // Render items
    events.forEach((event, index) => {
        const item = document.createElement('div');
        const isActive = index === activeIndex;
        item.className = `agenda-item visible ${isActive ? 'active expanded' : ''}`;
        
        const startTime = event.time.split('-')[0].trim();
        
        let generatedTimeHtml = '';
        if (event.generatedAt) {
            const genDate = new Date(event.generatedAt);
            const genTimeStr = `${genDate.getHours()}:${genDate.getMinutes().toString().padStart(2, '0')}`;
            generatedTimeHtml = `<div style="font-size: 10px; color: #ccc; margin-top: 5px; text-align: right;">生成于 ${genTimeStr}</div>`;
        }

        item.innerHTML = `
            <div class="time-col">
                <span class="time-prefix">// time</span>
                ${startTime}
                <div class="node"></div>
            </div>
            <div class="content-col">
                <div class="title-wrapper">
                    <div class="item-title">${event.location}</div>
                    <i class="ph ph-map-pin item-icon"></i>
                </div>
                <div class="item-details">
                    <div class="ornament">◆ ◆ ◆</div>
                    <div class="detail-text">${event.description}</div>
                    <div class="detail-meta">
                        <span class="meta-tag"><i class="ph ph-clock"></i> ${event.time}</span>
                    </div>
                    ${generatedTimeHtml}
                </div>
            </div>
        `;
        
        // Add click listener for expand/collapse
        item.addEventListener('click', () => {
            const allItems = container.querySelectorAll('.agenda-item');
            allItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('expanded');
                    other.classList.remove('active');
                }
            });
            item.classList.toggle('expanded');
            item.classList.toggle('active');
        });

        container.appendChild(item);
    });

    // Calculate and set progress line height after layout is complete
    setTimeout(() => {
        updateProgressLine(events, nowMinutes);
    }, 100);
}

function parseTimeToMinutes(timeStr) {
    const parts = (timeStr || '').trim().split(':');
    if (parts.length < 2) return -1;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function updateProgressLine(events, nowMinutes) {
    const container = document.getElementById('agendaList');
    const progressLine = document.getElementById('progressLine');
    if (!container || !progressLine || !events || events.length === 0) return;

    // Find the first and last event times
    const firstStart = parseTimeToMinutes(events[0].time.split('-')[0]);
    const lastEnd = parseTimeToMinutes(events[events.length - 1].time.split('-')[1] || events[events.length - 1].time.split('-')[0]);

    if (firstStart < 0 || lastEnd < 0 || lastEnd <= firstStart) {
        progressLine.style.height = '0px';
        return;
    }

    // Clamp nowMinutes between first start and last end
    const clampedNow = Math.max(firstStart, Math.min(lastEnd, nowMinutes));
    
    // Calculate the ratio through the timeline
    const ratio = (clampedNow - firstStart) / (lastEnd - firstStart);

    // Use pixel height based on the container's actual scroll height
    const totalHeight = container.scrollHeight;
    progressLine.style.height = `${Math.round(ratio * totalHeight)}px`;
}

function openLocationApp() {
    const locationApp = document.getElementById('location-app');
    locationApp.classList.remove('hidden');
    document.getElementById('chat-more-panel').classList.add('hidden');

    // Update date display in header
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const shortMonth = shortMonths[now.getMonth()];
    const headerDateEl = document.getElementById('location-header-date');
    if (headerDateEl) headerDateEl.textContent = `${dayName}, ${day} ${month}`;
    const introDateEl = document.getElementById('location-intro-date');
    if (introDateEl) introDateEl.textContent = `\u2605 Daily Itinerary / ${shortMonth} ${day}`;

    generateDailyItinerary();
}

function openItinerarySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    document.getElementById('auto-itinerary-toggle').checked = contact.autoItineraryEnabled || false;
    document.getElementById('auto-itinerary-interval').value = contact.autoItineraryInterval || 10;
    
    document.getElementById('itinerary-settings-modal').classList.remove('hidden');
}

function handleSaveItinerarySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const enabled = document.getElementById('auto-itinerary-toggle').checked;
    const interval = parseInt(document.getElementById('auto-itinerary-interval').value);

    contact.autoItineraryEnabled = enabled;
    contact.autoItineraryInterval = isNaN(interval) || interval < 1 ? 10 : interval;

    saveConfig();
    document.getElementById('itinerary-settings-modal').classList.add('hidden');
    alert('行程设置已保存');
}

async function getCurrentItineraryInfo(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return '';
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        if (!window.iphoneSimState.itineraries) return '';
        const itinerary = window.iphoneSimState.itineraries[contactId];
        
        if (!itinerary || itinerary.generatedDate !== today || !itinerary.events || !Array.isArray(itinerary.events) || itinerary.events.length === 0) {
            return '';
        }
        
        const sortedEvents = [...itinerary.events].sort((a, b) => {
            const timeA = a.time.split('-')[0].trim();
            const timeB = b.time.split('-')[0].trim();
            return timeA.localeCompare(timeB);
        });
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        let currentEvent = null;
        let nextEvent = null;
        let allEventsText = '';
        
        for (let i = 0; i < sortedEvents.length; i++) {
            const event = sortedEvents[i];
            const [startStr, endStr] = event.time.split('-');
            const [startHour, startMinute] = startStr.trim().split(':').map(Number);
            const [endHour, endMinute] = endStr.trim().split(':').map(Number);
            
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;
            
            allEventsText += `${event.time} ${event.location}：${event.description}\n`;
            
            if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
                currentEvent = event;
            }
            
            if (currentTimeInMinutes < startTimeInMinutes && !nextEvent) {
                nextEvent = event;
            }
        }
        
        let info = '【今日行程安排】\n';
        info += allEventsText;
        
        if (currentEvent) {
            info += `\n【当前状态】\n根据时间安排，我现在（${currentHour}:${currentMinute.toString().padStart(2, '0')}）正在${currentEvent.location}，进行：${currentEvent.description}\n`;
        } else if (nextEvent) {
            const [nextHour, nextMinute] = nextEvent.time.split('-')[0].trim().split(':').map(Number);
            const timeUntilNext = nextHour * 60 + nextMinute - currentTimeInMinutes;
            
            if (timeUntilNext > 0) {
                info += `\n【当前状态】\n现在时间是${currentHour}:${currentMinute.toString().padStart(2, '0')}，距离下一个行程（${nextEvent.time} ${nextEvent.location}）还有大约${Math.floor(timeUntilNext/60)}小时${timeUntilNext%60}分钟。\n`;
            }
        } else {
            info += `\n【当前状态】\n今天的行程已经全部结束了。\n`;
        }
        
        return info;
    } catch (error) {
        console.error('解析行程信息失败:', error);
        return '';
    }
}

// --- 音乐功能 ---

function initMusicWidget() {
    const bgMusicAudio = document.getElementById('bg-music');
    if (window.iphoneSimState.music) {
        updateMusicUI();
        if (window.iphoneSimState.music.src) {
            bgMusicAudio.src = window.iphoneSimState.music.src;
        }
    }
    
    bgMusicAudio.addEventListener('timeupdate', syncLyrics);
    bgMusicAudio.addEventListener('ended', () => {
        window.iphoneSimState.music.playing = false;
        updateMusicUI();
    });
}

function openMusicSettings() {
    const coverPreview = document.getElementById('music-cover-preview');
    if (coverPreview && window.iphoneSimState.music.cover) {
        coverPreview.innerHTML = `<img src="${window.iphoneSimState.music.cover}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    const bgPreview = document.getElementById('music-widget-bg-preview');
    if (bgPreview) {
        if (window.iphoneSimState.music.widgetBg) {
            bgPreview.innerHTML = `<img src="${window.iphoneSimState.music.widgetBg}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            bgPreview.innerHTML = '<i class="fas fa-image"></i>';
        }
    }

    resetMusicUploadForm();
    renderMusicPlaylist();
    switchMusicTab('list');

    document.getElementById('music-settings-modal').classList.remove('hidden');
}

function switchMusicTab(tab) {
    const listTab = document.getElementById('tab-music-list');
    const uploadTab = document.getElementById('tab-music-upload');
    const listView = document.getElementById('music-view-list');
    const uploadView = document.getElementById('music-view-upload');
    const indicator = document.getElementById('music-nav-indicator');

    if (tab === 'list') {
        listTab.classList.add('active');
        uploadTab.classList.remove('active');
        
        listView.style.display = 'block';
        uploadView.style.display = 'none';
        
        void listView.offsetWidth;
        
        listView.classList.add('active');
        uploadView.classList.remove('active');
        
        indicator.style.transform = 'translateX(0)';
    } else {
        listTab.classList.remove('active');
        uploadTab.classList.add('active');
        
        listView.style.display = 'none';
        uploadView.style.display = 'block';
        
        void uploadView.offsetWidth;
        
        listView.classList.remove('active');
        uploadView.classList.add('active');
        
        indicator.style.transform = 'translateX(100%)';
    }
}

function resetMusicUploadForm() {
    document.getElementById('input-song-title').value = '';
    document.getElementById('input-artist-name').value = '';
    document.getElementById('music-url-input').value = '';
    document.getElementById('music-file-upload').value = '';
    document.getElementById('lyrics-file-upload').value = '';
    document.getElementById('lyrics-status').textContent = '未选择文件';
    
    window.iphoneSimState.tempMusicSrc = null;
    window.iphoneSimState.tempLyricsData = null;
    window.iphoneSimState.tempLyricsFile = null;
}

function handleMusicCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 300, 0.7).then(base64 => {
        const preview = document.getElementById('music-cover-preview');
        if (preview) {
            preview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        window.iphoneSimState.tempMusicCover = base64;
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function handleMusicWidgetBgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        const preview = document.getElementById('music-widget-bg-preview');
        if (preview) {
            preview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        window.iphoneSimState.tempMusicWidgetBg = base64;
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function handleMusicFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        window.iphoneSimState.tempMusicSrc = event.target.result;
        alert('音乐文件已选择，点击保存生效');
    };
    reader.readAsDataURL(file);
}

function handleLyricsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const lrcContent = event.target.result;
        const parsedLyrics = parseLRC(lrcContent);
        
        if (parsedLyrics.length > 0) {
            window.iphoneSimState.tempLyricsData = parsedLyrics;
            window.iphoneSimState.tempLyricsFile = file.name;
            document.getElementById('lyrics-status').textContent = `已选择: ${file.name}`;
        } else {
            alert('歌词解析失败，请检查文件格式');
        }
    };
    reader.readAsText(file);
}

function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            
            if (text) {
                result.push({ time, text });
            }
        }
    });

    return result.sort((a, b) => a.time - b.time);
}

function saveMusicAppearance() {
    if (window.iphoneSimState.tempMusicCover) {
        window.iphoneSimState.music.cover = window.iphoneSimState.tempMusicCover;
        delete window.iphoneSimState.tempMusicCover;
    }

    if (window.iphoneSimState.tempMusicWidgetBg) {
        window.iphoneSimState.music.widgetBg = window.iphoneSimState.tempMusicWidgetBg;
        delete window.iphoneSimState.tempMusicWidgetBg;
    }

    updateMusicUI();
    saveConfig();
    alert('外观设置已保存');
}

function saveNewSong() {
    const title = document.getElementById('input-song-title').value.trim();
    const artist = document.getElementById('input-artist-name').value.trim();
    const urlInput = document.getElementById('music-url-input').value.trim();

    if (!title) {
        alert('请输入歌名');
        return;
    }

    let src = '';
    if (window.iphoneSimState.tempMusicSrc) {
        src = window.iphoneSimState.tempMusicSrc;
    } else if (urlInput) {
        src = urlInput;
    } else {
        alert('请上传音乐文件或输入URL');
        return;
    }

    const newSong = {
        id: Date.now(),
        title: title,
        artist: artist || '未知歌手',
        src: src,
        lyricsData: window.iphoneSimState.tempLyricsData || [],
        lyricsFile: window.iphoneSimState.tempLyricsFile || ''
    };

    if (!window.iphoneSimState.music.playlist) window.iphoneSimState.music.playlist = [];
    window.iphoneSimState.music.playlist.push(newSong);
    
    playSong(newSong.id);
    
    saveConfig();
    
    resetMusicUploadForm();
    switchMusicTab('list');
    renderMusicPlaylist();
}

function renderMusicPlaylist() {
    const list = document.getElementById('music-playlist');
    const emptyState = document.getElementById('music-empty-state');
    if (!list) return;

    list.innerHTML = '';

    if (!window.iphoneSimState.music.playlist || window.iphoneSimState.music.playlist.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    window.iphoneSimState.music.playlist.forEach(song => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.setProperty('display', 'flex', 'important');
        item.style.setProperty('align-items', 'center', 'important');
        item.style.setProperty('padding-top', '12px', 'important');
        item.style.setProperty('padding-bottom', '12px', 'important');
        item.style.setProperty('min-height', '64px', 'important');
        item.style.setProperty('box-sizing', 'border-box', 'important');
        const isPlaying = window.iphoneSimState.music.currentSongId === song.id;
        
        item.innerHTML = `
            <div class="list-content column" style="flex: 1;">
                <div style="font-weight: bold; font-size: 16px; ${isPlaying ? 'color: #007AFF;' : ''}">${song.title}</div>
                <div style="font-size: 12px; color: #888;">${song.artist}</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="ios-btn-small" onclick="window.playSong(${song.id})" style="${isPlaying ? 'background-color: #007AFF;' : ''}">${isPlaying ? '播放中' : '播放'}</button>
                <button class="ios-btn-small danger" onclick="window.deleteSong(${song.id})">删除</button>
            </div>
        `;
        const textBlocks = item.querySelectorAll('.list-content.column > div');
        textBlocks.forEach(el => {
            el.style.setProperty('margin', '0', 'important');
            el.style.setProperty('line-height', '1.2', 'important');
        });
        list.appendChild(item);
    });
}

window.playSong = function(id) {
    const song = window.iphoneSimState.music.playlist.find(s => s.id === id);
    if (!song) return;

    window.iphoneSimState.music.currentSongId = id;
    window.iphoneSimState.music.title = song.title;
    window.iphoneSimState.music.artist = song.artist;
    window.iphoneSimState.music.src = song.src;
    window.iphoneSimState.music.lyricsData = song.lyricsData;
    window.iphoneSimState.music.lyricsFile = song.lyricsFile;
    
    const bgMusicAudio = document.getElementById('bg-music');
    bgMusicAudio.src = song.src;
    
    bgMusicAudio.play().then(() => {
        window.iphoneSimState.music.playing = true;
        updateMusicUI();
        renderMusicPlaylist();
    }).catch(err => {
        console.error('播放失败:', err);
        alert('播放失败');
    });
    
    saveConfig();
};

window.deleteSong = function(id) {
    if (confirm('确定要删除这首歌吗？')) {
        window.iphoneSimState.music.playlist = window.iphoneSimState.music.playlist.filter(s => s.id !== id);
        if (window.iphoneSimState.music.currentSongId === id) {
            window.iphoneSimState.music.currentSongId = null;
        }
        saveConfig();
        renderMusicPlaylist();
    }
};

function toggleMusicPlay() {
    if (!window.iphoneSimState.music.src) {
        alert('请先设置音乐源');
        return;
    }

    const bgMusicAudio = document.getElementById('bg-music');
    if (bgMusicAudio.paused) {
        bgMusicAudio.play().then(() => {
            window.iphoneSimState.music.playing = true;
            updateMusicUI();
        }).catch(err => {
            console.error('播放失败:', err);
            alert('播放失败，可能是浏览器限制自动播放，请尝试手动点击播放。');
        });
    } else {
        bgMusicAudio.pause();
        window.iphoneSimState.music.playing = false;
        updateMusicUI();
    }
}

function updateMusicUI() {
    const widget = document.getElementById('music-widget');
    const cover = document.getElementById('vinyl-cover');
    const disk = document.getElementById('vinyl-disk');
    const title = document.getElementById('song-title');
    const artist = document.getElementById('artist-name');
    const lyricsContainer = document.getElementById('lyrics-display');
    const playIcon = document.getElementById('play-icon');

    if (widget && window.iphoneSimState.music.widgetBg) {
        widget.style.backgroundImage = `url('${window.iphoneSimState.music.widgetBg}')`;
        widget.style.backgroundSize = 'cover';
        widget.style.backgroundPosition = 'center';
    } else if (widget) {
        widget.style.backgroundImage = '';
    }

    if (cover) cover.style.backgroundImage = `url('${window.iphoneSimState.music.cover}')`;
    if (title) title.textContent = window.iphoneSimState.music.title;
    if (artist) artist.textContent = window.iphoneSimState.music.artist;
    
    if (lyricsContainer) {
        let html = '<div class="lyrics-scroll-container" id="lyrics-scroll">';
        if (window.iphoneSimState.music.lyricsData && window.iphoneSimState.music.lyricsData.length > 0) {
            window.iphoneSimState.music.lyricsData.forEach((line, index) => {
                html += `<div class="lyric-line" data-time="${line.time}" data-index="${index}">${line.text}</div>`;
            });
        } else {
            html += '<div class="lyric-line">暂无歌词</div>';
        }
        html += '</div>';
        lyricsContainer.innerHTML = html;
    }

    if (window.iphoneSimState.music.playing) {
        if (disk) disk.classList.add('playing');
        if (playIcon) {
            playIcon.className = 'fas fa-pause';
        }
    } else {
        if (disk) disk.classList.remove('playing');
        if (playIcon) {
            playIcon.className = 'fas fa-play';
        }
    }
}

function syncLyrics() {
    const bgMusicAudio = document.getElementById('bg-music');
    const currentTime = bgMusicAudio.currentTime;
    const lyricsData = window.iphoneSimState.music.lyricsData;
    
    if (!lyricsData || lyricsData.length === 0) return;

    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        const scrollContainer = document.getElementById('lyrics-scroll');
        const lines = document.querySelectorAll('.lyric-line');
        
        lines.forEach(line => line.classList.remove('active'));
        
        if (lines[activeIndex]) {
            lines[activeIndex].classList.add('active');
            
            const lineHeight = 20;
            if (scrollContainer) {
                scrollContainer.style.transform = `translateY(-${activeIndex * lineHeight}px)`;
            }
        }
    }
}

// --- 拍立得功能 ---

function initPolaroidWidget() {
    const polaroidImg1 = document.getElementById('polaroid-img-1');
    const polaroidText1 = document.getElementById('polaroid-text-1');
    const polaroidImg2 = document.getElementById('polaroid-img-2');
    const polaroidText2 = document.getElementById('polaroid-text-2');

    if (window.iphoneSimState.polaroid) {
        if (polaroidImg1) polaroidImg1.src = window.iphoneSimState.polaroid.img1;
        if (polaroidText1) polaroidText1.textContent = window.iphoneSimState.polaroid.text1;
        if (polaroidImg2) polaroidImg2.src = window.iphoneSimState.polaroid.img2;
        if (polaroidText2) polaroidText2.textContent = window.iphoneSimState.polaroid.text2;
    }
}

function handlePolaroidImageUpload(e, index) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 600, 0.7).then(base64 => {
        if (index === 1) {
            window.iphoneSimState.polaroid.img1 = base64;
            document.getElementById('polaroid-img-1').src = base64;
        } else {
            window.iphoneSimState.polaroid.img2 = base64;
            document.getElementById('polaroid-img-2').src = base64;
        }
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handlePolaroidTextEdit(index) {
    const currentText = index === 1 ? window.iphoneSimState.polaroid.text1 : window.iphoneSimState.polaroid.text2;
    const newText = prompt('请输入文字：', currentText);
    
    if (newText !== null) {
        if (index === 1) {
            window.iphoneSimState.polaroid.text1 = newText;
            document.getElementById('polaroid-text-1').textContent = newText;
        } else {
            window.iphoneSimState.polaroid.text2 = newText;
            document.getElementById('polaroid-text-2').textContent = newText;
        }
        saveConfig();
    }
}

// --- 表情包系统 ---

function initStickerSystem() {
    const stickerBtn = document.getElementById('sticker-btn');
    if (stickerBtn) {
        const newBtn = stickerBtn.cloneNode(true);
        stickerBtn.parentNode.replaceChild(newBtn, stickerBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStickerPanel();
        });
    }

    const manageBtn = document.getElementById('sticker-manage-btn');
    if (manageBtn) {
        const newManageBtn = manageBtn.cloneNode(true);
        manageBtn.parentNode.replaceChild(newManageBtn, manageBtn);
        newManageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.iphoneSimState.isStickerManageMode) {
                toggleStickerManageMode();
            } else {
                document.getElementById('sticker-options-modal').classList.remove('hidden');
            }
        });
    }

    const optionsModal = document.getElementById('sticker-options-modal');

    if (optionsModal) {
        const newOptionsModal = optionsModal.cloneNode(true);
        optionsModal.parentNode.replaceChild(newOptionsModal, optionsModal);
        
        const optManage = newOptionsModal.querySelector('#sticker-opt-manage');
        const optImport = newOptionsModal.querySelector('#sticker-opt-import');
        const optCancel = newOptionsModal.querySelector('#sticker-opt-cancel');

        newOptionsModal.addEventListener('click', (e) => {
            if (e.target === newOptionsModal) {
                newOptionsModal.classList.add('hidden');
            }
            e.stopPropagation();
        });

        if (optManage) {
            optManage.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                toggleStickerManageMode();
            });
        }

        if (optImport) {
            optImport.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                document.getElementById('sticker-category-name').value = '';
                document.getElementById('sticker-import-text').value = '';
                
                // Clear stale JSON data
                window.iphoneSimState.tempStickerJson = null;
                document.getElementById('sticker-import-json').value = '';
                const status = document.getElementById('sticker-json-status');
                if (status) status.textContent = '未选择文件';

                document.getElementById('import-sticker-modal').classList.remove('hidden');
            });
        }

        const optDeleteCats = newOptionsModal.querySelector('#sticker-opt-deletecats');
        if (optDeleteCats) {
            optDeleteCats.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                renderStickerCategoryDeleteModal();
            });
        }

        if (optCancel) {
            optCancel.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
            });
        }
    }

    const importBtn = document.getElementById('sticker-import-btn-action');
    if (importBtn) {
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);

        newImportBtn.addEventListener('click', () => {
            document.getElementById('sticker-category-name').value = '';
            document.getElementById('sticker-import-text').value = '';
            
            // Clear stale JSON data
            window.iphoneSimState.tempStickerJson = null;
            document.getElementById('sticker-import-json').value = '';
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = '未选择文件';

            document.getElementById('import-sticker-modal').classList.remove('hidden');
        });
    }

    const selectAllBtn = document.getElementById('sticker-select-all-btn');
    if (selectAllBtn) {
        const newSelectAllBtn = selectAllBtn.cloneNode(true);
        selectAllBtn.parentNode.replaceChild(newSelectAllBtn, selectAllBtn);
        newSelectAllBtn.addEventListener('click', toggleSelectAllStickers);
    }

    const deleteBtn = document.getElementById('sticker-delete-btn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', deleteSelectedStickers);
    }

    const exportBtn = document.getElementById('sticker-export-btn');
    if (exportBtn) {
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        newExportBtn.addEventListener('click', handleExportStickers);
    }

    const closeImportBtn = document.getElementById('close-import-sticker');
    if (closeImportBtn) {
        const newCloseImportBtn = closeImportBtn.cloneNode(true);
        closeImportBtn.parentNode.replaceChild(newCloseImportBtn, closeImportBtn);
        newCloseImportBtn.addEventListener('click', () => {
            document.getElementById('import-sticker-modal').classList.add('hidden');
        });
    }

    const saveImportBtn = document.getElementById('save-sticker-import-btn');
    if (saveImportBtn) {
        const newSaveImportBtn = saveImportBtn.cloneNode(true);
        saveImportBtn.parentNode.replaceChild(newSaveImportBtn, saveImportBtn);
        newSaveImportBtn.addEventListener('click', handleImportStickers);
    }

    const searchInput = document.getElementById('sticker-search-input');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', (e) => {
            renderStickerList(e.target.value);
        });
    }

    const stickerJsonInput = document.getElementById('sticker-import-json');
    if (stickerJsonInput) {
        const newStickerJsonInput = stickerJsonInput.cloneNode(true);
        stickerJsonInput.parentNode.replaceChild(newStickerJsonInput, stickerJsonInput);
        newStickerJsonInput.addEventListener('change', handleStickerJsonUpload);
    }

    renderStickerTabs();
    renderStickerList();
}

function handleStickerJsonUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            window.iphoneSimState.tempStickerJson = data;
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = `已加载: ${file.name}`;
            
            // Auto-fill category name if present in JSON and input is empty
            const nameInput = document.getElementById('sticker-category-name');
            if (nameInput && !nameInput.value && data.name) {
                nameInput.value = data.name;
            }
        } catch (err) {
            console.error('JSON Parse Error:', err);
            alert('JSON 文件格式错误');
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = '解析失败';
            window.iphoneSimState.tempStickerJson = null;
        }
    };
    reader.readAsText(file);
}

function toggleStickerPanel() {
    const panel = document.getElementById('sticker-panel');
    const chatMorePanel = document.getElementById('chat-more-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    if (panel.classList.contains('slide-in')) {
        panel.classList.remove('slide-in');
        if (chatInputArea) chatInputArea.classList.remove('push-up');
        
        if (window.iphoneSimState.isStickerManageMode) {
            toggleStickerManageMode();
        }
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('slide-in');
        
        if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
        
        if (chatInputArea) chatInputArea.classList.add('push-up');
        
        if (window.scrollToBottom) window.scrollToBottom();
        renderStickerTabs();
        renderStickerList();
    }
}

function handleImportStickers() {
    const name = document.getElementById('sticker-category-name').value.trim();
    const text = document.getElementById('sticker-import-text').value.trim();
    const jsonData = window.iphoneSimState.tempStickerJson;

    let stickers = [];
    let catName = name;

    if (jsonData) {
        let rawStickers = [];
        if (Array.isArray(jsonData)) {
            rawStickers = jsonData;
        } else if (jsonData.list && Array.isArray(jsonData.list)) {
            rawStickers = jsonData.list;
            if (!catName && jsonData.name) catName = jsonData.name;
        }

        stickers = rawStickers.filter(s => s.url && s.desc).map(s => ({ desc: s.desc, url: s.url }));
        
        if (stickers.length === 0) {
            alert('JSON中未找到有效的表情包数据 (需包含 url 和 desc)');
            return;
        }
    } else {
        if (!text) {
            alert('请输入表情包数据');
            return;
        }

        const lines = text.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            let parts = line.split(/[:：]/);
            if (parts.length >= 2) {
                const desc = parts[0].trim();
                const url = parts.slice(1).join(':').trim();
                if (url) {
                    stickers.push({ desc, url });
                }
            }
        });

        if (stickers.length === 0) {
            alert('未能解析出有效的表情包数据，请检查格式');
            return;
        }
    }

    if (!catName) {
        alert('请输入分类名称');
        return;
    }

    const existingCategory = window.iphoneSimState.stickerCategories.find(c => c.name === catName);

    if (existingCategory) {
        existingCategory.list.push(...stickers);
        window.iphoneSimState.currentStickerCategoryId = existingCategory.id;
        alert(`已合并到现有分类 "${catName}"，新增 ${stickers.length} 个表情`);
    } else {
        const newCategory = {
            id: Date.now(),
            name: catName,
            list: stickers
        };
        window.iphoneSimState.stickerCategories.push(newCategory);
        window.iphoneSimState.currentStickerCategoryId = newCategory.id;
        alert(`成功导入 ${stickers.length} 个表情包`);
    }
    
    saveConfig();
    renderStickerTabs();
    renderStickerList();
    
    document.getElementById('import-sticker-modal').classList.add('hidden');
    
    if (jsonData) {
        window.iphoneSimState.tempStickerJson = null;
        document.getElementById('sticker-import-json').value = '';
        const status = document.getElementById('sticker-json-status');
        if (status) status.textContent = '未选择文件';
    }
}

function renderStickerTabs() {
    const container = document.getElementById('sticker-tabs-container');
    if (!container) return;

    let indicator = container.querySelector('.tab-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'tab-indicator';
        container.appendChild(indicator);
    }

    const oldTabs = container.querySelectorAll('.sticker-tab');
    oldTabs.forEach(t => t.remove());

    const allTab = document.createElement('div');
    allTab.className = `sticker-tab ${window.iphoneSimState.currentStickerCategoryId === 'all' ? 'active' : ''}`;
    allTab.textContent = '全部';
    allTab.onclick = (e) => {
        e.stopPropagation();
        window.iphoneSimState.currentStickerCategoryId = 'all';
        updateTabState(container, allTab);
    };
    container.appendChild(allTab);

    window.iphoneSimState.stickerCategories.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = `sticker-tab ${window.iphoneSimState.currentStickerCategoryId === cat.id ? 'active' : ''}`;
        tab.textContent = cat.name;
        tab.onclick = (e) => {
            e.stopPropagation();
            window.iphoneSimState.currentStickerCategoryId = cat.id;
            updateTabState(container, tab);
        };
        container.appendChild(tab);
    });

    setTimeout(() => updateTabIndicator(), 50);
}

function updateTabState(container, activeTab) {
    const tabs = container.querySelectorAll('.sticker-tab');
    tabs.forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
    
    updateTabIndicator();
    document.getElementById('sticker-search-input').value = '';
    if (window.iphoneSimState.isStickerManageMode) {
        toggleStickerManageMode();
    }
    renderStickerList();
}

function updateTabIndicator() {
    const container = document.getElementById('sticker-tabs-container');
    if (!container) return;
    
    const activeTab = container.querySelector('.sticker-tab.active');
    const indicator = container.querySelector('.tab-indicator');
    
    if (activeTab && indicator) {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
        indicator.style.opacity = '1';
    } else if (indicator) {
        indicator.style.opacity = '0';
    }
}

function renderStickerList(filterText = '') {
    const container = document.getElementById('sticker-content');
    if (!container) return;

    container.innerHTML = '';

    let stickers = [];
    
    if (window.iphoneSimState.currentStickerCategoryId === 'all') {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            cat.list.forEach((s, index) => {
                stickers.push({ ...s, _catId: cat.id, _index: index });
            });
        });
    } else {
        const category = window.iphoneSimState.stickerCategories.find(c => c.id === window.iphoneSimState.currentStickerCategoryId);
        if (category) {
            stickers = category.list.map((s, index) => ({ ...s, _catId: category.id, _index: index }));
        }
    }

    if (stickers.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">暂无表情包</div>';
        return;
    }

    if (filterText) {
        stickers = stickers.filter(s => s.desc.toLowerCase().includes(filterText.toLowerCase()));
    }

    if (stickers.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">没有找到匹配的表情</div>';
        return;
    }

    stickers.forEach((sticker) => {
        const key = `${sticker._catId}-${sticker._index}`;
        const item = document.createElement('div');
        item.className = `sticker-item ${window.iphoneSimState.isStickerManageMode && window.iphoneSimState.selectedStickers.has(key) ? 'selected' : ''}`;
        
        let innerHTML = `
            <img src="${sticker.url}" loading="lazy" onerror="this.src='https://placehold.co/60x60?text=Error'">
            <span>${sticker.desc}</span>
        `;

        if (window.iphoneSimState.isStickerManageMode) {
            innerHTML += `<div class="sticker-checkbox"><i class="fas fa-check"></i></div>`;
            item.onclick = (e) => {
                e.stopPropagation();
                toggleSelectSticker(sticker._catId, sticker._index);
            };
        } else {
            item.onclick = (e) => {
                e.stopPropagation();
                sendSticker(sticker);
            };
        }

        item.innerHTML = innerHTML;
        container.appendChild(item);
    });
}

function sendSticker(sticker) {
    if (window.sendMessage) window.sendMessage(sticker.url, true, 'sticker', sticker.desc);
    
    const panel = document.getElementById('sticker-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    if (panel) panel.classList.remove('slide-in');
    if (chatInputArea) chatInputArea.classList.remove('push-up');
}

function toggleStickerManageMode() {
    window.iphoneSimState.isStickerManageMode = !window.iphoneSimState.isStickerManageMode;
    window.iphoneSimState.selectedStickers.clear();
    
    const manageBtn = document.getElementById('sticker-manage-btn');
    const actionsPanel = document.getElementById('sticker-manage-actions');
    const topBar = document.querySelector('.sticker-top-bar');
    
    if (window.iphoneSimState.isStickerManageMode) {
        manageBtn.innerHTML = '<span style="font-size: 14px; color: #007AFF;">完成</span>';
        actionsPanel.classList.remove('hidden');
        if (topBar) topBar.style.display = 'none';
    } else {
        manageBtn.innerHTML = '<i class="fas fa-cog"></i>';
        actionsPanel.classList.add('hidden');
        if (topBar) topBar.style.display = 'flex';
    }
    
    updateSelectCount();
    renderStickerList();
}

function toggleSelectSticker(catId, index) {
    const key = `${catId}-${index}`;
    if (window.iphoneSimState.selectedStickers.has(key)) {
        window.iphoneSimState.selectedStickers.delete(key);
    } else {
        window.iphoneSimState.selectedStickers.add(key);
    }
    updateSelectCount();
    renderStickerList();
}

function updateSelectCount() {
    document.getElementById('sticker-select-count').textContent = `已选 ${window.iphoneSimState.selectedStickers.size}`;
}

function toggleSelectAllStickers() {
    let targetStickers = [];
    
    if (window.iphoneSimState.currentStickerCategoryId === 'all') {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            cat.list.forEach((_, index) => {
                targetStickers.push(`${cat.id}-${index}`);
            });
        });
    } else {
        const category = window.iphoneSimState.stickerCategories.find(c => c.id === window.iphoneSimState.currentStickerCategoryId);
        if (category) {
            category.list.forEach((_, index) => {
                targetStickers.push(`${category.id}-${index}`);
            });
        }
    }
    
    if (targetStickers.length === 0) return;

    let allSelected = true;
    for (const key of targetStickers) {
        if (!window.iphoneSimState.selectedStickers.has(key)) {
            allSelected = false;
            break;
        }
    }

    if (allSelected) {
        for (const key of targetStickers) {
            window.iphoneSimState.selectedStickers.delete(key);
        }
    } else {
        for (const key of targetStickers) {
            window.iphoneSimState.selectedStickers.add(key);
        }
    }
    
    updateSelectCount();
    renderStickerList();
}

function handleExportStickers() {
    if (window.iphoneSimState.selectedStickers.size === 0) {
        alert('请先选择要导出的表情包');
        return;
    }

    const selectedKeys = Array.from(window.iphoneSimState.selectedStickers);
    const exportList = [];

    selectedKeys.forEach(key => {
        const [catId, index] = key.split('-');
        const category = window.iphoneSimState.stickerCategories.find(c => c.id == catId);
        if (category && category.list[index]) {
            exportList.push(category.list[index]);
        }
    });

    if (exportList.length === 0) {
        alert('导出失败：未找到有效数据');
        return;
    }

    const exportData = {
        list: exportList,
        exportedAt: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stickers_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function deleteSelectedStickers() {
    if (window.iphoneSimState.selectedStickers.size === 0) {
        if (window.iphoneSimState.currentStickerCategoryId && window.iphoneSimState.currentStickerCategoryId !== 'all') {
            if (confirm('未选择表情。是否删除当前整个分类？')) {
                window.iphoneSimState.stickerCategories = window.iphoneSimState.stickerCategories.filter(c => c.id !== window.iphoneSimState.currentStickerCategoryId);
                window.iphoneSimState.currentStickerCategoryId = 'all';
                saveConfig();
                toggleStickerManageMode();
                renderStickerTabs();
                renderStickerList();
            }
        }
        return;
    }

    if (confirm(`确定删除选中的 ${window.iphoneSimState.selectedStickers.size} 个表情吗？`)) {
        const toDelete = {};
        
        window.iphoneSimState.selectedStickers.forEach(key => {
            const [catId, index] = key.split('-');
            if (!toDelete[catId]) toDelete[catId] = [];
            toDelete[catId].push(parseInt(index));
        });

        Object.keys(toDelete).forEach(catId => {
            const category = window.iphoneSimState.stickerCategories.find(c => c.id == catId);
            if (category) {
                const indexes = toDelete[catId].sort((a, b) => b - a);
                indexes.forEach(idx => {
                    category.list.splice(idx, 1);
                });
            }
        });

        window.iphoneSimState.selectedStickers.clear();
        saveConfig();
        updateSelectCount();
        renderStickerList();
    }
}

function renderStickerCategoryDeleteModal() {
    const modal = document.getElementById('sticker-delete-cats-modal');
    if (!modal) return;
    const list = modal.querySelector('#sticker-delete-cats-list');
    list.innerHTML = '';

    if (!window.iphoneSimState.stickerCategories || window.iphoneSimState.stickerCategories.length === 0) {
        list.innerHTML = '<div class="list-item"><div class="list-content">暂无表情包分类</div></div>';
    } else {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-content" style="justify-content: space-between; align-items: center; width: 100%;">
                    <span>${cat.name}</span>
                    <input type="checkbox" class="sticker-delete-cat-checkbox" data-id="${cat.id}">
                </div>
            `;
            list.appendChild(item);
        });
    }

    const closeBtn = document.getElementById('close-delete-sticker-cats');
    const confirmBtn = document.getElementById('confirm-delete-sticker-cats');

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            modal.classList.add('hidden');
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteSelectedStickerCategories();
        };
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    modal.classList.remove('hidden');
}

function handleDeleteSelectedStickerCategories() {
    const modal = document.getElementById('sticker-delete-cats-modal');
    if (!modal) return;
    const checked = modal.querySelectorAll('.sticker-delete-cat-checkbox:checked');
    if (!checked || checked.length === 0) {
        alert('未选择任何分类');
        return;
    }

    const ids = Array.from(checked).map(cb => cb.dataset.id);
    if (!confirm(`确定删除选中的 ${ids.length} 个分类及其中的所有表情包吗？此操作不可恢复。`)) return;

    window.iphoneSimState.stickerCategories = window.iphoneSimState.stickerCategories.filter(c => !ids.includes(String(c.id)));

    if (window.iphoneSimState.contacts && window.iphoneSimState.contacts.length > 0) {
        window.iphoneSimState.contacts.forEach(contact => {
            if (contact.linkedStickerCategories && contact.linkedStickerCategories.length > 0) {
                contact.linkedStickerCategories = contact.linkedStickerCategories.filter(id => !ids.includes(String(id)) && !ids.includes(id));
            }
        });
    }

    if (ids.includes(String(window.iphoneSimState.currentStickerCategoryId))) {
        window.iphoneSimState.currentStickerCategoryId = 'all';
    }

    saveConfig();
    renderStickerTabs();
    renderStickerList();
    modal.classList.add('hidden');
    alert('已删除所选分类');
}

// --- 身份管理功能 ---

function openPersonaManage() {
    const list = document.getElementById('persona-list');
    list.innerHTML = '';

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    window.iphoneSimState.userPersonas.forEach(p => {
        const item = document.createElement('div');
        item.className = `persona-item`;
        item.innerHTML = `
            <div class="persona-info">
                <div class="persona-name">${p.name || '未命名身份'}</div>
            </div>
            <button class="ios-btn-small" style="margin-left: 10px;" onclick="event.stopPropagation(); window.editPersona('${p.id}')">设置</button>
        `;
        list.appendChild(item);
    });

    document.getElementById('persona-manage-modal').classList.remove('hidden');
}

window.editPersona = function(id) {
    document.getElementById('persona-manage-modal').classList.add('hidden');
    openPersonaEdit(parseInt(id));
}

function switchPersona(id) {
    window.iphoneSimState.currentUserPersonaId = id;
    saveConfig();
    renderMeTab();
    document.getElementById('persona-manage-modal').classList.add('hidden');
}

function openPersonaEdit(id = null) {
    currentEditingPersonaId = id;
    const modal = document.getElementById('persona-edit-modal');
    const title = document.getElementById('persona-modal-title');
    const deleteBtn = document.getElementById('delete-persona-btn');
    
    if (id) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === id);
        if (p) {
            title.textContent = '编辑身份信息';
            document.getElementById('persona-name').value = p.name || '';
            document.getElementById('persona-ai-prompt').value = p.aiPrompt || '';
            deleteBtn.style.display = 'block';
        }
    } else {
        title.textContent = '新建身份';
        document.getElementById('persona-name').value = '';
        document.getElementById('persona-ai-prompt').value = '';
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.remove('hidden');
}

function handleSavePersona() {
    const name = document.getElementById('persona-name').value;
    const aiPrompt = document.getElementById('persona-ai-prompt').value;

    if (currentEditingPersonaId) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === currentEditingPersonaId);
        if (p) {
            p.name = name;
            p.title = name;
            p.aiPrompt = aiPrompt;
        }
    } else {
        const newId = Date.now();
        const newPersona = {
            id: newId,
            title: name || '未命名身份',
            name: name || '未命名身份',
            aiPrompt,
            personaId: '',
            desc: '',
            avatar: '',
            bgImage: ''
        };
        window.iphoneSimState.userPersonas.push(newPersona);
        window.iphoneSimState.currentUserPersonaId = newId;
    }
    
    saveConfig();
    document.getElementById('persona-edit-modal').classList.add('hidden');
}

function handleDeletePersona() {
    if (!currentEditingPersonaId) return;
    if (confirm('确定要删除此身份吗？')) {
        window.iphoneSimState.userPersonas = window.iphoneSimState.userPersonas.filter(p => p.id !== currentEditingPersonaId);
        if (window.iphoneSimState.currentUserPersonaId === currentEditingPersonaId) {
            window.iphoneSimState.currentUserPersonaId = window.iphoneSimState.userPersonas.length > 0 ? window.iphoneSimState.userPersonas[0].id : null;
        }
        saveConfig();
        renderMeTab();
        document.getElementById('persona-edit-modal').classList.add('hidden');
    }
}

// 初始化监听器
function setupAppsListeners() {
    const closeWalletBtn = document.getElementById('close-wallet-screen');
    const walletRechargeBtn = document.getElementById('wallet-recharge-btn');
    const walletRechargeModal = document.getElementById('wallet-recharge-modal');
    const walletWithdrawBtn = document.getElementById('wallet-withdraw-btn');
    const walletWithdrawModal = document.getElementById('wallet-withdraw-modal');
    const closeWalletRechargeBtn = document.getElementById('close-recharge-modal');
    const closeWalletWithdrawBtn = document.getElementById('close-withdraw-modal');
    const doRechargeBtn = document.getElementById('do-recharge-btn');
    const doWithdrawBtn = document.getElementById('do-withdraw-btn');

    // Keep shared modals outside app containers so they can open from any page.
    const ensureGlobalModal = (modalEl) => {
        if (!modalEl) return null;
        if (modalEl.parentElement !== document.body) document.body.appendChild(modalEl);
        return modalEl;
    };
    ensureGlobalModal(walletRechargeModal);
    ensureGlobalModal(walletWithdrawModal);
    ensureGlobalModal(document.getElementById('bank-funding-source-modal'));

    if (closeWalletBtn) closeWalletBtn.addEventListener('click', () => document.getElementById('wallet-screen').classList.add('hidden'));
    if (walletRechargeBtn) walletRechargeBtn.addEventListener('click', () => {
        walletRechargeModal.classList.remove('hidden');
        const input = document.getElementById('recharge-amount');
        if (input) input.value = '';
    });
    if (closeWalletRechargeBtn) closeWalletRechargeBtn.addEventListener('click', () => walletRechargeModal.classList.add('hidden'));
    if (doRechargeBtn) doRechargeBtn.addEventListener('click', handleRecharge);
    if (walletWithdrawBtn) walletWithdrawBtn.addEventListener('click', () => {
        if (!walletWithdrawModal) return;
        walletWithdrawModal.classList.remove('hidden');
        const input = document.getElementById('withdraw-amount');
        if (input) input.value = '';
    });
    if (closeWalletWithdrawBtn) closeWalletWithdrawBtn.addEventListener('click', () => {
        if (walletWithdrawModal) walletWithdrawModal.classList.add('hidden');
    });
    if (doWithdrawBtn) doWithdrawBtn.addEventListener('click', handleWithdraw);

    const addMemoryBtn = document.getElementById('add-memory-btn');
    const manualSummaryBtn = document.getElementById('manual-summary-btn');
    const memorySettingsBtn = document.getElementById('memory-settings-btn');
    const addMemoryModal = document.getElementById('add-memory-modal');
    const closeAddMemoryBtn = document.getElementById('close-add-memory');
    const saveManualMemoryBtn = document.getElementById('save-manual-memory-btn');
    const manualSummaryModal = document.getElementById('manual-summary-modal');
    const closeManualSummaryBtn = document.getElementById('close-manual-summary');
    const doManualSummaryBtn = document.getElementById('do-manual-summary-btn');
    const memorySettingsModal = document.getElementById('memory-settings-modal');
    const closeMemorySettingsBtn = document.getElementById('close-memory-settings');
    const saveMemorySettingsBtn = document.getElementById('save-memory-settings-btn');
    const editMemoryModal = document.getElementById('edit-memory-modal');
    const closeEditMemoryBtn = document.getElementById('close-edit-memory');
    const saveEditedMemoryBtn = document.getElementById('save-edited-memory-btn');
    const closeMemoryBtn = document.getElementById('close-memory-app');
    const memoryFilterBtns = document.querySelectorAll('#memory-filter-bar .memory-filter-btn');
    const memorySelectToggleBtn = document.getElementById('memory-select-toggle-btn');
    const memorySelectAllBtn = document.getElementById('memory-select-all-btn');
    const memorySelectRecentBtn = document.getElementById('memory-select-recent-btn');
    const memorySelectInvertBtn = document.getElementById('memory-select-invert-btn');
    const memorySelectClearBtn = document.getElementById('memory-select-clear-btn');
    const memoryRefineSelectedBtn = document.getElementById('memory-refine-selected-btn');
    const memoryRefineConfirmModal = document.getElementById('memory-refine-confirm-modal');
    const closeMemoryRefineConfirmBtn = document.getElementById('close-memory-refine-confirm');
    const cancelMemoryRefineConfirmBtn = document.getElementById('cancel-memory-refine-confirm');
    const confirmMemoryRefineBtn = document.getElementById('confirm-memory-refine-btn');
    const memoryRefineSelectedCountModal = document.getElementById('memory-refine-selected-count-modal');
    const manualStateTagInput = document.querySelector('#manual-memory-tags input[value="state"]');
    const editStateTagInput = document.querySelector('#edit-memory-tags input[value="state"]');
    const manualStateOptions = document.getElementById('manual-memory-state-options');
    const editStateOptions = document.getElementById('edit-memory-state-options');

    if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => {
        document.getElementById('memory-app').classList.add('hidden');
        resetMemorySelection();
        if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
    });
    if (closeEditMemoryBtn) closeEditMemoryBtn.addEventListener('click', () => {
        editMemoryModal.classList.add('hidden');
        currentEditingMemoryId = null;
    });
    if (saveEditedMemoryBtn) saveEditedMemoryBtn.addEventListener('click', handleSaveEditedMemory);

    if (manualStateTagInput && manualStateOptions) {
        manualStateTagInput.addEventListener('change', () => {
            manualStateOptions.style.display = manualStateTagInput.checked ? '' : 'none';
        });
    }
    if (editStateTagInput && editStateOptions) {
        editStateTagInput.addEventListener('change', () => {
            editStateOptions.style.display = editStateTagInput.checked ? '' : 'none';
        });
    }

    if (memoryFilterBtns && memoryFilterBtns.length > 0) {
        memoryFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentMemoryFilter = btn.dataset.filter || 'all';
                if (currentMemoryFilter === 'candidate' && memorySelectMode) {
                    memorySelectMode = false;
                    selectedMemoryIds = new Set();
                }
                renderMemoryList();
            });
        });
    }

    if (memorySelectToggleBtn) {
        memorySelectToggleBtn.addEventListener('click', () => {
            window.toggleMemorySelectMode();
        });
    }
    if (memorySelectAllBtn) {
        memorySelectAllBtn.addEventListener('click', () => {
            window.selectAllMemoriesForRefine();
        });
    }
    if (memorySelectRecentBtn) {
        memorySelectRecentBtn.addEventListener('click', () => {
            window.selectRecentMemoriesForRefine(10);
        });
    }
    if (memorySelectInvertBtn) {
        memorySelectInvertBtn.addEventListener('click', () => {
            window.invertMemorySelectionForRefine();
        });
    }
    if (memorySelectClearBtn) {
        memorySelectClearBtn.addEventListener('click', () => {
            window.clearMemorySelectionForRefine();
        });
    }

    if (memoryRefineSelectedBtn) {
        memoryRefineSelectedBtn.addEventListener('click', () => {
            if (!memorySelectMode || selectedMemoryIds.size === 0) {
                showNotification('请先选择要精炼的记忆', 1600);
                return;
            }
            if (memoryRefineSelectedCountModal) {
                memoryRefineSelectedCountModal.textContent = String(selectedMemoryIds.size);
            }
            if (memoryRefineConfirmModal) {
                memoryRefineConfirmModal.classList.remove('hidden');
            }
        });
    }

    if (closeMemoryRefineConfirmBtn) {
        closeMemoryRefineConfirmBtn.addEventListener('click', () => {
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
        });
    }
    if (cancelMemoryRefineConfirmBtn) {
        cancelMemoryRefineConfirmBtn.addEventListener('click', () => {
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
        });
    }
    if (confirmMemoryRefineBtn) {
        confirmMemoryRefineBtn.addEventListener('click', async () => {
            const contactId = window.iphoneSimState.currentChatContactId;
            if (!contactId) return;
            const selectedIds = Array.from(selectedMemoryIds);
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
            await window.refineSelectedMemories(contactId, selectedIds);
        });
    }
    if (memoryRefineConfirmModal) {
        memoryRefineConfirmModal.addEventListener('click', (event) => {
            if (event.target === memoryRefineConfirmModal) {
                memoryRefineConfirmModal.classList.add('hidden');
            }
        });
    }

    if (addMemoryBtn) addMemoryBtn.addEventListener('click', () => {
        document.getElementById('manual-memory-content').value = '';
        document.querySelectorAll('#manual-memory-tags input[type="checkbox"]').forEach(input => {
            input.checked = input.value === 'long_term';
        });
        if (manualStateOptions) manualStateOptions.style.display = 'none';
        const manualStateReason = document.getElementById('manual-memory-state-reason');
        const manualStateTtl = document.getElementById('manual-memory-state-ttl');
        if (manualStateReason) manualStateReason.value = 'other';
        if (manualStateTtl) manualStateTtl.value = '7';
        addMemoryModal.classList.remove('hidden');
    });
    if (closeAddMemoryBtn) closeAddMemoryBtn.addEventListener('click', () => addMemoryModal.classList.add('hidden'));
    if (saveManualMemoryBtn) saveManualMemoryBtn.addEventListener('click', handleSaveManualMemory);

    if (manualSummaryBtn) manualSummaryBtn.addEventListener('click', openManualSummary);
    if (closeManualSummaryBtn) closeManualSummaryBtn.addEventListener('click', () => manualSummaryModal.classList.add('hidden'));
    if (doManualSummaryBtn) doManualSummaryBtn.addEventListener('click', handleManualSummary);

    if (memorySettingsBtn) memorySettingsBtn.addEventListener('click', openMemorySettings);
    if (closeMemorySettingsBtn) closeMemorySettingsBtn.addEventListener('click', () => memorySettingsModal.classList.add('hidden'));
    if (saveMemorySettingsBtn) saveMemorySettingsBtn.addEventListener('click', handleSaveMemorySettings);

    const closeLocationBtn = document.getElementById('close-location-app');
    const itinerarySettingsBtn = document.getElementById('itinerary-settings-btn');
    const itinerarySettingsModal = document.getElementById('itinerary-settings-modal');
    const closeItinerarySettingsBtn = document.getElementById('close-itinerary-settings');
    const saveItinerarySettingsBtn = document.getElementById('save-itinerary-settings-btn');
    const refreshLocationBtn = document.getElementById('refresh-location-btn');

    if (closeLocationBtn) closeLocationBtn.addEventListener('click', () => document.getElementById('location-app').classList.add('hidden'));
    if (refreshLocationBtn) refreshLocationBtn.addEventListener('click', () => generateDailyItinerary(true));
    if (itinerarySettingsBtn) itinerarySettingsBtn.addEventListener('click', openItinerarySettings);
    if (closeItinerarySettingsBtn) closeItinerarySettingsBtn.addEventListener('click', () => itinerarySettingsModal.classList.add('hidden'));
    if (saveItinerarySettingsBtn) saveItinerarySettingsBtn.addEventListener('click', handleSaveItinerarySettings);
    
    // Bind new UI elements to location app functions
    const closeLocationBtnNew = document.getElementById('close-location-btn-new');
    const itinerarySettingsBtnNew = document.getElementById('itinerary-settings-btn-new');
    const refreshLocationBtnNew = document.getElementById('refresh-location-btn-new');
    
    if (closeLocationBtnNew) closeLocationBtnNew.addEventListener('click', () => document.getElementById('location-app').classList.add('hidden'));
    if (itinerarySettingsBtnNew) itinerarySettingsBtnNew.addEventListener('click', openItinerarySettings);
    if (refreshLocationBtnNew) refreshLocationBtnNew.addEventListener('click', () => generateDailyItinerary(true));

    const musicWidget = document.getElementById('music-widget');
    const musicSettingsModal = document.getElementById('music-settings-modal');
    const closeMusicSettingsBtn = document.getElementById('close-music-settings');
    const saveMusicAppearanceBtn = document.getElementById('save-music-appearance');
    const saveNewSongBtn = document.getElementById('save-new-song');
    const tabMusicList = document.getElementById('tab-music-list');
    const tabMusicUpload = document.getElementById('tab-music-upload');
    const musicCoverUpload = document.getElementById('music-cover-upload');
    const musicWidgetBgUpload = document.getElementById('music-widget-bg-upload');
    const musicFileUpload = document.getElementById('music-file-upload');
    const uploadMusicBtn = document.getElementById('upload-music-btn');
    const lyricsFileUpload = document.getElementById('lyrics-file-upload');
    const uploadLyricsBtn = document.getElementById('upload-lyrics-btn');

    if (musicWidget) {
        musicWidget.addEventListener('click', (e) => {
            if (e.target.id === 'play-icon' || e.target.closest('.music-controls-mini')) {
                e.stopPropagation();
                toggleMusicPlay();
            } else {
                openMusicSettings();
            }
        });
    }

    if (closeMusicSettingsBtn) closeMusicSettingsBtn.addEventListener('click', () => musicSettingsModal.classList.add('hidden'));
    if (saveMusicAppearanceBtn) saveMusicAppearanceBtn.addEventListener('click', saveMusicAppearance);
    if (saveNewSongBtn) saveNewSongBtn.addEventListener('click', saveNewSong);
    if (tabMusicList) tabMusicList.addEventListener('click', () => switchMusicTab('list'));
    if (tabMusicUpload) tabMusicUpload.addEventListener('click', () => switchMusicTab('upload'));
    
    if (uploadMusicBtn && musicFileUpload) {
        uploadMusicBtn.addEventListener('click', () => musicFileUpload.click());
        musicFileUpload.addEventListener('change', handleMusicFileUpload);
    }

    if (musicCoverUpload) {
        const preview = document.getElementById('music-cover-preview');
        if (preview) preview.addEventListener('click', () => musicCoverUpload.click());
        musicCoverUpload.addEventListener('change', handleMusicCoverUpload);
    }

    if (musicWidgetBgUpload) {
        const preview = document.getElementById('music-widget-bg-preview');
        if (preview) preview.addEventListener('click', () => musicWidgetBgUpload.click());
        musicWidgetBgUpload.addEventListener('change', handleMusicWidgetBgUpload);
    }

    if (uploadLyricsBtn && lyricsFileUpload) {
        uploadLyricsBtn.addEventListener('click', () => lyricsFileUpload.click());
        lyricsFileUpload.addEventListener('change', handleLyricsUpload);
    }

    const polaroidWidget = document.getElementById('polaroid-widget');
    const polaroidImg1 = document.getElementById('polaroid-img-1');
    const polaroidText1 = document.getElementById('polaroid-text-1');
    const polaroidInput1 = document.getElementById('polaroid-input-1');
    const polaroidImg2 = document.getElementById('polaroid-img-2');
    const polaroidText2 = document.getElementById('polaroid-text-2');
    const polaroidInput2 = document.getElementById('polaroid-input-2');

    if (polaroidWidget) {
        if (polaroidImg1) {
            polaroidImg1.parentElement.addEventListener('click', (e) => {
                e.stopPropagation();
                polaroidInput1.click();
            });
        }
        if (polaroidImg2) {
            polaroidImg2.parentElement.addEventListener('click', (e) => {
                e.stopPropagation();
                polaroidInput2.click();
            });
        }
        if (polaroidText1) {
            polaroidText1.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePolaroidTextEdit(1);
            });
        }
        if (polaroidText2) {
            polaroidText2.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePolaroidTextEdit(2);
            });
        }
        if (polaroidInput1) polaroidInput1.addEventListener('change', (e) => handlePolaroidImageUpload(e, 1));
        if (polaroidInput2) polaroidInput2.addEventListener('change', (e) => handlePolaroidImageUpload(e, 2));
    }

    const switchPersonaBtn = document.getElementById('switch-persona-btn');
    const closePersonaManageBtn = document.getElementById('close-persona-manage');
    const addPersonaBtn = document.getElementById('add-persona-btn');
    const closePersonaEditBtn = document.getElementById('close-persona-edit');
    const savePersonaBtn = document.getElementById('save-persona-btn');
    const deletePersonaBtn = document.getElementById('delete-persona-btn');

    if (switchPersonaBtn) switchPersonaBtn.addEventListener('click', openPersonaManage);
    if (closePersonaManageBtn) closePersonaManageBtn.addEventListener('click', () => document.getElementById('persona-manage-modal').classList.add('hidden'));
    if (addPersonaBtn) addPersonaBtn.addEventListener('click', () => {
        document.getElementById('persona-manage-modal').classList.add('hidden');
        openPersonaEdit(null);
    });
    if (closePersonaEditBtn) closePersonaEditBtn.addEventListener('click', () => document.getElementById('persona-edit-modal').classList.add('hidden'));
    if (savePersonaBtn) savePersonaBtn.addEventListener('click', handleSavePersona);
    if (deletePersonaBtn) deletePersonaBtn.addEventListener('click', handleDeletePersona);

    const momentsBgInput = document.getElementById('moments-bg-input');
    if (momentsBgInput) momentsBgInput.addEventListener('change', (e) => handleMeImageUpload(e, 'momentsBgImage'));

    const postMomentModal = document.getElementById('post-moment-modal');
    const closePostMomentBtn = document.getElementById('close-post-moment');
    const doPostMomentBtn = document.getElementById('do-post-moment');
    const addMomentImageBtn = document.getElementById('add-moment-image-btn');
    const postMomentFileInput = document.getElementById('post-moment-file-input');
    const addVirtualImageBtn = document.getElementById('add-virtual-image-btn');

    if (closePostMomentBtn) closePostMomentBtn.addEventListener('click', () => postMomentModal.classList.add('hidden'));
    if (doPostMomentBtn) doPostMomentBtn.addEventListener('click', handlePostMoment);
    if (addMomentImageBtn) addMomentImageBtn.addEventListener('click', () => postMomentFileInput.click());
    if (addVirtualImageBtn) addVirtualImageBtn.addEventListener('click', handleVirtualImage);
    if (postMomentFileInput) postMomentFileInput.addEventListener('change', handlePostMomentImages);

    const personalMomentsScreen = document.getElementById('personal-moments-screen');
    const closePersonalMomentsBtn = document.getElementById('close-personal-moments');
    const personalMomentsBgInput = document.getElementById('personal-moments-bg-input');
    
    if (closePersonalMomentsBtn) closePersonalMomentsBtn.addEventListener('click', () => personalMomentsScreen.classList.add('hidden'));
    if (personalMomentsBgInput) personalMomentsBgInput.addEventListener('change', handlePersonalMomentsBgUpload);

    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-modal');
    const doTransferBtn = document.getElementById('do-transfer-btn');

    if (closeTransferBtn) closeTransferBtn.addEventListener('click', () => transferModal.classList.add('hidden'));
    // doTransferBtn listener moved to chat.js to avoid duplicate handling

    initStickerSystem();
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupAppsListeners);
}
