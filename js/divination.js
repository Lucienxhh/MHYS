/**
 * divination.js — 梅花易数核心断卦逻辑
 * 依赖：data.js 中的 WUXING、YAO_MAP、WANGSHUAI_TABLE、SHENG、KE、DIZHI、NAGA
 */

function getMonthWuxing(monthZhi) {
    return DIZHI[monthZhi].wuxing;
}

function yaoToNum(arr) {
    for (let [k, v] of Object.entries(YAO_MAP)) {
        if (v[0]===arr[0] && v[1]===arr[1] && v[2]===arr[2]) return +k;
    }
    return 8;
}

/**
 * 互卦抽取规则（梅花易数正统）：
 * 本卦六爻：初(1)、二(2)、三(3)、四(4)、五(5)、上(6)
 * 互卦下卦(1-3爻) = 本卦二、三、四爻
 * 互卦上卦(4-6爻) = 本卦三、四、五爻
 */
function getHuGua(up, down) {
    const downYao = YAO_MAP[down]; // 本卦下卦三爻 [初,二,三]
    const upYao   = YAO_MAP[up];   // 本卦上卦三爻 [四,五,上]
    // 互卦下卦 = 本卦二爻(1)、三爻(2)、四爻(0)
    const huDown = [downYao[1], downYao[2], upYao[0]];
    // 互卦上卦 = 本卦三爻(2)、四爻(0)、五爻(1)
    const huUp   = [downYao[2], upYao[0], upYao[1]];
    return [yaoToNum(huUp), yaoToNum(huDown)];
}

function getBianGua(up, down, move) {
    let upY = [...YAO_MAP[up]], downY = [...YAO_MAP[down]];
    if (move <= 3) downY[move-1] = 1 - downY[move-1];
    else           upY[move-4]   = 1 - upY[move-4];
    return [yaoToNum(upY), yaoToNum(downY)];
}

function analyzeBase(tiWx, yongWx) {
    if (tiWx === yongWx)           return {name:"比和",    desc:"内外同心，诸事和谐"};
    if (SHENG[yongWx] === tiWx)    return {name:"用生体",  desc:"外势相助，诸事顺遂"};
    if (SHENG[tiWx]   === yongWx)  return {name:"体生用",  desc:"自身耗泄，劳心费力"};
    if (KE[tiWx]      === yongWx)  return {name:"体克用",  desc:"主动制伏，辛苦得成"};
    if (KE[yongWx]    === tiWx)    return {name:"用克体",  desc:"外势压制，阻力重重"};
    return {name:"未知", desc:""};
}

function applyWangshuai(tiWx, yongWx, monthWx, base) {
    const tiS = WANGSHUAI_TABLE[monthWx][tiWx];
    const yongS = WANGSHUAI_TABLE[monthWx][yongWx];
    const score = {旺:3,相:2,休:1,囚:0,死:-1};
    let adj = "";
    if (base.name === "用克体") {
        if (score[tiS]>=2 && score[yongS]<=0) adj = "但体卦旺相而用卦衰弱，压力虚张声势，有惊无险。";
        else if (score[tiS]<=0 && score[yongS]>=2) adj = "且体卦衰弱，用卦强旺，凶险加剧，需格外谨慎。";
    } else if (base.name === "用生体") {
        if (score[tiS]>=2) adj = "且体卦旺相，受益更深，锦上添花。";
        else if (score[tiS]<=0) adj = "但体卦衰弱，虽得生助却无力承载，获益有限。";
    } else if (base.name === "体克用") {
        if (score[tiS]>=2) adj = "且体卦旺相，攻克轻松，事半功倍。";
        else if (score[tiS]<=0) adj = "但体卦衰弱，有心无力，克不动对方。";
    } else if (base.name === "体生用") {
        if (score[tiS]>=2) adj = "体卦旺相，虽耗损但根基尚稳。";
        else if (score[tiS]<=0) adj = "体卦衰弱，再行生泄，损耗严重。";
    } else if (base.name === "比和") {
        if (score[tiS]>=2) adj = "体用皆旺，同气相应，势如破竹。";
        else if (score[tiS]<=0) adj = "体用皆衰，虽志同道合但力量不足，宜待时而动。";
    }
    return {tiState: tiS, yongState: yongS, fullDesc: base.desc + (adj ? adj : "")};
}

/**
 * 根据本卦上下卦和动爻位置，获取动爻对应的地支
 * @param {number} up     - 上卦数(1-8)
 * @param {number} down   - 下卦数(1-8)
 * @param {number} moveYao - 动爻位置(1-6)
 * @returns {number} 地支序号(1-12)
 */
function getMoveYaoZhi(up, down, moveYao) {
    if (moveYao <= 3) return NAGA[down][moveYao];
    else              return NAGA[up][moveYao - 3];
}

function predictYingqi(tiWx, tiState, moveYao, up, down) {
    const wxMon = {木:[1,2],火:[4,5],金:[7,8],水:[10,11],土:[3,6,9,12]};
    let desc = "";
    if (tiState === "旺" || tiState === "相") {
        desc = `体卦旺相，事易成。应期可能在${wxMon[tiWx].map(m=>m+'月').join('、')}（${tiWx}旺之月）或逢冲动之年月。`;
    } else {
        const sheng = Object.keys(SHENG).filter(k => SHENG[k] === tiWx);
        if (sheng.length) desc = `体卦衰弱，需待生助。应期可能在${wxMon[sheng[0]].map(m=>m+'月').join('、')}（${sheng[0]}生${tiWx}之月）。`;
        else desc = "体卦衰弱，短期内难有转机，宜静守。";
    }
    const moveZhiIdx = getMoveYaoZhi(up, down, moveYao);
    const moveZhi = DIZHI[moveZhiIdx]?.name || "";
    if (moveZhi) desc += ` 动爻值${moveZhi}，逢${moveZhi}年、月、日亦为应兆。`;
    return desc;
}

function analyzeSpacetime(tiWx, dayGan, dayZhi, hourZhi) {
    const hints = [];
    if (dayGan) {
        const gan = TIANGAN[dayGan];
        if (gan.wuxing === tiWx)           hints.push(`日干${gan.name}方（${gan.dir}）与体卦比和，此方位行事顺遂。`);
        else if (SHENG[gan.wuxing]===tiWx) hints.push(`日干${gan.name}方（${gan.dir}）生体卦，向此方求谋易得贵人。`);
        else if (KE[gan.wuxing]===tiWx)    hints.push(`日干${gan.name}方（${gan.dir}）克体卦，今日此方需防口舌。`);
        else if (SHENG[tiWx]===gan.wuxing) hints.push(`体卦生${gan.name}方（${gan.dir}），往此方行事较耗心力。`);
    }
    if (dayZhi) {
        const zhi = DIZHI[dayZhi];
        if (zhi.wuxing === tiWx)           hints.push(`日支${zhi.name}方（${zhi.dir}）比助体卦，宜静守此方。`);
        else if (SHENG[zhi.wuxing]===tiWx) hints.push(`日支${zhi.name}方（${zhi.dir}）生体卦，此方位有生助之气。`);
        else if (KE[zhi.wuxing]===tiWx)    hints.push(`日支${zhi.name}方（${zhi.dir}）克体卦，今日避免向此方争执。`);
    }
    if (hourZhi) {
        const zhi = DIZHI[hourZhi];
        if (KE[tiWx]===zhi.wuxing)    hints.push(`此时辰${zhi.name}方（${zhi.dir}）受体卦所克，向此方主动出击可成。`);
        else if (KE[zhi.wuxing]===tiWx) hints.push(`此时辰${zhi.name}方（${zhi.dir}）克体卦，此刻暂避此方。`);
    }
    return hints.length ? hints.join(" ") : "无特殊时空方位提示，可依常理行事。";
}

/** 日期起卦：根据干支计算上卦、下卦、动爻 */
function calcGuaFromDate(gz) {
    const yearZhi  = gz.year.zhi;
    const monthNum = gz.month.zhi;
    const dayNum   = new Date(
        document.getElementById("gregYear").value,
        document.getElementById("gregMonth").value - 1,
        document.getElementById("gregDay").value
    ).getDate();
    const hourZhi = gz.hour.zhi;
    const sumUp   = yearZhi + monthNum + dayNum;
    const sumDown = sumUp + hourZhi;
    let up   = sumUp % 8;           if (up   === 0) up   = 8;
    let down = sumDown % 8;         if (down === 0) down = 8;
    let move = (sumUp + hourZhi) % 6; if (move === 0) move = 6;
    return {up, down, move};
}
