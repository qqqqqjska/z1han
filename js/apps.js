// 其他应用功能模块 (朋友圈, 钱包, 记忆, 行程, 音乐, 拍立得, 表情包, 身份)

let postMomentImages = [];
let currentEditingPersonaId = null;
let currentEditingMemoryId = null;

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

const MEMORY_KIND_LABEL_MAP = {
    short_term: '短期',
    long_term: '长期',
    state: '状态',
    fact: '具体信息'
};

const MEMORY_FACT_SUBTYPE_LABEL_MAP = {
    fact: '事实',
    preference: '偏好',
    dislike: '禁忌',
    plan: '计划',
    named_entity: '名称'
};

const MEMORY_STATE_TYPE_LABEL_MAP = {
    health: '健康',
    schedule: '日程',
    emotion: '情绪',
    relationship: '关系',
    other: '其他'
};

let memoryFilterMode = 'all';
let memorySelectionMode = false;
let selectedMemoryIds = new Set();
let currentRefineDraft = null;
const autoRefineLocks = {};

function escapeMemoryHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function ensureMemoriesArray() {
    if (!Array.isArray(window.iphoneSimState.memories)) {
        window.iphoneSimState.memories = [];
    }
    return window.iphoneSimState.memories;
}

function getMemoryTime(record) {
    const ts = Number(record && (record.updatedAt || record.createdAt || record.time));
    return Number.isFinite(ts) ? ts : Date.now();
}

function normalizeMemoryText(text) {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function computeBigramSimilarity(a, b) {
    const left = normalizeMemoryText(a).toLowerCase();
    const right = normalizeMemoryText(b).toLowerCase();
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right) || right.includes(left)) return 0.9;

    const toBigrams = (text) => {
        if (text.length < 2) return new Set([text]);
        const grams = new Set();
        for (let i = 0; i < text.length - 1; i++) {
            const gram = text.slice(i, i + 2);
            if (!/\s/.test(gram)) grams.add(gram);
        }
        return grams;
    };

    const aSet = toBigrams(left);
    const bSet = toBigrams(right);
    if (aSet.size === 0 || bSet.size === 0) return 0;

    let intersection = 0;
    aSet.forEach(item => {
        if (bSet.has(item)) intersection++;
    });
    const union = new Set([...aSet, ...bSet]).size || 1;
    return intersection / union;
}

function normalizeEntityName(name) {
    return String(name || '')
        .replace(/[“”"《》<>]/g, '')
        .replace(/\s+/g, '')
        .trim()
        .toLowerCase();
}

function ensureContactMemoryProfile(contact) {
    if (!contact || typeof contact !== 'object') return;
    if (!contact.memoryProfile || typeof contact.memoryProfile !== 'object') {
        contact.memoryProfile = {
            shortTermDays: 7,
            longTermLimit: 100,
            aiLimitDefault: 12,
            namedBackfilled: false
        };
        return;
    }

    if (!Number.isFinite(Number(contact.memoryProfile.shortTermDays))) contact.memoryProfile.shortTermDays = 7;
    if (!Number.isFinite(Number(contact.memoryProfile.longTermLimit))) contact.memoryProfile.longTermLimit = 100;
    if (!Number.isFinite(Number(contact.memoryProfile.aiLimitDefault))) contact.memoryProfile.aiLimitDefault = 12;
    if (typeof contact.memoryProfile.namedBackfilled !== 'boolean') contact.memoryProfile.namedBackfilled = false;
}

function inferFactSubtype(content) {
    const text = String(content || '');
    if (!text) return 'fact';
    if (/(喜欢|爱吃|爱喝|偏好|想要|钟爱)/.test(text)) return 'preference';
    if (/(不喜欢|讨厌|不吃|不喝|忌口|雷点|过敏)/.test(text)) return 'dislike';
    if (/(下周|明天|后天|计划|打算|准备|安排|要去)/.test(text)) return 'plan';
    return 'fact';
}

function inferStateType(content) {
    const text = String(content || '');
    if (/(生病|发烧|咳嗽|过敏|生理期|痛经|不舒服|头疼)/.test(text)) return 'health';
    if (/(考试|出差|旅行|放假|上班|开会|加班|课程|deadline|ddl)/i.test(text)) return 'schedule';
    if (/(开心|难过|焦虑|emo|紧张|生气|烦|伤心)/.test(text)) return 'emotion';
    if (/(和好|吵架|冷战|分手|复合|关系)/.test(text)) return 'relationship';
    return 'other';
}

function inferEntityType(name, sourceType = '') {
    const n = String(name || '');
    const st = String(sourceType || '').toLowerCase();
    if (st === 'delivery_share' || st === 'order_share' || st === 'order_progress') return 'item';
    if (st === 'shopping_gift' || st === 'gift_card') return 'gift';
    if (st === 'product_share') return 'item';
    if (/(面|饭|奶茶|咖啡|汉堡|披萨|火锅|药|胶囊|片)/.test(n)) return 'food';
    if (/(礼物|花束|蛋糕|巧克力|手办|耳机|项链|口红|玩偶)/.test(n)) return 'gift';
    if (/(店|餐厅|酒店|地铁|影院|公园|商场|医院|学校|公司)/.test(n)) return 'place';
    return 'other';
}

function getStateDefaultTtlMs(stateType) {
    const day = 24 * 60 * 60 * 1000;
    if (stateType === 'emotion') return 3 * day;
    if (stateType === 'schedule') return 14 * day;
    if (stateType === 'relationship') return 30 * day;
    return 7 * day;
}

function safeParseJson(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        return null;
    }
}

function pruneLongTermMemories(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    ensureContactMemoryProfile(contact);
    const longTermLimit = Math.max(1, Number(contact.memoryProfile.longTermLimit || 100));
    const memories = ensureMemoriesArray();

    const target = memories
        .filter(m => String(m.contactId) === String(contactId) && (m.kind === 'long_term' || m.pinned))
        .sort((a, b) => getMemoryTime(b) - getMemoryTime(a));

    if (target.length <= longTermLimit) return;

    const removable = target
        .filter(m => !m.pinned)
        .sort((a, b) => {
            const ai = Number.isFinite(Number(a.importance)) ? Number(a.importance) : 0;
            const bi = Number.isFinite(Number(b.importance)) ? Number(b.importance) : 0;
            if (ai !== bi) return ai - bi;
            return getMemoryTime(a) - getMemoryTime(b);
        });

    let toRemoveCount = target.length - longTermLimit;
    for (const item of removable) {
        if (toRemoveCount <= 0) break;
        item.kind = 'fact';
        item.factSubtype = item.factSubtype || 'fact';
        item.importance = Math.min(Number(item.importance || 0.5), 0.7);
        item.tags = Array.from(new Set([...(item.tags || []), 'archived_long_term']));
        item.updatedAt = Date.now();
        toRemoveCount--;
    }
}

function applyStateExpiry(contactId) {
    const now = Date.now();
    let changed = false;
    ensureMemoriesArray().forEach(memory => {
        if (String(memory.contactId) !== String(contactId)) return;
        if (memory.kind !== 'state') return;
        if (memory.stateActive === false) return;
        if (memory.endedAt) return;
        if (Number.isFinite(Number(memory.expiresAt)) && Number(memory.expiresAt) <= now) {
            memory.stateActive = false;
            memory.endedAt = now;
            memory.updatedAt = now;
            changed = true;
        }
    });
    if (changed) {
        const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(contactId));
        if (contact && Array.isArray(contact.importantStates)) {
            const activeStateTexts = new Set(
                ensureMemoriesArray()
                    .filter(m => String(m.contactId) === String(contactId))
                    .filter(m => m.kind === 'state' && m.stateActive !== false && !m.endedAt && (!m.expiresAt || Number(m.expiresAt) > now))
                    .map(m => String(m.content))
            );
            contact.importantStates = contact.importantStates.filter(text => activeStateTexts.has(String(text)));
        }
    }
    return changed;
}

function upsertContactEntityIndex(contact, record) {
    if (!contact || !record || record.factSubtype !== 'named_entity' || !record.exactName) return;
    if (!Array.isArray(contact.memoryEntityIndex)) contact.memoryEntityIndex = [];

    const normalized = normalizeEntityName(record.exactName);
    if (!normalized) return;

    let target = contact.memoryEntityIndex.find(item => normalizeEntityName(item.canonicalName) === normalized);
    if (!target && Array.isArray(record.aliases) && record.aliases.length > 0) {
        target = contact.memoryEntityIndex.find(item => {
            const aliases = Array.isArray(item.aliases) ? item.aliases : [];
            return aliases.some(alias => normalizeEntityName(alias) === normalized);
        });
    }

    const now = Date.now();
    if (!target) {
        contact.memoryEntityIndex.push({
            entityId: record.entityId || `entity_${now}_${Math.random().toString(36).slice(2, 8)}`,
            canonicalName: record.exactName,
            aliases: Array.from(new Set((record.aliases || []).filter(Boolean))),
            entityType: record.entityType || 'other',
            firstSeenAt: Number(record.createdAt || now),
            lastSeenAt: Number(record.updatedAt || now),
            lastConfirmedAt: Number(record.updatedAt || now),
            confidence: Number(record.confidence || 0.9),
            sourceMessageIds: record.sourceMessageId != null ? [record.sourceMessageId] : []
        });
        return;
    }

    target.lastSeenAt = now;
    target.lastConfirmedAt = now;
    target.confidence = Math.max(Number(target.confidence || 0), Number(record.confidence || 0));
    if (record.entityType) target.entityType = record.entityType;
    const mergedAliases = new Set([...(target.aliases || []), ...(record.aliases || [])].filter(Boolean));
    target.aliases = Array.from(mergedAliases);
    if (record.sourceMessageId != null) {
        if (!Array.isArray(target.sourceMessageIds)) target.sourceMessageIds = [];
        if (!target.sourceMessageIds.includes(record.sourceMessageId)) {
            target.sourceMessageIds.push(record.sourceMessageId);
        }
    }
}

function ensureMemoryRecordV2(input) {
    const now = Date.now();
    const raw = input && typeof input === 'object' ? input : {};
    const content = normalizeMemoryText(raw.content || raw.text || raw.exactName || '');
    const contactId = raw.contactId != null ? raw.contactId : window.iphoneSimState.currentChatContactId;
    if (contactId == null) return null;
    if (!content) return null;

    let kind = raw.kind;
    if (!kind) {
        if (raw.stateType || raw.stateActive || raw.endedAt) kind = 'state';
        else if (raw.factSubtype || raw.exactName) kind = 'fact';
        else kind = 'short_term';
    }
    if (!['short_term', 'long_term', 'state', 'fact'].includes(kind)) kind = 'short_term';

    const createdAt = Number.isFinite(Number(raw.createdAt || raw.time)) ? Number(raw.createdAt || raw.time) : now;
    const updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : createdAt;
    const source = raw.source || 'manual';

    const memory = {
        id: raw.id != null ? raw.id : `${createdAt}_${Math.random().toString(36).slice(2, 6)}`,
        contactId,
        content,
        createdAt,
        updatedAt,
        kind,
        source,
        importance: Number.isFinite(Number(raw.importance))
            ? Number(raw.importance)
            : (kind === 'long_term' ? 0.85 : (kind === 'state' ? 0.7 : 0.5)),
        pinned: !!raw.pinned,
        title: raw.title || '',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        range: raw.range || '',
        refinedFrom: Array.isArray(raw.refinedFrom) ? raw.refinedFrom : []
    };

    if (kind === 'fact') {
        memory.factSubtype = raw.factSubtype || (raw.exactName ? 'named_entity' : inferFactSubtype(content));
    }

    if (kind === 'state') {
        const stateType = raw.stateType || inferStateType(content);
        memory.stateType = stateType;
        memory.stateActive = raw.stateActive !== false && !raw.endedAt;
        memory.endedAt = Number.isFinite(Number(raw.endedAt)) ? Number(raw.endedAt) : null;
        if (memory.endedAt) memory.stateActive = false;
        memory.expiresAt = Number.isFinite(Number(raw.expiresAt))
            ? Number(raw.expiresAt)
            : (memory.stateActive ? createdAt + getStateDefaultTtlMs(stateType) : null);
    }

    if (raw.exactName) memory.exactName = String(raw.exactName).trim();
    if (raw.entityType) memory.entityType = String(raw.entityType);
    if (Array.isArray(raw.aliases)) memory.aliases = Array.from(new Set(raw.aliases.map(a => String(a)).filter(Boolean)));
    if (Number.isFinite(Number(raw.confidence))) memory.confidence = Number(raw.confidence);
    if (raw.sourceMessageId != null) memory.sourceMessageId = raw.sourceMessageId;
    if (raw.sourceMessageType != null) memory.sourceMessageType = String(raw.sourceMessageType);
    if (raw.entityId != null) memory.entityId = String(raw.entityId);

    return memory;
}

function findDuplicateMemory(record) {
    const memories = ensureMemoriesArray();
    if (record.factSubtype === 'named_entity' && record.exactName) {
        const normalized = normalizeEntityName(record.exactName);
        const recordType = String(record.entityType || 'other');
        return memories.find(item => {
            if (String(item.contactId) !== String(record.contactId)) return false;
            if (item.kind !== 'fact' || item.factSubtype !== 'named_entity') return false;
            const itemType = String(item.entityType || 'other');
            if (itemType !== recordType) return false;
            const selfName = normalizeEntityName(item.exactName || item.content);
            if (selfName && selfName === normalized) return true;
            const aliases = Array.isArray(item.aliases) ? item.aliases : [];
            return aliases.some(alias => normalizeEntityName(alias) === normalized);
        });
    }

    const normalized = normalizeMemoryText(record.content);
    return memories.find(item =>
        String(item.contactId) === String(record.contactId) &&
        item.kind === record.kind &&
        (item.factSubtype || '') === (record.factSubtype || '') &&
        (
            normalizeMemoryText(item.content) === normalized ||
            normalizeMemoryText(item.content).includes(normalized) ||
            normalized.includes(normalizeMemoryText(item.content)) ||
            computeBigramSimilarity(item.content, record.content) >= 0.82
        )
    );
}

function mirrorLegacyMemoryFields(contact, memory) {
    if (!contact) return;
    if (!Array.isArray(contact.userPerception)) contact.userPerception = [];
    if (!Array.isArray(contact.importantStates)) contact.importantStates = [];

    if (memory.kind === 'state' && memory.stateActive !== false) {
        if (!contact.importantStates.includes(memory.content)) {
            contact.importantStates.push(memory.content);
            if (contact.importantStates.length > 8) {
                contact.importantStates = contact.importantStates.slice(-8);
            }
        }
    }

    if (memory.kind === 'fact' && memory.factSubtype !== 'named_entity') {
        if (!contact.userPerception.some(item => item.includes(memory.content) || memory.content.includes(item))) {
            contact.userPerception.push(memory.content);
            if (contact.userPerception.length > 60) {
                contact.userPerception = contact.userPerception.slice(-60);
            }
        }
    }
}

window.addMemoryRecord = function(input, options = {}) {
    const record = ensureMemoryRecordV2(input);
    if (!record) return null;

    const memories = ensureMemoriesArray();
    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(record.contactId));
    if (contact) ensureContactMemoryProfile(contact);

    applyStateExpiry(record.contactId);

    const duplicate = findDuplicateMemory(record);
    if (duplicate) {
        duplicate.updatedAt = Date.now();
        duplicate.content = record.content || duplicate.content;
        duplicate.kind = record.kind || duplicate.kind;
        duplicate.source = record.source || duplicate.source;
        duplicate.importance = Math.max(Number(duplicate.importance || 0), Number(record.importance || 0));
        duplicate.pinned = !!duplicate.pinned || !!record.pinned;
        if (record.factSubtype) duplicate.factSubtype = record.factSubtype;
        if (record.stateType) duplicate.stateType = record.stateType;
        if (record.stateActive !== undefined) duplicate.stateActive = record.stateActive;
        if (record.expiresAt !== undefined) duplicate.expiresAt = record.expiresAt;
        if (record.endedAt !== undefined) duplicate.endedAt = record.endedAt;
        if (record.exactName) duplicate.exactName = record.exactName;
        if (record.entityType) duplicate.entityType = record.entityType;
        if (record.entityId) duplicate.entityId = record.entityId;
        if (Array.isArray(record.aliases) && record.aliases.length > 0) {
            duplicate.aliases = Array.from(new Set([...(duplicate.aliases || []), ...record.aliases]));
        }
        if (Number.isFinite(Number(record.confidence))) {
            duplicate.confidence = Math.max(Number(duplicate.confidence || 0), Number(record.confidence));
        }
        mirrorLegacyMemoryFields(contact, duplicate);
        upsertContactEntityIndex(contact, duplicate);
        pruneLongTermMemories(record.contactId);
        if (!options.skipSave) saveConfig();
        return duplicate;
    }

    memories.push(record);
    mirrorLegacyMemoryFields(contact, record);
    upsertContactEntityIndex(contact, record);
    pruneLongTermMemories(record.contactId);
    if (!options.skipSave) saveConfig();

    if (!options.skipAutoRefine && typeof window.refineMemories === 'function') {
        const blockedSources = new Set(['migration', 'auto_summary', 'refine_summary']);
        if (!blockedSources.has(record.source)) {
            setTimeout(() => {
                window.refineMemories(record.contactId, 'auto').catch(() => {});
            }, 80);
        }
    }

    return record;
};

window.applyEntityRenameOverride = function(contactId, oldName, newName) {
    const oldNorm = normalizeEntityName(oldName);
    const newNorm = normalizeEntityName(newName);
    if (!oldNorm || !newNorm) return false;
    if (oldNorm === newNorm) return false;

    let changed = false;
    const now = Date.now();
    ensureMemoriesArray().forEach(memory => {
        if (String(memory.contactId) !== String(contactId)) return;
        if (memory.kind !== 'fact' || memory.factSubtype !== 'named_entity') return;
        const current = normalizeEntityName(memory.exactName || memory.content);
        const aliases = Array.isArray(memory.aliases) ? memory.aliases : [];
        const aliasHit = aliases.some(alias => normalizeEntityName(alias) === oldNorm);
        if (current === oldNorm || aliasHit) {
            const prev = memory.exactName || memory.content;
            memory.exactName = newName;
            memory.content = memory.content.replace(prev, newName);
            memory.aliases = Array.from(new Set([...(memory.aliases || []), prev].filter(Boolean)));
            memory.updatedAt = now;
            changed = true;
        }
    });

    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(contactId));
    if (contact && Array.isArray(contact.memoryEntityIndex)) {
        contact.memoryEntityIndex.forEach(entity => {
            const current = normalizeEntityName(entity.canonicalName);
            const aliasHit = Array.isArray(entity.aliases) && entity.aliases.some(alias => normalizeEntityName(alias) === oldNorm);
            if (current === oldNorm || aliasHit) {
                entity.aliases = Array.from(new Set([...(entity.aliases || []), entity.canonicalName].filter(Boolean)));
                entity.canonicalName = newName;
                entity.lastConfirmedAt = now;
                entity.lastSeenAt = now;
                changed = true;
            }
        });
    }

    if (changed) saveConfig();
    return changed;
};

window.extractSpecificInfoFromMessage = function(message, contactId) {
    if (!message || contactId == null) return [];
    const extracted = [];
    const msgType = String(message.type || 'text');
    const text = typeof message.content === 'string' ? message.content : '';
    if (msgType === 'system_event' || msgType === 'live_sync_hidden') return extracted;
    if (/^\s*\[系统消息\]/.test(text)) return extracted;
    const payload = safeParseJson(text);

    const addEntity = (name, confidence = 0.9, sourceType = msgType, extra = {}) => {
        const clean = String(name || '').trim();
        if (!clean || clean.length < 2 || clean.length > 40) return;
        const record = window.addMemoryRecord({
            contactId,
            content: `具体名称：${clean}`,
            kind: 'fact',
            factSubtype: 'named_entity',
            exactName: clean,
            entityType: inferEntityType(clean, sourceType),
            confidence,
            source: extra.source || 'chat_extract',
            sourceMessageId: message.id,
            sourceMessageType: msgType,
            aliases: extra.aliases || []
        });
        if (record) extracted.push(record);
    };

    const addFact = (factText, subtype) => {
        const clean = normalizeMemoryText(factText);
        if (!clean) return;
        const record = window.addMemoryRecord({
            contactId,
            content: clean,
            kind: 'fact',
            factSubtype: subtype || inferFactSubtype(clean),
            source: 'chat_extract',
            sourceMessageId: message.id,
            sourceMessageType: msgType,
            importance: 0.65
        });
        if (record) extracted.push(record);
    };

    try {
        if (msgType === 'shopping_gift' || msgType === 'delivery_share' || msgType === 'order_share' || msgType === 'order_progress') {
            const data = payload || {};
            if (Array.isArray(data.items)) {
                data.items.forEach(item => {
                    if (item && item.title) addEntity(item.title, 0.98, msgType);
                });
            }
            if (data.shopName) addEntity(data.shopName, 0.9, msgType);
        } else if (msgType === 'gift_card') {
            const data = payload || {};
            if (data.title) addEntity(data.title, 0.98, msgType);
        } else if (msgType === 'product_share') {
            const data = payload || {};
            const title = data?.product?.title || data?.title;
            if (title) addEntity(title, 0.98, msgType);
        }
    } catch (error) {
        console.warn('[extractSpecificInfo] structured parse failed', error);
    }

    if (text) {
        const renameMatch = text.match(/(?:不是|不叫)\s*[“"'《]?([^“”"'《》\s，。！？,.!?]{1,24})[”"'》]?\s*(?:，|,|而是|是|叫)\s*[“"'《]?([^“”"'《》\s，。！？,.!?]{1,24})[”"'》]?/);
        if (renameMatch) {
            window.applyEntityRenameOverride(contactId, renameMatch[1], renameMatch[2]);
        }

        const quotePatterns = [/《([^》]{2,30})》/g, /“([^”]{2,30})”/g, /"([^"]{2,30})"/g];
        quotePatterns.forEach(reg => {
            let match;
            while ((match = reg.exec(text)) !== null) {
                addEntity(match[1], 0.75, 'text');
            }
        });

        const actionNamePattern = /(?:点了|买了|送了|吃了|喝了|看了|报名了|上了|用了|去了|在)\s*([^\s，。！？,.!?]{2,24})/g;
        let actionMatch;
        while ((actionMatch = actionNamePattern.exec(text)) !== null) {
            const candidate = actionMatch[1];
            if (candidate && !/^(一下|一个|一点|这个|那个|这里|那里)$/.test(candidate)) {
                addEntity(candidate, 0.68, 'text');
            }
        }

        if (/(喜欢|爱吃|爱喝|偏好)/.test(text)) addFact(text, 'preference');
        if (/(不喜欢|讨厌|忌口|过敏|雷点)/.test(text)) addFact(text, 'dislike');
        if (/(下周|明天|后天|计划|打算|准备|安排)/.test(text)) addFact(text, 'plan');
        if (/(生病|发烧|痛经|考试周|出差|假期|住院|不舒服)/.test(text)) {
            const stateText = text.length > 120 ? text.slice(0, 120) : text;
            window.addMemoryRecord({
                contactId,
                content: stateText,
                kind: 'state',
                stateType: inferStateType(stateText),
                source: 'chat_extract',
                sourceMessageId: message.id,
                sourceMessageType: msgType
            });
        }
    }

    return extracted;
};

window.buildMemoryContextForAI = function(contact, history = []) {
    if (!contact) {
        return { memoryContext: '', importantStateContext: '', userPerceptionContext: '' };
    }
    ensureContactMemoryProfile(contact);
    applyStateExpiry(contact.id);

    const now = Date.now();
    const memories = ensureMemoriesArray().filter(m => String(m.contactId) === String(contact.id));
    const shortDays = Math.max(1, Number(contact.memoryProfile.shortTermDays || 7));
    const shortCutoff = now - shortDays * 24 * 60 * 60 * 1000;
    const limit = contact.memorySendLimit && contact.memorySendLimit > 0
        ? contact.memorySendLimit
        : Math.max(1, Number(contact.memoryProfile.aiLimitDefault || 12));

    const activeStates = memories
        .filter(m => m.kind === 'state' && m.stateActive !== false && !m.endedAt && (!m.expiresAt || Number(m.expiresAt) > now))
        .sort((a, b) => getMemoryTime(b) - getMemoryTime(a));

    const recentConversationText = (history || [])
        .slice(-30)
        .map(msg => normalizeMemoryText(msg && msg.content ? msg.content : ''))
        .join(' ')
        .toLowerCase();

    const scoreShortTermRelevance = (memory) => {
        const content = normalizeMemoryText(memory.content || '').toLowerCase();
        if (!content || !recentConversationText) return 0;
        if (recentConversationText.includes(content) || content.includes(recentConversationText)) return 1;
        return computeBigramSimilarity(content, recentConversationText);
    };

    const shortTerm = memories
        .filter(m => m.kind === 'short_term')
        .filter(m => {
            const withinFloor = getMemoryTime(m) >= shortCutoff;
            if (withinFloor) return true; // 保底7天
            const relevance = scoreShortTermRelevance(m);
            return relevance >= 0.16; // 会话热区兜底
        })
        .sort((a, b) => {
            const scoreDiff = scoreShortTermRelevance(b) - scoreShortTermRelevance(a);
            if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
            return getMemoryTime(b) - getMemoryTime(a);
        });

    const longTerm = memories
        .filter(m => m.kind === 'long_term' || m.pinned)
        .sort((a, b) => {
            const ai = Number(a.importance || 0);
            const bi = Number(b.importance || 0);
            if (ai !== bi) return bi - ai;
            return getMemoryTime(b) - getMemoryTime(a);
        });

    const namedFacts = memories
        .filter(m => m.kind === 'fact' && m.factSubtype === 'named_entity' && (m.exactName || m.content))
        .sort((a, b) => getMemoryTime(b) - getMemoryTime(a));

    const otherFacts = memories
        .filter(m => m.kind === 'fact' && m.factSubtype !== 'named_entity')
        .sort((a, b) => getMemoryTime(b) - getMemoryTime(a));

    let remain = limit;
    const pick = (arr, maxCount) => {
        if (remain <= 0) return [];
        const count = Math.min(remain, maxCount, arr.length);
        remain -= count;
        return arr.slice(0, count);
    };

    const pickedState = pick(activeStates, 3);
    const pickedShort = pick(shortTerm, 4);
    const pickedLong = pick(longTerm, 3);
    const pickedNamed = pick(namedFacts, 4);
    const pickedFacts = pick(otherFacts, Math.max(remain, 0));

    let importantStateContext = '';
    if (pickedState.length > 0) {
        importantStateContext += '\n【当前重要状态 (时效性信息)】\n';
        pickedState.forEach(item => {
            const typeLabel = MEMORY_STATE_TYPE_LABEL_MAP[item.stateType] || '状态';
            importantStateContext += `- [${typeLabel}] ${item.content}\n`;
        });
    }

    let userPerceptionContext = '';
    if (pickedFacts.length > 0) {
        userPerceptionContext += '\n【关于用户的认知】\n';
        pickedFacts.forEach(item => {
            const subLabel = MEMORY_FACT_SUBTYPE_LABEL_MAP[item.factSubtype] || '信息';
            userPerceptionContext += `- [${subLabel}] ${item.content}\n`;
        });
    }

    let memoryContext = '';
    const timelineEntries = [...pickedShort, ...pickedLong].sort((a, b) => getMemoryTime(a) - getMemoryTime(b));
    if (timelineEntries.length > 0) {
        memoryContext += '\n【历史记忆 (已知事实)】\n';
        timelineEntries.forEach(item => {
            const date = new Date(getMemoryTime(item));
            const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const kindLabel = MEMORY_KIND_LABEL_MAP[item.kind] || '记忆';
            memoryContext += `- [${dateStr}][${kindLabel}] ${item.content}\n`;
        });
    }

    if (pickedNamed.length > 0) {
        memoryContext += '\n【具体名称记忆(严格)】\n';
        memoryContext += '⚠️ 以下名称必须保持一致，不可擅自改写或猜测；不确定时请用泛称。\n';
        pickedNamed.forEach(item => {
            const canonical = item.exactName || item.content;
            const aliases = Array.isArray(item.aliases) && item.aliases.length > 0 ? ` (别名: ${item.aliases.join(' / ')})` : '';
            memoryContext += `- ${canonical}${aliases}\n`;
        });
    }

    return { memoryContext, importantStateContext, userPerceptionContext };
};

window.applyNameConsistencyGuard = function(messagesList, contactId) {
    if (!Array.isArray(messagesList) || contactId == null) return messagesList;
    const named = ensureMemoriesArray().filter(m =>
        String(m.contactId) === String(contactId) &&
        m.kind === 'fact' &&
        m.factSubtype === 'named_entity' &&
        (m.exactName || m.content)
    );
    if (named.length === 0) return messagesList;

    const aliasBucket = new Map();
    const appendAlias = (alias, canonical) => {
        const key = String(alias || '').trim();
        const value = String(canonical || '').trim();
        if (!key || !value) return;
        if (!aliasBucket.has(key)) aliasBucket.set(key, new Set());
        aliasBucket.get(key).add(value);
    };
    named.forEach(item => {
        const canonical = String(item.exactName || item.content || '').trim();
        if (!canonical) return;
        appendAlias(canonical, canonical);
        const aliases = Array.isArray(item.aliases) ? item.aliases : [];
        aliases.forEach(alias => {
            const cleanAlias = String(alias || '').trim();
            if (cleanAlias) appendAlias(cleanAlias, canonical);
        });
    });

    const aliasMap = new Map();
    aliasBucket.forEach((canonicalSet, alias) => {
        if (canonicalSet.size === 1) {
            aliasMap.set(alias, Array.from(canonicalSet)[0]);
        } else {
            // 别名对应多个候选时，降级为泛称，避免错误命名
            aliasMap.set(alias, null);
        }
    });

    const escaped = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return messagesList.map(msg => {
        if (!msg) return msg;
        const type = String(msg.type || '').toLowerCase();
        const isTextLike = type === 'text' || type === '消息' || type === '';
        if (!isTextLike || typeof msg.content !== 'string') return msg;

        let next = msg.content;
        aliasMap.forEach((canonical, alias) => {
            if (!alias) return;
            if (canonical && alias === canonical) return;
            const re = new RegExp(escaped(alias), 'g');
            if (re.test(next)) {
                next = next.replace(re, canonical || '相关事项');
            }
        });

        return next === msg.content ? msg : { ...msg, content: next };
    });
};

// --- 记忆功能 ---

function openMemoryApp() {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;
    ensureContactMemoryProfile(contact);
    if (applyStateExpiry(contact.id)) saveConfig();
    
    const memoryApp = document.getElementById('memory-app');
    
    renderMemoryList();
    memoryApp.classList.remove('hidden');
}

function getVisibleMemoryIds() {
    if (!window.iphoneSimState.currentChatContactId) return [];
    return ensureMemoriesArray()
        .filter(m => String(m.contactId) === String(window.iphoneSimState.currentChatContactId))
        .filter(m => {
            if (memoryFilterMode === 'short_term') return m.kind === 'short_term';
            if (memoryFilterMode === 'long_term') return m.kind === 'long_term' || !!m.pinned;
            if (memoryFilterMode === 'state') return m.kind === 'state';
            if (memoryFilterMode === 'fact') return m.kind === 'fact';
            if (memoryFilterMode === 'refined') {
                return Array.isArray(m.refinedFrom) && m.refinedFrom.length > 0
                    || m.source === 'auto_summary'
                    || m.source === 'refine_summary';
            }
            return true;
        })
        .map(m => String(m.id));
}

function syncMemoryToolbarUI() {
    const countEl = document.getElementById('selected-memory-count');
    if (countEl) countEl.textContent = String(selectedMemoryIds.size);

    const toolbar = document.getElementById('memory-selection-toolbar');
    if (toolbar) toolbar.style.display = memorySelectionMode ? 'flex' : 'none';

    const toggleBtn = document.getElementById('toggle-memory-selection-btn');
    if (toggleBtn) toggleBtn.textContent = memorySelectionMode ? '退出多选' : '多选';

    const tabs = document.querySelectorAll('#memory-filter-tabs .memory-filter-btn');
    tabs.forEach(btn => {
        const mode = btn.getAttribute('data-filter-mode');
        btn.classList.toggle('active', mode === memoryFilterMode);
    });
}

window.setMemoryFilterMode = function(mode = 'all') {
    memoryFilterMode = String(mode || 'all');
    renderMemoryList();
};

window.toggleMemorySelectionMode = function(forceValue) {
    memorySelectionMode = typeof forceValue === 'boolean' ? forceValue : !memorySelectionMode;
    if (!memorySelectionMode) selectedMemoryIds.clear();
    renderMemoryList();
};

window.toggleMemorySelection = function(id, checked) {
    const key = String(id);
    if (checked) selectedMemoryIds.add(key);
    else selectedMemoryIds.delete(key);
    syncMemoryToolbarUI();
};

window.selectAllVisibleMemories = function() {
    const ids = getVisibleMemoryIds();
    ids.forEach(id => selectedMemoryIds.add(String(id)));
    renderMemoryList();
};

window.clearSelectedMemories = function() {
    selectedMemoryIds.clear();
    renderMemoryList();
};

window.saveRefineDraftFromModal = async function() {
    if (!currentRefineDraft) return;
    const modal = document.getElementById('refine-memory-modal');
    const summaryEl = document.getElementById('refine-summary-content');
    const list = document.getElementById('refine-highlights-list');
    const deleteCheckbox = document.getElementById('refine-delete-source');

    const highlights = [];
    if (list) {
        list.querySelectorAll('.refine-highlight-item').forEach(row => {
            const content = normalizeMemoryText(row.querySelector('[data-key="content"]')?.value || '');
            if (!content) return;
            highlights.push({
                content,
                targetKind: row.querySelector('[data-key="targetKind"]')?.value || 'fact',
                factSubtype: row.querySelector('[data-key="factSubtype"]')?.value || undefined,
                stateType: row.querySelector('[data-key="stateType"]')?.value || undefined,
                exactName: normalizeMemoryText(row.querySelector('[data-key="exactName"]')?.value || '') || undefined,
                entityType: row.querySelector('[data-key="entityType"]')?.value || undefined,
                importance: clamp01(row.querySelector('[data-key="importance"]')?.value, 0.7)
            });
        });
    }

    const payload = {
        ...currentRefineDraft,
        summary: normalizeMemoryText(summaryEl?.value || currentRefineDraft.summary || ''),
        highlights,
        deleteSources: deleteCheckbox ? !!deleteCheckbox.checked : true
    };

    const result = await window.commitRefineDraft(payload.contactId, payload, { source: 'refine_summary' });
    if (result?.ok) {
        if (modal) modal.classList.add('hidden');
        currentRefineDraft = null;
        selectedMemoryIds.clear();
        memorySelectionMode = false;
        renderMemoryList();
        showNotification('精炼并存档完成', 1800, 'success');
    } else {
        showNotification('精炼保存失败', 1800, 'error');
    }
};

window.closeRefineModal = function() {
    const modal = document.getElementById('refine-memory-modal');
    if (modal) modal.classList.add('hidden');
};

function syncManualMemoryFormByKind() {
    const kind = String(document.getElementById('manual-memory-kind')?.value || 'short_term');
    const factGroup = document.getElementById('manual-memory-fact-subtype')?.closest('.setting-group');
    const stateGroup = document.getElementById('manual-memory-state-type')?.closest('.setting-group');
    if (factGroup) factGroup.style.display = kind === 'fact' ? 'block' : 'none';
    if (stateGroup) stateGroup.style.display = kind === 'state' ? 'block' : 'none';
}

function handleSaveManualMemory() {
    const content = document.getElementById('manual-memory-content').value.trim();
    if (!content) {
        alert('请输入记忆内容');
        return;
    }

    if (!window.iphoneSimState.currentChatContactId) return;

    const kindEl = document.getElementById('manual-memory-kind');
    const factSubtypeEl = document.getElementById('manual-memory-fact-subtype');
    const stateTypeEl = document.getElementById('manual-memory-state-type');
    const importanceEl = document.getElementById('manual-memory-importance');

    const kind = kindEl ? String(kindEl.value || 'short_term') : 'short_term';
    const factSubtype = factSubtypeEl ? String(factSubtypeEl.value || '') : '';
    const stateType = stateTypeEl ? String(stateTypeEl.value || '') : '';
    const importance = importanceEl && importanceEl.value !== '' ? Number(importanceEl.value) : undefined;

    const saved = window.addMemoryRecord({
        contactId: window.iphoneSimState.currentChatContactId,
        content,
        kind,
        factSubtype: kind === 'fact' ? (factSubtype || undefined) : undefined,
        stateType: kind === 'state' ? (stateType || undefined) : undefined,
        importance: Number.isFinite(importance) ? Math.max(0, Math.min(1, importance)) : undefined,
        source: 'manual',
        pinned: kind === 'long_term'
    });

    if (!saved) {
        alert('记忆保存失败，请检查内容后重试');
        return;
    }

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
    showNotification('正在手动总结...');
    
    await generateSummary(contact, messagesToSummarize, range);
}

function openMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    document.getElementById('modal-memory-send-limit').value = contact.memorySendLimit || '';
    document.getElementById('memory-settings-modal').classList.remove('hidden');
}

function handleSaveMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    const limit = parseInt(document.getElementById('modal-memory-send-limit').value);
    contact.memorySendLimit = isNaN(limit) ? 0 : limit;
    
    saveConfig();
    document.getElementById('memory-settings-modal').classList.add('hidden');
    alert('设置已保存');
}

function renderMemoryList() {
    const list = document.getElementById('memory-list');
    const emptyState = document.getElementById('memory-empty');
    if (!list) return;

    list.innerHTML = '';
    
    if (!window.iphoneSimState.currentChatContactId) return;

    const now = Date.now();
    const contactMemories = ensureMemoriesArray()
        .filter(m => String(m.contactId) === String(window.iphoneSimState.currentChatContactId))
        .filter(m => {
            if (memoryFilterMode === 'short_term') return m.kind === 'short_term';
            if (memoryFilterMode === 'long_term') return m.kind === 'long_term' || !!m.pinned;
            if (memoryFilterMode === 'state') return m.kind === 'state';
            if (memoryFilterMode === 'fact') return m.kind === 'fact';
            if (memoryFilterMode === 'refined') {
                return Array.isArray(m.refinedFrom) && m.refinedFrom.length > 0
                    || m.source === 'auto_summary'
                    || m.source === 'refine_summary';
            }
            return true;
        });
    
    if (contactMemories.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';

    const sortedMemories = [...contactMemories].sort((a, b) => {
        const diff = getMemoryTime(b) - getMemoryTime(a);
        if (diff !== 0) return diff;
        return String(b.id).localeCompare(String(a.id));
    });

    sortedMemories.forEach(memory => {
        const item = document.createElement('div');
        item.className = 'archive-card';
        const selected = selectedMemoryIds.has(String(memory.id));
        
        const date = new Date(getMemoryTime(memory));
        const timeStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        let memoryType = MEMORY_KIND_LABEL_MAP[memory.kind] || '短期';
        if (memory.kind === 'state') {
            if (memory.stateActive === false || memory.endedAt) memoryType = '状态-已结束';
            else if (memory.expiresAt && Number(memory.expiresAt) <= now) memoryType = '状态-已过期';
            else memoryType = '状态-进行中';
        } else if (memory.kind === 'fact' && memory.factSubtype) {
            const subLabel = MEMORY_FACT_SUBTYPE_LABEL_MAP[memory.factSubtype] || memory.factSubtype;
            memoryType = `具体信息/${subLabel}`;
        } else if (memory.kind === 'long_term' || memory.pinned) {
            memoryType = memory.pinned ? '长期-置顶' : '长期';
        }

        let title = memory.title || 'Memory Fragment';
        if (!memory.title && memory.content) {
            title = memory.content.substring(0, 10);
        }

        const memoryIdToken = JSON.stringify(String(memory.id));
        const memoryMenuId = encodeURIComponent(String(memory.id));
        const selectionMarker = memorySelectionMode ? `
            <label style="display:flex; align-items:center; gap:4px; font-size:11px; color:#666;">
                <input type="checkbox" onchange="window.toggleMemorySelection(${memoryIdToken}, this.checked)" ${selected ? 'checked' : ''}>
                选择
            </label>
        ` : '';

        item.innerHTML = `
            <div class="card-top">
                <span class="ref-id">REF // ${memory.range || '0000'}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="status">${memoryType}</span>
                    ${selectionMarker}
                </div>
            </div>
            <div class="card-body" onclick="this.querySelector('p').classList.toggle('expanded'); event.stopPropagation();">
                <h3>${title}</h3>
                <p>${memory.content}</p>
            </div>
            <div class="card-footer">
                <div class="archive-actions" style="position: relative;">
                    <span style="cursor: pointer; margin-right: 10px; font-family: monospace; font-size: 10px; border: 1px solid #ccc; padding: 2px 5px; border-radius: 4px;" onclick="event.stopPropagation(); window.toggleMemoryActions(this, ${memoryIdToken})">OPTS</span>
                    <div class="memory-action-menu" id="memory-action-${memoryMenuId}" style="display: none; position: absolute; left: 0; bottom: 100%; background: white; border: 1px solid #eee; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 5px; z-index: 100;">
                        <div onclick="event.stopPropagation(); window.editMemory(${memoryIdToken}); window.toggleMemoryActions(null, ${memoryIdToken})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">编辑</div>
                        <div onclick="event.stopPropagation(); window.refineMemories(${JSON.stringify(String(window.iphoneSimState.currentChatContactId))}, 'single', [${memoryIdToken}]); window.toggleMemoryActions(null, ${memoryIdToken})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #4a5568; border-bottom: 1px solid #f5f5f5;">精炼</div>
                        <div onclick="event.stopPropagation(); window.toggleMemoryLongTerm(${memoryIdToken}); window.toggleMemoryActions(null, ${memoryIdToken})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">${memory.kind === 'long_term' || memory.pinned ? '取消长期' : '设为长期'}</div>
                        ${memory.kind === 'state' ? `<div onclick="event.stopPropagation(); window.endStateMemory(${memoryIdToken}); window.toggleMemoryActions(null, ${memoryIdToken})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">结束状态</div>` : ''}
                        <div onclick="event.stopPropagation(); window.deleteMemory(${memoryIdToken}); window.toggleMemoryActions(null, ${memoryIdToken})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #ff3b30;">删除</div>
                    </div>
                </div>
                <span>DATE: ${timeStr}</span>
            </div>
        `;
        
        item.addEventListener('click', function(e) {
            if (e.target.closest('.archive-actions') || e.target.closest('.memory-action-menu')) return;
            
            const isActive = this.classList.contains('is-active');
            
            document.querySelectorAll('.archive-card').forEach(card => {
                card.classList.remove('is-active');
            });
            
            if (!isActive) {
                this.classList.add('is-active');
            }
        });

        list.appendChild(item);
    });

    syncMemoryToolbarUI();
}

window.toggleMemoryActions = function(element, id) {
    const menuKey = encodeURIComponent(String(id));
    const allMenus = document.querySelectorAll('.memory-action-menu');
    allMenus.forEach(menu => {
        if (menu.id !== `memory-action-${menuKey}`) {
            menu.style.display = 'none';
        }
    });
    
    const menu = document.getElementById(`memory-action-${menuKey}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
    
    // Close when clicking outside
    if (menu && menu.style.display === 'block') {
        const closeMenu = function(e) {
            if (!menu.contains(e.target) && (!element || !element.contains(e.target))) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }
};

window.toggleMemoryLongTerm = function(id) {
    const memory = ensureMemoriesArray().find(m => String(m.id) === String(id));
    if (!memory) return;
    const now = Date.now();
    const isLong = memory.kind === 'long_term' || memory.pinned;
    if (isLong) {
        memory.pinned = false;
        if (memory.kind === 'long_term') {
            memory.kind = 'short_term';
            memory.importance = Math.min(Number(memory.importance || 0.5), 0.7);
        }
    } else {
        memory.kind = 'long_term';
        memory.pinned = true;
        memory.importance = Math.max(Number(memory.importance || 0.5), 0.85);
    }
    memory.updatedAt = now;
    pruneLongTermMemories(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.endStateMemory = function(id) {
    const memory = ensureMemoriesArray().find(m => String(m.id) === String(id));
    if (!memory || memory.kind !== 'state') return;
    const now = Date.now();
    memory.stateActive = false;
    memory.endedAt = now;
    memory.updatedAt = now;
    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(memory.contactId));
    if (contact && Array.isArray(contact.importantStates)) {
        contact.importantStates = contact.importantStates.filter(item => String(item) !== String(memory.content));
    }
    saveConfig();
    renderMemoryList();
};

function clamp01(value, fallback = 0.5) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.min(1, num));
}

function buildLocalRefineHighlights(records) {
    const output = [];
    const pushItem = (item) => {
        const content = normalizeMemoryText(item.content);
        if (!content) return;
        const duplicate = output.find(existing =>
            computeBigramSimilarity(existing.content, content) >= 0.9 &&
            String(existing.targetKind || '') === String(item.targetKind || '')
        );
        if (duplicate) return;
        output.push({ ...item, content });
    };

    records.forEach(record => {
        const content = normalizeMemoryText(record.content);
        if (!content) return;
        if (record.kind === 'state') {
            pushItem({
                content,
                targetKind: 'state',
                stateType: record.stateType || inferStateType(content),
                importance: clamp01(record.importance, 0.72)
            });
            return;
        }
        if (record.kind === 'fact') {
            const isNamed = record.factSubtype === 'named_entity' || !!record.exactName;
            pushItem({
                content,
                targetKind: 'fact',
                factSubtype: isNamed ? 'named_entity' : (record.factSubtype || inferFactSubtype(content)),
                exactName: isNamed ? (record.exactName || content.replace(/^具体名称[:：]\s*/, '')) : undefined,
                entityType: isNamed ? (record.entityType || inferEntityType(record.exactName || content, record.sourceMessageType || 'text')) : undefined,
                importance: clamp01(record.importance, isNamed ? 0.92 : 0.78)
            });
            return;
        }

        if (record.kind === 'long_term' || record.pinned) {
            pushItem({
                content,
                targetKind: 'long_term',
                importance: clamp01(record.importance, 0.86),
                pinned: !!record.pinned
            });
            return;
        }

        // short_term / legacy fallback route
        if (/(生病|发烧|痛经|考试周|出差|住院|不舒服|情绪|焦虑|加班|请假)/.test(content)) {
            pushItem({
                content,
                targetKind: 'state',
                stateType: inferStateType(content),
                importance: 0.72
            });
        } else if (/(喜欢|爱吃|偏好|不喜欢|讨厌|忌口|计划|打算|安排|下周|明天|后天)/.test(content)) {
            pushItem({
                content,
                targetKind: 'fact',
                factSubtype: inferFactSubtype(content),
                importance: 0.76
            });
        } else {
            pushItem({
                content,
                targetKind: 'long_term',
                importance: 0.7
            });
        }
    });

    return output.slice(0, 12);
}

async function tryBuildAiRefineDraft(contact, records) {
    if (!contact || !Array.isArray(records) || records.length === 0) return null;
    const settings = window.iphoneSimState.aiSettings2?.url
        ? window.iphoneSimState.aiSettings2
        : window.iphoneSimState.aiSettings;
    if (!settings || !settings.url || !settings.key) return null;

    const payloadLines = records.map((record, index) => {
        const when = new Date(getMemoryTime(record)).toISOString();
        return `${index + 1}. [${record.kind || 'short_term'}][${when}] ${record.content}`;
    }).join('\n');

    const systemPrompt = '你是记忆精炼助手。请将输入记忆压缩为简洁总结，并输出结构化 highlights。仅输出 JSON。';
    const userPrompt = `请输出 JSON，格式如下：
{
  "summary": "字符串",
  "highlights": [
    {"content":"字符串","targetKind":"state|short_term|long_term|fact","factSubtype":"fact|preference|dislike|plan|named_entity","stateType":"health|schedule|emotion|relationship|other","importance":0.0-1.0,"exactName":"可选","entityType":"可选"}
  ]
}

联系人：${contact.name || '联系人'}
待精炼记忆：
${payloadLines}`;

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
                temperature: 0.2
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const raw = String(data?.choices?.[0]?.message?.content || '').trim();
        if (!raw) return null;
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        const parsed = JSON.parse(raw.slice(start, end + 1));
        if (!parsed || typeof parsed !== 'object') return null;
        const summary = normalizeMemoryText(parsed.summary || '');
        const highlightsRaw = Array.isArray(parsed.highlights) ? parsed.highlights : [];
        const highlights = highlightsRaw
            .map(item => ({
                content: normalizeMemoryText(item.content || ''),
                targetKind: ['short_term', 'long_term', 'state', 'fact'].includes(item.targetKind) ? item.targetKind : 'fact',
                factSubtype: item.factSubtype,
                stateType: item.stateType,
                importance: clamp01(item.importance, 0.7),
                exactName: item.exactName ? String(item.exactName).trim() : undefined,
                entityType: item.entityType ? String(item.entityType).trim() : undefined
            }))
            .filter(item => item.content);
        if (!summary && highlights.length === 0) return null;
        return { summary, highlights };
    } catch (error) {
        console.warn('[memory-refine] ai draft failed, fallback to local', error);
        return null;
    }
}

window.buildRefineDraft = async function(contactId, selectedIds = []) {
    if (contactId == null) return null;
    const selectedSet = new Set((selectedIds || []).map(id => String(id)));
    const sourceRecords = ensureMemoriesArray()
        .filter(record => String(record.contactId) === String(contactId) && selectedSet.has(String(record.id)))
        .sort((a, b) => getMemoryTime(a) - getMemoryTime(b));
    if (sourceRecords.length === 0) return null;

    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(contactId));
    const aiDraft = await tryBuildAiRefineDraft(contact, sourceRecords);
    const localHighlights = buildLocalRefineHighlights(sourceRecords);
    const highlights = (aiDraft && Array.isArray(aiDraft.highlights) && aiDraft.highlights.length > 0)
        ? aiDraft.highlights
        : localHighlights;

    let summary = '';
    if (aiDraft && aiDraft.summary) {
        summary = aiDraft.summary;
    } else {
        const snippets = sourceRecords
            .map(item => normalizeMemoryText(item.content).replace(/^【[^】]+】/, ''))
            .filter(Boolean)
            .slice(0, 6);
        summary = `精炼了${sourceRecords.length}条记忆：${snippets.join('；')}`;
        if (summary.length > 220) summary = summary.slice(0, 220) + '...';
    }

    return {
        contactId,
        selectedIds: Array.from(selectedSet),
        sourceCount: sourceRecords.length,
        summary,
        highlights,
        deleteSources: true,
        generatedAt: Date.now()
    };
};

window.commitRefineDraft = async function(contactId, draft, options = {}) {
    if (contactId == null || !draft || typeof draft !== 'object') {
        return { ok: false, error: 'invalid_draft' };
    }

    const memoriesBackup = JSON.parse(JSON.stringify(ensureMemoriesArray()));
    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(contactId));
    const contactBackup = contact ? {
        userPerception: JSON.parse(JSON.stringify(contact.userPerception || [])),
        importantStates: JSON.parse(JSON.stringify(contact.importantStates || [])),
        memoryEntityIndex: JSON.parse(JSON.stringify(contact.memoryEntityIndex || []))
    } : null;

    const selectedSet = new Set((draft.selectedIds || []).map(id => String(id)));
    const refinedFrom = Array.from(selectedSet);
    const saveSource = options.source || (draft.mode === 'auto' ? 'auto_summary' : 'refine_summary');

    try {
        const createdIds = [];
        const summaryText = normalizeMemoryText(draft.summary || '');
        if (summaryText) {
            const summaryRecord = window.addMemoryRecord({
                contactId,
                content: summaryText,
                title: '精炼总结',
                kind: 'long_term',
                source: saveSource,
                importance: 0.9,
                tags: ['refined_summary'],
                refinedFrom
            }, { skipSave: true, skipAutoRefine: true });
            if (summaryRecord) createdIds.push(String(summaryRecord.id));
        }

        const highlights = Array.isArray(draft.highlights) ? draft.highlights : [];
        highlights.forEach(item => {
            const content = normalizeMemoryText(item.content || '');
            if (!content) return;
            const targetKind = ['short_term', 'long_term', 'state', 'fact'].includes(item.targetKind)
                ? item.targetKind
                : 'fact';
            const base = {
                contactId,
                content,
                kind: targetKind,
                source: saveSource,
                importance: clamp01(item.importance, targetKind === 'long_term' ? 0.82 : 0.72),
                refinedFrom
            };
            if (targetKind === 'fact') {
                base.factSubtype = item.factSubtype || (item.exactName ? 'named_entity' : inferFactSubtype(content));
                if (base.factSubtype === 'named_entity') {
                    base.exactName = item.exactName || content.replace(/^具体名称[:：]\s*/, '');
                    base.entityType = item.entityType || inferEntityType(base.exactName, 'text');
                    base.confidence = clamp01(item.confidence, 0.88);
                }
            } else if (targetKind === 'state') {
                base.stateType = item.stateType || inferStateType(content);
                base.stateActive = item.stateActive !== false;
                base.expiresAt = item.stateActive === false ? null : Date.now() + getStateDefaultTtlMs(base.stateType);
            } else if (targetKind === 'long_term') {
                base.pinned = !!item.pinned;
            }

            const created = window.addMemoryRecord(base, { skipSave: true, skipAutoRefine: true });
            if (created) createdIds.push(String(created.id));
        });

        let deletedCount = 0;
        if (draft.deleteSources !== false && selectedSet.size > 0) {
            const before = ensureMemoriesArray().length;
            window.iphoneSimState.memories = ensureMemoriesArray()
                .filter(record => !(String(record.contactId) === String(contactId) && selectedSet.has(String(record.id))));
            deletedCount = before - window.iphoneSimState.memories.length;
        }

        saveConfig();
        if (window.iphoneSimState.currentChatContactId === contactId) {
            renderMemoryList();
        }
        return {
            ok: true,
            createdCount: createdIds.length,
            deletedCount
        };
    } catch (error) {
        window.iphoneSimState.memories = memoriesBackup;
        if (contact && contactBackup) {
            contact.userPerception = contactBackup.userPerception;
            contact.importantStates = contactBackup.importantStates;
            contact.memoryEntityIndex = contactBackup.memoryEntityIndex;
        }
        console.error('[memory-refine] commit failed, rolled back', error);
        return { ok: false, error: error.message || 'commit_failed' };
    }
};

window.refineMemories = async function(contactId, mode = 'auto', selectedIds = []) {
    const finalContactId = contactId != null ? contactId : window.iphoneSimState.currentChatContactId;
    if (finalContactId == null) return null;
    const contact = window.iphoneSimState.contacts.find(c => String(c.id) === String(finalContactId));
    if (!contact) return null;
    ensureContactMemoryProfile(contact);

    let ids = Array.isArray(selectedIds) ? selectedIds.map(id => String(id)) : [];
    if (mode === 'single' && ids.length === 0) return null;

    if (mode === 'batch' && ids.length === 0) {
        showNotification('请先选择要精炼的记忆', 1600);
        return null;
    }

    if (mode === 'auto') {
        if (autoRefineLocks[finalContactId]) return null;
        autoRefineLocks[finalContactId] = true;
        try {
            const now = Date.now();
            const shortDays = Math.max(1, Number(contact.memoryProfile.shortTermDays || 7));
            const shortCutoff = now - shortDays * 24 * 60 * 60 * 1000;
            const candidates = ensureMemoriesArray()
                .filter(record => String(record.contactId) === String(finalContactId))
                .filter(record => record.kind === 'short_term')
                .filter(record => getMemoryTime(record) >= shortCutoff)
                .filter(record => !['auto_summary', 'refine_summary', 'migration'].includes(String(record.source || '')))
                .sort((a, b) => getMemoryTime(b) - getMemoryTime(a));
            if (candidates.length < 3) return null;
            ids = candidates.slice(0, 6).map(item => String(item.id));
            const autoDraft = await window.buildRefineDraft(finalContactId, ids);
            if (!autoDraft) return null;
            autoDraft.mode = 'auto';
            autoDraft.deleteSources = false; // short-term 保底，不在自动精炼里删源
            return window.commitRefineDraft(finalContactId, autoDraft, { source: 'auto_summary' });
        } finally {
            autoRefineLocks[finalContactId] = false;
        }
    }

    const draft = await window.buildRefineDraft(finalContactId, ids);
    if (!draft) {
        showNotification('未找到可精炼的记忆', 1600);
        return null;
    }
    draft.mode = mode;

    // 如果页面已接入精炼弹窗，则保留草稿让 UI 编辑；否则直接提交。
    const refineModal = document.getElementById('refine-memory-modal');
    if (refineModal) {
        currentRefineDraft = draft;
        const summaryEl = document.getElementById('refine-summary-content');
        const deleteCheckbox = document.getElementById('refine-delete-source');
        if (summaryEl) summaryEl.value = draft.summary || '';
        if (deleteCheckbox) deleteCheckbox.checked = draft.deleteSources !== false;
        const list = document.getElementById('refine-highlights-list');
        if (list) {
            list.innerHTML = '';
            draft.highlights.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'refine-highlight-item';
                row.innerHTML = `
                    <div style="display:flex; gap:8px; margin-bottom:6px;">
                        <select data-key="targetKind" style="flex:1;">
                            <option value="fact">具体信息</option>
                            <option value="state">状态</option>
                            <option value="long_term">长期</option>
                            <option value="short_term">短期</option>
                        </select>
                        <input data-key="importance" type="number" min="0" max="1" step="0.05" style="width:80px;" value="${clamp01(item.importance, 0.7)}">
                    </div>
                    <div style="display:flex; gap:8px; margin-bottom:6px;">
                        <select data-key="factSubtype" style="flex:1;">
                            <option value="fact">事实</option>
                            <option value="preference">偏好</option>
                            <option value="dislike">禁忌</option>
                            <option value="plan">计划</option>
                            <option value="named_entity">特定名称</option>
                        </select>
                        <select data-key="stateType" style="flex:1;">
                            <option value="other">状态类型</option>
                            <option value="health">健康</option>
                            <option value="schedule">日程</option>
                            <option value="emotion">情绪</option>
                            <option value="relationship">关系</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:8px; margin-bottom:6px;">
                        <input data-key="exactName" type="text" style="flex:1;" placeholder="特定名称(可选)">
                        <select data-key="entityType" style="width:120px;">
                            <option value="">实体类型</option>
                            <option value="item">物品</option>
                            <option value="food">食物</option>
                            <option value="gift">礼物</option>
                            <option value="place">地点</option>
                            <option value="person">人物</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <textarea data-key="content" style="height:64px; width:100%; margin-bottom:6px;"></textarea>
                `;
                const kindSel = row.querySelector('select[data-key="targetKind"]');
                if (kindSel) kindSel.value = item.targetKind || 'fact';
                const factSubtypeSel = row.querySelector('select[data-key="factSubtype"]');
                if (factSubtypeSel) factSubtypeSel.value = item.factSubtype || 'fact';
                const stateTypeSel = row.querySelector('select[data-key="stateType"]');
                if (stateTypeSel) stateTypeSel.value = item.stateType || 'other';
                const exactNameEl = row.querySelector('input[data-key="exactName"]');
                if (exactNameEl) exactNameEl.value = item.exactName || '';
                const entityTypeSel = row.querySelector('select[data-key="entityType"]');
                if (entityTypeSel) entityTypeSel.value = item.entityType || '';
                const contentEl = row.querySelector('textarea[data-key="content"]');
                if (contentEl) contentEl.value = item.content || '';
                row.dataset.index = String(idx);
                list.appendChild(row);
            });
        }
        refineModal.classList.remove('hidden');
        return { ok: true, draftOnly: true };
    }

    const result = await window.commitRefineDraft(finalContactId, draft, { source: 'refine_summary' });
    if (result?.ok) showNotification('记忆精炼完成', 1500, 'success');
    return result;
};

window.editMemory = function(id) {
    const memory = ensureMemoriesArray().find(m => String(m.id) === String(id));
    if (!memory) return;

    currentEditingMemoryId = String(id);
    document.getElementById('edit-memory-content').value = memory.content;
    document.getElementById('edit-memory-modal').classList.remove('hidden');
};

function handleSaveEditedMemory() {
    if (!currentEditingMemoryId) return;

    const content = document.getElementById('edit-memory-content').value.trim();
    if (!content) {
        alert('记忆内容不能为空');
        return;
    }

    const memory = ensureMemoriesArray().find(m => String(m.id) === String(currentEditingMemoryId));
    if (memory) {
        memory.content = content;
        memory.updatedAt = Date.now();
        saveConfig();
        renderMemoryList();
        document.getElementById('edit-memory-modal').classList.add('hidden');
    }
    currentEditingMemoryId = null;
}

window.deleteMemory = function(id) {
    if (confirm('确定要删除这条记忆吗？')) {
        window.iphoneSimState.memories = ensureMemoriesArray().filter(m => String(m.id) !== String(id));
        saveConfig();
        renderMemoryList();
    }
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

        showNotification('正在总结...');
        await generateSummary(contact, messagesToSummarize, range);
    }
}

async function generateSummary(contact, messages, range) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) {
        console.log('未配置副API，无法自动总结');
        showNotification('未配置API', 2000);
        return;
    }

    const textMessages = messages.filter(m => m.type === 'text' && !m.content.startsWith('['));
    if (textMessages.length === 0) {
        document.getElementById('summary-notification').classList.add('hidden');
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

    const systemPrompt = `你是一个即时通讯软件的聊天记录总结助手。
请阅读以下聊天记录，并提取出其中重要的信息、事实、用户偏好或发生的事件，生成一条简练的“记忆”。
记忆应该是陈述句，包含关键信息。
请务必总结 ${userName} 和 ${contact.name} 聊天的具体内容，不要只总结重要信息。
如果聊天记录中没有值得记忆的重要信息（例如只是简单的问候或无意义的对话），请返回 "无"。
不要包含“聊天记录显示”、“用户说”等前缀，直接陈述事实。

【重要要求】：
请务必在记忆中包含事情发生的具体时间点（YYYY年MM月DD日 HH:mm）。
请将聊天中的相对时间（如“今天”、“刚才”、“昨天”）根据当前参考时间转换为绝对时间。
参考时间：${dateStr} ${timeStr}`;

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
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let summary = data.choices[0].message.content.trim();

        if (summary && summary !== '无' && summary !== '无。') {
            window.addMemoryRecord({
                contactId: contact.id,
                content: summary,
                kind: 'short_term',
                source: 'auto_summary',
                range: range,
                importance: 0.72
            });
            
            if (!document.getElementById('memory-app').classList.contains('hidden')) {
                renderMemoryList();
            }
            
            showNotification('总结完成', 2000, 'success');
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
    const memoryFilterBtns = document.querySelectorAll('#memory-filter-tabs .memory-filter-btn');
    const toggleMemorySelectionBtn = document.getElementById('toggle-memory-selection-btn');
    const selectAllMemoriesBtn = document.getElementById('select-all-memories-btn');
    const clearSelectedMemoriesBtn = document.getElementById('clear-selected-memories-btn');
    const refineSelectedMemoriesBtn = document.getElementById('refine-selected-memories-btn');
    const openManualSummaryBtn = document.getElementById('open-manual-summary-btn');
    const closeRefineMemoryBtn = document.getElementById('close-refine-memory');
    const saveRefineMemoryBtn = document.getElementById('save-refine-memory-btn');
    const addRefineHighlightBtn = document.getElementById('add-refine-highlight-btn');
    const manualMemoryKind = document.getElementById('manual-memory-kind');

    if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => document.getElementById('memory-app').classList.add('hidden'));
    if (closeEditMemoryBtn) closeEditMemoryBtn.addEventListener('click', () => editMemoryModal.classList.add('hidden'));
    if (saveEditedMemoryBtn) saveEditedMemoryBtn.addEventListener('click', handleSaveEditedMemory);

    if (addMemoryBtn) addMemoryBtn.addEventListener('click', () => {
        document.getElementById('manual-memory-content').value = '';
        const kindEl = document.getElementById('manual-memory-kind');
        const factSubtypeEl = document.getElementById('manual-memory-fact-subtype');
        const stateTypeEl = document.getElementById('manual-memory-state-type');
        const importanceEl = document.getElementById('manual-memory-importance');
        if (kindEl) kindEl.value = 'short_term';
        if (factSubtypeEl) factSubtypeEl.value = 'fact';
        if (stateTypeEl) stateTypeEl.value = 'other';
        if (importanceEl) importanceEl.value = '';
        syncManualMemoryFormByKind();
        addMemoryModal.classList.remove('hidden');
    });
    if (closeAddMemoryBtn) closeAddMemoryBtn.addEventListener('click', () => addMemoryModal.classList.add('hidden'));
    if (saveManualMemoryBtn) saveManualMemoryBtn.addEventListener('click', handleSaveManualMemory);

    if (manualSummaryBtn) manualSummaryBtn.addEventListener('click', async () => {
        if (!memorySelectionMode) {
            window.toggleMemorySelectionMode(true);
            showNotification('已进入批量精炼模式，请选择记忆', 1800);
            return;
        }
        const ids = Array.from(selectedMemoryIds);
        if (ids.length === 0) {
            showNotification('请先选择要精炼的记忆', 1600);
            return;
        }
        await window.refineMemories(window.iphoneSimState.currentChatContactId, 'batch', ids);
    });
    if (closeManualSummaryBtn) closeManualSummaryBtn.addEventListener('click', () => manualSummaryModal.classList.add('hidden'));
    if (doManualSummaryBtn) doManualSummaryBtn.addEventListener('click', handleManualSummary);
    if (openManualSummaryBtn) openManualSummaryBtn.addEventListener('click', openManualSummary);

    if (memorySettingsBtn) memorySettingsBtn.addEventListener('click', openMemorySettings);
    if (closeMemorySettingsBtn) closeMemorySettingsBtn.addEventListener('click', () => memorySettingsModal.classList.add('hidden'));
    if (saveMemorySettingsBtn) saveMemorySettingsBtn.addEventListener('click', handleSaveMemorySettings);
    if (manualMemoryKind) manualMemoryKind.addEventListener('change', syncManualMemoryFormByKind);

    if (memoryFilterBtns && memoryFilterBtns.length > 0) {
        memoryFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-filter-mode') || 'all';
                window.setMemoryFilterMode(mode);
            });
        });
    }
    if (toggleMemorySelectionBtn) toggleMemorySelectionBtn.addEventListener('click', () => window.toggleMemorySelectionMode());
    if (selectAllMemoriesBtn) selectAllMemoriesBtn.addEventListener('click', () => window.selectAllVisibleMemories());
    if (clearSelectedMemoriesBtn) clearSelectedMemoriesBtn.addEventListener('click', () => window.clearSelectedMemories());
    if (refineSelectedMemoriesBtn) {
        refineSelectedMemoriesBtn.addEventListener('click', async () => {
            const ids = Array.from(selectedMemoryIds);
            if (ids.length === 0) {
                showNotification('请先选择记忆', 1600);
                return;
            }
            await window.refineMemories(window.iphoneSimState.currentChatContactId, 'batch', ids);
        });
    }
    if (closeRefineMemoryBtn) closeRefineMemoryBtn.addEventListener('click', window.closeRefineModal);
    if (saveRefineMemoryBtn) saveRefineMemoryBtn.addEventListener('click', window.saveRefineDraftFromModal);
    if (addRefineHighlightBtn) {
        addRefineHighlightBtn.addEventListener('click', () => {
            const list = document.getElementById('refine-highlights-list');
            if (!list) return;
            const row = document.createElement('div');
            row.className = 'refine-highlight-item';
            row.innerHTML = `
                <div style="display:flex; gap:8px; margin-bottom:6px;">
                    <select data-key="targetKind" style="flex:1;">
                        <option value="fact">具体信息</option>
                        <option value="state">状态</option>
                        <option value="long_term">长期</option>
                        <option value="short_term">短期</option>
                    </select>
                    <input data-key="importance" type="number" min="0" max="1" step="0.05" style="width:80px;" value="0.7">
                </div>
                <div style="display:flex; gap:8px; margin-bottom:6px;">
                    <select data-key="factSubtype" style="flex:1;">
                        <option value="fact">事实</option>
                        <option value="preference">偏好</option>
                        <option value="dislike">禁忌</option>
                        <option value="plan">计划</option>
                        <option value="named_entity">特定名称</option>
                    </select>
                    <select data-key="stateType" style="flex:1;">
                        <option value="other">状态类型</option>
                        <option value="health">健康</option>
                        <option value="schedule">日程</option>
                        <option value="emotion">情绪</option>
                        <option value="relationship">关系</option>
                    </select>
                </div>
                <div style="display:flex; gap:8px; margin-bottom:6px;">
                    <input data-key="exactName" type="text" style="flex:1;" placeholder="特定名称(可选)">
                    <select data-key="entityType" style="width:120px;">
                        <option value="">实体类型</option>
                        <option value="item">物品</option>
                        <option value="food">食物</option>
                        <option value="gift">礼物</option>
                        <option value="place">地点</option>
                        <option value="person">人物</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <textarea data-key="content" style="height:64px; width:100%; margin-bottom:6px;" placeholder="输入提取的重要信息"></textarea>
            `;
            list.appendChild(row);
        });
    }
    syncManualMemoryFormByKind();

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
