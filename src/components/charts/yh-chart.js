import * as echarts from 'echarts';
import dayjs from "dayjs";

export default class YHChartBuilder {
    constructor(vm, container, userOptions, lineStyle) {
        this.chart = echarts.init(document.getElementById(container));
        // 添加一个属性来跟踪所有的定时器
        this.yhTimeOut = [];
        // 添加一个属性来跟踪当前的时间
        this.yhCurrentTime = 0;
        // 添加一个属性来跟踪所有的播放时间
        this.yhArrPlay = [];
        window.charts = {};
        window.charts[container] = this.chart;
        // 使用默认的options初始化
        lineStyle = lineStyle || {};
        this.option = this.initOption(lineStyle);
        // 合并用户定义的options
        userOptions = userOptions || {};
        this.setOptions(userOptions);
        // 应用合并后的options
        this.chart.setOption(this.option);
        // 添加一个属性来跟踪播放状态
        this.isPlaying = false;
        // 添加一个属性来跟踪数据总数
        this.yhTotal = 0;
    }

    /**
     * 初始化options
     * @returns {*}
     */
    initOption(lineStyle) {
        this.option = {
            grid: {
                bottom: 60, top: 35, right: 20
            }, xAxis: {
                boundaryGap: 0, axisTick: {
                    show: false
                }, type: 'category', // X轴均为category，Y轴均为value   //设置为类目轴
                axisLine: {
                    lineStyle: {
                        type: 'dashed', color: '#A0A5B3'
                    }, show: true
                }, axisLabel: {
                    color: '#606A84', rotate: 90, // 显示条件，只有在data数组中非空的情况下才显示
                    show: function (value) {
                        return value !== '';
                    },
                }, data: []
            }, yAxis: {
                type: 'value', axisTick: {
                    show: false
                }, splitLine: {
                    lineStyle: {
                        type: 'dashed', color: '#A0A5B3'
                    }
                }, axisLine: {
                    lineStyle: {
                        type: 'dashed', color: '#A0A5B3'
                    }, show: true
                }, boundaryGap: 0, axisLabel: {
                    formatter: (value) => {
                        if (value !== 0) {
                            return value + '%';
                        } else {
                            return '';
                        }
                    }, show: true, color: '#606A84', rotate: 90
                }, min: 0, max: 50
            },

            series: [
                {
                    name: '历史最高含水量',
                    type: 'line',
                    itemStyle: {
                        color: lineStyle.max || '#5d77f3'
                    },
                    symbol: 'none',
                    smooth: true, // stack:'总量',
                    data: [],
                    markLine: {
                        zLevel: 1,
                        symbol: 'none',
                        lineStyle: {
                            type: 'dashed'
                        }, silent: true, // 是否不响应和触发鼠标事件
                        //根系
                        data: [{
                            name: '', // 使用找到的rootIndex来定位markLine
                            xAxis: 0, label: {
                                formatter: '' // 可选，自定义标记线文字
                            }
                        }],

                        animation: false
                    }
                }, {
                    name: '当前含水量',
                    type: 'line',
                    symbol: 'none',
                    itemStyle: {
                        color: lineStyle.current || '#3bcf9b'
                    },
                    smooth: true,
                    stack: '总量',
                    data: []
                }, {
                    name: '历史最低含水量',
                    type: 'line',
                    symbol: 'none',
                    itemStyle: {
                        color: '#f6657d'
                    },
                    smooth: true,
                    stack: '总量2',
                    data: []
                }, {
                    name: '蓄水潜力',
                    type: 'line',
                    symbol: 'none',
                    smooth: true,
                    stack: '总量',
                    areaStyle: {
                        color: lineStyle.waterRetentionCapacity || 'rgba(91, 121, 251, 0.5)'
                    },
                    lineStyle: {
                        ype: 'dashed',
                        color: 'rgba(0,0,0,0)'
                    },
                    data: []
                }, {
                    name: '有效蓄水量',
                    type: 'line',
                    symbol: 'none',
                    smooth: true,
                    stack: '总量2',
                    areaStyle: {
                        color: lineStyle.effectiveStorageCapacity || '#93dfc5'
                    }, lineStyle: {
                        type: 'dashed', color: 'rgba(0,0,0,0)'
                    }, data: []
                }]
        };
        return this.option
    }

    /**
     * 设置options
     * @param userOptions
     */
    setOptions(userOptions) {
        // 合并用户定义的options到默认options中
        Object.keys(userOptions).forEach((key) => {
            if (this.option[key]) {
                // 如果默认options中有这个属性，则合并
                Object.assign(this.option[key], userOptions[key]);
            } else {
                // 如果没有，则直接添加
                this.option[key] = userOptions[key];
            }
        });

        // 重新渲染图表以应用新的options
        this.chart.setOption(this.option);
    }

    /**
     * 加载中
     * @returns {YHChartBuilder}
     */
    loading() {
        this.chart.showLoading('default', {
            text: '', maskColor: 'rgba(255, 255, 255, 0.6)', color: '#4C84FF', spinnerRadius: 10, lineWidth: 2
        });
        return this;
    }

    /**
     * 数据处理
     * @param data
     * @returns {{date: *, effectiveStorageCapacity: number, waterRetentionCapacity: number, yhTotal: number}}
     */
    processing(data) {
        //roots 为data.data.depthSeries最后一位的根系深度
        const roots = Object.values(data.depthSeries)[Object.values(data.depthSeries).length - 1];
        this.yhTotal = data.timeseries.length;

        const date = data.timeseries.slice(-1)[0];
        // min:历史最低含水量 cur:当前含水量 max:历史最高含水量 storage:有效储水量 impound:蓄水潜力
        // storage有效储水量计算为 min-cur impound蓄水潜力计算为cur-max
        const min = data.extremum[1].data;
        const cur = data.series.slice(-1)[0];
        const max = data.extremum[0].data;
        const storage = [];
        const impound = [];
        // 有效储水量计算：根系对应的中间的点减去
        // 有效储水量
        let waterRetentionCapacitySumPre = 0;
        let waterRetentionCapacitySumNext = 0;
        for (let c = 0; c < cur.length; c++) {
            if (c >= data.depth) {
                break;
            }
            waterRetentionCapacitySumPre += cur[c];
            waterRetentionCapacitySumNext += max[c];
        }
        const effectiveStorageCapacity = Math.floor(waterRetentionCapacitySumPre - waterRetentionCapacitySumNext);
        let effectiveStorageCapacitySumPre = 0;
        let effectiveStorageCapacitySumNext = 0;
        for (let cg = 0; cg < cur.length; cg++) {
            if (cg >= data.depth) {
                break;
            }
            effectiveStorageCapacitySumPre += min[cg];
            effectiveStorageCapacitySumNext += cur[cg];
        }
        const waterRetentionCapacity = Math.floor(effectiveStorageCapacitySumPre - effectiveStorageCapacitySumNext);
        const calcDepthMoisture = function (premoisture, nextmoisture) {
            const x0 = premoisture;
            const x1 = nextmoisture;
            const y0 = 1;
            const y1 = 3;
            const y2 = 2;
            const x2 = ((y2 - y0) / (y1 - y0)) * (x1 - x0) + x0;
            return x2;
        };
        const calcMoistureInterpolation = function (org) {
            const orgmin = org;
            const totaldepth = (data.category.length - 1) * 2 + 1;
            const moisture = [];
            for (let i = 0; i < totaldepth; i++) {
                if (i == totaldepth - 1) {
                    // 计算最后一个深度
                    moisture.push(orgmin[orgmin.length - 1]);
                } else if (i % 2 == 0) {
                    if (i == 0) {
                        moisture.push(-1);
                    } else {
                        moisture.push(calcDepthMoisture(orgmin[i - (i / 2 + 1)], orgmin[i - i / 2]));
                    }
                } else {
                    moisture.push(orgmin[(i - 1) / 2]);
                }
            }
            moisture[0] = moisture[1];
            // [2P0 - P1， P0， P1， P2] ...... [P1,P2,P3, 2P3 - P2]
            const result = [];
            result.push(moisture[0] * 2 - moisture[1]);
            for (let i = 0; i < moisture.length; i++) {
                result.push(moisture[i]);
            }
            result.push(moisture[totaldepth - 1] * 2 - moisture[totaldepth - 2]);
            return result;
        };
        // 三条line的数据
        const minIpl = calcMoistureInterpolation(min);
        const curIpl = calcMoistureInterpolation(cur);
        const maxIpl = calcMoistureInterpolation(max);

        // 曲线插值
        const buildCatmullRomSpline = function (orginal, part) {
            part = Math.ceil(part);
            const result = [];
            if (orginal.length < 4) {
                return orginal;
            }
            let c = 0;
            // result.push(orginal[0]);
            for (let index = 1; index < orginal.length - 2; index++) {
                const p0 = orginal[index - 1];
                const p1 = orginal[index];
                const p2 = orginal[index + 1];
                const p3 = orginal[index + 2];
                for (let i = 1; i <= part; i++) {
                    const t = i / part;
                    const tt = t * t;
                    const ttt = tt * t;
                    let pi = {};
                    pi = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * tt + (3 * p1 - p0 - 3 * p2 + p3) * ttt);
                    result.push(pi);
                }
                c++;
            }
            return result;
        };
        // 曲线插值
        const result = {
            min: [], cur: [], max: []
        };
        // 计算yh图当前需要计算出多少个数
        const ylen = 21;
        const cha = ylen / (minIpl.length - 3);
        let tmp = buildCatmullRomSpline(minIpl, cha);
        for (let i = 0; i < tmp.length; i++) {
            result.min.push(tmp[i]);
        }
        tmp = buildCatmullRomSpline(curIpl, cha);
        for (let i = 0; i < tmp.length; i++) {
            result.cur.push(tmp[i]);
        }
        tmp = buildCatmullRomSpline(maxIpl, cha);
        // x轴最大值
        for (let i = 0; i < tmp.length; i++) {
            if (tmp[i] > result.xmax) {
                result.xmax = tmp[i];
            }
            result.max.push(tmp[i]);
        }

        // 根系深度
        const root = 0;
        // 生成x轴数据
        const xAxisLength = result.min.length;
        const xAxisData = new Array(xAxisLength).fill('');
        // 计算roots中的每个标签应该大概位于哪里
        const interval = Math.floor((xAxisLength - 1) / (data.category.length - 1));
        // 分配roots中的标签到xAxisData中
        data.category.forEach((item, index) => {
            // 特别处理最后一个项，直接放在数组的最末尾
            if (index === data.category.length - 1) {
                xAxisData[xAxisLength - 1] = item;
            } else {
                // 根据计算出的间隔来安置roots中的每个项
                const position = index * interval;
                xAxisData[position] = item;
            }
        });
        // 寻找root在xAxisData中的位置索引
        const rootIndex = xAxisData.findIndex((x) => (x.replace('cm', '')) == roots) || 0;

        for (let i = 0; i < result.min.length; i++) {
            if (rootIndex === -1) {
                break;
            }
            const num = result.min[i] - result.cur[i];
            const num2 = result.cur[i] - result.max[i];
            storage.push(num);
            impound.push(num2);
        }
        result.min.push(result.min[result.min.length - 1]);
        result.cur.push(result.cur[result.cur.length - 1]);
        result.max.push(result.max[result.max.length - 1]);

        //    执行series
        this.series(result.min, result.cur, result.max, storage, impound, data.category, roots).build();
        return {
            yhTotal: this.yhTotal, date, effectiveStorageCapacity, waterRetentionCapacity
        }
    }

    /**
     * 播放处理
     * @param data 数据
     * @param interval 播放间隔
     */
    playingProcessing(data, interval) {
        console.log('YH播放');
        // 设置time的默认值为500，如果它没有被传递
        interval = interval || 500;
        const newTimeseries = data.timeseries.slice(this.yhCurrentTime);
        const newSeries = data.series.slice(this.yhCurrentTime);

        for (let timeIndex = 0; timeIndex < newTimeseries.length; timeIndex++) {
            this.yhTimeOut.push(window.setTimeout(() => {
                if (this.isPlaying) {
                    let date = newTimeseries[timeIndex];
                    const min = data.extremum[1].data;
                    // 只改变cur
                    const cur = newSeries[timeIndex];
                    const max = data.extremum[0].data;
                    const storage = [];
                    const impound = [];

                    const calcDepthMoisture = function (premoisture, nextmoisture) {
                        const x0 = premoisture;
                        const x1 = nextmoisture;
                        const y0 = 1;
                        const y1 = 3;
                        const y2 = 2;
                        const x2 = ((y2 - y0) / (y1 - y0)) * (x1 - x0) + x0;
                        return x2;
                    };
                    const calcMoistureInterpolation = function (org) {
                        const orgmin = org;
                        const totaldepth = (data.category.length - 1) * 2 + 1;
                        const moisture = [];
                        for (let i = 0; i < totaldepth; i++) {
                            if (i == totaldepth - 1) {
                                // 计算最后一个深度
                                moisture.push(orgmin[orgmin.length - 1]);
                            } else if (i % 2 == 0) {
                                if (i == 0) {
                                    moisture.push(-1);
                                } else {
                                    moisture.push(calcDepthMoisture(orgmin[i - (i / 2 + 1)], orgmin[i - i / 2]));
                                }
                            } else {
                                moisture.push(orgmin[(i - 1) / 2]);
                            }
                        }
                        moisture[0] = moisture[1];
                        // [2P0 - P1， P0， P1， P2] ...... [P1,P2,P3, 2P3 - P2]
                        const result = [];
                        result.push(moisture[0] * 2 - moisture[1]);
                        for (let i = 0; i < moisture.length; i++) {
                            result.push(moisture[i]);
                        }
                        result.push(moisture[totaldepth - 1] * 2 - moisture[totaldepth - 2]);
                        return result;
                    };
                    // 三条line的数据
                    const minIpl = calcMoistureInterpolation(min);
                    const curIpl = calcMoistureInterpolation(cur);
                    const maxIpl = calcMoistureInterpolation(max);

                    // 曲线插值
                    const buildCatmullRomSpline = function (orginal, part) {
                        part = Math.ceil(part);
                        const result = [];
                        if (orginal.length < 4) {
                            return orginal;
                        }
                        let c = 0;
                        // result.push(orginal[0]);
                        for (let index = 1; index < orginal.length - 2; index++) {
                            const p0 = orginal[index - 1];
                            const p1 = orginal[index];
                            const p2 = orginal[index + 1];
                            const p3 = orginal[index + 2];
                            for (let i = 1; i <= part; i++) {
                                const t = i / part;
                                const tt = t * t;
                                const ttt = tt * t;
                                let pi = {};
                                pi = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * tt + (3 * p1 - p0 - 3 * p2 + p3) * ttt);
                                result.push(pi);
                            }
                            c++;
                        }
                        return result;
                    };
                    // 曲线插值
                    const result = {
                        min: [], cur: [], max: []
                    };
                    // yh图的高
                    const ylen = 21;
                    const cha = ylen / (minIpl.length - 3);
                    let tmp = buildCatmullRomSpline(minIpl, cha);
                    for (let i = 0; i < tmp.length; i++) {
                        result.min.push(tmp[i]);
                    }
                    tmp = buildCatmullRomSpline(curIpl, cha);
                    for (let i = 0; i < tmp.length; i++) {
                        result.cur.push(tmp[i]);
                    }
                    tmp = buildCatmullRomSpline(maxIpl, cha);
                    // x轴最大值
                    for (let i = 0; i < tmp.length; i++) {
                        if (tmp[i] > result.xmax) {
                            result.xmax = tmp[i];
                        }
                        result.max.push(tmp[i]);
                    }
                    //有效储水量计算：根系对应的中间的点减去
                    //  计算对应的index找到对应的root下标
                    const roots = (data.depthSeries[dayjs(data.timeseries[timeIndex])
                        .format('YYYYMMDD')]) / 10;
                    // 有效储水量
                    let waterRetentionCapacitySumPre = 0;
                    let waterRetentionCapacitySumNext = 0;
                    for (let c = 0; c < cur.length; c++) {
                        if (c >= roots) {
                            break;
                        }
                        waterRetentionCapacitySumPre += cur[c];
                        waterRetentionCapacitySumNext += max[c];
                    }
                    let effectiveStorageCapacitySumPre = 0;
                    let effectiveStorageCapacitySumNext = 0;
                    for (let cg = 0; cg < cur.length; cg++) {
                        if (cg >= roots) {
                            break;
                        }
                        effectiveStorageCapacitySumPre += min[cg];
                        effectiveStorageCapacitySumNext += cur[cg];
                    }
                    let effectiveStorageCapacity = 0;
                    let waterRetentionCapacity = 0;
                    if (!roots) {
                        waterRetentionCapacity = 0;
                        effectiveStorageCapacity = 0;
                    } else {
                        effectiveStorageCapacity = Math.floor(waterRetentionCapacitySumPre - waterRetentionCapacitySumNext);
                        waterRetentionCapacity = Math.floor(effectiveStorageCapacitySumPre - effectiveStorageCapacitySumNext);
                    }

                    // 根系深度
                    const root = 0;
                    // 生成x轴数据
                    const xAxisLength = result.min.length;
                    const xAxisData = new Array(xAxisLength).fill('');
                    // 计算roots中的每个标签应该大概位于哪里
                    const interval = Math.floor((xAxisLength - 1) / (data.category.length - 1));
                    // 分配roots中的标签到xAxisData中
                    data.category.forEach((item, index) => {
                        // 特别处理最后一个项，直接放在数组的最末尾
                        if (index === data.category.length - 1) {
                            xAxisData[xAxisLength - 1] = item;
                        } else {
                            // 根据计算出的间隔来安置roots中的每个项
                            const position = index * interval;
                            xAxisData[position] = item;
                        }
                    });
                    // 寻找root在xAxisData中的位置索引
                    const rootIndex = xAxisData.findIndex((x) => (x.replace('cm', '')) == roots * 10) || 0;
                    for (let i = 0; i < result.min.length; i++) {
                        if (rootIndex === -1) {
                            break;
                        }
                        const num = result.min[i] - result.cur[i];
                        const num2 = result.cur[i] - result.max[i];
                        storage.push(num);
                        impound.push(num2);
                    }
                    // 算出来是40个值，添加最后一个值为原始数据最后一个值
                    result.min.push(result.min[result.min.length - 1]);
                    result.cur.push(result.cur[result.cur.length - 1]);
                    result.max.push(result.max[result.max.length - 1]);

                    // 执行series
                    this.series(result.min, result.cur, result.max, storage, impound, data.category, roots * 10).build();

                    this.yhCurrentTime = timeIndex
                    this.yhArrPlay.push(timeIndex);
                    // 检查播放是否完成
                    this.checkPlaybackCompletion();
                    // 自定义事件
                    const event = new CustomEvent('yhDataUpdated', {
                        detail: {
                            date, effectiveStorageCapacity, waterRetentionCapacity, timeIndex,
                        }
                    });
                    document.dispatchEvent(event);
                }
            }, interval * timeIndex));
        }
    }

    /**
     * 检查播放是否完成
     */
    checkPlaybackCompletion() {
        if (this.yhArrPlay.length >= this.yhTotal) {
            // 触发自定义事件，通知页面播放已完成
            const playbackCompleteEvent = new CustomEvent('yhPlaybackComplete', {
                detail: {
                    yhTotal: this.yhTotal,
                    yhCurrentTime: this.yhCurrentTime,
                    yhArrPlay: this.yhArrPlay
                }
            });
            document.dispatchEvent(playbackCompleteEvent);

            // 重置播放状态
            this.isPlaying = false;
            this.yhCurrentTime = 0;
            this.yhArrPlay = [];
        }
    }

    /**
     * 清除所有定时器
     */
    clearTimeouts() {
        this.yhTimeOut.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        this.yhCurrentTime = this.yhArrPlay.length;
        this.yhTimeOut = []; // 清空数组
    }

    /**
     * 展示图表
     * @param data
     * @returns {{date: *, effectiveStorageCapacity: number, waterRetentionCapacity: number, yhTotal: number}}
     */
    show(data) {
        return this.processing(data);
    }

    /**
     * 播放图表
     * @param data 数据
     * @param interval 播放间隔
     */
    play(data, interval) {
        this.clearTimeouts(); // 清除已有的定时器
        this.isPlaying = true; // 更新播放状态
        this.playingProcessing(data, interval); // 开始播放处理
    }

    /**
     * 暂停播放
     */
    pause() {
        this.isPlaying = false; // 更新播放状态
        this.clearTimeouts(); // 清除所有定时器
    }

    /**
     * 添加数据
     * @param {Array} data 数据数组
     * min:历史最低含水量
     * cur:当前含水量
     * max:历史最高含水量
     * storage:有效储水量
     * impound:蓄水潜力
     */
    series(min, cur, max, storage, impound, category, root) {
        //判断roots中的不为'地表'的数据是否有单位cm，如果没有则添加单位cmroots为['','']
        category.forEach((item, index) => {
            if (item !== '地表') {
                if (!item.includes('cm')) {
                    category[index] = `${item}cm`;
                }
            }
        });
        this.category = category;
        this.data = min;

        const processData = (data) => data.map((item) => (item.value === 0 ? 'null' : item));

        [min, cur, max, storage, impound].forEach((dataset, index) => {
            this.option.series[index].data = processData(dataset);
        });

        // 生成x轴数据
        const xAxisLength = this.option.series[0].data.length;
        const xAxisData = new Array(xAxisLength).fill('');
        // 计算roots中的每个标签应该大概位于哪里
        const interval = Math.floor((xAxisLength - 1) / (category.length - 1));
        // 分配roots中的标签到xAxisData中
        category.forEach((item, index) => {
            // 特别处理最后一个项，直接放在数组的最末尾
            if (index === category.length - 1) {
                xAxisData[xAxisLength - 1] = item;
            } else {
                // 根据计算出的间隔来安置roots中的每个项
                const position = index * interval;
                xAxisData[position] = item;
            }
        });
        this.option.xAxis.data = xAxisData;

        // 寻找root在xAxisData中的位置索引
        if (root == 0) {
            root = '地表';
        }
        const rootIndex = xAxisData.findIndex((x) => (x.replace('cm', '')) == root);

        if (rootIndex === xAxisLength - 1) {
            this.option.series[3].data.push(this.option.series[3].data[this.option.series[3].data.length - 1]);
            this.option.series[4].data.push(this.option.series[4].data[this.option.series[4].data.length - 1]);
            this.option.series[0].markLine.data[0].xAxis = rootIndex;
            return this;
        }
        this.option.series[3].data.splice(rootIndex + 1, xAxisLength - rootIndex - 1);
        this.option.series[4].data.splice(rootIndex + 1, xAxisLength - rootIndex - 1);
        this.option.series[0].markLine.data[0].xAxis = rootIndex;
        return this;
    }

    /**
     * 构建图表
     */
    build() {
        this.chart.setOption(this.option);
        this.chart.hideLoading();
    }
}
