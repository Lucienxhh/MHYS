/**
 * explain.js — 卦象解析推导文本生成模块
 * 依赖：data.js, divination.js
 * 对外暴露：generateExplain(params) → HTML字符串
 */

/**
 * 生成完整卦象解析HTML
 * @param {object} params
 *   up, down, move       — 本卦上下卦数(1-8)、动爻位置(1-6)
 *   huU, huD             — 互卦上下卦数
 *   bianU, bianD         — 变卦上下卦数
 *   tiNum, yongNum       — 体卦/用卦数
 *   tiWx, yongWx         — 体/用五行
 *   monthWx, monthZhi    — 月令五行与地支序号
 *   base, ws             — 本卦体用分析结果
 *   huBase, huWs         — 互卦体用分析
 *   bianBase, bianWs     — 变卦体用分析
 *   yingqi, spaceHint    — 应期/方位文本
 *   gz                   — 完整干支对象
 *   mode                 — 起卦方式 'date'|'number'
 *   inputNums            — 数字起卦时的原始数 {n1,n2,n3}（可选）
 */
function generateExplain(params) {
    const {
        up, down, move,
        rawUp, rawDown, rawMove,
        huU, huD, bianU, bianD,
        tiNum, yongNum,
        huTiIdx, huYongIdx,
        bTiIdx, bYongIdx,
        tiWx, yongWx,
        monthWx, monthZhi,
        base, ws,
        huBase, huWs,
        bianBase, bianWs,
        yingqi, spaceHint,
        gz, mode, inputNums
    } = params;

    const sections = [];
    const tocTitles = []; // 与 sections 同步的目录标题

    /* ─── §0 起卦推导：从数到卦 ─── */
    {
        let body = "";

        // 展示本次起卦的推导过程
        if (mode === 'date' && gz) {
            const yearZhi  = gz.year.zhi;
            const monthNum = gz.month.zhi;
            const dayNum   = (gz.inputDate && gz.inputDate.day) || 1;
            const hourZhi = gz.hour.zhi;
            const sumUp   = yearZhi + monthNum + dayNum;
            const sumDown = sumUp + hourZhi;
            const sumMove = sumUp + hourZhi;

            body += `<p class="exp-intro"><strong>日期起卦</strong>：以年支序号、月支序号、日数、时支序号为基数进行计算。</p>`;
            body += formula(`上卦 = 年支(${yearZhi}) + 月支(${monthNum}) + 日(${dayNum}) = ${sumUp}，${sumUp} ÷ 8 余 ${sumUp % 8}`, `${guaTag(up)}`, "");
            body += formula(`下卦 = ${sumUp} + 时支(${hourZhi}) = ${sumDown}，${sumDown} ÷ 8 余 ${sumDown % 8}`, `${guaTag(down)}`, "");
            body += formula(`动爻 = ${sumUp} + 时支(${hourZhi}) = ${sumMove}，${sumMove} ÷ 6 余 ${sumMove % 6}`, `第 ${move} 爻`, "");
        } else if (mode === 'number' && inputNums) {
            const n1 = inputNums.n1, n2 = inputNums.n2;
            const hasN3 = inputNums.n3 !== null && inputNums.n3 > 0;

            body += `<p class="exp-intro"><strong>数字起卦</strong>：以用户输入的数字为基数进行计算。</p>`;
            body += formula(`上卦 = ${n1} ÷ 8，余 ${n1 % 8 || 8}`, `${guaTag(up)}`, "");
            body += formula(`下卦 = ${n2} ÷ 8，余 ${n2 % 8 || 8}`, `${guaTag(down)}`, "");
            if (hasN3) {
                body += formula(`动爻 = ${inputNums.n3} ÷ 6，余 ${inputNums.n3 % 6 || 6}`, `第 ${move} 爻`, "用户指定动爻数");
            } else {
                body += formula(`动爻 = (${n1} + ${n2}) ÷ 6 = ${n1+n2} ÷ 6，余 ${(n1+n2) % 6 || 6}`, `第 ${move} 爻`, "未指定动爻数，取两数之和");
            }
        }

        // 八卦对照表
        body += `<div class="exp-divider"></div>`;
        body += `<p class="exp-intro">先天八卦数与卦象对应关系：</p>`;
        body += `<table class="exp-gua-ref-table"><tr>${[1,2,3,4,5,6,7,8].map(n => `<td>${n}</td>`).join('')}</tr><tr>${[1,2,3,4,5,6,7,8].map(n => `<td>${GUA_NAMES[n]}</td>`).join('')}</tr></table>`;

        sections.push(sec("📐", "起卦推导", body));
        tocTitles.push("起卦推导");
    }

    /* ─── 辅助渲染函数 ─── */
    function sec(icon, title, body) {
        return `<div class="exp-section">
            <div class="exp-title">${icon ? icon + ' ' : ''}${title}</div>
            <div class="exp-body">${body}</div>
        </div>`;
    }
    function row(label, val, note) {
        return `<div class="exp-row">
            <span class="exp-label">${label}</span>
            <span class="exp-val">${val}</span>
            ${note ? `<span class="exp-note">${note}</span>` : ''}
        </div>`;
    }
    function formula(expr, result, comment) {
        return `<div class="exp-formula">
            <span class="exp-expr">${expr}</span>
            <span class="exp-arrow">→</span>
            <span class="exp-result">${result}</span>
            ${comment ? `<span class="exp-comment">（${comment}）</span>` : ''}
        </div>`;
    }
    function wxTag(wx) {
        const cls = {"金":"wx-jin","木":"wx-mu","水":"wx-shui","火":"wx-huo","土":"wx-tu"}[wx]||"";
        return `<span class="exp-wx ${cls}">${wx}</span>`;
    }
    function stateTag(s) {
        const colors = {"旺":"#c0392b","相":"#d35400","休":"#2980b9","囚":"#7f8c8d","死":"#2c3e50"};
        return `<span class="exp-state" style="color:${colors[s]||'#333'}">${s}</span>`;
    }
    function guaTag(num) {
        return `<span class="exp-gua">${GUA_NAMES[num]}</span>`;
    }
    /** 生成 CSS 爻线 HTML（与 render.js 一致的 yao-bar/yao-yang/yao-yin 样式） */
    function yaoHtml(v, isDong) {
        const cls = isDong ? ' dong-yao' : '';
        if (v === 1) {
            return `<span class="yao-bar yao-yang${cls}"></span>`;
        }
        return `<span class="yao-yin${cls}"><span class="yao-yin-segment"></span><span class="yao-yin-segment"></span></span>`;
    }

    /* ─── §2 本卦的推演 ─── */
    {
        const upYao   = YAO_MAP[up];
        const downYao = YAO_MAP[down];

        function yaoLine(yaoArr, label) {
            return yaoArr.map((v, i) => `第${i+1}爻：${v===1?'阳爻 ━━━━━━':'阴爻 ━━ ━━'}`).join('　');
        }

        let body = "";
        body += `<p class="exp-intro">由上卦 ${guaTag(up)} 与下卦 ${guaTag(down)} 组合，第 <strong>${move}</strong> 爻为动爻。</p>`;
        body += `<div class="exp-gua-diagram">`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">上卦 ${GUA_NAMES[up]}</div>`;
        [...upYao].reverse().forEach((v, i) => {
            const realIdx = upYao.length - 1 - i;
            const gIdx = 4 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${yaoHtml(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 动':''}</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 ${GUA_NAMES[down]}</div>`;
        [...downYao].reverse().forEach((v, i) => {
            const realIdx = downYao.length - 1 - i;
            const gIdx = 1 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${yaoHtml(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 动':''}</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;

        body += `<p class="exp-tip">本卦为事物的初始状态，上卦代表外在环境，下卦代表内在基础。</p>`;

        sections.push(sec("", "本卦 · 两仪生象", body));
        tocTitles.push("本卦推演");
    }

    /* ─── §3 互卦的衍生 ─── */
    {
        const downYao = YAO_MAP[down];
        const upYao   = YAO_MAP[up];

        // 互卦六爻（从下到上）：第1-3爻来自本卦第2-4爻，第4-6爻来自本卦第3-5爻
        const huAllYao = [
            {yao: 1, srcPos: 2}, // 互卦第1爻 ← 本卦第2爻
            {yao: 2, srcPos: 3}, // 互卦第2爻 ← 本卦第3爻
            {yao: 3, srcPos: 4}, // 互卦第3爻 ← 本卦第4爻
            {yao: 4, srcPos: 3}, // 互卦第4爻 ← 本卦第3爻
            {yao: 5, srcPos: 4}, // 互卦第5爻 ← 本卦第4爻
            {yao: 6, srcPos: 5}, // 互卦第6爻 ← 本卦第5爻
        ];
        // 取爻值：downYao=[本卦1,2,3爻], upYao=[本卦4,5,6爻]
        function huYaoVal(yao) {
            if (yao === 1) return downYao[1]; // ←本卦第2爻
            if (yao === 2) return downYao[2]; // ←本卦第3爻
            if (yao === 3) return upYao[0];   // ←本卦第4爻
            if (yao === 4) return downYao[2]; // ←本卦第3爻
            if (yao === 5) return upYao[0];   // ←本卦第4爻
            return upYao[1];                   // ←本卦第5爻
        }

        let body = "";
        body += `<p class="exp-intro">互卦取本卦中间四爻（第2-5爻），重新组合为六爻：</p>`;
        body += `<div class="exp-gua-diagram">`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">上卦 ${GUA_NAMES[huU]}</div>`;
        [6,5,4].forEach(yao => {
            const v = huYaoVal(yao);
            body += `<div class="exp-yao-row">${yaoHtml(v,false)} <span class="exp-yao-idx">第${yao}爻（来自本卦第${huAllYao[yao-1].srcPos}爻）</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 ${GUA_NAMES[huD]}</div>`;
        [3,2,1].forEach(yao => {
            const v = huYaoVal(yao);
            body += `<div class="exp-yao-row">${yaoHtml(v,false)} <span class="exp-yao-idx">第${yao}爻（来自本卦第${huAllYao[yao-1].srcPos}爻）</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;
        body += `<p class="exp-tip">互卦揭示事情的发展过程与中间变化，是本卦走向变卦的"桥梁"。</p>`;

        sections.push(sec("", "互卦 · 中间过程", body));
        tocTitles.push("互卦衍生");
    }

    /* ─── §4 变卦的产生 ─── */
    {
        const upYao   = [...YAO_MAP[up]];
        const downYao = [...YAO_MAP[down]];

        // 找出动爻原始值
        let origVal, changedVal, inGua, yaoPos;
        if (move <= 3) {
            origVal    = downYao[move - 1];
            changedVal = 1 - origVal;
            inGua      = `下卦第${move}爻`;
            yaoPos     = move;
        } else {
            origVal    = upYao[move - 4];
            changedVal = 1 - origVal;
            inGua      = `上卦第${move-3}爻（全卦第${move}爻）`;
            yaoPos     = move - 3;
        }

        let body = "";
        body += `<p class="exp-intro">变卦由本卦动爻翻转产生：动爻阳变阴、阴变阳，其余爻不变。</p>`;
        body += `<div class="exp-change-rule">`;
        body += `<div class="exp-change-row">
            <span class="exp-label">动爻位置</span>
            <span class="exp-val">${inGua}</span>
        </div>`;
        body += `<div class="exp-change-row">
            <span class="exp-label">翻转前</span>
            <span class="exp-val">${yaoHtml(origVal,false)} <span style="font-size:13px;color:#3a5a52">${origVal===1?'阳爻':'阴爻'}</span></span>
        </div>`;
        body += `<div class="exp-change-row">
            <span class="exp-label">翻转后</span>
            <span class="exp-val">${yaoHtml(changedVal,true)} <span style="font-size:13px;color:#3a5a52">${changedVal===1?'阳爻':'阴爻'}</span></span>
        </div>`;
        body += `</div>`;

        // 变卦爻象图（与§2本卦一致的结构）
        const bianUpYao   = [...YAO_MAP[up]];
        const bianDownYao = [...YAO_MAP[down]];
        // 执行翻转
        if (move <= 3) bianDownYao[move - 1] = 1 - bianDownYao[move - 1];
        else           bianUpYao[move - 4]   = 1 - bianUpYao[move - 4];

        body += `<div class="exp-gua-diagram">`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">上卦 ${GUA_NAMES[bianU]}</div>`;
        [...bianUpYao].reverse().forEach((v, i) => {
            const realIdx = bianUpYao.length - 1 - i;
            const gIdx = 4 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${yaoHtml(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 翻转':''}</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 ${GUA_NAMES[bianD]}</div>`;
        [...bianDownYao].reverse().forEach((v, i) => {
            const realIdx = bianDownYao.length - 1 - i;
            const gIdx = 1 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${yaoHtml(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 翻转':''}</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;

        body += `<p class="exp-tip">变卦是事情的最终走向与结果。阳极生阴、阴极生阳，万事终归变化。</p>`;

        sections.push(sec("", "变卦 · 动极而变", body));
        tocTitles.push("变卦产生");
    }

    /* ─── §5 体用关系与五行属性 ─── */
    {
        const relDesc = {
            "比和":   {color:"#8e44ad", emoji:"🟣"},
            "用生体": {color:"#27ae60", emoji:"🟢"},
            "体生用": {color:"#e67e22", emoji:"🟠"},
            "体克用": {color:"#3498db", emoji:"🔵"},
            "用克体": {color:"#e74c3c", emoji:"🔴"},
        };

        let body = "";

        // ── ① 引出体用概念 ──
        body += `<p class="exp-intro">本卦、互卦、变卦的上卦和下卦都可以拆分为<strong>体卦</strong>和<strong>用卦</strong>：</p>`;
        body += row("体卦", "动爻不在的卦，代表问卦者 / 事情主体", "不变的一方");
        body += row("用卦", "动爻所在的卦，代表所问之事 / 对方 / 外物", "变化的一方");

        // ── ② 体用判定 ──
        body += `<div class="exp-divider"></div>`;
        body += `<p class="exp-highlight">本次起卦动爻为第<strong>${move}</strong>爻（位于本卦${move<=3?'下卦':'上卦'}），故：本卦、互卦、变卦中的${move<=3?'下卦':'上卦'}为用卦，${move<=3?'上卦':'下卦'}为体卦。</p>`;

        // ── ③ 本卦、互卦、变卦的体用五行 ──
        body += `<div class="exp-divider"></div>`;

        const bRelDesc   = relDesc[bianBase.name] || {color:"#555",emoji:"⚪",tip:""};
        const huRelDesc  = relDesc[huBase.name]   || {color:"#555",emoji:"⚪",tip:""};
        const mainRel    = relDesc[base.name]      || {color:"#555",emoji:"⚪",tip:""};

        // 体卦位置固定：动爻≤3时上卦为体，>3时下卦为体，三卦一致
        const isTiUp = move <= 3; // 上卦是否为体卦

        function guaRoleLabel(num, isTi) {
            return `<span style="font-weight:700;color:#2a4a40">${GUA_NAMES[num]}</span> <span style="color:#7a9e98;font-size:12px">${isTi?'（体卦）':'（用卦）'}</span>`;
        }

        body += `<table class="exp-table">
            <thead><tr><th></th><th>上卦</th><th>下卦</th><th>体用关系</th><th>体用详解</th></tr></thead>
            <tbody>
                <tr>
                    <td style="font-weight:700;color:#2a4a40">本卦</td>
                    <td>${guaRoleLabel(up, isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[up])}</span></td>
                    <td>${guaRoleLabel(down, !isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[down])}</span></td>
                    <td style="color:${mainRel.color};font-weight:700">${base.name === '比和' ? '比\u3000和' : base.name}（主断）</td>
                    <td style="text-align:left;font-size:12px;padding:6px 8px">${base.desc}</td>
                </tr>
                <tr>
                    <td style="font-weight:700;color:#2a4a40">互卦</td>
                    <td>${guaRoleLabel(huU, isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[huU])}</span></td>
                    <td>${guaRoleLabel(huD, !isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[huD])}</span></td>
                    <td style="color:${huRelDesc.color};font-weight:700">${huBase.name === '比和' ? '比\u3000和' : huBase.name}（过程）</td>
                    <td style="text-align:left;font-size:12px;padding:6px 8px">${huBase.desc}</td>
                </tr>
                <tr>
                    <td style="font-weight:700;color:#2a4a40">变卦</td>
                    <td>${guaRoleLabel(bianU, isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[bianU])}</span></td>
                    <td>${guaRoleLabel(bianD, !isTiUp)}<br/><span style="font-size:12px">${wxTag(WUXING[bianD])}</span></td>
                    <td style="color:${bRelDesc.color};font-weight:700">${bianBase.name === '比和' ? '比\u3000和' : bianBase.name}（结局）</td>
                    <td style="text-align:left;font-size:12px;padding:6px 8px">${bianBase.desc}</td>
                </tr>
            </tbody>
        </table>`;

        // ── ④ 五行生克与体用吉凶速查 ──
        body += `<div class="exp-wuxing-legend">
            <div class="exp-wx-rule"><strong>相生：</strong>金生水 → 水生木 → 木生火 → 火生土 → 土生金</div>
            <div class="exp-wx-rule"><strong>相克：</strong>金克木 → 木克土 → 土克水 → 水克火 → 火克金</div>
            <div class="exp-wx-rule"><strong>卦象与五行的对应关系：</strong></div>
            <table class="exp-gua-ref-table"><tr>${[1,2,3,4,5,6,7,8].map(i=>`<td>${GUA_NAMES[i]}</td>`).join('')}</tr><tr>${[1,2,3,4,5,6,7,8].map(i=>`<td>${WUXING[i]}</td>`).join('')}</tr></table>
        </div>`;

        sections.push(sec("⚖️", "体用关系", body));
        tocTitles.push("体用关系");
    }

    /* ─── §7 月令旺衰 ─── */
    {
        const monthZhiName = DIZHI[monthZhi]?.name || "";
        const stateOrder = ["旺","相","休","囚","死"];
        const stateDesc2 = {
            "旺":"当令最强，得时得势",
            "相":"次旺蓄势，待发之时",
            "休":"气已泄退，退休退守",
            "囚":"受制被困，力量不足",
            "死":"最衰无力，须待时机"
        };

        let body = "";
        body += `<p class="exp-intro">月令（当前月份地支：<strong>${monthZhiName}</strong>）对应五行为 ${wxTag(monthWx)}，五行当月强弱状态：</p>`;

        body += `<table class="exp-table">
            <thead><tr><th>五行</th><th>当月状态</th><th>含义</th></tr></thead>
            <tbody>`;
        const wxList = ['木','火','土','金','水'];
        wxList.slice().sort((a,b) => stateOrder.indexOf(WANGSHUAI_TABLE[monthWx][a]) - stateOrder.indexOf(WANGSHUAI_TABLE[monthWx][b]))
            .forEach(wx => {
            const state = WANGSHUAI_TABLE[monthWx][wx];
            body += `<tr>
                <td>${wxTag(wx)}</td>
                <td style="text-align:center">${stateTag(state)}</td>
                <td>${stateDesc2[state]}</td>
            </tr>`;
        });
        body += `</tbody></table>`;

        body += `<p class="exp-highlight">本卦：体卦 ${wxTag(tiWx)} → ${stateTag(ws.tiState)}，用卦 ${wxTag(yongWx)} → ${stateTag(ws.yongState)}</p>`;

        // 旺衰对结论的影响
        const score = {"旺":3,"相":2,"休":1,"囚":0,"死":-1};
        let inflDesc = "";
        if (base.name === "用克体") {
            if (score[ws.tiState]>=2 && score[ws.yongState]<=0)
                inflDesc = "虽用克体为大凶，但体卦当月旺相、用卦衰弱，外力虚张声势，有惊无险，凶象减轻。";
            else if (score[ws.tiState]<=0 && score[ws.yongState]>=2)
                inflDesc = "用克体已凶，且体卦衰弱、用卦旺盛，凶险加剧，须格外谨慎。";
            else
                inflDesc = "用克体，需关注月令对体用力量的消长，力量强者占优。";
        } else if (base.name === "用生体") {
            if (score[ws.tiState]>=2)
                inflDesc = "体卦旺相，受益更深，用生体锦上添花。";
            else
                inflDesc = "体卦衰弱，虽得生助但承载力有限，获益有限。";
        } else if (base.name === "比和") {
            if (score[ws.tiState]>=2)
                inflDesc = "体用皆旺，同气相应，势如破竹，有利可图。";
            else
                inflDesc = "体用皆衰，虽志同道合但力量不足，宜待时而动。";
        } else {
            inflDesc = ws.fullDesc;
        }

        body += `<div class="exp-wangshuai-conclude">
            <strong>月令旺衰对结论的影响：</strong>${inflDesc}
        </div>`;

        sections.push(sec("🌙", "月令旺衰影响", body));
        tocTitles.push("月令旺衰");
    }

    /* ─── §8 方位分析 ─── */
    {
        let body = "";
        body += `<p class="exp-intro">方位分析依据日干、日支、时支与体卦五行的生克关系判断：</p>`;

        function dirRule(label, idx, isGan) {
            if (!idx) return "";
            const obj = isGan ? TIANGAN[idx] : DIZHI[idx];
            if (!obj) return "";
            let rel = "", tip = "";
            if (obj.wuxing === tiWx)            { rel="比和"; tip=`${obj.dir}方与体卦同行，行事顺遂`; }
            else if (SHENG[obj.wuxing]===tiWx)  { rel="生体"; tip=`${obj.dir}方五行生体卦，此方求谋易得贵人`; }
            else if (KE[obj.wuxing]===tiWx)     { rel="克体"; tip=`${obj.dir}方五行克体卦，此方需防口舌阻滞`; }
            else if (SHENG[tiWx]===obj.wuxing)  { rel="体生"; tip=`体卦生${obj.dir}方，往此方行事较耗心力`; }
            else if (KE[tiWx]===obj.wuxing)     { rel="体克"; tip=`体卦克${obj.dir}方，主动出击可成`; }
            return `<div class="exp-dir-row">
                <span class="exp-label">${label}</span>
                <span class="exp-val">${obj.name}（${wxTag(obj.wuxing)}，方位：${obj.dir}）</span>
                <span class="exp-rel-badge rel-${rel}">${rel}</span>
                <span class="exp-note">${tip}</span>
            </div>`;
        }

        body += dirRule("日干", gz.day.gan, true);
        body += dirRule("日支", gz.day.zhi, false);
        body += dirRule("时支", gz.hour.zhi, false);

        body += `<div class="exp-dir-conclude">
            <strong>方位小结：</strong>${spaceHint}
        </div>`;
        body += `<p class="exp-tip">方位以体卦五行为基准，凡生体、比和之方位皆宜，克体之方位需避。</p>`;

        sections.push(sec("🧭", "方位分析推导", body));
        tocTitles.push("方位分析");
    }

    /* ─── §9 应期推算 ─── */
    {
        const moveZhiIdx = getMoveYaoZhi(up, down, move);
        const moveZhiName = DIZHI[moveZhiIdx]?.name || "";
        const monthZhiName = DIZHI[monthZhi]?.name || "";

        const wxMonMap = {木:[1,2],火:[4,5],金:[7,8],水:[10,11],土:[3,6,9,12]};
        const tiWangMonths = wxMonMap[tiWx] || [];
        const shengTiWx    = Object.keys(SHENG).find(k => SHENG[k] === tiWx);
        const shengMonths  = shengTiWx ? (wxMonMap[shengTiWx] || []) : [];

        let body = "";
        body += `<p class="exp-intro">应期推算以体卦旺相状态及动爻地支为核心依据：</p>`;

        body += `<div class="exp-yingqi-steps">`;
        // 第一步：体卦旺衰
        body += `<div class="exp-step">
            <div class="exp-step-num">①</div>
            <div class="exp-step-body">
                <div class="exp-step-title">体卦旺衰</div>
                <p>体卦 ${wxTag(tiWx)} 当月状态为 ${stateTag(ws.tiState)}（${monthZhiName}月，月令${wxTag(monthWx)}）</p>
                <p>${ws.tiState==="旺"||ws.tiState==="相"
                    ? `体卦旺相，事较易成，<strong>应期</strong>可能在 ${tiWangMonths.map(m=>m+'月').join('、')} 等 ${tiWx}旺之月份。`
                    : `体卦衰弱，需等待生助之时。${shengMonths.length?`<strong>应期</strong>可能在 ${shengMonths.map(m=>m+'月').join('、')} 等 ${shengTiWx||''}生${tiWx}之月份。`:''}`
                }</p>
            </div>
        </div>`;

        // 第二步：动爻地支
        body += `<div class="exp-step">
            <div class="exp-step-num">②</div>
            <div class="exp-step-body">
                <div class="exp-step-title">动爻地支应兆</div>
                <p>动爻（第${move}爻）纳甲地支为 <strong>${moveZhiName}</strong>，逢 <strong>${moveZhiName}</strong> 年、月、日，事情往往有明显应兆或转折。</p>
            </div>
        </div>`;

        // 第三步：综合结论
        body += `<div class="exp-step">
            <div class="exp-step-num">③</div>
            <div class="exp-step-body">
                <div class="exp-step-title">综合应期结论</div>
                <p>${yingqi}</p>
            </div>
        </div>`;
        body += `</div>`;

        body += `<p class="exp-tip">应期可以年、月、日为单位：近期事以"日"论，中期以"月"论，远期大事以"年"论。</p>`;

        sections.push(sec("📅", "应期推算过程", body));
        tocTitles.push("应期推算");
    }

    /* ─── 组装输出 ─── */
    return `<div class="explain-panel">
        <div class="explain-header">
            <span class="explain-header-icon">🔍</span>
            <span class="explain-header-title">卦象解析</span>
            <button class="explain-close-btn" onclick="toggleExplainPanel()">✕ 收起</button>
        </div>
        <div class="explain-toc">
            ${tocTitles.map((t,i)=>`<a class="toc-item" href="javascript:void(0)" onclick="document.getElementById('exp-sec-${i+1}').scrollIntoView({behavior:'smooth',block:'start'});return false;">${i+1}. ${t}</a>`).join('')}
        </div>
        ${sections.map((s,i)=>`<div id="exp-sec-${i+1}">${s}</div>`).join('')}
    </div>`;
}

/* ─── 内部辅助 ─── */
function _getMoveYaoType(up, down, move) {
    if (move <= 3) return YAO_MAP[down][move - 1];
    else           return YAO_MAP[up][move - 4];
}



