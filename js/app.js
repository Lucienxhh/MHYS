/**
 * app.js — 梅花易数应用入口
 * 负责：初始化、UI事件绑定、起卦主流程调度
 * 依赖顺序：data.js → ganzhi.js → divination.js → render.js → app.js
 */

(function () {
    let currentGz = null;
    let lastExplainParams = null; // 保存最近一次断卦的解析参数

    // ── 起卦历史记录（localStorage） ──
    const HISTORY_KEY = 'mhys_history';
    const HISTORY_MAX = 20;

    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
        catch(e) { return []; }
    }

    function saveHistory(params) {
        const list = loadHistory();
        // 只保留 generateExplain/renderHistoryList 需要的字段，避免存多余数据
        const slim = {
            up: params.up, down: params.down, move: params.move,
            rawUp: params.rawUp, rawDown: params.rawDown, rawMove: params.rawMove,
            huU: params.huU, huD: params.huD, bianU: params.bianU, bianD: params.bianD,
            tiNum: params.tiNum, yongNum: params.yongNum,
            huTiIdx: params.huTiIdx, huYongIdx: params.huYongIdx,
            bTiIdx: params.bTiIdx, bYongIdx: params.bYongIdx,
            tiWx: params.tiWx, yongWx: params.yongWx,
            monthWx: params.monthWx, monthZhi: params.monthZhi,
            base: params.base, ws: params.ws,
            huBase: params.huBase, huWs: params.huWs,
            bianBase: params.bianBase, bianWs: params.bianWs,
            yingqi: params.yingqi, spaceHint: params.spaceHint,
            gz: params.gz,
            mode: params.mode,
            inputNums: params.inputNums
        };
        const entry = {
            id: Date.now(),
            time: new Date().toLocaleString('zh-CN', {hour12: false}),
            params: slim
        };
        list.unshift(entry);
        if (list.length > HISTORY_MAX) list.splice(HISTORY_MAX);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        return entry;
    }

    function deleteHistoryEntry(id) {
        const list = loadHistory().filter(e => e.id !== id);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
    }

    function clearHistory() {
        try { localStorage.removeItem(HISTORY_KEY); } catch(e) {}
    }

    // ── 渲染历史记录列表 ──
    function renderHistoryList() {
        let list = loadHistory();
        // 过滤掉无效条目并同步清理 localStorage
        const valid = list.filter(e => e && e.params && typeof e.params.up === 'number');
        if (valid.length !== list.length) {
            list = valid;
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
        }
        const wrap = document.getElementById('historyList');
        if (!wrap) return;
        if (list.length === 0) {
            wrap.innerHTML = '<div class="history-empty">暂无记录</div>';
            return;
        }
        wrap.innerHTML = list.map(entry => {
            const p = entry.params;
            const upName   = (typeof GUA_NAMES !== 'undefined') ? GUA_NAMES[p.up]   : p.up;
            const downName = (typeof GUA_NAMES !== 'undefined') ? GUA_NAMES[p.down] : p.down;
            const label = `${upName}☰ / ${downName} · 动爻 ${p.move}`;
            return `<div class="history-item" data-id="${entry.id}">
                <div class="history-item-main" onclick="openHistoryDetail(${entry.id})">
                    <span class="history-time">${entry.time}</span>
                    <span class="history-label">${upName} / ${downName}，动爻第 ${p.move} 爻</span>
                </div>
                <button class="history-del-btn" onclick="event.stopPropagation();deleteHistoryItem(${entry.id})" title="删除">×</button>
            </div>`;
        }).join('');
    }

    // ── 切换解析面板显隐 ──
    window.toggleExplainPanel = function() {
        const area = document.getElementById("explainArea");
        const bar  = document.getElementById("explainCollapsedBar");
        const btn  = document.getElementById("explainBtn");
        if (area) {
            area.style.display = "none";
            bar.style.display = "block";
            btn.textContent = "🔍 卦象解析";
        }
    };

    // ── 初始化当前时间 ──
    function initCurrentTime() {
        const now = new Date();
        document.getElementById("gregYear").value   = now.getFullYear();
        document.getElementById("gregMonth").value  = now.getMonth() + 1;
        document.getElementById("gregDay").value    = now.getDate();
        document.getElementById("gregHour").value   = now.getHours();
        document.getElementById("gregMinute").value = now.getMinutes();
    }

    // ── 通用干支刷新：从指定输入源读取时间并更新干支 ──
    function refreshGanZhiFromInputs(inputIds) {
        const y   = +document.getElementById(inputIds[0]).value;
        const m   = +document.getElementById(inputIds[1]).value;
        const d   = +document.getElementById(inputIds[2]).value;
        const h   = +document.getElementById(inputIds[3]).value;
        const min = +document.getElementById(inputIds[4]).value || 0;
        if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h)) return;
        currentGz = computeAllGanZhi(y, m, d, h, min);
        document.getElementById("displayGanzhi").innerHTML = `📌 干支：${formatGanZhi(currentGz)}`;
        return currentGz;
    }

    // ── 更新干支显示 & 自动计算日期模式卦数 ──
    function updateGanZhi() {
        const gz = refreshGanZhiFromInputs(['gregYear','gregMonth','gregDay','gregHour','gregMinute']);
        if (!gz) return;
        if (document.getElementById("divinationMode").value === 'date') {
            const nums = calcGuaFromDate(gz);
            document.getElementById("numUp").value   = nums.up;
            document.getElementById("numDown").value = nums.down;
            document.getElementById("numMove").value = nums.move;
        }
    }

    // ── 时令参考面板：根据自定义输入更新干支 ──
    function updateRefCustomGanZhi() {
        refreshGanZhiFromInputs(['refYear','refMonth','refDay','refHour','refMinute']);
    }

    // ── 一键填入当前系统时间 ──
    function fillNowTime() {
        initCurrentTime();
        updateGanZhi();
    }

    // ── 切换起卦方式 ──
    function toggleMode() {
        const mode            = document.getElementById("divinationMode").value;
        const numInputs       = document.getElementById("numberInputs");
        const dateInputSection = document.getElementById("dateInputSection");

        if (mode === 'date') {
            numInputs.style.display        = 'none';
            dateInputSection.style.display = 'block';
            if (currentGz) {
                const nums = calcGuaFromDate(currentGz);
                document.getElementById("numUp").value   = nums.up;
                document.getElementById("numDown").value = nums.down;
                document.getElementById("numMove").value = nums.move;
            }
        } else {
            numInputs.style.display        = 'block';
            dateInputSection.style.display = 'none';
            refreshTimeRefNow(); // 刷新当前时间显示
        }
    }

    // ── 时令参考面板：刷新"当前时间"显示 ──
    function refreshTimeRefNow() {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
        const h = now.getHours(), min = now.getMinutes();
        const el = document.getElementById("timeRefNowDisplay");
        if (el) el.textContent = `${y}年${m}月${d}日 ${h}:${String(min).padStart(2,'0')}`;
        // 静默抓取当前时间更新干支（用于断卦分析）
        currentGz = computeAllGanZhi(y, m, d, h, min);
        document.getElementById("displayGanzhi").innerHTML = `📌 干支：${formatGanZhi(currentGz)}`;
    }

    // ── 时令参考面板：切换 使用当前时间 / 使用自定义时间 ──
    function bindTimeRefToggle() {
        const optNow      = document.getElementById("optNowTime");
        const optCustom   = document.getElementById("optCustomTime");
        const panelNow    = document.getElementById("timeRefNow");
        const panelCustom = document.getElementById("timeRefCustom");
        const refInputs   = ['refYear','refMonth','refDay','refHour','refMinute'];

        optNow.onclick = () => {
            optNow.classList.add('active');
            optCustom.classList.remove('active');
            panelNow.style.display = 'flex';
            panelCustom.style.display = 'none';
            refInputs.forEach(id => document.getElementById(id).disabled = true);
            refreshTimeRefNow();
        };

        optCustom.onclick = () => {
            optCustom.classList.add('active');
            optNow.classList.remove('active');
            panelNow.style.display = 'none';
            panelCustom.style.display = 'flex';
            refInputs.forEach(id => document.getElementById(id).disabled = false);
            // 自动填入当前时间
            const now = new Date();
            document.getElementById("refYear").value   = now.getFullYear();
            document.getElementById("refMonth").value  = now.getMonth() + 1;
            document.getElementById("refDay").value    = now.getDate();
            document.getElementById("refHour").value   = now.getHours();
            document.getElementById("refMinute").value = now.getMinutes();
            updateRefCustomGanZhi();
        };
    }

    // ── 获取当前生效的时间参数（用于 perform） ──
    function getActiveTimeInputs() {
        const mode = document.getElementById("divinationMode").value;
        if (mode === 'date') {
            return {
                year: document.getElementById("gregYear").value,
                month: document.getElementById("gregMonth").value,
                day: document.getElementById("gregDay").value,
                hour: document.getElementById("gregHour").value,
                minute: document.getElementById("gregMinute").value
            };
        }
        // 数字起卦模式
        const useNow = document.getElementById("optNowTime").classList.contains('active');
        if (useNow) {
            const now = new Date();
            return {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes()
            };
        }
        return {
            year: document.getElementById("refYear").value,
            month: document.getElementById("refMonth").value,
            day: document.getElementById("refDay").value,
            hour: document.getElementById("refHour").value,
            minute: document.getElementById("refMinute").value
        };
    }

    // ── 自动计算数字起卦 ──
    function autoCalcNumber() {
        const n1 = parseInt(document.getElementById("inputNum1").value) || 0;
        const n2 = parseInt(document.getElementById("inputNum2").value) || 0;
        const n3Input = document.getElementById("inputNum3");
        const n3 = n3Input.value.trim() === '' ? null : parseInt(n3Input.value);
        if (n1 <= 0 || n2 <= 0) {
            document.getElementById("numUp").value   = '';
            document.getElementById("numDown").value = '';
            document.getElementById("numMove").value = '';
            return;
        }
        let up   = n1 % 8; if (up === 0) up = 8;
        let down = n2 % 8; if (down === 0) down = 8;
        let move;
        if (n3 !== null && n3 > 0) {
            move = n3 % 6; if (move === 0) move = 6;
        } else {
            move = (n1 + n2) % 6; if (move === 0) move = 6;
        }
        document.getElementById("numUp").value   = up;
        document.getElementById("numDown").value = down;
        document.getElementById("numMove").value = move;
    }

    // ── 旺相休囚死文字描述 ──
    const stateDesc = {
        "旺": "当令最强，得时得势",
        "相": "次旺蓄势，待发之时",
        "休": "气已泄退，退休退守",
        "囚": "受制被困，力量不足",
        "死": "最衰无力，全无生机"
    };

    // ── 主起卦流程 ──
    function perform() {
        // 每次起卦时重置解析面板状态
        const prevArea = document.getElementById("explainArea");
        const prevBar  = document.getElementById("explainCollapsedBar");
        const prevBtn  = document.getElementById("explainBtn");
        prevArea.style.display = "none";
        prevBar.style.display  = "none";
        prevBtn.classList.add('disabled');
        prevBtn.textContent = "🔍 卦象解析";

        // 确保干支已计算（数字起卦模式静默抓取时间）
        const mode = document.getElementById("divinationMode").value;
        if (mode === 'date') {
            if (!currentGz) updateGanZhi();
        } else {
            // 数字起卦：根据时令参考面板设置计算干支
            const t = getActiveTimeInputs();
            if (+t.year && +t.month && +t.day && +t.hour !== undefined) {
                currentGz = computeAllGanZhi(+t.year, +t.month, +t.day, +t.hour, +t.minute || 0);
                document.getElementById("displayGanzhi").innerHTML = `📌 干支：${formatGanZhi(currentGz)}`;
            } else if (!currentGz) {
                refreshTimeRefNow();
            }
        }
        const gz = currentGz;

        let rawUp   = +document.getElementById("numUp").value;
        let rawDown = +document.getElementById("numDown").value;
        let rawMove = +document.getElementById("numMove").value;
        if (!rawUp || !rawDown || !rawMove) { alert("请先确定上/下卦数与动爻数"); return; }
        let up   = (rawUp   - 1) % 8 + 1;
        let down = (rawDown - 1) % 8 + 1;
        let move = (rawMove - 1) % 6 + 1;

        // 体用判断
        const tiYong = move <= 3 ? {ti: up, yong: down} : {ti: down, yong: up};
        const tiWx   = WUXING[tiYong.ti], yongWx = WUXING[tiYong.yong];
        const monthWx = getMonthWuxing(gz.month.zhi);

        const base   = analyzeBase(tiWx, yongWx);
        const ws     = applyWangshuai(tiWx, yongWx, monthWx, base);
        const yingqi = predictYingqi(tiWx, ws.tiState, move, up, down);
        const spaceHint = analyzeSpacetime(tiWx, gz.day.gan, gz.day.zhi, gz.hour.zhi);

        const [huU, huD]     = getHuGua(up, down);
        const [bianU, bianD] = getBianGua(up, down, move);

        // 渲染本卦
        const benHtml  = renderBenGua(up, down, move, tiYong.ti, tiYong.yong);

        // 互卦体用分析
        const huTiIdx   = move <= 3 ? huU : huD;
        const huYongIdx = move <= 3 ? huD : huU;
        const huTiWx    = WUXING[huTiIdx], huDwWx = WUXING[huYongIdx];
        const huBase    = analyzeBase(huTiWx, huDwWx);
        const huWs      = applyWangshuai(huTiWx, huDwWx, monthWx, huBase);

        // 变卦体用分析
        const bTiIdx   = move <= 3 ? bianU : bianD;
        const bYongIdx = move <= 3 ? bianD : bianU;
        const bTiWx    = WUXING[bTiIdx], bYongWx = WUXING[bYongIdx];
        const bBase    = analyzeBase(bTiWx, bYongWx);
        const bWs      = applyWangshuai(bTiWx, bYongWx, monthWx, bBase);

        // 渲染互卦、变卦（传入 isTiUp 布尔值）
        const huHtml   = renderPlainGua(huU, huD, move <= 3);
        const bianHtml = renderPlainGua(bianU, bianD, move <= 3);

        // 内联分析块
        const benAnalysis = `<div class="inline-analysis ia-ben">
            <div class="ia-row"><span class="ia-ti-label">体-${tiWx}-${ws.tiState}：</span><span class="ia-state-desc">${stateDesc[ws.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${yongWx}-${ws.yongState}：</span><span class="ia-state-desc">${stateDesc[ws.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#8e44ad;">${base.name}</div>
        </div>`;

        const huAnalysis = `<div class="inline-analysis ia-hu">
            <div class="ia-row"><span class="ia-ti-label">体-${huTiWx}-${huWs.tiState}：</span><span class="ia-state-desc">${stateDesc[huWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${huDwWx}-${huWs.yongState}：</span><span class="ia-state-desc">${stateDesc[huWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#d35400;">${huBase.name}</div>
        </div>`;

        const bianAnalysis = `<div class="inline-analysis ia-bian">
            <div class="ia-row"><span class="ia-ti-label">体-${bTiWx}-${bWs.tiState}：</span><span class="ia-state-desc">${stateDesc[bWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${bYongWx}-${bWs.yongState}：</span><span class="ia-state-desc">${stateDesc[bWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#16a085;">${bBase.name}</div>
        </div>`;

        // 注入结果区域
        document.getElementById("resultContent").innerHTML = `
            <div class="gua-row-flex">
                <div class="gua-column"><div class="stage-title">起因 · 本卦</div>${benHtml}${benAnalysis}</div>
                <div class="gua-column"><div class="stage-title">过程 · 互卦</div>${huHtml}${huAnalysis}</div>
                <div class="gua-column"><div class="stage-title">结局 · 变卦</div>${bianHtml}${bianAnalysis}</div>
            </div>
            <div class="divider"></div>
            <div class="info-list">
                <div class="spacetime-box"><strong>🧭 方位提示</strong> ${spaceHint}</div>
                <div class="spacetime-box"><strong>📅 应期参考</strong> ${yingqi}</div>
            </div>
            <div class="export-area">
                <button class="export-btn" id="exportCopyBtn">📋 导出并复制</button>
            </div>
        `;

        // 保存解析参数，激活解析按钮
        lastExplainParams = {
            up, down, move,
            rawUp, rawDown, rawMove,
            huU, huD, bianU, bianD,
            tiNum: tiYong.ti, yongNum: tiYong.yong,
            huTiIdx, huYongIdx,
            bTiIdx, bYongIdx,
            tiWx, yongWx,
            monthWx, monthZhi: gz.month.zhi,
            base, ws,
            huBase, huWs,
            bianBase: bBase, bianWs: bWs,
            yingqi, spaceHint,
            gz,
            mode: document.getElementById("divinationMode").value,
            inputNums: {
                n1: parseInt(document.getElementById("inputNum1").value) || 0,
                n2: parseInt(document.getElementById("inputNum2").value) || 0,
                n3: document.getElementById("inputNum3").value.trim() !== '' ?
                    parseInt(document.getElementById("inputNum3").value) : null
            }
        };
        const explainBtn = document.getElementById("explainBtn");
        explainBtn.classList.remove('disabled');
        explainBtn.textContent = "🔍 卦象解析";
        document.getElementById("explainCollapsedBar").style.display = "block";
        document.getElementById("resultCard").style.display = "block";

        // 构建导出文本
        const wsMap = {
            '木': {'木':'旺','火':'相','水':'休','金':'囚','土':'死'},
            '火': {'火':'旺','土':'相','木':'休','水':'囚','金':'死'},
            '土': {'土':'旺','金':'相','火':'休','木':'囚','水':'死'},
            '金': {'金':'旺','水':'相','土':'休','火':'囚','木':'死'},
            '水': {'水':'旺','木':'相','金':'休','土':'囚','火':'死'}
        };
        const getWxByState = (mWx, state) => {
            const map = wsMap[mWx];
            for (let wx in map) { if (map[wx] === state) return wx; }
            return '';
        };
        const yuelingWxDesc = `${monthWx}旺、${getWxByState(monthWx,'相')}相、${getWxByState(monthWx,'休')}休、${getWxByState(monthWx,'囚')}囚、${getWxByState(monthWx,'死')}死`;
        const exportText = `【梅花易数 · 断卦记录】
起卦时间：${gz.inputDate.year}年${gz.inputDate.month}月${gz.inputDate.day}日 ${document.getElementById("gregHour").value}:${String(document.getElementById("gregMinute").value||0).padStart(2,'0')}
干　　支：${TIANGAN[gz.year.gan].name}${DIZHI[gz.year.zhi].name}年 ${TIANGAN[gz.month.gan].name}${DIZHI[gz.month.zhi].name}月 ${TIANGAN[gz.day.gan].name}${DIZHI[gz.day.zhi].name}日 ${TIANGAN[gz.hour.gan].name}${DIZHI[gz.hour.zhi].name}时
月　　令：${DIZHI[gz.month.zhi].name}月（${yuelingWxDesc}）
动　　爻：${move}

━━ 起因 · 本卦 ━━
${tiYong.ti===up?'上卦（体）':'上卦（用）'}：${GUA_NAMES[up]}（${WUXING[up]}）${tiYong.ti===up?ws.tiState:ws.yongState} — ${stateDesc[tiYong.ti===up?ws.tiState:ws.yongState]}
${tiYong.ti===down?'下卦（体）':'下卦（用）'}：${GUA_NAMES[down]}（${WUXING[down]}）${tiYong.ti===down?ws.tiState:ws.yongState} — ${stateDesc[tiYong.ti===down?ws.tiState:ws.yongState]}
体用关系：${base.name}

━━ 过程 · 互卦 ━━
${move<=3?'上卦（体）':'上卦（用）'}：${GUA_NAMES[huU]}（${WUXING[huU]}）${move<=3?huWs.tiState:huWs.yongState} — ${stateDesc[move<=3?huWs.tiState:huWs.yongState]}
${move<=3?'下卦（用）':'下卦（体）'}：${GUA_NAMES[huD]}（${WUXING[huD]}）${move<=3?huWs.yongState:huWs.tiState} — ${stateDesc[move<=3?huWs.yongState:huWs.tiState]}
体用关系：${huBase.name}

━━ 结局 · 变卦 ━━
${move>3?'上卦（体）':'上卦（用）'}：${GUA_NAMES[bianU]}（${WUXING[bianU]}）${move>3?bWs.tiState:bWs.yongState} — ${stateDesc[move>3?bWs.tiState:bWs.yongState]}
${move<=3?'下卦（体）':'下卦（用）'}：${GUA_NAMES[bianD]}（${WUXING[bianD]}）${move<=3?bWs.tiState:bWs.yongState} — ${stateDesc[move<=3?bWs.tiState:bWs.yongState]}
体用关系：${bBase.name}

━━ 综合 ━━
应期：${yingqi}
方位：${spaceHint}`;

        document.getElementById("exportCopyBtn").onclick = () => {
            navigator.clipboard.writeText(exportText).then(() => {
                alert("已复制到剪贴板");
            }).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = exportText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert("已复制到剪贴板");
            });
        };

        // 保存本次起卦记录
        saveHistory(lastExplainParams);
        renderHistoryList();
    }

    // ── 事件绑定与初始化 ──
    document.addEventListener("DOMContentLoaded", () => {
        initCurrentTime();

        document.getElementById("nowTimeBtn").onclick     = fillNowTime;
        document.getElementById("calculateBtn").onclick   = perform;
        document.getElementById("divinationMode").onchange = toggleMode;

        document.getElementById("explainBtn").onclick = function() {
            if (!lastExplainParams) return;
            const area    = document.getElementById("explainArea");
            const bar     = document.getElementById("explainCollapsedBar");
            const content = document.getElementById("explainContent");
            if (area.style.display !== "none") {
                // 当前已展开 → 收起
                area.style.display = "none";
                bar.style.display = "block";
                this.textContent = "🔍 卦象解析";
            } else {
                // 当前已折叠 → 展开
                content.innerHTML = generateExplain(lastExplainParams);
                area.style.display = "block";
                bar.style.display = "none";
                area.scrollIntoView({behavior: "smooth", block: "start"});
            }
        };

        // 日期起卦：时间输入实时更新干支
        ['gregYear','gregMonth','gregDay','gregHour','gregMinute'].forEach(id => {
            document.getElementById(id).oninput = updateGanZhi;
        });
        // 数字起卦：数字输入实时计算卦数
        document.getElementById("inputNum1").oninput = autoCalcNumber;
        document.getElementById("inputNum2").oninput = autoCalcNumber;
        document.getElementById("inputNum3").oninput = autoCalcNumber;
        // 数字起卦：自定义时间输入实时更新干支
        ['refYear','refMonth','refDay','refHour','refMinute'].forEach(id => {
            document.getElementById(id).oninput = updateRefCustomGanZhi;
        });

        // 时令参考面板切换绑定
        bindTimeRefToggle();

        updateGanZhi();
        toggleMode();

        // ── 历史记录面板折叠 ──
        const historyToggle = document.getElementById('historyToggleBtn');
        const historyPanel  = document.getElementById('historyPanel');
        if (historyToggle && historyPanel) {
            historyToggle.onclick = () => {
                const open = historyPanel.style.display !== 'none';
                historyPanel.style.display = open ? 'none' : 'block';
                historyToggle.classList.toggle('open', !open);
            };
        }

        // 初始化渲染历史列表
        renderHistoryList();

        // 清空历史
        const clearBtn = document.getElementById('historyClearBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (!confirm('确认清空所有起卦记录？')) return;
                clearHistory();
                renderHistoryList();
            };
        }
    });

    // ── 全局：删除单条历史 ──
    window.deleteHistoryItem = function(id) {
        deleteHistoryEntry(id);
        renderHistoryList();
    };

    // ── 全局：打开历史详情（覆盖层展示）──
    window.openHistoryDetail = function(id) {
        const list = loadHistory();
        const entry = list.find(e => e.id === id);
        if (!entry) return;
        // 将数据存入 sessionStorage，history.html 读取
        sessionStorage.setItem('mhys_detail', JSON.stringify(entry));
        // 在当前页面渲染历史详情覆盖层
        renderHistoryDetail(entry);
    };

    // ── 在当前页面渲染历史详情 ──
    function renderHistoryDetail(entry) {
        let overlay = document.getElementById('historyOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'historyOverlay';
            overlay.className = 'history-overlay';
            document.body.appendChild(overlay);
        }

        // 构建与 history.html 相同的推演内容（复用 render.js）
        const p = entry.params;
        const stateDesc2 = {
            "旺":"当令最强，得时得势","相":"次旺蓄势，待发之时",
            "休":"气已泄退，退休退守","囚":"受制被困，力量不足","死":"最衰无力，全无生机"
        };

        const benHtml  = renderBenGua(p.up, p.down, p.move, p.tiNum, p.yongNum);
        const huHtml   = renderPlainGua(p.huU, p.huD, p.move <= 3);
        const bianHtml = renderPlainGua(p.bianU, p.bianD, p.move <= 3);

        const benAnalysis = `<div class="inline-analysis ia-ben">
            <div class="ia-row"><span class="ia-ti-label">体-${p.tiWx}-${p.ws.tiState}：</span><span class="ia-state-desc">${stateDesc2[p.ws.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${p.yongWx}-${p.ws.yongState}：</span><span class="ia-state-desc">${stateDesc2[p.ws.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#8e44ad;">${p.base.name}</div>
        </div>`;
        const huAnalysis = `<div class="inline-analysis ia-hu">
            <div class="ia-row"><span class="ia-ti-label">体-${(p.huBase&&WUXING[p.huTiIdx])||'?'}-${p.huWs.tiState}：</span><span class="ia-state-desc">${stateDesc2[p.huWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${(p.huBase&&WUXING[p.huYongIdx])||'?'}-${p.huWs.yongState}：</span><span class="ia-state-desc">${stateDesc2[p.huWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#d35400;">${p.huBase.name}</div>
        </div>`;
        const bianAnalysis = `<div class="inline-analysis ia-bian">
            <div class="ia-row"><span class="ia-ti-label">体-${(p.bianBase&&WUXING[p.bTiIdx])||'?'}-${p.bianWs.tiState}：</span><span class="ia-state-desc">${stateDesc2[p.bianWs.tiState]}</span></div>
            <div class="ia-row"><span class="ia-yong-label">用-${(p.bianBase&&WUXING[p.bYongIdx])||'?'}-${p.bianWs.yongState}：</span><span class="ia-state-desc">${stateDesc2[p.bianWs.yongState]}</span></div>
            <div class="ia-rel-line" style="color:#16a085;">${p.bianBase.name}</div>
        </div>`;

        overlay.innerHTML = `
            <div class="history-overlay-backdrop"></div>
            <div class="history-overlay-content">
                <div class="history-detail-header-bar">
                    <span class="history-detail-time-badge">🕐 ${entry.time}</span>
                    <button class="history-close-btn" id="historyCloseBtn">✕ 关闭</button>
                </div>

                <!-- 卦象推演 -->
                <div class="card result-area">
                    <div class="card-title">🔮 卦象推演</div>
                    <div class="gua-row-flex">
                        <div class="gua-column"><div class="stage-title">起因 · 本卦</div>${benHtml}${benAnalysis}</div>
                        <div class="gua-column"><div class="stage-title">过程 · 互卦</div>${huHtml}${huAnalysis}</div>
                        <div class="gua-column"><div class="stage-title">结局 · 变卦</div>${bianHtml}${bianAnalysis}</div>
                    </div>
                    <div class="divider"></div>
                    <div class="info-list">
                        <div class="spacetime-box"><strong>🧭 方位提示</strong> ${p.spaceHint}</div>
                        <div class="spacetime-box"><strong>📅 应期参考</strong> ${p.yingqi}</div>
                    </div>
                </div>

                <!-- 卦象解析折叠条 -->
                <div class="explain-collapsed-bar" style="display:block; margin-top:12px;">
                    <div class="explain-bar-content" id="historyExplainBtn">🔍 卦象解析</div>
                </div>

                <!-- 卦象解析面板 -->
                <div class="card explain-area" id="historyExplainArea" style="display:none;">
                    <div id="historyExplainContent"></div>
                </div>
            </div>
        `;

        // 显示
        document.body.style.overflow = 'hidden';
        overlay.style.display = 'flex';

        // 关闭按钮
        document.getElementById('historyCloseBtn').onclick = closeHistoryOverlay;
        overlay.querySelector('.history-overlay-backdrop').onclick = closeHistoryOverlay;

        // 解析面板展开/收起
        document.getElementById('historyExplainBtn').onclick = function() {
            const area    = document.getElementById('historyExplainArea');
            const bar     = area.previousElementSibling;
            const content = document.getElementById('historyExplainContent');
            if (area.style.display !== 'none') {
                area.style.display = 'none';
                bar.style.display = 'block';
            } else {
                content.innerHTML = generateExplain(p);
                area.style.display = 'block';
                bar.style.display = 'none';
                area.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        };
    }

    function closeHistoryOverlay() {
        const overlay = document.getElementById('historyOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
})();
