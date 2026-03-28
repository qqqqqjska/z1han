(function () {
    const defaultRegexEntries = [
        {
            title: 'Extract Links',
            icon: 'ri-link',
            pattern: '/https?:\\/\\/[^\\s]+/g',
            template: '<a href="$&">$&</a>'
        },
        {
            title: 'Highlight Tags',
            icon: 'ri-hashtag',
            pattern: '/#\\w+/g',
            template: '<span class="tag">$&</span>'
        }

    ];

    const presetState = {
        data: [],
        currentIndex: 0,
        activeTab: 'preset',
        editContext: null,
        initialized: false,
        restoring: false
    };

    const STORAGE_KEY = 'preset-app-state-v2';
    const LEGACY_STORAGE_KEY = 'preset-app-state-v1';
    const STATE_DB_NAME = 'preset-app-db';
    const STATE_STORE_NAME = 'preset_state';
    const STATE_RECORD_ID = 'main';
    const defaultPresetData = clonePresetData(presetState.data);
    let stateDbPromise = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function clonePresetItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item, index) {
            return {
                identifier: item?.identifier ? String(item.identifier) : undefined,
                en: String(item?.en ?? item?.name ?? ('Entry ' + (index + 1))),
                zh: String(item?.zh ?? item?.summary ?? item?.content ?? ''),
                icon: item?.icon || 'ri-text',
                active: item?.active !== false,
                content: typeof item?.content === 'string' ? item.content : undefined,
                summary: typeof item?.summary === 'string' ? item.summary : undefined,
                role: item?.role || undefined,
                systemPrompt: Boolean(item?.systemPrompt),
                marker: Boolean(item?.marker)
            };
        });
    }

    function clonePresetData(presets) {
        if (!Array.isArray(presets)) {
            return [];
        }

        return presets.map(function (preset, index) {
            return {
                id: String(preset?.id || buildPresetId(index)),
                title: String(preset?.title || ('Preset ' + (index + 1))),
                items: clonePresetItems(preset?.items),
                regexEntries: cloneRegexEntries(preset?.regexEntries)
            };
        });
    }

    function isRemovedBuiltinPreset(preset) {
        const builtinMap = {
            Creative: ['Artistic Freedom', 'Sensory Overlay', 'Poetic Tone', 'Abstract Logic'],
            Logic: ['Strict Syntax', 'Math Precision', 'Source Citation', 'Error Tracing'],
            Roleplay: ['Deep Memory', 'Persona Anchor', 'Emotion Engine', 'Unrestricted']
        };

        const expectedItems = builtinMap[String(preset?.title || '')];
        if (!expectedItems || !Array.isArray(preset?.items) || preset.items.length !== expectedItems.length) {
            return false;
        }

        return expectedItems.every(function (name, index) {
            return String(preset.items[index]?.en || '') === name;
        });
    }

    function stripRemovedBuiltinPresets(presets) {
        return clonePresetData(presets).filter(function (preset) {
            return !isRemovedBuiltinPreset(preset);
        });
    }


    function getStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function createPersistedStatePayload() {
        const data = stripRemovedBuiltinPresets(presetState.data);
        const hasData = data.length > 0;

        return {
            data: data,
            currentIndex: hasData ? Math.min(Math.max(presetState.currentIndex, 0), data.length - 1) : 0,
            activeTab: presetState.activeTab === 'regex' ? 'regex' : 'preset'
        };
    }

    function applyPersistedState(payload) {
        const data = stripRemovedBuiltinPresets(payload?.data);
        presetState.data = data;
        presetState.currentIndex = data.length
            ? Math.min(Math.max(Number.isFinite(Number(payload?.currentIndex)) ? Number(payload.currentIndex) : 0, 0), data.length - 1)
            : 0;
        presetState.activeTab = payload?.activeTab === 'regex' ? 'regex' : 'preset';
    }

    function openStateDatabase() {
        if (stateDbPromise) {
            return stateDbPromise;
        }

        stateDbPromise = new Promise(function (resolve) {
            try {
                if (!window.indexedDB) {
                    resolve(null);
                    return;
                }

                const request = window.indexedDB.open(STATE_DB_NAME, 1);
                request.onupgradeneeded = function () {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STATE_STORE_NAME)) {
                        db.createObjectStore(STATE_STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = function () {
                    const db = request.result;
                    db.onversionchange = function () {
                        db.close();
                    };
                    resolve(db);
                };
                request.onerror = function () {
                    resolve(null);
                };
            } catch (error) {
                resolve(null);
            }
        });

        return stateDbPromise;
    }

    function readStateFromIndexedDb() {
        return openStateDatabase().then(function (db) {
            if (!db) {
                return null;
            }

            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STATE_STORE_NAME, 'readonly');
                    const request = tx.objectStore(STATE_STORE_NAME).get(STATE_RECORD_ID);
                    request.onsuccess = function () {
                        resolve(request.result || null);
                    };
                    request.onerror = function () {
                        resolve(null);
                    };
                } catch (error) {
                    resolve(null);
                }
            });
        });
    }

    function writeStateToIndexedDb(payload) {
        return openStateDatabase().then(function (db) {
            if (!db) {
                return false;
            }

            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STATE_STORE_NAME, 'readwrite');
                    tx.objectStore(STATE_STORE_NAME).put({
                        id: STATE_RECORD_ID,
                        data: payload.data,
                        currentIndex: payload.currentIndex,
                        activeTab: payload.activeTab
                    });
                    tx.oncomplete = function () {
                        resolve(true);
                    };
                    tx.onerror = function () {
                        resolve(false);
                    };
                    tx.onabort = function () {
                        resolve(false);
                    };
                } catch (error) {
                    resolve(false);
                }
            });
        });
    }

    function persistState() {
        if (presetState.restoring) {
            return;
        }

        const payload = createPersistedStatePayload();
        writeStateToIndexedDb(payload);

        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(payload));
            } catch (error) {
            }
        }
    }

    function restoreState() {
        presetState.restoring = true;

        return readStateFromIndexedDb()
            .then(function (payload) {
                if (payload && Array.isArray(payload.data)) {
                    applyPersistedState(payload);
                    return;
                }

                const storage = getStorage();
                if (storage) {
                    try {
                        const raw = storage.getItem(LEGACY_STORAGE_KEY);
                        if (raw) {
                            const legacyPayload = JSON.parse(raw);
                            if (legacyPayload && Array.isArray(legacyPayload.data)) {
                                applyPersistedState(legacyPayload);
                                writeStateToIndexedDb(createPersistedStatePayload());
                                return;
                            }
                        }
                    } catch (error) {
                    }
                }

                applyPersistedState({
                    data: stripRemovedBuiltinPresets(defaultPresetData),
                    currentIndex: 0,
                    activeTab: 'preset'
                });
            })
            .catch(function () {
                applyPersistedState({
                    data: stripRemovedBuiltinPresets(defaultPresetData),
                    currentIndex: 0,
                    activeTab: 'preset'
                });
            })
            .finally(function () {
                presetState.restoring = false;
            });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cloneRegexEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries.map(function (entry) {
            return {
                title: String(entry?.title ?? entry?.scriptName ?? 'Untitled Regex'),
                icon: entry?.icon || 'ri-braces-line',
                pattern: String(entry?.pattern ?? entry?.findRegex ?? ''),
                template: String(entry?.template ?? entry?.replaceString ?? ''),
                active: entry?.active ?? entry?.enabled ?? !entry?.disabled
            };
        });
    }

    function buildPresetId(index) {
        return String(index + 1).padStart(2, '0');
    }

    function getBaseName(fileName) {
        return String(fileName || 'Imported Preset').replace(/\.[^.]+$/, '').trim() || 'Imported Preset';
    }

    function getCurrentPreset() {
        return presetState.data[presetState.currentIndex] || null;
    }

    function getCurrentRegexEntries() {
        const currentPreset = getCurrentPreset();
        if (!currentPreset) {
            return [];
        }

        if (!Array.isArray(currentPreset.regexEntries)) {
            currentPreset.regexEntries = [];
        }

        return currentPreset.regexEntries;
    }

    function getTextPreview(text, maxLength) {
        const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
        if (!normalized) {
            return '';
        }

        if (normalized.length <= maxLength) {
            return normalized;
        }

        return normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
    }

    function getItemContent(item) {
        if (!item) {
            return '';
        }

        if (typeof item.content === 'string') {
            return item.content;
        }

        return String(item.zh ?? '');
    }

    function getItemSubtitle(item) {
        if (!item) {
            return '';
        }

        if (typeof item.summary === 'string' && item.summary.trim()) {
            return item.summary;
        }

        return String(item.zh ?? '');
    }

    function buildImportedItemSummary(item, contentOverride) {
        const meta = [];
        const content = typeof contentOverride === 'string' ? contentOverride : getItemContent(item);

        if (item?.role) {
            meta.push(String(item.role).toUpperCase());
        }

        if (item?.systemPrompt) {
            meta.push('SYS');
        }

        if (item?.marker) {
            meta.push('MARK');
        }

        const preview = getTextPreview(content, 54);
        if (meta.length && preview) {
            return meta.join(' · ') + ' · ' + preview;
        }

        return meta.join(' · ') || preview || 'Imported Entry';
    }

    function setItemContent(item, value) {
        if (!item) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(item, 'content') || Object.prototype.hasOwnProperty.call(item, 'summary')) {
            item.content = value;
            item.summary = buildImportedItemSummary(item, value);
            item.zh = item.summary;
            return;
        }

        item.zh = value;
    }

    function inferPromptIcon(prompt) {
        if (prompt?.system_prompt) {
            return 'ri-shield-star-line';
        }

        if (prompt?.role === 'assistant') {
            return 'ri-robot-2-line';
        }

        if (prompt?.role === 'user') {
            return 'ri-user-3-line';
        }

        if (prompt?.marker) {
            return 'ri-price-tag-3-line';
        }

        return 'ri-file-text-line';
    }

    function inferRegexIcon(script) {
        if (script?.substituteRegex) {
            return 'ri-magic-line';
        }

        if (script?.promptOnly) {
            return 'ri-chat-1-line';
        }

        if (script?.markdownOnly) {
            return 'ri-markdown-line';
        }

        return 'ri-braces-line';
    }

    function normalizeRegexEntries(rawEntries) {
        if (!Array.isArray(rawEntries)) {
            return [];
        }

        return rawEntries.map(function (entry, index) {
            return {
                title: String(entry?.title ?? entry?.scriptName ?? `Regex ${index + 1}`),
                icon: entry?.icon || inferRegexIcon(entry),
                pattern: String(entry?.pattern ?? entry?.findRegex ?? ''),
                template: String(entry?.template ?? entry?.replaceString ?? ''),
                active: entry?.active ?? entry?.enabled ?? !entry?.disabled
            };
        });
    }

    function parseRegexScripts(regexScripts) {
        if (!Array.isArray(regexScripts)) {
            return [];
        }

        return regexScripts.map(function (script, index) {
            const templateParts = [];
            const replaceString = String(script?.replaceString ?? '');
            const trimStrings = Array.isArray(script?.trimStrings)
                ? script.trimStrings.filter(function (value) { return value !== ''; })
                : [];
            const modes = [];

            if (replaceString) {
                templateParts.push(replaceString);
            }

            if (trimStrings.length) {
                templateParts.push('Trim: ' + trimStrings.join(' | '));
            }

            if (script?.promptOnly) {
                modes.push('Prompt');
            }

            if (script?.markdownOnly) {
                modes.push('Markdown');
            }

            if (script?.runOnEdit) {
                modes.push('Edit');
            }

            if (script?.disabled) {
                modes.push('Disabled');
            }

            if (modes.length) {
                templateParts.push('Mode: ' + modes.join(' · '));
            }

            return {
                title: String(script?.scriptName ?? `Regex ${index + 1}`),
                icon: inferRegexIcon(script),
                pattern: String(script?.findRegex ?? ''),
                template: templateParts.join('\n\n') || '',
                active: !script?.disabled
            };
        });
    }

    function normalizeLegacyItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item, index) {
            return {
                en: String(item?.en ?? item?.name ?? `Entry ${index + 1}`),
                zh: String(item?.zh ?? item?.summary ?? item?.content ?? ''),
                icon: item?.icon || 'ri-text',
                active: item?.active !== false,
                content: typeof item?.content === 'string' ? item.content : undefined,
                summary: typeof item?.summary === 'string' ? item.summary : undefined,
                role: item?.role || undefined,
                systemPrompt: Boolean(item?.systemPrompt),
                marker: Boolean(item?.marker)
            };
        });
    }

    function parsePromptPreset(parsed, fileName) {
        const prompts = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
        if (!prompts.length) {
            return null;
        }

        const promptMap = new Map();
        prompts.forEach(function (prompt) {
            promptMap.set(prompt.identifier, prompt);
        });

        const orderedRefs = Array.isArray(parsed?.prompt_order?.[0]?.order) ? parsed.prompt_order[0].order : [];
        const seen = new Set();
        const items = [];

        orderedRefs.forEach(function (orderItem) {
            const prompt = promptMap.get(orderItem.identifier);
            if (!prompt || seen.has(orderItem.identifier)) {
                return;
            }

            seen.add(orderItem.identifier);
            items.push({
                identifier: prompt.identifier,
                en: String(prompt.name || prompt.identifier || `Entry ${items.length + 1}`),
                zh: '',
                summary: '',
                content: String(prompt.content ?? ''),
                icon: inferPromptIcon(prompt),
                active: orderItem.enabled !== false && prompt.enabled !== false,
                role: prompt.role || '',
                systemPrompt: Boolean(prompt.system_prompt),
                marker: Boolean(prompt.marker)
            });
        });

        prompts.forEach(function (prompt) {
            if (seen.has(prompt.identifier)) {
                return;
            }

            items.push({
                identifier: prompt.identifier,
                en: String(prompt.name || prompt.identifier || `Entry ${items.length + 1}`),
                zh: '',
                summary: '',
                content: String(prompt.content ?? ''),
                icon: inferPromptIcon(prompt),
                active: prompt.enabled !== false,
                role: prompt.role || '',
                systemPrompt: Boolean(prompt.system_prompt),
                marker: Boolean(prompt.marker)
            });
        });

        items.forEach(function (item) {
            item.summary = buildImportedItemSummary(item, item.content);
            item.zh = item.summary;
        });

        return {
            id: buildPresetId(presetState.data.length),
            title: getBaseName(fileName),
            items: items,
            regexEntries: parseRegexScripts(parsed?.extensions?.regex_scripts)
        };
    }

    function normalizeLegacyPreset(parsed, fileName) {
        if (!parsed || !parsed.title || !Array.isArray(parsed.items)) {
            return null;
        }

        return {
            id: parsed.id || buildPresetId(presetState.data.length),
            title: String(parsed.title || getBaseName(fileName)),
            items: normalizeLegacyItems(parsed.items),
            regexEntries: normalizeRegexEntries(parsed.regexEntries || parsed.regex || parsed?.extensions?.regex_scripts)
        };
    }

    function parseImportedPreset(parsed, fileName) {
        const legacyPreset = normalizeLegacyPreset(parsed, fileName);
        if (legacyPreset) {
            return legacyPreset;
        }

        const promptPreset = parsePromptPreset(parsed, fileName);
        if (promptPreset) {
            return promptPreset;
        }

        return null;
    }

    function updateVolDisplays() {
        const displayValue = presetState.data.length ? String(presetState.currentIndex + 1) : '--';

        document.querySelectorAll('#preset-app .preset-vol-num-display').forEach(function (node) {
            node.textContent = displayValue;
        });

        const legacyVol = byId('preset-vol-num');
        if (legacyVol) {
            legacyVol.textContent = displayValue;
        }
    }

    function closeDropdown() {
        const carousel = byId('preset-carousel');
        if (carousel) {
            carousel.classList.remove('open');
        }
    }

    function renderPresetHeader() {
        const carousel = byId('preset-carousel');
        const dots = byId('preset-dots');
        const currentPreset = getCurrentPreset();

        if (!carousel || !dots || !currentPreset) {
            return;
        }

        carousel.classList.remove('open');
        carousel.innerHTML = `
            <button type="button" class="preset-trigger" id="preset-trigger-btn">
                <div class="preset-title-index">No. ${escapeHtml(currentPreset.id || buildPresetId(presetState.currentIndex))}</div>
                <div class="preset-title-main-wrap">
                    <div class="preset-title-main">${escapeHtml(currentPreset.title)}</div>
                    <i class="ri-arrow-down-s-line preset-title-caret"></i>
                </div>
            </button>
            <div class="preset-dropdown">
                ${presetState.data.map(function (preset, index) {
                    return `
                        <button type="button" class="preset-option ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}">
                            <div class="preset-option-meta">
                                <div class="preset-option-index">No. ${escapeHtml(preset.id || buildPresetId(index))}</div>
                                <div class="preset-option-title">${escapeHtml(preset.title)}</div>
                            </div>
                            <i class="ri-check-line preset-option-check"></i>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        dots.innerHTML = presetState.data.map(function (_, index) {
            return `
                <button type="button" class="preset-dot ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}" aria-label="????"></button>
            `;
        }).join('');

        updateVolDisplays();

        const trigger = byId('preset-trigger-btn');
        if (trigger) {
            trigger.addEventListener('click', function (event) {
                event.stopPropagation();
                carousel.classList.toggle('open');
            });
        }

        carousel.querySelectorAll('.preset-option').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                closeDropdown();
                goToPreset(Number(button.dataset.index));
            });
        });

        dots.querySelectorAll('.preset-dot').forEach(function (button) {
            button.addEventListener('click', function () {
                goToPreset(Number(button.dataset.index));
            });
        });
    }

    function renderPresetList(index) {
        const listContent = byId('preset-list-content');
        const preset = presetState.data[index];

        if (!listContent || !preset) {
            return;
        }

        listContent.innerHTML = preset.items.map(function (item, itemIndex) {
            return `
                <div class="preset-list-item" style="animation: presetSlideUp 0.45s ${itemIndex * 0.06}s both;">
                    <button type="button" class="preset-item-content" data-index="${itemIndex}">
                        <i class="${escapeHtml(item.icon || 'ri-text')} preset-item-icon"></i>
                        <div class="preset-item-text">
                            <div class="preset-item-en">${escapeHtml(item.en)}</div>
                            <div class="preset-item-zh">${escapeHtml(getItemSubtitle(item))}</div>
                        </div>
                    </button>
                    <button type="button" class="preset-toggle ${item.active ? 'active' : ''}" data-index="${itemIndex}" aria-label="切换参数"></button>
                </div>
            `;
        }).join('');

        void listContent.offsetWidth;
        listContent.classList.add('show');

        listContent.querySelectorAll('.preset-item-content').forEach(function (button) {
            button.addEventListener('click', function () {
                openEditor(Number(button.dataset.index));
            });
        });

        listContent.querySelectorAll('.preset-toggle').forEach(function (button) {
            button.addEventListener('click', function () {
                toggleItem(button, Number(button.dataset.index));
            });
        });
    }

    function goToPreset(index) {
        if (index < 0 || index >= presetState.data.length) {
            return;
        }

        if (index === presetState.currentIndex) {
            renderPresetHeader();
            renderPresetList(index);
            if (presetState.activeTab === 'regex') {
                renderRegexGrid();
            }
            return;
        }

        presetState.currentIndex = index;
        persistState();
        const listContent = byId('preset-list-content');
        const content = byId('preset-app-content');

        if (content) {
            content.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderPresetHeader();

        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (listContent) {
            listContent.classList.remove('show');
        }

        if (presetState.activeTab === 'regex') {
            renderRegexGrid();
        }

        setTimeout(function () {
            renderPresetList(index);
        }, 180);
    }

    function toggleItem(button, itemIndex) {
        const item = getCurrentPreset()?.items?.[itemIndex];
        if (!button || !item) {
            return;
        }

        button.classList.toggle('active');
        item.active = button.classList.contains('active');
        persistState();

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
        const item = getCurrentPreset()?.items?.[itemIndex];
        if (!item) {
            return;
        }

        presetState.editContext = { index: itemIndex };

        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');

        if (inputEn) {
            inputEn.value = item.en || '';
        }

        if (inputZh) {
            inputZh.value = getItemContent(item);
        }

        if (backdrop) {
            backdrop.classList.add('active');
        }

        if (sheet) {
            sheet.classList.add('active');
        }
    }

    function closeEditor() {
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');
        if (backdrop) {
            backdrop.classList.remove('active');
        }
        if (sheet) {
            sheet.classList.remove('active');
        }
        presetState.editContext = null;
    }

    function saveEditor() {
        if (!presetState.editContext) {
            return;
        }

        const currentItem = getCurrentPreset()?.items?.[presetState.editContext.index];
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        if (!currentItem || !inputEn || !inputZh) {
            return;
        }

        const enValue = inputEn.value.trim();
        const zhValue = inputZh.value.trim();

        if (enValue) {
            currentItem.en = enValue;
        }

        setItemContent(currentItem, zhValue);
        persistState();

        closeEditor();
        renderPresetList(presetState.currentIndex);
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
                const importedPreset = parseImportedPreset(parsed, file.name);

                if (!importedPreset) {
                    alert('Invalid preset format.');
                    return;
                }

                if (!importedPreset.regexEntries?.length) {
                    importedPreset.regexEntries = [];
                }

                presetState.data.push(importedPreset);
                persistState();
                setActiveTab('preset');
                goToPreset(presetState.data.length - 1);
            } catch (error) {
                alert('Failed to parse preset JSON.');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    function regexCardMarkup(entry) {
        return `
            <article class="regex-card" style="animation: regexFadeInUp 0.45s ease both;">
                <div class="regex-card-top">
                    <div class="regex-card-title">${escapeHtml(entry.title)}</div>
                    <div class="regex-card-icon"><i class="${escapeHtml(entry.icon || 'ri-function-line')}"></i></div>
                </div>

                <div class="regex-data-section">
                    <div class="regex-data-label"><i class="ri-code-s-slash-line"></i> Pattern</div>
                    <div class="regex-data-value">${escapeHtml(entry.pattern)}</div>
                </div>

                <div class="regex-card-divider"></div>

                <div class="regex-data-section">
                    <div class="regex-data-label"><i class="ri-html5-line"></i> Markup</div>
                    <div class="regex-data-value">${escapeHtml(entry.template)}</div>
                </div>
            </article>
        `;
    }

    function renderRegexGrid() {
        const grid = byId('preset-regex-grid');
        if (!grid) {
            return;
        }

        const entries = getCurrentRegexEntries();
        if (!entries.length) {
            grid.innerHTML = `
                <article class="regex-card" style="animation: regexFadeInUp 0.45s ease both;">
                    <div class="regex-card-top">
                        <div class="regex-card-title">No Regex Yet</div>
                        <div class="regex-card-icon"><i class="ri-braces-line"></i></div>
                    </div>
                    <div class="regex-data-section">
                        <div class="regex-data-label"><i class="ri-information-line"></i> Status</div>
                        <div class="regex-data-value">当前预设还没有配套正则，点右上角 New 可以自己补一条。</div>
                    </div>
                </article>
            `;
            return;
        }

        grid.innerHTML = entries.map(regexCardMarkup).join('');
    }

    function openRegexDrawer() {
        const drawer = byId('preset-regex-drawer');
        const overlay = byId('preset-regex-overlay');
        if (drawer) {
            drawer.classList.add('active');
        }
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    function closeRegexDrawer() {
        const drawer = byId('preset-regex-drawer');
        const overlay = byId('preset-regex-overlay');
        if (drawer) {
            drawer.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    function addRegexEntry() {
        const titleInput = byId('preset-regex-title');
        const patternInput = byId('preset-regex-pattern');
        const templateInput = byId('preset-regex-template');

        if (!titleInput || !patternInput || !templateInput) {
            return;
        }

        const entry = {
            title: titleInput.value.trim() || 'Untitled',
            icon: 'ri-function-line',
            pattern: patternInput.value.trim() || '/.../g',
            template: templateInput.value.trim() || '...'
        };

        getCurrentRegexEntries().unshift(entry);
        persistState();
        renderRegexGrid();

        titleInput.value = '';
        patternInput.value = '';
        templateInput.value = '';

        closeRegexDrawer();
    }

    function setActiveTab(tabName) {
        presetState.activeTab = tabName;
        persistState();

        document.querySelectorAll('#preset-app [data-tab-pane]').forEach(function (pane) {
            pane.classList.toggle('active', pane.dataset.tabPane === tabName);
        });

        document.querySelectorAll('#preset-app .preset-tab-item').forEach(function (button) {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        if (tabName !== 'preset') {
            closeDropdown();
            closeEditor();
        }

        if (tabName !== 'regex') {
            closeRegexDrawer();
        }

        if (tabName === 'regex') {
            renderRegexGrid();
        }
    }

    function openApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        screen.classList.remove('hidden');
        renderPresetHeader();
        renderPresetList(presetState.currentIndex);
        renderRegexGrid();
        setActiveTab(presetState.activeTab);
    }

    function closeApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        closeDropdown();
        closeEditor();
        closeRegexDrawer();
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
            const regexDrawer = byId('preset-regex-drawer');
            const carousel = byId('preset-carousel');

            if (sheet && sheet.classList.contains('active')) {
                closeEditor();
                return;
            }

            if (regexDrawer && regexDrawer.classList.contains('active')) {
                closeRegexDrawer();
                return;
            }

            if (carousel && carousel.classList.contains('open')) {
                closeDropdown();
                return;
            }

            closeApp();
        }
    }

    function bindImport(buttonId, inputId) {
        const button = byId(buttonId);
        const input = byId(inputId);

        if (button && input) {
            button.addEventListener('click', function () {
                input.click();
            });
            input.addEventListener('change', importData);
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

        presetState.initialized = true;

        document.querySelectorAll('#preset-app .preset-exit-btn').forEach(function (button) {
            button.addEventListener('click', closeApp);
        });

        bindImport('close-preset-app', 'preset-import-input');

        const backdrop = byId('preset-sheet-backdrop');
        const discardButton = byId('preset-discard-btn');
        const commitButton = byId('preset-commit-btn');
        const regexOpenButton = byId('preset-regex-open-drawer');
        const regexHomeButton = byId('preset-regex-home');
        const regexCloseButton = byId('preset-regex-close-drawer');
        const regexOverlay = byId('preset-regex-overlay');
        const regexAddButton = byId('preset-regex-add-entry');

        if (backdrop) {
            backdrop.addEventListener('click', closeEditor);
        }
        if (discardButton) {
            discardButton.addEventListener('click', closeEditor);
        }
        if (commitButton) {
            commitButton.addEventListener('click', saveEditor);
        }
        if (regexOpenButton) {
            regexOpenButton.addEventListener('click', openRegexDrawer);
        }
        if (regexHomeButton) {
            regexHomeButton.addEventListener('click', closeApp);
        }
        if (regexCloseButton) {
            regexCloseButton.addEventListener('click', closeRegexDrawer);
        }
        if (regexOverlay) {
            regexOverlay.addEventListener('click', closeRegexDrawer);
        }
        if (regexAddButton) {
            regexAddButton.addEventListener('click', addRegexEntry);
        }

        document.querySelectorAll('#preset-app .preset-tab-item').forEach(function (button) {
            button.addEventListener('click', function () {
                setActiveTab(button.dataset.tab);
            });
        });

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);

        restoreState().finally(function () {
            renderPresetHeader();
            renderPresetList(presetState.currentIndex);
            renderRegexGrid();
            setActiveTab(presetState.activeTab);
        });
    }

    function getActivePresetPrompts() {
        const currentPreset = getCurrentPreset();
        if (!currentPreset || !Array.isArray(currentPreset.items)) {
            return [];
        }

        return currentPreset.items
            .filter(function (item) { return item.active; })
            .map(function (item) { return getItemContent(item); })
            .filter(function (content) { return Boolean(String(content).trim()); });
    }

    function getPresetContextString() {
        const activeItems = getActivePresetPrompts();
        if (activeItems.length === 0) {
            return '';
        }

        const currentPreset = getCurrentPreset();
        return `【当前启用的高级预设 (${currentPreset.title})】\n` + activeItems.map(function (content) {
            return `- ${content}`;
        }).join('\n');
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
