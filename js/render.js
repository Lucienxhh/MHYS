/**
 * render.js — 卦象渲染模块
 * 依赖：data.js 中的 GUA_NAMES、WUXING、YAO_MAP
 */

// 剥离卦名中的 Unicode 卦象符号（☰☱☲☳☴☵☶☷），只保留汉字
function _gn(n) { return (GUA_NAMES[n]||'').replace(/[\u2630\u2631\u2632\u2633\u2634\u2635\u2636\u2637]/g, ''); }

// 旺相休囚死颜色映射
function tiStateColor(state) {
    const map = {"旺":"#c0392b","相":"#d35400","休":"#2980b9","囚":"#7f8c8d","死":"#2c3e50"};
    return map[state] || "#5a3f2e";
}

// 五行→CSS类名映射
function wxClass(wx) {
    return {"金":"wx-jin","木":"wx-mu","水":"wx-shui","火":"wx-huo","土":"wx-tu"}[wx] || "";
}

// 五行颜色
function wxColor(wx) {
    return {"金":"#b8860b","木":"#27ae60","水":"#2980b9","火":"#c0392b","土":"#a0714a"}[wx] || "#5a3f2e";
}

function wxBg(wx) {
    return {"金":"#f9f3e3","木":"#e8f5e9","水":"#e3f2fd","火":"#ffebee","土":"#f5f5dc"}[wx] || "#d4c3b6";
}

/**
 * 渲染本卦 — 用文字色标体/用，不使用虚线框
 */
function renderBenGua(up, down, move, tiNum, yongNum) {
    const upYao = YAO_MAP[up], downYao = YAO_MAP[down];
    const isTiUp = (tiNum === up);

    function renderYao(arr, startIdx) {
        return [...arr].reverse().map((v, i) => {
            const gIdx = startIdx + (arr.length - 1 - i);
            const isDong = (gIdx === move);
            const yaoHtml = v === 1
                ? `<span class="yao-bar yao-yang${isDong ? ' dong-yao' : ''}"></span>`
                : `<span class="yao-yin${isDong ? ' dong-yao' : ''}"><span class="yao-yin-segment"></span><span class="yao-yin-segment"></span></span>`;
            return `<div class="gua-yao-row">${yaoHtml}</div>`;
        }).join('');
    }

    const upTagClass = isTiUp ? 'pos-label-ti' : 'pos-label-yong';
    const upTagText  = isTiUp ? '• 体' : '• 用';
    const upLines    = renderYao(upYao, 4);
    const upArea     = `<div class="gua-trigram">${upLines}
        <div class="gua-meta-row">
            <span class="gua-label">${_gn(up)}</span>
            <span class="gua-pos-label ${upTagClass}">${upTagText}</span>
        </div></div>`;

    const downIsTi   = !isTiUp && tiNum === down;
    const downTagClass = downIsTi ? 'pos-label-ti' : 'pos-label-yong';
    const downTagText  = downIsTi ? '• 体' : '• 用';
    const downLines    = renderYao(downYao, 1);
    const downArea     = `<div class="gua-trigram">${downLines}
        <div class="gua-meta-row">
            <span class="gua-label">${_gn(down)}</span>
            <span class="gua-pos-label ${downTagClass}">${downTagText}</span>
        </div></div>`;

    return `<div class="gua-stack">${upArea}<div class="gua-divider"></div>${downArea}</div>`;
}

/**
 * 渲染互卦/变卦（可选体用标注）
 * @param {number} u - 上卦编号
 * @param {number} d - 下卦编号
 * @param {boolean|null} isTiUp - 上卦是否为体卦（null 则不标注体用）
 * ⚠️ 使用副本进行reverse，避免修改原始YAO_MAP
 */
function renderPlainGua(u, d, isTiUp) {
    const yaoStr = (v) => v === 1
        ? `<span class="yao-bar yao-yang"></span>`
        : `<span class="yao-yin"><span class="yao-yin-segment"></span><span class="yao-yin-segment"></span></span>`;
    const showTiYong = isTiUp != null;
    const upIsTi  = showTiYong && isTiUp;
    const downIsTi = showTiYong && !isTiUp;
    const upTag  = upIsTi  ? '• 体' : (showTiYong ? '• 用' : '');
    const downTag = downIsTi ? '• 体' : (showTiYong ? '• 用' : '');
    return `<div class="gua-stack">
        <div class="gua-trigram">
            ${[...YAO_MAP[u]].reverse().map(v=>`<div class="gua-yao-row">${yaoStr(v)}</div>`).join('')}
            <div class="gua-meta-row">
                <span class="gua-label">${_gn(u)}</span>
                ${showTiYong ? `<span class="gua-pos-label ${upIsTi?'pos-label-ti':'pos-label-yong'}">${upTag}</span>` : ''}
            </div>
        </div>
        <div class="gua-divider"></div>
        <div class="gua-trigram">
            ${[...YAO_MAP[d]].reverse().map(v=>`<div class="gua-yao-row">${yaoStr(v)}</div>`).join('')}
            <div class="gua-meta-row">
                <span class="gua-label">${_gn(d)}</span>
                ${showTiYong ? `<span class="gua-pos-label ${downIsTi?'pos-label-ti':'pos-label-yong'}">${downTag}</span>` : ''}
            </div>
        </div>
    </div>`;
}

/**
 * 初始化五行五边形交互图（月令旺衰箭头）
 * @param {string} monthWx - 月令五行
 */
function initWuxingPentagon(monthWx) {
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
    const stateColors = {
        '旺': '#c0392b', '相': '#d35400',
        '休': '#2980b9', '囚': '#7f8c8d', '死': '#2c3e50'
    };
    const wangshuaiMap = {
        '木': {'木':'旺','火':'相','水':'休','金':'囚','土':'死'},
        '火': {'火':'旺','土':'相','木':'休','水':'囚','金':'死'},
        '土': {'土':'旺','金':'相','火':'休','木':'囚','水':'死'},
        '金': {'金':'旺','水':'相','土':'休','火':'囚','木':'死'},
        '水': {'水':'旺','木':'相','金':'休','土':'囚','火':'死'}
    };

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
