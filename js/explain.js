/**
 * explain.js — 卦象解析推导文本生成模块
 * 依赖：data.js, divination.js
 * 对外暴露：generateExplain(params) → HTML字符串
 */

class GuaExplainer {
    // 生成完整卦象解析HTML
    static generateExplain(params) {
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
            bBase, bWs,
            yingqi, spaceHint,
            gz, mode, inputNums
        } = params;

        const sections = [];
        const tocTitles = [];

        // 起卦推导部分
        sections.push(this.generateDivinationDerivationSection(mode, gz, inputNums, up, down, move, rawUp, rawDown, rawMove));
        tocTitles.push("起卦推导");

        // 本卦推演部分
        sections.push(this.generateBenGuaSection(up, down, move));
        tocTitles.push("本卦推演");

        // 互卦衍生部分
        sections.push(this.generateHuGuaSection(up, down, huU, huD));
        tocTitles.push("互卦衍生");

        // 变卦产生部分
        sections.push(this.generateBianGuaSection(up, down, move, bianU, bianD));
        tocTitles.push("变卦产生");

        // 体用关系部分
        sections.push(this.generateTiYongSection(move, up, down, huU, huD, bianU, bianD, tiNum, yongNum, huTiIdx, huYongIdx, bTiIdx, bYongIdx, tiWx, yongWx, base, huBase, bBase, ws, huWs, bWs, params));
        tocTitles.push("体用关系");

        // 月令旺衰部分（已移至体用关系中，不再单独显示）
        // sections.push(this.generateWangShuaiSection(monthZhi, monthWx, tiWx, yongWx, ws));
        // tocTitles.push("月令旺衰");

        // 方位分析和应期推算部分（合并为一个卡片）
        // 直接获取两个部分的内容，不使用section包装
        let directionContent = "";
        directionContent += `<p class="exp-intro">方位分析依据日干、日支、时支与体卦五行的生克关系判断：</p>`;
        
        function dirRule(label, idx, isGan) {
            if (!idx) return "";
            const obj = isGan ? TIANGAN[idx] : DIZHI[idx];
            if (!obj) return "";
            let rel = "", tip = "";
            const formattedDir = obj.dir.length === 1 ? ` ${obj.dir} ` : obj.dir;
            if (obj.wuxing === tiWx)            { rel="比和"; tip=`${formattedDir}方与体卦同行，行事顺遂`; }
            else if (SHENG[obj.wuxing]===tiWx)  { rel="生体"; tip=`${formattedDir}方五行生体卦，此方求谋易得贵人`; }
            else if (KE[obj.wuxing]===tiWx)     { rel="克体"; tip=`${formattedDir}方五行克体卦，此方需防口舌阻滞`; }
            else if (SHENG[tiWx]===obj.wuxing)  { rel="体生"; tip=`体卦生${formattedDir}方，往此方行事较耗心力`; }
            else if (KE[tiWx]===obj.wuxing)     { rel="体克"; tip=`体卦克${formattedDir}方，主动出击可成`; }
            return `<div class="exp-dir-row">
                <span class="exp-label">${label}</span>
                <span class="exp-val">${obj.name}（${GuaExplainer.wxTag(obj.wuxing)}，方位：${formattedDir}）</span>
                <span class="exp-rel-badge rel-${rel}">${rel}</span>
                <span class="exp-note">${tip}</span>
            </div>`;
        }
        
        directionContent += dirRule("日干", gz.day.gan, true);
        directionContent += dirRule("日支", gz.day.zhi, false);
        directionContent += dirRule("时支", gz.hour.zhi, false);
        
        directionContent += `<div class="exp-dir-conclude">
            <strong>方位小结：</strong>${spaceHint}
        </div>`;
        directionContent += `<p class="exp-tip">方位以体卦五行为基准，凡生体、比和之方位皆宜，克体之方位需避。</p>`;

        directionContent += `<div class="exp-collapse-section">
            <div class="exp-collapse-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="exp-collapse-title">天干地支五行方位对照表</span>
                <span class="exp-collapse-icon">▼</span>
            </div>
            <div class="exp-collapse-content">
                <div class="exp-wx-ref-table-container">
                    <table class="exp-gua-ref-table">
                        <tr><td colspan="10">天干</td></tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].name}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].wuxing}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].dir}</td>`).join('')}</tr>
                    </table>
                    <table class="exp-gua-ref-table" style="margin-top:12px;">
                        <tr><td colspan="12">地支</td></tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].name}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].wuxing}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].dir}</td>`).join('')}</tr>
                    </table>
                </div>
            </div>
        </div>`;
        
        // 应期推算内容
        const moveZhiIdx = getMoveYaoZhi(up, down, move);
        const moveZhiName = DIZHI[moveZhiIdx]?.name || "";
        const monthZhiName = DIZHI[monthZhi]?.name || "";
        
        const tiWangMonths = WX_MONTHS[tiWx] || [];
        const shengTiWx    = Object.keys(SHENG).find(k => SHENG[k] === tiWx);
        const shengMonths  = shengTiWx ? (WX_MONTHS[shengTiWx] || []) : [];
        
        let yingqiContent = "";
        if (ws.tiState === "旺" || ws.tiState === "相") {
            yingqiContent = "体卦旺相，事较易成，<strong>应期</strong>可能在 " + tiWangMonths.map(m=>m+'月').join('、') + " 等 " + tiWx + "旺之月份。";
        } else {
            if (shengMonths.length) {
                yingqiContent = "体卦衰弱，需等待生助之时。<strong>应期</strong>可能在 " + shengMonths.map(m=>m+'月').join('、') + " 等 " + (shengTiWx||'') + "生" + tiWx + "之月份。";
            } else {
                yingqiContent = "体卦衰弱，需等待生助之时。";
            }
        }
        
        let yingqiSectionContent = "";
        yingqiSectionContent += `<p class="exp-intro">应期推算以体卦旺相状态及动爻地支为核心依据：</p>`;
        
        yingqiSectionContent += `<div class="exp-yingqi-steps">`;
        // 第一步：体卦旺衰
        yingqiSectionContent += `<div class="exp-step">
            <div class="exp-step-num">1</div>
            <div class="exp-step-body">
                <div class="exp-step-title">体卦旺衰</div>
                <p>体卦 ${GuaExplainer.wxTag(tiWx)} 当月状态为 ${GuaExplainer.stateTag(ws.tiState)}（${monthZhiName}月）</p>
                <p>${yingqiContent}</p>
            </div>
        </div>`;
        
        // 第二步：动爻地支
        yingqiSectionContent += `<div class="exp-step">
            <div class="exp-step-num">2</div>
            <div class="exp-step-body">
                <div class="exp-step-title">动爻地支应兆</div>
                <p>动爻（第${move}爻）纳甲地支为 <strong>${moveZhiName}</strong>，逢 <strong>${moveZhiName}</strong> 年、月、日，事情往往有明显应兆或转折。</p>
            </div>
        </div>`;
        
        // 第三步：综合结论
        yingqiSectionContent += `<div class="exp-step">
            <div class="exp-step-num">3</div>
            <div class="exp-step-body">
                <div class="exp-step-title">综合应期结论</div>
                <p>${yingqi}</p>
            </div>
        </div>`;
        yingqiSectionContent += `</div>`;
        
        yingqiSectionContent += `<p class="exp-tip">应期可以年、月、日为单位：近期事以"日"论，中期以"月"论，远期大事以"年"论。</p>`;
        
        // 合并两个部分的内容到一个卡片
        const combinedContent = directionContent + `<div class="exp-divider"></div>` + yingqiSectionContent;
        const combinedSection = this.section("", "方位应期", combinedContent);
        sections.push(combinedSection);
        tocTitles.push("方位应期");

        return this.assembleExplainHTML(sections, tocTitles);
    }

    // 生成起卦推导部分
    static generateDivinationDerivationSection(mode, gz, inputNums, up, down, move, rawUp, rawDown, rawMove) {
        let body = "";

        if (mode === 'date' && gz) {
            const yearZhi  = gz.year.zhi;
            const monthNum = gz.month.zhi;
            const dayNum   = (gz.inputDate && gz.inputDate.day) || 1;
            const hourZhi = gz.hour.zhi;
            const sumUp   = yearZhi + monthNum + dayNum;
            const sumDown = sumUp + hourZhi;
            const sumMove = sumUp + hourZhi;

            body += `<p class="exp-intro"><strong>日期起卦</strong>：以年支序号、月支序号、日数、时支序号为基数进行计算。</p>`;
            body += this.formula(`上卦 = 年支(${yearZhi}) + 月支(${monthNum}) + 日(${dayNum}) = ${sumUp}，${sumUp} ÷ 8 余 ${sumUp % 8 || 8}`, `${this.guaTag(up)}`, "");
            body += this.formula(`下卦 = ${sumUp} + 时支(${hourZhi}) = ${sumDown}，${sumDown} ÷ 8 余 ${sumDown % 8 || 8}`, `${this.guaTag(down)}`, "");
            body += this.formula(`动爻 = ${sumUp} + 时支(${hourZhi}) = ${sumMove}，${sumMove} ÷ 6 余 ${sumMove % 6 || 6}`, `第 ${move} 爻`, "");
        } else if (mode === 'number' && inputNums) {
            const n1 = inputNums.n1, n2 = inputNums.n2;
            const hasN3 = inputNums.n3 !== null && inputNums.n3 > 0;

            body += `<p class="exp-intro"><strong>数字起卦</strong>：以用户输入的数字为基数进行计算。</p>`;
            body += this.formula(`上卦 = ${n1} ÷ 8，余 ${n1 % 8 || 8}`, `${this.guaTag(up)}`, "");
            body += this.formula(`下卦 = ${n2} ÷ 8，余 ${n2 % 8 || 8}`, `${this.guaTag(down)}`, "");
            if (hasN3) {
                body += this.formula(`动爻 = ${inputNums.n3} ÷ 6，余 ${inputNums.n3 % 6 || 6}`, `第 ${move} 爻`, "用户指定动爻数");
            } else {
                body += this.formula(`动爻 = (${n1} + ${n2}) ÷ 6 = ${n1+n2} ÷ 6，余 ${(n1+n2) % 6 || 6}`, `第 ${move} 爻`, "未指定动爻数，取两数之和");
            }
        }

        body += `<div class="exp-divider"></div>`;
        // 卦数与卦象（可折叠）
        body += `<div class="exp-collapse-section">
            <div class="exp-collapse-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="exp-collapse-title">卦数与卦象</span>
                <span class="exp-collapse-icon">▼</span>
            </div>
            <div class="exp-collapse-content">
                <p class="exp-intro">先天八卦数与卦象对应关系：</p>
                <div class="exp-gua-ref-table-container"><table class="exp-gua-ref-table"><tr>${[1,2,3,4].map(n => `<td>${n}</td>`).join('')}</tr><tr>${[1,2,3,4].map(n => `<td>${GUA_NAMES[n]}</td>`).join('')}</tr><tr>${[5,6,7,8].map(n => `<td>${n}</td>`).join('')}</tr><tr>${[5,6,7,8].map(n => `<td>${GUA_NAMES[n]}</td>`).join('')}</tr></table></div>
            </div>
        </div>`;

        return this.section("", "起卦推导", body);
    }

    // 生成本卦推演部分
    static generateBenGuaSection(up, down, move) {
        const upYao   = YAO_MAP[up];
        const downYao = YAO_MAP[down];

        function yaoLine(yaoArr, label) {
            return yaoArr.map((v, i) => `第${i+1}爻：${v===1?'阳爻 ━━━━━━':'阴爻 ━━ ━━'}`).join('　');
        }

        let body = "";
        body += `<p class="exp-intro">由上卦 <strong>${GUA_NAMES[up].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong> 与下卦 <strong>${GUA_NAMES[down].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong> 组合，第 <strong>${move}</strong> 爻为动爻。</p>`;
        body += `<div class="exp-gua-diagram">`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">上卦 <strong>${GUA_NAMES[up].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [...upYao].reverse().forEach((v, i) => {
            const realIdx = upYao.length - 1 - i;
            const gIdx = 4 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${renderYaoLine(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 动':''}</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 <strong>${GUA_NAMES[down].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [...downYao].reverse().forEach((v, i) => {
            const realIdx = downYao.length - 1 - i;
            const gIdx = 1 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${renderYaoLine(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 动':''}</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;

        return this.section("", "本卦 · 初始状态", body);
    }

    // 生成互卦衍生部分
    static generateHuGuaSection(up, down, huU, huD) {
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
        body += `<div class="exp-gua-name">上卦 <strong>${GUA_NAMES[huU].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [6,5,4].forEach(yao => {
            const v = huYaoVal(yao);
            body += `<div class="exp-yao-row">${renderYaoLine(v,false)} <span class="exp-yao-idx">第${yao}爻（本卦第${huAllYao[yao-1].srcPos}爻）</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 <strong>${GUA_NAMES[huD].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [3,2,1].forEach(yao => {
            const v = huYaoVal(yao);
            body += `<div class="exp-yao-row">${renderYaoLine(v,false)} <span class="exp-yao-idx">第${yao}爻（本卦第${huAllYao[yao-1].srcPos}爻）</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;
        return this.section("", "互卦 · 中间过程", body);
    }

    // 生成变卦产生部分
    static generateBianGuaSection(up, down, move, bianU, bianD) {
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

        // 变卦爻象图（与本卦一致的结构）
        const bianUpYao   = [...YAO_MAP[up]];
        const bianDownYao = [...YAO_MAP[down]];
        // 执行翻转
        if (move <= 3) bianDownYao[move - 1] = 1 - bianDownYao[move - 1];
        else           bianUpYao[move - 4]   = 1 - bianUpYao[move - 4];

        body += `<div class="exp-gua-diagram">`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">上卦 <strong>${GUA_NAMES[bianU].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [...bianUpYao].reverse().forEach((v, i) => {
            const realIdx = bianUpYao.length - 1 - i;
            const gIdx = 4 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${renderYaoLine(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 翻转':''}</span></div>`;
        });
        body += `</div>`;
        body += `<div class="exp-gua-col">`;
        body += `<div class="exp-gua-name">下卦 <strong>${GUA_NAMES[bianD].replace(/[☰☱☲☳☴☵☶☷]/g, '')}</strong></div>`;
        [...bianDownYao].reverse().forEach((v, i) => {
            const realIdx = bianDownYao.length - 1 - i;
            const gIdx = 1 + realIdx;
            const isDong = (gIdx === move);
            body += `<div class="exp-yao-row${isDong?' is-dong':''}">${renderYaoLine(v,isDong)} <span class="exp-yao-idx">第${gIdx}爻${isDong?' ◀ 翻转':''}</span></div>`;
        });
        body += `</div>`;
        body += `</div>`;

        return this.section("", "变卦 · 事件结局", body);
    }

    // 生成体用关系部分
    static generateTiYongSection(move, up, down, huU, huD, bianU, bianD, tiNum, yongNum, huTiIdx, huYongIdx, bTiIdx, bYongIdx, tiWx, yongWx, base, huBase, bBase, ws, huWs, bWs, params) {
        const relDesc = {
            "比和":   {color:"#333", emoji:"⬜"},
            "用生体": {color:"#333", emoji:"⬜"},
            "体生用": {color:"#333", emoji:"⬜"},
            "体克用": {color:"#333", emoji:"⬜"},
            "用克体": {color:"#333", emoji:"⬜"},
        };

        let body = "";

        // 引出体用概念
        body += `<p class="exp-intro">本卦、互卦、变卦的上卦和下卦都可以拆分为<strong>体卦</strong>和<strong>用卦</strong>：</p>`;
        body += this.row("体卦", "动爻不在的卦，代表问卦者 / 事情主体", "不变的一方");
        body += this.row("用卦", "动爻所在的卦，代表所问之事 / 对方 / 外物", "变化的一方");
        body += `<p class="exp-intro">动爻在本卦第<strong>${move}</strong>爻(位于${move<=3?'下卦':'上卦'})，故：本卦、互卦、变卦中的${move<=3?'下卦':'上卦'}为用卦，${move<=3?'上卦':'下卦'}为体卦。</p>`;

        // 本卦、互卦、变卦的体用五行
        body += `<div class="exp-divider"></div>`;

        const bRelDesc   = relDesc[bBase.name] || {color:"#555",tip:""};
        const huRelDesc  = relDesc[huBase.name]   || {color:"#555",tip:""};
        const mainRel    = relDesc[base.name]      || {color:"#555",tip:""};

        // 体卦位置固定：动爻≤3时上卦为体，>3时下卦为体，三卦一致
        const isTiUp = move <= 3; // 上卦是否为体卦

        // 将旺相休囚死转换为※的数量
        function getStrengthStars(state) {
            const strengthMap = {"旺": "5※", "相": "4※", "休": "3※", "囚": "2※", "死": "1※"};
            return strengthMap[state] || "0※";
        }

        function guaRoleLabel(num, isTi) {
            return `<span style="font-weight:700;color:#333">${GUA_NAMES[num]}</span> <span style="color:#999;font-size:12px">${isTi?'（体卦）':'（用卦）'}</span>`;
        }

        // 生成表头，根据实际卦象和体用关系自动变化
        const upGuaName = GUA_NAMES[up].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','');
        const downGuaName = GUA_NAMES[down].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','');
        const upRole = isTiUp ? '体' : '用';
        const downRole = !isTiUp ? '体' : '用';

        // 修改getStrengthStars函数，返回实际的※符号
        function getStrengthStars(state) {
            const strengthMap = {"旺": "※※※※※", "相": "※※※※", "休": "※※※", "囚": "※※", "死": "※"};
            return strengthMap[state] || "";
        }

        // 添加月令旺衰注解
        const monthZhiName = DIZHI[params.monthZhi]?.name || "";

        body += `<div class="exp-table-container"><table class="exp-table">
            <thead><tr><th></th><th>上卦-${upRole}</th><th>下卦-${downRole}</th><th>体用关系</th><th>体用解析</th></tr></thead>
            <tbody>
                <tr>
                    <td style="font-weight:700;color:#333">本卦</td>
                    <td style="text-align:center;">${upGuaName}-${WUXING[up]}<br/>${getStrengthStars(isTiUp ? ws.tiState : ws.yongState)}</td>
                    <td style="text-align:center;">${downGuaName}-${WUXING[down]}<br/>${getStrengthStars(!isTiUp ? ws.tiState : ws.yongState)}</td>
                    <td style="color:${mainRel.color};font-weight:700">${base.name === '比和' ? '比　和' : base.name}-主断</td>
                    <td style="text-align:center;font-size:12px;padding:6px 8px">${base.desc}</td>
                </tr>
                <tr>
                    <td style="font-weight:700;color:#333">互卦</td>
                    <td style="text-align:center;">${GUA_NAMES[huU].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','')}-${WUXING[huU]}<br/>${getStrengthStars(isTiUp ? huWs.tiState : huWs.yongState)}</td>
                    <td style="text-align:center;">${GUA_NAMES[huD].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','')}-${WUXING[huD]}<br/>${getStrengthStars(!isTiUp ? huWs.tiState : huWs.yongState)}</td>
                    <td style="color:${huRelDesc.color};font-weight:700">${huBase.name === '比和' ? '比　和' : huBase.name}-过程</td>
                    <td style="text-align:center;font-size:12px;padding:6px 8px">${huBase.desc}</td>
                </tr>
                <tr>
                    <td style="font-weight:700;color:#333">变卦</td>
                    <td style="text-align:center;">${GUA_NAMES[bianU].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','')}-${WUXING[bianU]}<br/>${getStrengthStars(isTiUp ? bWs.tiState : bWs.yongState)}</td>
                    <td style="text-align:center;">${GUA_NAMES[bianD].replace('☰','').replace('☱','').replace('☲','').replace('☳','').replace('☴','').replace('☵','').replace('☶','').replace('☷','')}-${WUXING[bianD]}<br/>${getStrengthStars(!isTiUp ? bWs.tiState : bWs.yongState)}</td>
                    <td style="color:${bRelDesc.color};font-weight:700">${bBase.name === '比和' ? '比　和' : bBase.name}-结局</td>
                    <td style="text-align:center;font-size:12px;padding:6px 8px">${bBase.desc}</td>
                </tr>
            </tbody>
        </table></div>`;

        // 直接在表格下方添加月令旺衰注解
        body += `<p class="exp-intro" style="font-size:12px; color:#666; margin-top:8px; margin-bottom:16px;">当前月份地支为${monthZhiName}，五行当月强弱状态用※表示</p>`;

        // 五行与卦象（可折叠）
        body += `<div class="exp-collapse-section">
            <div class="exp-collapse-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="exp-collapse-title">五行与卦象</span>
                <span class="exp-collapse-icon">▼</span>
            </div>
            <div class="exp-collapse-content">
                <div class="exp-wx-rule"><strong>相生：</strong>金生水 → 水生木 → 木生火 → 火生土 → 土生金</div>
                <div class="exp-wx-rule"><strong>相克：</strong>金克木 → 木克土 → 土克水 → 水克火 → 火克金</div>
                <div class="exp-wx-rule"><strong>卦象与五行的对应关系：</strong></div>
                <div class="exp-gua-ref-table-container"><table class="exp-gua-ref-table"><tr>${[1,2,3,4].map(i=>`<td>${GUA_NAMES[i]}</td>`).join('')}</tr><tr>${[1,2,3,4].map(i=>`<td>${WUXING[i]}</td>`).join('')}</tr><tr>${[5,6,7,8].map(i=>`<td>${GUA_NAMES[i]}</td>`).join('')}</tr><tr>${[5,6,7,8].map(i=>`<td>${WUXING[i]}</td>`).join('')}</tr></table></div>
            </div>
        </div>`;

        return this.section("", "体用关系", body);
    }

    // 生成月令旺衰部分（已移至体用关系中）
    static generateWangShuaiSection(monthZhi, monthWx, tiWx, yongWx, ws) {
        return "";
    }

    // 生成方位分析部分
    static generateDirectionSection(tiWx, gz, spaceHint) {
        let body = "";
        body += `<p class="exp-intro">方位分析依据日干、日支、时支与体卦五行的生克关系判断：</p>`;

        function dirRule(label, idx, isGan) {
            if (!idx) return "";
            const obj = isGan ? TIANGAN[idx] : DIZHI[idx];
            if (!obj) return "";
            let rel = "", tip = "";
            const formattedDir = obj.dir.length === 1 ? ` ${obj.dir} ` : obj.dir;
            if (obj.wuxing === tiWx)            { rel="比和"; tip=`${formattedDir}方与体卦同行，行事顺遂`; }
            else if (SHENG[obj.wuxing]===tiWx)  { rel="生体"; tip=`${formattedDir}方五行生体卦，此方求谋易得贵人`; }
            else if (KE[obj.wuxing]===tiWx)     { rel="克体"; tip=`${formattedDir}方五行克体卦，此方需防口舌阻滞`; }
            else if (SHENG[tiWx]===obj.wuxing)  { rel="体生"; tip=`体卦生${formattedDir}方，往此方行事较耗心力`; }
            else if (KE[tiWx]===obj.wuxing)     { rel="体克"; tip=`体卦克${formattedDir}方，主动出击可成`; }
            return `<div class="exp-dir-row">
                <span class="exp-label">${label}</span>
                <span class="exp-val">${obj.name}（${GuaExplainer.wxTag(obj.wuxing)}，方位：${formattedDir}）</span>
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

        body += `<div class="exp-collapse-section">
            <div class="exp-collapse-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="exp-collapse-title">天干地支五行方位对照表</span>
                <span class="exp-collapse-icon">▼</span>
            </div>
            <div class="exp-collapse-content">
                <div class="exp-wx-ref-table-container">
                    <table class="exp-gua-ref-table">
                        <tr><td colspan="10">天干</td></tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].name}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].wuxing}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10].map(i=>`<td>${TIANGAN[i].dir}</td>`).join('')}</tr>
                    </table>
                    <table class="exp-gua-ref-table" style="margin-top:12px;">
                        <tr><td colspan="12">地支</td></tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].name}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].wuxing}</td>`).join('')}</tr>
                        <tr>${[1,2,3,4,5,6,7,8,9,10,11,12].map(i=>`<td>${DIZHI[i].dir}</td>`).join('')}</tr>
                    </table>
                </div>
            </div>
        </div>`;

        return this.section("", "方位分析推导", body);
    }

    // 生成应期推算部分
    static generateYingQiSection(tiWx, tiState, move, up, down, monthZhi, yingqi) {
        const moveZhiIdx = getMoveYaoZhi(up, down, move);
        const moveZhiName = DIZHI[moveZhiIdx]?.name || "";
        const monthZhiName = DIZHI[monthZhi]?.name || "";

        const tiWangMonths = WX_MONTHS[tiWx] || [];
        const shengTiWx    = Object.keys(SHENG).find(k => SHENG[k] === tiWx);
        const shengMonths  = shengTiWx ? (WX_MONTHS[shengTiWx] || []) : [];

        let yingqiContent = "";
        if (tiState === "旺" || tiState === "相") {
            yingqiContent = "体卦旺相，事较易成，<strong>应期</strong>可能在 " + tiWangMonths.map(m=>m+'月').join('、') + " 等 " + tiWx + "旺之月份。";
        } else {
            if (shengMonths.length) {
                yingqiContent = "体卦衰弱，需等待生助之时。<strong>应期</strong>可能在 " + shengMonths.map(m=>m+'月').join('、') + " 等 " + (shengTiWx||'') + "生" + tiWx + "之月份。";
            } else {
                yingqiContent = "体卦衰弱，需等待生助之时。";
            }
        }

        let body = "";
        body += `<p class="exp-intro">应期推算以体卦旺相状态及动爻地支为核心依据：</p>`;

        body += `<div class="exp-yingqi-steps">`;
        // 第一步：体卦旺衰
        body += `<div class="exp-step">
            <div class="exp-step-num">1</div>
            <div class="exp-step-body">
                <div class="exp-step-title">体卦旺衰</div>
                <p>体卦 ${this.wxTag(tiWx)} 当月状态为 ${this.stateTag(tiState)}（${monthZhiName}月）</p>
                <p>${yingqiContent}</p>
            </div>
        </div>`;

        // 第二步：动爻地支
        body += `<div class="exp-step">
            <div class="exp-step-num">2</div>
            <div class="exp-step-body">
                <div class="exp-step-title">动爻地支应兆</div>
                <p>动爻（第${move}爻）纳甲地支为 <strong>${moveZhiName}</strong>，逢 <strong>${moveZhiName}</strong> 年、月、日，事情往往有明显应兆或转折。</p>
            </div>
        </div>`;

        // 第三步：综合结论
        body += `<div class="exp-step">
            <div class="exp-step-num">3</div>
            <div class="exp-step-body">
                <div class="exp-step-title">综合应期结论</div>
                <p>${yingqi}</p>
            </div>
        </div>`;
        body += `</div>`;

        body += `<p class="exp-tip">应期可以年、月、日为单位：近期事以"日"论，中期以"月"论，远期大事以"年"论。</p>`;

        return this.section("", "应期推算过程", body);
    }

    // 辅助渲染函数
    static section(icon, title, body) {
        return `<div class="exp-section">
            <div class="exp-title">${icon ? icon + ' ' : ''}${title}</div>
            <div class="exp-body">${body}</div>
        </div>`;
    }

    static row(label, val, note) {
        return `<div class="exp-row">
            <span class="exp-label">${label}</span>
            <span class="exp-val">${val}</span>
            ${note ? `<span class="exp-note">${note}</span>` : ''}
        </div>`;
    }

    static formula(expr, result, comment) {
        return `<div class="exp-formula">
            <span class="exp-expr">${expr}</span>
            <span class="exp-arrow">→</span>
            <span class="exp-result">${result}</span>
            ${comment ? `<span class="exp-comment">（${comment}）</span>` : ''}
        </div>`;
    }

    static wxTag(wx) {
        const cls = wxClass(wx);
        return `<span class="exp-wx ${cls}">${wx}</span>`;
    }

    static stateTag(s) {
        return `<span class="exp-state" style="color:${STATE_COLORS[s]||'#333'}">${s}</span>`;
    }

    static guaTag(num) {
        return `<span class="exp-gua">${GUA_NAMES[num]}</span>`;
    }

    // 组装最终HTML
    static assembleExplainHTML(sections, tocTitles) {
        return `<div class="explain-panel">
            <div class="explain-header">
                <span class="explain-header-icon"></span>
                <span class="explain-header-title">卦象解析</span>
                <button class="explain-close-btn" onclick="app.toggleExplainPanel()">收起</button>
            </div>
            <div class="explain-toc">
                ${tocTitles.map((t,i)=>`<a class="toc-item" href="javascript:void(0)" onclick="document.getElementById('exp-sec-${i+1}').scrollIntoView({behavior:'smooth',block:'start'});return false;">${i+1}. ${t}</a>`).join('')}
            </div>
            ${sections.map((s,i)=>`<div id="exp-sec-${i+1}">${s}</div>`).join('')}
        </div>`;
    }
}

// 导出函数，保持向后兼容
function generateExplain(params) {
    return GuaExplainer.generateExplain(params);
}