/**
 * ganzhi.js — 干支计算模块
 * 依赖：data.js 中的 TIANGAN、DIZHI
 */

class GanZhiCalculator {
    // 根据总分钟数（0~1439）确定时辰地支序号（1-12）
    static getShiChen(totalMinutes) {
        if (totalMinutes >= 1380) return 1; // 23:00-24:00 → 子
        return Math.floor((totalMinutes + 60) / 120) % 12 + 1;
    }

    // 获取节气数据（简化版，实际应用中可能需要更精确的节气计算）
    static getSolarTerms(year) {
        return [5,20,4,19,6,21,5,20,6,21,7,23,8,23,8,23,9,24,8,23,8,24,7,22];
    }

    // 根据节气确定月份地支
    static getMonthZhiBySolarTerm(year, month, day) {
        const terms = this.getSolarTerms(year);
        const map = [
            {idx:2, zhi:3},{idx:4, zhi:4},{idx:6, zhi:5},{idx:8, zhi:6},
            {idx:10, zhi:7},{idx:12, zhi:8},{idx:14, zhi:9},{idx:16, zhi:10},
            {idx:18, zhi:11},{idx:20, zhi:12},{idx:22, zhi:1},{idx:0, zhi:2}
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

    // 计算年干支
    static getYearGanZhi(year, month, day) {
        const terms = this.getSolarTerms(year);
        const before = (month < 2) || (month === 2 && day < terms[2]);
        const ly = before ? year - 1 : year;
        let gan = (ly - 3) % 10; if (gan <= 0) gan += 10;
        let zhi = (ly - 3) % 12; if (zhi <= 0) zhi += 12;
        return {gan, zhi};
    }

    // 计算日干支
    static getDayGanZhi(year, month, day) {
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        let jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
        let off = (jd + 49) % 60;
        return {gan: (off % 10) + 1, zhi: (off % 12) + 1};
    }

    // 计算月干支
    static getMonthGanZhi(year, month, day, yearGan) {
        const monthZhi = this.getMonthZhiBySolarTerm(year, month, day);
        let first;
        if (yearGan===1||yearGan===6) first=3;
        else if (yearGan===2||yearGan===7) first=5;
        else if (yearGan===3||yearGan===8) first=7;
        else if (yearGan===4||yearGan===9) first=9;
        else first=1;
        let gan = (first + (monthZhi - 3) + 10) % 10; if (gan === 0) gan = 10;
        return {gan, zhi: monthZhi};
    }

    // 计算时干支
    static getHourGanZhi(totalMinutes, dayGan) {
        const zhi = this.getShiChen(totalMinutes);
        let first;
        if (dayGan===1||dayGan===6) first=1;
        else if (dayGan===2||dayGan===7) first=3;
        else if (dayGan===3||dayGan===8) first=5;
        else if (dayGan===4||dayGan===9) first=7;
        else first=9;
        let gan = (first + (zhi - 1)) % 10; if (gan === 0) gan = 10;
        return {gan, zhi};
    }

    // 根据公历年月日时分计算完整四柱干支
    static computeAllGanZhi(year, month, day, hour, minute) {
        const yGz = this.getYearGanZhi(year, month, day);
        const mGz = this.getMonthGanZhi(year, month, day, yGz.gan);
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

        const dGz = this.getDayGanZhi(actualYear, actualMonth, actualDay);
        const hGz = this.getHourGanZhi(totalMin, dGz.gan);

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

    // 格式化干支显示
    static formatGanZhi(gz) {
        const base = 
            `${TIANGAN[gz.year.gan].name}${DIZHI[gz.year.zhi].name}年 ` +
            `${TIANGAN[gz.month.gan].name}${DIZHI[gz.month.zhi].name}月 ` +
            `${TIANGAN[gz.day.gan].name}${DIZHI[gz.day.zhi].name}日 ` +
            `${TIANGAN[gz.hour.gan].name}${DIZHI[gz.hour.zhi].name}时`;
        if (gz.isCrossDayZiShi) {
            return base + ` <span style="color:#333;font-size:13px;">（已跨入次日${gz.actualDate.month}/${gz.actualDate.day}子时）</span>`;
        }
        return base;
    }
}

// 导出函数，保持向后兼容
function getShiChen(totalMinutes) {
    return GanZhiCalculator.getShiChen(totalMinutes);
}

function getSolarTerms(year) {
    return GanZhiCalculator.getSolarTerms(year);
}

function getMonthZhiBySolarTerm(year, month, day) {
    return GanZhiCalculator.getMonthZhiBySolarTerm(year, month, day);
}

function getYearGanZhi(year, month, day) {
    return GanZhiCalculator.getYearGanZhi(year, month, day);
}

function getDayGanZhi(year, month, day) {
    return GanZhiCalculator.getDayGanZhi(year, month, day);
}

function getMonthGanZhi(year, month, day, yearGan) {
    return GanZhiCalculator.getMonthGanZhi(year, month, day, yearGan);
}

function getHourGanZhi(totalMinutes, dayGan) {
    return GanZhiCalculator.getHourGanZhi(totalMinutes, dayGan);
}

function computeAllGanZhi(year, month, day, hour, minute) {
    return GanZhiCalculator.computeAllGanZhi(year, month, day, hour, minute);
}

function formatGanZhi(gz) {
    return GanZhiCalculator.formatGanZhi(gz);
}