/**
 * 更新日志弹窗配置
 * 每次更新时：
 * 1. 修改 CHANGELOG_VERSION（修改后所有用户会再次看到弹窗）
 * 2. 修改 CHANGELOG_CONTENT 里的更新内容
 */

const CHANGELOG_VERSION = 'v1.0.3'; // 修改这个版本号来让弹窗再次显示
const CHANGELOG_IMAGE = 'https://i.postimg.cc/0yFjXpfZ/IMG_6893.jpg';
const CHANGELOG_ITEMS = [
    '激活码改成用设备码一机一码，qq带设备码找我',
    '新增家园系统，底栏第一个按钮可以去别的地方，顶栏头像可以选择联系人和设置动图，点击联系人形象可以摸头喂食和派遣',
    '新增查看token数，在聊天设置页面',
    '新增离线时触发主动发消息功能，但是我没测试多个联系人使用时会不会有 bug，需要用 render 部署一下，有需要的 qq 找我我来教',
    '修改了一下见面的 UI 和之前的 bug，之前的自定义 CSS 可能会用不了了',
    '音乐的退出按钮图片可以点那个铃铛按钮自定义了，然后之前的音乐接口失效了换了一下'
];

const CHANGELOG_STYLE = `
    #changelog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .changelog-popup {
        background: #fff;
        border-radius: 24px;
        width: 88%;
        max-width: 360px;
        max-height: 82vh;
        padding: 28px 22px 22px;
        position: relative;
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        overflow-y: auto;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    }

    .changelog-close-btn {
        position: absolute;
        top: 12px;
        right: 14px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: #f2f2f7;
        color: #8e8e93;
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
    }

    .changelog-subtitle {
        margin-bottom: 8px;
        text-align: center;
        color: #8e8e93;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1.6px;
        text-transform: uppercase;
    }

    .changelog-title {
        margin-bottom: 24px;
        text-align: center;
        color: #000;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: -0.5px;
    }

    .changelog-title span {
        color: #d1d1d6;
        font-weight: 500;
    }

    .changelog-feature-stage {
        margin-bottom: 24px;
    }

    .changelog-feature-cover {
        width: 100%;
        aspect-ratio: 1 / 1;
        display: block;
        padding: 0;
        border: none;
        border-radius: 20px;
        overflow: hidden;
        background: #f5f5f5;
        cursor: pointer;
        transition: opacity 0.28s ease, transform 0.28s ease;
    }

    .changelog-feature-cover img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .changelog-feature-guide {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 18px;
        margin-top: 12px;
        color: #8e8e93;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.2px;
        transition: opacity 0.24s ease, transform 0.24s ease;
    }

    .changelog-feature-guide-text {
        animation: changelogGuideFade 1.8s ease-in-out infinite;
    }

    .changelog-feature-guide-chevron {
        display: inline-block;
        font-size: 16px;
        line-height: 1;
        animation: changelogGuideBounce 1.2s ease-in-out infinite;
    }

    .changelog-feature-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: translateY(10px);
        transition: max-height 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, transform 0.28s ease, margin-top 0.28s ease;
    }

    .changelog-feature-stage.is-revealed .changelog-feature-list {
        max-height: 720px;
        opacity: 1;
        transform: translateY(0);
        margin-top: 6px;
    }

    .changelog-feature-cover.is-hiding,
    .changelog-feature-guide.is-hiding {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
    }

    .changelog-feature-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: #444;
        font-size: 14px;
        line-height: 1.65;
    }

    .changelog-feature-dot {
        width: 7px;
        height: 7px;
        margin-top: 9px;
        border-radius: 50%;
        background: #000;
        flex-shrink: 0;
    }

    .changelog-actions {
        margin-top: 6px;
        text-align: center;
    }

    .changelog-ok-btn {
        width: 100%;
        border: none;
        border-radius: 16px;
        padding: 14px 18px;
        background: #000;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
    }

    @keyframes changelogGuideFade {
        0%,
        100% {
            opacity: 0.45;
        }

        50% {
            opacity: 1;
        }
    }

    @keyframes changelogGuideBounce {
        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(3px);
        }
    }
`;

document.addEventListener('DOMContentLoaded', () => {
    const hasSeenChangelog = localStorage.getItem(`changelog_seen_${CHANGELOG_VERSION}`);

    if (!hasSeenChangelog) {
        showChangelogPopup();
    }
});

function ensureChangelogStyles() {
    if (document.getElementById('changelog-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'changelog-style';
    style.textContent = CHANGELOG_STYLE;
    document.head.appendChild(style);
}

function renderChangelogContent() {
    const versionText = CHANGELOG_VERSION.replace(/^v/i, '');
    const itemsMarkup = CHANGELOG_ITEMS.map(item => `
        <div class="changelog-feature-item">
            <span class="changelog-feature-dot"></span>
            <span>${item}</span>
        </div>
    `).join('');

    return `
        <div class="changelog-subtitle">What's New</div>
        <div class="changelog-title">Version <span>${versionText}</span></div>
        <div class="changelog-feature-stage" id="changelog-feature-stage">
            <button class="changelog-feature-cover" id="changelog-feature-cover" type="button" aria-label="查看更新内容">
                <img src="${CHANGELOG_IMAGE}" alt="更新图片">
            </button>
            <div class="changelog-feature-guide" id="changelog-feature-guide" aria-hidden="true">
                <span class="changelog-feature-guide-text">轻触图片查看更新内容</span>
                <span class="changelog-feature-guide-chevron">⌄</span>
            </div>
            <div class="changelog-feature-list" id="changelog-feature-list">
                ${itemsMarkup}
            </div>
        </div>
        <div class="changelog-actions">
            <button id="changelog-ok-btn" class="changelog-ok-btn">我知道了</button>
        </div>
    `;
}

function showChangelogPopup() {
    ensureChangelogStyles();

    const overlay = document.createElement('div');
    overlay.id = 'changelog-overlay';

    const popup = document.createElement('div');
    popup.className = 'changelog-popup';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'changelog-close-btn';

    const closePopup = () => {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
        localStorage.setItem(`changelog_seen_${CHANGELOG_VERSION}`, 'true');
    };

    closeBtn.onclick = closePopup;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = renderChangelogContent();

    popup.appendChild(closeBtn);
    popup.appendChild(contentDiv);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    setTimeout(() => {
        const okBtn = popup.querySelector('#changelog-ok-btn');
        const featureStage = popup.querySelector('#changelog-feature-stage');
        const featureCover = popup.querySelector('#changelog-feature-cover');
        const featureGuide = popup.querySelector('#changelog-feature-guide');

        if (okBtn) {
            okBtn.onclick = closePopup;
        }

        if (featureCover && featureStage) {
            featureCover.onclick = () => {
                if (featureStage.classList.contains('is-revealed')) {
                    return;
                }

                featureCover.classList.add('is-hiding');
                if (featureGuide) {
                    featureGuide.classList.add('is-hiding');
                }

                featureStage.classList.add('is-revealed');
                featureCover.setAttribute('aria-hidden', 'true');

                setTimeout(() => {
                    featureCover.hidden = true;
                    if (featureGuide) {
                        featureGuide.hidden = true;
                    }
                }, 260);
            };
        }

        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
    }, 10);
}
