/**
 * render.js — 卦象渲染模块
 * 依赖：data.js 中的 GUA_NAMES、WUXING、YAO_MAP
 */

class GuaRenderer {
    // 剥离卦名中的 Unicode 卦象符号（☰☱☲☳☴☵☶☷），只保留汉字
    static getGuaName(n) {
        return (GUA_NAMES[n]||'').replace(/[\u2630\u2631\u2632\u2633\u2634\u2635\u2636\u2637]/g, '');
    }

    // 旺相休囚死颜色映射
    static getStateColor(state) {
        return "#333";
    }

    // 五行→CSS类名映射
    static getWxClass(wx) {
        return {"金":"wx-jin","木":"wx-mu","水":"wx-shui","火":"wx-huo","土":"wx-tu"}[wx] || "";
    }

    // 五行颜色
    static getWxColor(wx) {
        return "#333";
    }

    // 五行背景色
    static getWxBg(wx) {
        return "#f9f9f9";
    }

    // 渲染单根爻线 HTML
    static renderYaoLine(v, isDong) {
        const cls = isDong ? ' dong-yao' : '';
        if (v === 1) {
            return `<span class="yao-bar yao-yang${cls}"></span>`;
        }
        return `<span class="yao-yin${cls}"><span class="yao-yin-segment"></span><span class="yao-yin-segment"></span></span>`;
    }

    // 渲染本卦 — 用文字色标体/用，不使用虚线框
    static renderBenGua(up, down, move, tiNum, yongNum) {
        const upYao = YAO_MAP[up], downYao = YAO_MAP[down];
        const isTiUp = (tiNum === up);

        function renderYao(arr, startIdx) {
            return [...arr].reverse().map((v, i) => {
                const gIdx = startIdx + (arr.length - 1 - i);
                const isDong = (gIdx === move);
                return `<div class="gua-yao-row">${GuaRenderer.renderYaoLine(v, isDong)}</div>`;
            }).join('');
        }

        const upTagClass = isTiUp ? 'pos-label-ti' : 'pos-label-yong';
        const upTagText  = isTiUp ? '• 体' : '• 用';
        const upLines    = renderYao(upYao, 4);
        const upArea     = `<div class="gua-trigram">${upLines}
            <div class="gua-meta-row">
                <span class="gua-label">${GuaRenderer.getGuaName(up)}</span>
                <span class="gua-pos-label ${upTagClass}">${upTagText}</span>
            </div></div>`;

        const downIsTi   = !isTiUp && tiNum === down;
        const downTagClass = downIsTi ? 'pos-label-ti' : 'pos-label-yong';
        const downTagText  = downIsTi ? '• 体' : '• 用';
        const downLines    = renderYao(downYao, 1);
        const downArea     = `<div class="gua-trigram">${downLines}
            <div class="gua-meta-row">
                <span class="gua-label">${GuaRenderer.getGuaName(down)}</span>
                <span class="gua-pos-label ${downTagClass}">${downTagText}</span>
            </div></div>`;

        return `<div class="gua-stack">${upArea}<div class="gua-divider"></div>${downArea}</div>`;
    }

    // 渲染互卦/变卦（可选体用标注）
    static renderPlainGua(u, d, isTiUp) {
        const showTiYong = isTiUp != null;
        const upIsTi  = showTiYong && isTiUp;
        const downIsTi = showTiYong && !isTiUp;
        const upTag  = upIsTi  ? '• 体' : (showTiYong ? '• 用' : '');
        const downTag = downIsTi ? '• 体' : (showTiYong ? '• 用' : '');
        return `<div class="gua-stack">
            <div class="gua-trigram">
                ${[...YAO_MAP[u]].reverse().map(v=>`<div class="gua-yao-row">${GuaRenderer.renderYaoLine(v)}</div>`).join('')}
                <div class="gua-meta-row">
                    <span class="gua-label">${GuaRenderer.getGuaName(u)}</span>
                    ${showTiYong ? `<span class="gua-pos-label ${upIsTi?'pos-label-ti':'pos-label-yong'}">${upTag}</span>` : ''}
                </div>
            </div>
            <div class="gua-divider"></div>
            <div class="gua-trigram">
                ${[...YAO_MAP[d]].reverse().map(v=>`<div class="gua-yao-row">${GuaRenderer.renderYaoLine(v)}</div>`).join('')}
                <div class="gua-meta-row">
                    <span class="gua-label">${GuaRenderer.getGuaName(d)}</span>
                    ${showTiYong ? `<span class="gua-pos-label ${downIsTi?'pos-label-ti':'pos-label-yong'}">${downTag}</span>` : ''}
                </div>
            </div>
        </div>`;
    }

    // 初始化五行五边形交互图（月令旺衰箭头）
    static initWuxingPentagon(monthWx) {
        const pentagon  = document.getElementById("wuxingPentagon");
        const arrowSvg  = document.getElementById("arrowSvg");
        const arrowGroup = document.getElementById("arrowGroup");
        if (!pentagon || !arrowSvg || !arrowGroup) return;

        // 正五边形顶点坐标（元素36×36，中心坐标）
        const wxPos = {
            '土': {x: 80, y: 18},
            '火': {x: 142, y: 66},
            '木': {x: 130, y: 128},
            '水': {x: 30, y: 128},
            '金': {x: 18, y: 66}
        };
        const centerPos = {x: 80, y: 80};
        const stateColors = STATE_COLORS;
        const wangshuaiMap = WANGSHUAI_TABLE;

        // 设置各五行旺衰状态
        pentagon.querySelectorAll('.wx-item').forEach(item => {
            const wx = item.dataset.wx;
            item.dataset.state = wangshuaiMap[monthWx][wx];
        });

        // 绘制月令→五行箭头
        arrowGroup.innerHTML = '';
        ['木', '火', '土', '金', '水'].forEach(wx => {
            const targetItem = pentagon.querySelector(`[data-wx="${wx}"]`);
            const targetState = targetItem ? targetItem.dataset.state : '';
            if (!targetState) return;

            const from = centerPos, to = wxPos[wx];
            const dx = to.x - from.x, dy = to.y - from.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const shorten = 22, ratio = (dist - shorten) / dist;
            const endX = from.x + dx * ratio, endY = from.y + dy * ratio;
            const startRatio = 20 / dist;
            const startX = from.x + dx * startRatio, startY = from.y + dy * startRatio;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX); line.setAttribute('y1', startY);
            line.setAttribute('x2', endX);   line.setAttribute('y2', endY);
            line.setAttribute('class', 'arrow-line');
            line.setAttribute('stroke', stateColors[targetState]);
            line.setAttribute('marker-end', 'url(#arrowhead)');
            arrowGroup.appendChild(line);

            const labelRatio = (dist - 35) / dist;
            const labelX = from.x + dx * labelRatio, labelY = from.y + dy * labelRatio;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelX); text.setAttribute('y', labelY);
            text.setAttribute('class', 'state-label');
            text.setAttribute('fill', stateColors[targetState]);
            text.setAttribute('font-size', '11px'); text.setAttribute('font-weight', 'bold');
            text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
            text.textContent = targetState;
            arrowGroup.appendChild(text);
        });

        arrowSvg.classList.add('show');
    }

    // 构建三卦推演区域 HTML（本卦/互卦/变卦 + 内联分析块）
    static buildGuaResultHTML(p) {
        const isTiUp = p.move <= 3;

        const benHtml  = this.renderBenGua(p.up, p.down, p.move, p.tiNum, p.yongNum);
        const huHtml   = this.renderPlainGua(p.huU, p.huD, isTiUp);
        const bianHtml = this.renderPlainGua(p.bianU, p.bianD, isTiUp);

        const huTiWx = WUXING[p.huTiIdx], huYongWx = WUXING[p.huYongIdx];
        const bTiWx  = WUXING[p.bTiIdx],  bYongWx  = WUXING[p.bYongIdx];

        const benAnalysis = `<div class="inline-analysis ia-ben">
            <div class="ia-row"><span class="ia-ti-label">体-${p.tiWx}-${p.ws.tiState}：</span><span class="ia-state-desc">${STATE_DESC[p.ws.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${p.yongWx}-${p.ws.yongState}：</span><span class="ia-state-desc">${STATE_DESC[p.ws.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#333;">${p.base.name}</div>
        </div>`;
        const huAnalysis = `<div class="inline-analysis ia-hu">
            <div class="ia-row"><span class="ia-ti-label">体-${huTiWx}-${p.huWs.tiState}：</span><span class="ia-state-desc">${STATE_DESC[p.huWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${huYongWx}-${p.huWs.yongState}：</span><span class="ia-state-desc">${STATE_DESC[p.huWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#333;">${p.huBase.name}</div>
        </div>`;
        const bianAnalysis = `<div class="inline-analysis ia-bian">
            <div class="ia-row"><span class="ia-ti-label">体-${bTiWx}-${p.bWs.tiState}：</span><span class="ia-state-desc">${STATE_DESC[p.bWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${bYongWx}-${p.bWs.yongState}：</span><span class="ia-state-desc">${STATE_DESC[p.bWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#333;">${p.bBase.name}</div>
        </div>`;

        return `<div class="gua-row-flex">
            <div class="gua-column"><div class="stage-title">起因 · 本卦</div>${benHtml}${benAnalysis}</div>
            <div class="gua-column"><div class="stage-title">过程 · 互卦</div>${huHtml}${huAnalysis}</div>
            <div class="gua-column"><div class="stage-title">结局 · 变卦</div>${bianHtml}${bianAnalysis}</div>
        </div>
        <div class="divider"></div>
        <div class="info-list">
            <div class="spacetime-box"><strong>方位提示</strong> ${p.spaceHint}</div>
            <div class="spacetime-box"><strong>应期参考</strong> ${p.yingqi}</div>
        </div>`;
    }
}

// 导出函数，保持向后兼容
function _gn(n) {
    return GuaRenderer.getGuaName(n);
}

function tiStateColor(state) {
    return GuaRenderer.getStateColor(state);
}

function wxClass(wx) {
    return GuaRenderer.getWxClass(wx);
}

function wxColor(wx) {
    return GuaRenderer.getWxColor(wx);
}

function wxBg(wx) {
    return GuaRenderer.getWxBg(wx);
}

function renderYaoLine(v, isDong) {
    return GuaRenderer.renderYaoLine(v, isDong);
}

function renderBenGua(up, down, move, tiNum, yongNum) {
    return GuaRenderer.renderBenGua(up, down, move, tiNum, yongNum);
}

function renderPlainGua(u, d, isTiUp) {
    return GuaRenderer.renderPlainGua(u, d, isTiUp);
}

function initWuxingPentagon(monthWx) {
    return GuaRenderer.initWuxingPentagon(monthWx);
}

function buildGuaResultHTML(p) {
    return GuaRenderer.buildGuaResultHTML(p);
}