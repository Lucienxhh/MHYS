/**
 * app.js — 梅花易数应用入口
 * 负责：初始化、UI事件绑定、起卦主流程调度
 * 依赖顺序：data.js → ganzhi.js → divination.js → render.js → app.js
 */

class PlumDivinationApp {
    constructor() {
        this.currentGz = null;
        this.lastExplainParams = null;
        this.HISTORY_KEY = 'mhys_history';
        this.HISTORY_MAX = 20;
        this.HISTORY_DETAIL_KEY = 'mhys_history_detail';
        this.init();
    }

    // ── 初始化 ──
    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.initCurrentTime();
            this.bindEvents();
            this.bindTimeRefToggle();
            this.bindHistoryToggle();
            this.updateGanZhi();
            this.toggleMode();
            this.renderHistoryList();
        });
    }

    // ── 事件绑定 ──
    bindEvents() {
        // 按钮事件
        document.getElementById("nowTimeBtn").addEventListener('click', () => this.fillNowTime());
        document.getElementById("calculateBtn").addEventListener('click', () => this.perform());
        document.getElementById("divinationMode").addEventListener('change', () => this.toggleMode());
        document.getElementById("explainBtn").addEventListener('click', () => this.toggleExplainPanel());
        document.getElementById("historyClearBtn").addEventListener('click', () => this.handleClearHistory());

        // 日期起卦：时间输入实时更新干支和自动调整
        ['gregYear','gregMonth','gregDay','gregHour','gregMinute'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', () => {
                this.autoAdjustDateTime('greg');
                this.updateGanZhi();
            });
            element.addEventListener('change', () => {
                this.autoAdjustDateTime('greg');
                this.updateGanZhi();
            });
            // 添加点击事件，显示弹出列表
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDateList(id);
            });
        });

        // 数字起卦：数字输入实时计算卦数
        ['inputNum1','inputNum2','inputNum3'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.autoCalcNumber());
        });

        // 数字起卦：自定义时间输入实时更新干支和自动调整
        ['refYear','refMonth','refDay','refHour','refMinute'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', () => {
                this.autoAdjustDateTime('ref');
                this.updateRefCustomGanZhi();
            });
            element.addEventListener('change', () => {
                this.autoAdjustDateTime('ref');
                this.updateRefCustomGanZhi();
            });
            // 添加点击事件，显示弹出列表
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDateList(id);
            });
        });

        // 点击其他区域关闭弹出列表
        document.addEventListener('click', () => {
            this.closeAllDateLists();
        });
    }

    // ── 显示日期选择列表 ──
    showDateList(inputId) {
        // 关闭所有其他列表
        this.closeAllDateLists();

        // 获取输入框元素
        const input = document.getElementById(inputId);
        if (!input) return;

        // 计算列表应该显示的位置
        const rect = input.getBoundingClientRect();
        const container = input.closest('.input-item');

        // 确定列表的范围
        let min, max, step = 1;
        if (inputId.includes('Year')) {
            min = 1990;
            max = 2026;
        } else if (inputId.includes('Month')) {
            min = 1;
            max = 12;
        } else if (inputId.includes('Day')) {
            // 获取当前月份和年份，计算当月天数
            const prefix = inputId.includes('ref') ? 'ref' : 'greg';
            const year = parseInt(document.getElementById(`${prefix}Year`).value) || new Date().getFullYear();
            const month = parseInt(document.getElementById(`${prefix}Month`).value) || new Date().getMonth() + 1;
            max = new Date(year, month, 0).getDate();
            min = 1;
        } else if (inputId.includes('Hour')) {
            min = 0;
            max = 23;
        } else if (inputId.includes('Minute')) {
            min = 0;
            max = 59;
            step = 5; // 分钟以5为步长
        }

        // 创建列表元素
        const list = document.createElement('div');
        list.id = 'dateList';
        list.style.position = 'absolute';
        list.style.top = `${rect.bottom + window.scrollY + 5}px`;
        list.style.left = `${rect.left + window.scrollX}px`;
        list.style.width = `${rect.width}px`;
        list.style.maxHeight = '200px';
        list.style.overflowY = 'auto';
        list.style.backgroundColor = 'white';
        list.style.border = '1px solid #e0e0e0';
        list.style.borderRadius = '8px';
        list.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        list.style.zIndex = '1000';
        list.style.padding = '4px 0';

        // 添加列表项
        if (inputId.includes('Year')) {
            // 年份从大到小排列
            for (let i = max; i >= min; i -= step) {
                const item = document.createElement('div');
                item.textContent = i;
                item.style.padding = '8px 12px';
                item.style.textAlign = 'center';
                item.style.cursor = 'pointer';
                item.style.transition = 'background-color 0.2s ease';
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    input.value = i;
                    this.closeAllDateLists();
                    // 触发输入事件，更新干支
                    if (inputId.includes('ref')) {
                        this.autoAdjustDateTime('ref');
                        this.updateRefCustomGanZhi();
                    } else {
                        this.autoAdjustDateTime('greg');
                        this.updateGanZhi();
                    }
                });
                item.addEventListener('mouseover', () => {
                    item.style.backgroundColor = '#f5f5f5';
                });
                item.addEventListener('mouseout', () => {
                    item.style.backgroundColor = 'white';
                });
                list.appendChild(item);
            }
        } else {
            // 其他字段从小到大排列
            for (let i = min; i <= max; i += step) {
                const item = document.createElement('div');
                item.textContent = i;
                item.style.padding = '8px 12px';
                item.style.textAlign = 'center';
                item.style.cursor = 'pointer';
                item.style.transition = 'background-color 0.2s ease';
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    input.value = i;
                    this.closeAllDateLists();
                    // 触发输入事件，更新干支
                    if (inputId.includes('ref')) {
                        this.autoAdjustDateTime('ref');
                        this.updateRefCustomGanZhi();
                    } else {
                        this.autoAdjustDateTime('greg');
                        this.updateGanZhi();
                    }
                });
                item.addEventListener('mouseover', () => {
                    item.style.backgroundColor = '#f5f5f5';
                });
                item.addEventListener('mouseout', () => {
                    item.style.backgroundColor = 'white';
                });
                list.appendChild(item);
            }
        }

        // 添加到文档中
        document.body.appendChild(list);

        // 阻止列表内部的点击事件冒泡
        list.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ── 关闭所有日期选择列表 ──
    closeAllDateLists() {
        const list = document.getElementById('dateList');
        if (list) {
            list.remove();
        }
    }

    // ── 自动调整日期时间 ──
    autoAdjustDateTime(prefix) {
        const year = document.getElementById(`${prefix}Year`);
        const month = document.getElementById(`${prefix}Month`);
        const day = document.getElementById(`${prefix}Day`);
        const hour = document.getElementById(`${prefix}Hour`);
        const minute = document.getElementById(`${prefix}Minute`);

        // 月份调整
        if (month.value === '13') {
            month.value = '1';
            year.value = parseInt(year.value) + 1;
        } else if (month.value === '0') {
            month.value = '12';
            year.value = parseInt(year.value) - 1;
        }

        // 日期调整
        const maxDays = new Date(parseInt(year.value), parseInt(month.value), 0).getDate();
        if (day.value > maxDays) {
            day.value = maxDays;
        } else if (day.value === '0') {
            day.value = new Date(parseInt(year.value), parseInt(month.value) - 1, 0).getDate();
            if (month.value === '1') {
                month.value = '12';
                year.value = parseInt(year.value) - 1;
            } else {
                month.value = parseInt(month.value) - 1;
            }
        }

        // 小时调整
        if (hour.value === '24') {
            hour.value = '0';
            day.value = parseInt(day.value) + 1;
            this.autoAdjustDateTime(prefix); // 递归调整日期
        } else if (hour.value === '-1') {
            hour.value = '23';
            day.value = parseInt(day.value) - 1;
            this.autoAdjustDateTime(prefix); // 递归调整日期
        }

        // 分钟调整
        if (minute.value === '60') {
            minute.value = '0';
            hour.value = parseInt(hour.value) + 1;
            this.autoAdjustDateTime(prefix); // 递归调整小时
        } else if (minute.value === '-1') {
            minute.value = '59';
            hour.value = parseInt(hour.value) - 1;
            this.autoAdjustDateTime(prefix); // 递归调整小时
        }
    }

    // ── 历史记录面板折叠 ──
    bindHistoryToggle() {
        const historyToggle = document.getElementById('historyToggleBtn');
        const historyPanel  = document.getElementById('historyPanel');
        if (historyToggle && historyPanel) {
            historyToggle.addEventListener('click', () => {
                const open = historyPanel.style.display !== 'none';
                historyPanel.style.display = open ? 'none' : 'block';
                historyToggle.classList.toggle('open', !open);
            });
        }
    }

    // ── 起卦历史记录（localStorage） ──
    loadHistory() {
        try { return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || []; } 
        catch(e) { return []; }
    }

    saveHistory(params) {
        const list = this.loadHistory();
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
            bBase: params.bBase, bWs: params.bWs,
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
        if (list.length > this.HISTORY_MAX) list.splice(this.HISTORY_MAX);
        try { localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
        return entry;
    }

    deleteHistoryEntry(id) {
        const list = this.loadHistory().filter(e => e.id !== id);
        try { localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
    }

    clearHistory() {
        try { localStorage.removeItem(this.HISTORY_KEY); } catch(e) {}
    }

    handleClearHistory() {
        if (!confirm('确认清空所有起卦记录？')) return;
        this.clearHistory();
        this.renderHistoryList();
    }

    // ── 渲染历史记录列表 ──
    renderHistoryList() {
        let list = this.loadHistory();
        const valid = list.filter(e => e && e.params && typeof e.params.up === 'number');
        if (valid.length !== list.length) {
            list = valid;
            try { localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list)); } catch(e) {}
        }
        const wrap = document.getElementById('historyList');
        if (!wrap) return;
        if (list.length === 0) {
            wrap.innerHTML = '<div class="history-empty">暂无记录</div>';
            return;
        }
        wrap.innerHTML = list.map(entry => {
            const p = entry.params;
            const upName   = GUA_NAMES[p.up] || p.up;
            const downName = GUA_NAMES[p.down] || p.down;
            return `<div class="history-item" data-id="${entry.id}">
                <div class="history-item-main" onclick="app.openHistoryDetail(${entry.id})"><span class="history-time">${entry.time}</span>
                    <span class="history-label">${upName} / ${downName}，动爻第 ${p.move} 爻</span>
                </div>
                <button class="history-del-btn" onclick="event.stopPropagation();app.deleteHistoryItem(${entry.id})" title="删除">×</button>
            </div>`;
        }).join('');
    }

    // ── 切换解析面板显隐 ──
    toggleExplainPanel() {
        const area = document.getElementById("explainArea");
        const bar  = document.getElementById("explainCollapsedBar");
        const btn  = document.getElementById("explainBtn");
        if (area) {
            if (area.style.display !== "none") {
                // 当前已展开 → 收起
                area.style.display = "none";
                bar.style.display = "block";
                btn.textContent = "卦象解析";
            } else {
                // 当前已折叠 → 展开
                if (!this.lastExplainParams) return;
                document.getElementById("explainContent").innerHTML = generateExplain(this.lastExplainParams);
                area.style.display = "block";
                bar.style.display = "none";
                area.scrollIntoView({behavior: "smooth", block: "start"});
            }
        }
    }

    // ── 初始化当前时间 ──
    initCurrentTime() {
        const now = new Date();
        const elements = ["gregYear", "gregMonth", "gregDay", "gregHour", "gregMinute"];
        const values = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()];
        elements.forEach((id, index) => {
            document.getElementById(id).value = values[index];
        });
    }

    // ── 通用干支刷新：从指定输入源读取时间并更新干支 ──
    refreshGanZhiFromInputs(inputIds) {
        const y   = +document.getElementById(inputIds[0]).value;
        const m   = +document.getElementById(inputIds[1]).value;
        const d   = +document.getElementById(inputIds[2]).value;
        const h   = +document.getElementById(inputIds[3]).value;
        const min = +document.getElementById(inputIds[4]).value || 0;
        if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h)) return;
        this.currentGz = computeAllGanZhi(y, m, d, h, min);
        this.updateGanZhiDisplay(this.currentGz);
        return this.currentGz;
    }

    // ── 更新干支显示 & 自动计算日期模式卦数 ──
    updateGanZhi() {
        const gz = this.refreshGanZhiFromInputs(['gregYear','gregMonth','gregDay','gregHour','gregMinute']);
        if (!gz) return;
        if (document.getElementById("divinationMode").value === 'date') {
            const nums = calcGuaFromDate(gz, gz.inputDate && gz.inputDate.day);
            this.updateNumInputs(nums);
        }
    }

    // ── 时令参考面板：根据自定义输入更新干支 ──
    updateRefCustomGanZhi() {
        this.refreshGanZhiFromInputs(['refYear','refMonth','refDay','refHour','refMinute']);
    }

    // ── 一键填入当前系统时间 ──
    fillNowTime() {
        this.initCurrentTime();
        this.updateGanZhi();
    }

    // ── 切换起卦方式 ──
    toggleMode() {
        const mode            = document.getElementById("divinationMode").value;
        const numInputs       = document.getElementById("numberInputs");
        const dateInputSection = document.getElementById("dateInputSection");

        if (mode === 'date') {
            numInputs.style.display        = 'none';
            dateInputSection.style.display = 'block';
            if (this.currentGz) {
                const nums = calcGuaFromDate(this.currentGz, this.currentGz.inputDate && this.currentGz.inputDate.day);
                this.updateNumInputs(nums);
            }
        } else {
            numInputs.style.display        = 'block';
            dateInputSection.style.display = 'none';
            this.refreshTimeRefNow();
        }
    }

    // ── 时令参考面板：刷新"当前时间"显示 ──
    refreshTimeRefNow() {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
        const h = now.getHours(), min = now.getMinutes();
        const el = document.getElementById("timeRefNowDisplay");
        if (el) el.textContent = `${y}年${m}月${d}日 ${h}:${String(min).padStart(2,'0')}`;
        this.currentGz = computeAllGanZhi(y, m, d, h, min);
        this.updateGanZhiDisplay(this.currentGz);
    }

    // ── 时令参考面板：切换 使用当前时间 / 使用自定义时间 ──
    bindTimeRefToggle() {
        const optNow      = document.getElementById("optNowTime");
        const optCustom   = document.getElementById("optCustomTime");
        const panelNow    = document.getElementById("timeRefNow");
        const panelCustom = document.getElementById("timeRefCustom");
        const refInputs   = ['refYear','refMonth','refDay','refHour','refMinute'];

        optNow.addEventListener('click', () => {
            optNow.classList.add('active');
            optCustom.classList.remove('active');
            panelNow.style.display = 'flex';
            panelCustom.style.display = 'none';
            refInputs.forEach(id => document.getElementById(id).disabled = true);
            this.refreshTimeRefNow();
        });

        optCustom.addEventListener('click', () => {
            optCustom.classList.add('active');
            optNow.classList.remove('active');
            panelNow.style.display = 'none';
            panelCustom.style.display = 'flex';
            refInputs.forEach(id => document.getElementById(id).disabled = false);
            const now = new Date();
            refInputs.forEach((id, index) => {
                const values = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()];
                document.getElementById(id).value = values[index];
            });
            this.updateRefCustomGanZhi();
        });
    }

    // ── 获取当前生效的时间参数（用于 perform） ──
    getActiveTimeInputs() {
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
    autoCalcNumber() {
        const n1 = parseInt(document.getElementById("inputNum1").value) || 0;
        const n2 = parseInt(document.getElementById("inputNum2").value) || 0;
        const n3Input = document.getElementById("inputNum3");
        const n3 = n3Input.value.trim() === '' ? null : parseInt(n3Input.value);
        if (n1 <= 0 || n2 <= 0) {
            this.updateNumInputs({ up: '', down: '', move: '' });
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
        this.updateNumInputs({ up, down, move });
    }

    // ── 更新卦数输入框 ──
    updateNumInputs(nums) {
        document.getElementById("numUp").value   = nums.up;
        document.getElementById("numDown").value = nums.down;
        document.getElementById("numMove").value = nums.move;
    }

    // ── 更新页面上的干支显示 ──
    updateGanZhiDisplay(gz) {
        document.getElementById("displayGanzhi").innerHTML = `干支：${formatGanZhi(gz)}`;
    }

    // ── 主起卦流程 ──
    perform() {
        // 重置解析面板状态
        this.resetExplainPanel();

        // 确保干支已计算
        this.ensureGanZhiComputed();
        const gz = this.currentGz;
        if (!gz) return;

        // 获取卦数
        const { rawUp, rawDown, rawMove, up, down, move } = this.getGuaNumbers();
        if (!up || !down || !move) {
            alert("请先确定上/下卦数与动爻数");
            return;
        }

        // 体用判断
        const tiYong = move <= 3 ? { ti: up, yong: down } : { ti: down, yong: up };
        const tiWx = WUXING[tiYong.ti];
        const yongWx = WUXING[tiYong.yong];
        const monthWx = getMonthWuxing(gz.month.zhi);

        // 卦象分析
        const base = analyzeBase(tiWx, yongWx);
        const ws = applyWangshuai(tiWx, yongWx, monthWx, base);
        const yingqi = predictYingqi(tiWx, ws.tiState, move, up, down);
        const spaceHint = analyzeSpacetime(tiWx, gz.day.gan, gz.day.zhi, gz.hour.zhi);

        // 互卦和变卦
        const [huU, huD] = getHuGua(up, down);
        const [bianU, bianD] = getBianGua(up, down, move);

        // 互卦体用
        const huTiYong = move <= 3 ? { ti: huU, yong: huD } : { ti: huD, yong: huU };
        const huTiIdx = huTiYong.ti;
        const huYongIdx = huTiYong.yong;
        const huTiWx = WUXING[huTiIdx];
        const huYongWx = WUXING[huYongIdx];
        const huBase = analyzeBase(huTiWx, huYongWx);
        const huWs = applyWangshuai(huTiWx, huYongWx, monthWx, huBase);

        // 变卦体用
        const bTiYong = move <= 3 ? { ti: bianU, yong: bianD } : { ti: bianD, yong: bianU };
        const bTiIdx = bTiYong.ti;
        const bYongIdx = bTiYong.yong;
        const bTiWx = WUXING[bTiIdx];
        const bYongWx = WUXING[bYongIdx];
        const bBase = analyzeBase(bTiWx, bYongWx);
        const bWs = applyWangshuai(bTiWx, bYongWx, monthWx, bBase);

        // 渲染结果
        this.renderResult({
            up, down, move,
            huU, huD, bianU, bianD,
            tiNum: tiYong.ti, yongNum: tiYong.yong,
            tiWx, yongWx,
            ws, base,
            huTiIdx, huYongIdx, huBase, huWs,
            bTiIdx, bYongIdx, bBase, bWs,
            spaceHint, yingqi
        });

        // 保存解析参数
        this.saveExplainParams({
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
            bBase, bWs,
            yingqi, spaceHint,
            gz,
            mode: document.getElementById("divinationMode").value,
            inputNums: {
                n1: parseInt(document.getElementById("inputNum1").value) || 0,
                n2: parseInt(document.getElementById("inputNum2").value) || 0,
                n3: document.getElementById("inputNum3").value.trim() !== '' ?
                    parseInt(document.getElementById("inputNum3").value) : null
            }
        });

        // 构建并绑定导出功能
        this.bindExportFunction(gz, tiYong, up, down, move, base, ws, huU, huD, huBase, huWs, bianU, bianD, bBase, bWs, yingqi, spaceHint, monthWx);

        // 保存历史记录
        this.saveHistory(this.lastExplainParams);
        this.renderHistoryList();
    }

    // ── 重置解析面板 ──
    resetExplainPanel() {
        const prevArea = document.getElementById("explainArea");
        const prevBar  = document.getElementById("explainCollapsedBar");
        const prevBtn  = document.getElementById("explainBtn");
        prevArea.style.display = "none";
        prevBar.style.display  = "none";
        prevBtn.classList.add('disabled');
        prevBtn.textContent = "卦象解析";
    }

    // ── 确保干支已计算 ──
    ensureGanZhiComputed() {
        const mode = document.getElementById("divinationMode").value;
        if (mode === 'date') {
            if (!this.currentGz) this.updateGanZhi();
        } else {
            const t = this.getActiveTimeInputs();
            if (+t.year && +t.month && +t.day && +t.hour !== undefined) {
                this.currentGz = computeAllGanZhi(+t.year, +t.month, +t.day, +t.hour, +t.minute || 0);
                this.updateGanZhiDisplay(this.currentGz);
            } else if (!this.currentGz) {
                this.refreshTimeRefNow();
            }
        }
    }

    // ── 获取卦数 ──
    getGuaNumbers() {
        let rawUp = +document.getElementById("numUp").value;
        let rawDown = +document.getElementById("numDown").value;
        let rawMove = +document.getElementById("numMove").value;
        let up = (rawUp - 1) % 8 + 1;
        let down = (rawDown - 1) % 8 + 1;
        let move = (rawMove - 1) % 6 + 1;
        return { rawUp, rawDown, rawMove, up, down, move };
    }

    // ── 渲染结果 ──
    renderResult(params) {
        document.getElementById("resultContent").innerHTML = buildGuaResultHTML(params) + `
            <div class="export-area">
                <button class="export-btn" id="exportCopyBtn">导出并复制</button>
            </div>
        `;
    }

    // ── 保存解析参数 ──
    saveExplainParams(params) {
        this.lastExplainParams = params;
        const explainBtn = document.getElementById("explainBtn");
        explainBtn.classList.remove('disabled');
        explainBtn.textContent = "卦象解析";
        document.getElementById("explainCollapsedBar").style.display = "block";
        document.getElementById("resultCard").style.display = "block";
    }

    // ── 绑定导出功能 ──
    bindExportFunction(gz, tiYong, up, down, move, base, ws, huU, huD, huBase, huWs, bianU, bianD, bBase, bWs, yingqi, spaceHint, monthWx) {
        const yuelingWxDesc = this.getYuelingWxDesc(monthWx);
        const isTiUp = tiYong.ti === up;
        const exportText = `【梅花易数 · 断卦记录】
起卦时间：${gz.inputDate.year}年${gz.inputDate.month}月${gz.inputDate.day}日 ${document.getElementById("gregHour").value}:${String(document.getElementById("gregMinute").value||0).padStart(2,'0')}
干　　支：${TIANGAN[gz.year.gan].name}${DIZHI[gz.year.zhi].name}年 ${TIANGAN[gz.month.gan].name}${DIZHI[gz.month.zhi].name}月 ${TIANGAN[gz.day.gan].name}${DIZHI[gz.day.zhi].name}日 ${TIANGAN[gz.hour.gan].name}${DIZHI[gz.hour.zhi].name}时
月　　令：${DIZHI[gz.month.zhi].name}月（${yuelingWxDesc}）
动　　爻：${move}

━━ 起因 · 本卦 ━━
${isTiUp?'上卦（体）':'上卦（用）'}：${GUA_NAMES[up]}（${WUXING[up]}）${isTiUp?ws.tiState:ws.yongState} — ${STATE_DESC[isTiUp?ws.tiState:ws.yongState]}
${!isTiUp?'下卦（体）':'下卦（用）'}：${GUA_NAMES[down]}（${WUXING[down]}）${!isTiUp?ws.tiState:ws.yongState} — ${STATE_DESC[!isTiUp?ws.tiState:ws.yongState]}
体用关系：${base.name}
体用解析：${base.desc}

━━ 过程 · 互卦 ━━
${isTiUp?'上卦（体）':'上卦（用）'}：${GUA_NAMES[huU]}（${WUXING[huU]}）${isTiUp?huWs.tiState:huWs.yongState} — ${STATE_DESC[isTiUp?huWs.tiState:huWs.yongState]}
${!isTiUp?'下卦（体）':'下卦（用）'}：${GUA_NAMES[huD]}（${WUXING[huD]}）${!isTiUp?huWs.tiState:huWs.yongState} — ${STATE_DESC[!isTiUp?huWs.tiState:huWs.yongState]}
体用关系：${huBase.name}
体用解析：${huBase.desc}

━━ 结局 · 变卦 ━━
${isTiUp?'上卦（体）':'上卦（用）'}：${GUA_NAMES[bianU]}（${WUXING[bianU]}）${isTiUp?bWs.tiState:bWs.yongState} — ${STATE_DESC[isTiUp?bWs.tiState:bWs.yongState]}
${!isTiUp?'下卦（体）':'下卦（用）'}：${GUA_NAMES[bianD]}（${WUXING[bianD]}）${!isTiUp?bWs.tiState:bWs.yongState} — ${STATE_DESC[!isTiUp?bWs.tiState:bWs.yongState]}
体用关系：${bBase.name}
体用解析：${bBase.desc}

━━ 综合 ━━
应期：${yingqi}
方位：${spaceHint}`;

        document.getElementById("exportCopyBtn").addEventListener('click', () => {
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
        });
    }

    // ── 获取月令五行描述 ──
    getYuelingWxDesc(monthWx) {
        const wsMap = WANGSHUAI_TABLE[monthWx];
        const states = ['旺', '相', '休', '囚', '死'];
        return states.map(state => {
            const wx = Object.keys(wsMap).find(key => wsMap[key] === state);
            return `${wx}${state}`;
        }).join('、');
    }

    // ── 全局：删除单条历史 ──
    deleteHistoryItem(id) {
        this.deleteHistoryEntry(id);
        this.renderHistoryList();
    }

    // ── 全局：打开历史详情（新标签页）──
    openHistoryDetail(id) {
        const list = this.loadHistory();
        const entry = list.find(e => e.id === id);
        if (!entry) return;
        try {
            localStorage.setItem(this.HISTORY_DETAIL_KEY, JSON.stringify({ entry: entry }));
        } catch(e) {}
        window.open('detail.html', '_blank');
    }
}

// 初始化应用
const app = new PlumDivinationApp();