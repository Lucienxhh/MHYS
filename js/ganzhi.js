/**
 * ganzhi.js — 干支计算模块
 * 依赖：data.js 中的 TIANGAN、DIZHI
 */

/**
 * 根据总分钟数（0~1439）确定时辰地支序号（1-12）
 * 时辰边界以整点为界：
 *   子时 23:00-01:00 → 丑时 01:00-03:00 → ... → 亥时 21:00-23:00
 *   特例：23:00-24:00 归子时，0:00-1:00 也归子时
 */
function getShiChen(totalMinutes) {
    if (totalMinutes >= 1380) return 1; // 23:00-24:00 → 子
    return Math.floor((totalMinutes + 60) / 120) % 12 + 1;
}

function getSolarTerms(year) {
    return [5,20,4,19,6,21,5,20,6,21,7,23,8,23,8,23,9,24,8,23,8,24,7,22];
}

function getMonthZhiBySolarTerm(year, month, day) {
    const terms = getSolarTerms(year);
    const map = [
        {idx:2,zhi:3},{idx:4,zhi:4},{idx:6,zhi:5},{idx:8,zhi:6},
        {idx:10,zhi:7},{idx:12,zhi:8},{idx:14,zhi:9},{idx:16,zhi:10},
        {idx:18,zhi:11},{idx:20,zhi:12},{idx:22,zhi:1},{idx:0,zhi:2}
    ];
    const doy = (new Date(year, month-1, day) - new Date(year, 0, 0)) / 86400000;
    for (let i = 0; i < map.length; i++) {
        const t = map[i];
        const tm = (t.idx >= 22) ? 12 : Math.floor(t.idx / 2) + 1;
        const tday = terms[t.idx];
        const tdoy = (new Date(year, tm-1, tday) - new Date(year, 0, 0)) / 86400000;
        if (doy < tdoy) return map[(i-1+12)%12].zhi;
    }
    return 2;
}

function getYearGanZhi(year, month, day) {
    const terms = getSolarTerms(year);
    const before = (month < 2) || (month === 2 && day < terms[2]);
    const ly = before ? year - 1 : year;
    let gan = (ly - 3) % 10; if (gan <= 0) gan += 10;
    let zhi = (ly - 3) % 12; if (zhi <= 0) zhi += 12;
    return {gan, zhi};
}

function getDayGanZhi(year, month, day) {
    let a = Math.floor((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
    let jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
    let off = (jd + 49) % 60;
    return {gan: (off % 10) + 1, zhi: (off % 12) + 1};
}

function getMonthGanZhi(year, month, day, yearGan) {
    const monthZhi = getMonthZhiBySolarTerm(year, month, day);
    let first;
    if (yearGan===1||yearGan===6) first=3;
    else if (yearGan===2||yearGan===7) first=5;
    else if (yearGan===3||yearGan===8) first=7;
    else if (yearGan===4||yearGan===9) first=9;
    else first=1;
    let gan = (first + (monthZhi - 3) + 10) % 10; if (gan === 0) gan = 10;
    return {gan, zhi: monthZhi};
}

function getHourGanZhi(totalMinutes, dayGan) {
    const zhi = getShiChen(totalMinutes);
    let first;
    if (dayGan===1||dayGan===6) first=1;
    else if (dayGan===2||dayGan===7) first=3;
    else if (dayGan===3||dayGan===8) first=5;
    else if (dayGan===4||dayGan===9) first=7;
    else first=9;
    let gan = (first + (zhi - 1)) % 10; if (gan === 0) gan = 10;
    return {gan, zhi};
}

/**
 * 根据公历年月日时分计算完整四柱干支
 *
 * ⚠️ 关键规则：子时跨日（23:00~23:59）
 *   当处于子时时段，日柱应取次日，年/月柱不变，
 *   时柱仍用当日日干的五鼠遁推出。
 */
function computeAllGanZhi(year, month, day, hour, minute) {
    const yGz = getYearGanZhi(year, month, day);
    const mGz = getMonthGanZhi(year, month, day, yGz.gan);
    const totalMin = hour * 60 + (minute || 0);

    let actualDay = day, actualMonth = month, actualYear = year;
    let isCrossDayZiShi = false;

    if (totalMin >= 1380) { // 23:00 ~ 23:59 → 次日子时
        isCrossDayZiShi = true;
        const nd = new Date(actualYear, actualMonth - 1, actualDay + 1);
        actualDay   = nd.getDate();
        actualMonth = nd.getMonth() + 1;
        actualYear  = nd.getFullYear();
    }

    const dGz = getDayGanZhi(actualYear, actualMonth, actualDay);
    const hGz = getHourGanZhi(totalMin, dGz.gan);

    return {
        year:  yGz,
        month: mGz,
        day:   dGz,
        hour:  hGz,
        isCrossDayZiShi,
        inputDate: { year, month, day },
        actualDate: { year: actualYear, month: actualMonth, day: actualDay }
    };
}

function formatGanZhi(gz) {
    const base =
        `${TIANGAN[gz.year.gan].name}${DIZHI[gz.year.zhi].name}年 ` +
        `${TIANGAN[gz.month.gan].name}${DIZHI[gz.month.zhi].name}月 ` +
        `${TIANGAN[gz.day.gan].name}${DIZHI[gz.day.zhi].name}日 ` +
        `${TIANGAN[gz.hour.gan].name}${DIZHI[gz.hour.zhi].name}时`;
    if (gz.isCrossDayZiShi) {
        return base + ` <span style="color:#c0392b;font-size:13px;">（已跨入次日${gz.actualDate.month}/${gz.actualDate.day}子时）</span>`;
    }
    return base;
}
