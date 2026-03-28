(function () {
    const presetState = {
        data: [
            {
                id: '01',
                title: 'Creative',
                items: [
                    { en: 'Artistic Freedom', zh: '艺术自由度解除', icon: 'ri-brush-line', active: true },
                    { en: 'Sensory Overlay', zh: '五感重叠描写', icon: 'ri-eye-2-line', active: true },
                    { en: 'Poetic Tone', zh: '诗意化语境', icon: 'ri-quill-pen-line', active: false },
                    { en: 'Abstract Logic', zh: '抽象逻辑联想', icon: 'ri-shape-line', active: false }
                ]
            },
            {
                id: '02',
                title: 'Logic',
                items: [
                    { en: 'Strict Syntax', zh: '严格语法树', icon: 'ri-code-box-line', active: true },
                    { en: 'Math Precision', zh: '数学精度校验', icon: 'ri-functions', active: true },
                    { en: 'Source Citation', zh: '信源强制标注', icon: 'ri-bookmark-3-line', active: true },
                    { en: 'Error Tracing', zh: '错误回溯排查', icon: 'ri-bug-line', active: false }
                ]
            },
            {
                id: '03',
                title: 'Roleplay',
                items: [
                    { en: 'Deep Memory', zh: '深度记忆检索', icon: 'ri-brain-line', active: true },
                    { en: 'Persona Anchor', zh: '人格锚点锁定', icon: 'ri-anchor-line', active: true },
                    { en: 'Emotion Engine', zh: '情感引擎共鸣', icon: 'ri-heart-pulse-line', active: true },
                    { en: 'Unrestricted', zh: '无边界推演', icon: 'ri-fire-line', active: false }
                ]
            }
        ],
        currentIndex: 0,
        editContext: null,
        initialized: false
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function closeDropdown() {
        const carousel = byId('preset-carousel');
        if (carousel) {
            carousel.classList.remove('open');
        }
    }

    function renderHeader() {
        const carousel = byId('preset-carousel');
        const dots = byId('preset-dots');
        const currentPreset = presetState.data[presetState.currentIndex];

        if (!carousel || !dots || !currentPreset) {
            return;
        }

        carousel.classList.remove('open');
        carousel.innerHTML = `
            <button type="button" class="preset-trigger" id="preset-trigger-btn">
                <div class="preset-title-index">No. ${escapeHtml(currentPreset.id || String(presetState.currentIndex + 1).padStart(2, '0'))}</div>
                <div class="preset-title-main-wrap">
                    <div class="preset-title-main">${escapeHtml(currentPreset.title)}</div>
                    <i class="ri-arrow-down-s-line preset-title-caret"></i>
                </div>
            </button>
            <div class="preset-dropdown">
                ${presetState.data.map((preset, index) => `
                    <button type="button" class="preset-option ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}">
                        <div class="preset-option-meta">
                            <div class="preset-option-index">No. ${escapeHtml(preset.id || String(index + 1).padStart(2, '0'))}</div>
                            <div class="preset-option-title">${escapeHtml(preset.title)}</div>
                        </div>
                        <i class="ri-check-line preset-option-check"></i>
                    </button>
                `).join('')}
            </div>
        `;

        dots.innerHTML = presetState.data.map((_, index) => `
            <button type="button" class="preset-dot ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}" aria-label="Preset ${index + 1}"></button>
        `).join('');

        const volNum = byId('preset-vol-num');
        if (volNum) {
            volNum.textContent = String(presetState.currentIndex + 1);
        }

        document.querySelectorAll('#preset-app .preset-vol-num-display').forEach(function (node) {
            node.textContent = String(presetState.currentIndex + 1);
        });

        const trigger = byId('preset-trigger-btn');
        if (trigger) {
            trigger.addEventListener('click', function (event) {
                event.stopPropagation();
                carousel.classList.toggle('open');
            });
        }

        carousel.querySelectorAll('.preset-option').forEach((button) => {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                closeDropdown();
                goTo(Number(button.dataset.index));
            });
        });

        dots.querySelectorAll('.preset-dot').forEach((button) => {
            button.addEventListener('click', function () {
                goTo(Number(button.dataset.index));
            });
        });
    }

    function renderList(index) {
        const listContent = byId('preset-list-content');
        const preset = presetState.data[index];

        if (!listContent || !preset) {
            return;
        }

        listContent.innerHTML = preset.items.map((item, itemIndex) => `
            <div class="preset-list-item" style="animation: presetSlideUp 0.45s ${itemIndex * 0.06}s both;">
                <button type="button" class="preset-item-content" data-index="${itemIndex}">
                    <i class="${escapeHtml(item.icon || 'ri-text')} preset-item-icon"></i>
                    <div class="preset-item-text">
                        <div class="preset-item-en">${escapeHtml(item.en)}</div>
                        <div class="preset-item-zh">${escapeHtml(item.zh)}</div>
                    </div>
                </button>
                <button type="button" class="preset-toggle ${item.active ? 'active' : ''}" data-index="${itemIndex}" aria-label="切换参数"></button>
            </div>
        `).join('');

        void listContent.offsetWidth;
        listContent.classList.add('show');

        listContent.querySelectorAll('.preset-item-content').forEach((button) => {
            button.addEventListener('click', function () {
                openEditor(Number(button.dataset.index));
            });
        });

        listContent.querySelectorAll('.preset-toggle').forEach((button) => {
            button.addEventListener('click', function () {
                toggleItem(button, Number(button.dataset.index));
            });
        });
    }

    function goTo(index) {
        if (index === presetState.currentIndex || index < 0 || index >= presetState.data.length) {
            return;
        }

        presetState.currentIndex = index;
        const listContent = byId('preset-list-content');
        const content = byId('preset-app-content');

        if (content) {
            content.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderHeader();

        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (listContent) {
            listContent.classList.remove('show');
        }

        setTimeout(function () {
            renderList(index);
        }, 180);
    }

    function toggleItem(button, itemIndex) {
        const item = presetState.data[presetState.currentIndex]?.items?.[itemIndex];
        if (!button || !item) {
            return;
        }

        button.classList.toggle('active');
        item.active = button.classList.contains('active');

        if (navigator.vibrate) {
            navigator.vibrate([10, 20]);
        }

        const parent = button.closest('.preset-list-item');
        if (parent) {
            parent.style.background = 'rgba(0, 0, 0, 0.02)';
            setTimeout(function () {
                parent.style.background = 'transparent';
            }, 180);
        }
    }

    function openEditor(itemIndex) {
        const item = presetState.data[presetState.currentIndex]?.items?.[itemIndex];
        if (!item) {
            return;
        }

        presetState.editContext = { index: itemIndex };

        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');

        if (inputEn) inputEn.value = item.en || '';
        if (inputZh) inputZh.value = item.zh || '';
        if (backdrop) backdrop.classList.add('active');
        if (sheet) sheet.classList.add('active');
    }

    function closeEditor() {
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');
        if (backdrop) backdrop.classList.remove('active');
        if (sheet) sheet.classList.remove('active');
        presetState.editContext = null;
    }

    function saveEditor() {
        if (!presetState.editContext) {
            return;
        }

        const currentItem = presetState.data[presetState.currentIndex]?.items?.[presetState.editContext.index];
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        if (!currentItem || !inputEn || !inputZh) {
            return;
        }

        const enValue = inputEn.value.trim();
        const zhValue = inputZh.value.trim();

        if (enValue) currentItem.en = enValue;
        if (zhValue) currentItem.zh = zhValue;

        closeEditor();
        renderList(presetState.currentIndex);
    }

    function importData(event) {
        const file = event?.target?.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            try {
                const parsed = JSON.parse(loadEvent.target.result);
                if (parsed && parsed.title && Array.isArray(parsed.items)) {
                    parsed.id = parsed.id || String(presetState.data.length + 1).padStart(2, '0');
                    presetState.data.push(parsed);
                    goTo(presetState.data.length - 1);
                } else {
                    alert('Invalid preset format.');
                }
            } catch (error) {
                alert('Failed to parse preset JSON.');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    function openApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        screen.classList.remove('hidden');
        renderHeader();
        renderList(presetState.currentIndex);
    }

    function closeApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        closeDropdown();
        closeEditor();
        screen.classList.add('hidden');
    }

    function handleDocumentClick(event) {
        const screen = byId('preset-app');
        const carousel = byId('preset-carousel');
        if (!screen || screen.classList.contains('hidden') || !carousel) {
            return;
        }

        if (!carousel.contains(event.target)) {
            closeDropdown();
        }
    }

    function handleKeydown(event) {
        const screen = byId('preset-app');
        if (!screen || screen.classList.contains('hidden')) {
            return;
        }

        if (event.key === 'Escape') {
            const sheet = byId('preset-editor-sheet');
            if (sheet && sheet.classList.contains('active')) {
                closeEditor();
                return;
            }

            const carousel = byId('preset-carousel');
            if (carousel && carousel.classList.contains('open')) {
                closeDropdown();
                return;
            }

            closeApp();
        }
    }

    function init() {
        if (presetState.initialized) {
            return;
        }

        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        const closeButton = byId('preset-exit-btn');
        const importButton = byId('close-preset-app');
        const importInput = byId('preset-import-input');
        const backdrop = byId('preset-sheet-backdrop');
        const discardButton = byId('preset-discard-btn');
        const commitButton = byId('preset-commit-btn');

        if (closeButton) closeButton.addEventListener('click', closeApp);
        if (importButton) {
            importButton.setAttribute('aria-label', '导入预设');
            importButton.setAttribute('title', '导入预设');
            importButton.addEventListener('click', function () {
                if (importInput) {
                    importInput.click();
                }
            });
        }
        if (importInput) importInput.addEventListener('change', importData);
        if (backdrop) backdrop.addEventListener('click', closeEditor);
        if (discardButton) discardButton.addEventListener('click', closeEditor);
        if (commitButton) commitButton.addEventListener('click', saveEditor);

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);

        renderHeader();
        renderList(presetState.currentIndex);
        presetState.initialized = true;
    }

    function getActivePresetPrompts() {
        const currentPreset = presetState.data[presetState.currentIndex];
        if (!currentPreset || !currentPreset.items) return [];
        return currentPreset.items.filter(item => item.active).map(item => item.zh);
    }

    function getPresetContextString() {
        const activeItems = getActivePresetPrompts();
        if (activeItems.length === 0) return '';
        const currentPreset = presetState.data[presetState.currentIndex];
        return `【当前启用的高级预设 (${currentPreset.title})】\n` + activeItems.map(zh => `- ${zh}`).join('\n');
    }

    window.PresetApp = {
        init: init,
        openApp: openApp,
        closeApp: closeApp,
        getActivePresetPrompts: getActivePresetPrompts,
        getPresetContextString: getPresetContextString
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
