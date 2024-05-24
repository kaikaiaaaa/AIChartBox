import * as echarts from 'echarts';

export default class ETChartBuilder {
    constructor(vm, container, userOptions, lineStyle) {
        this.vm = vm;
        this.chart = echarts.init(document.getElementById(container));
        window.charts = {};
        window.charts[container] = this.chart;
        //x轴的数据
        this.lineXAxis = ''
        // 图中展示的数据及百分比
        this.formatter = []
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
        this.etTotal = 0;
        // 添加一个属性来跟踪当前的时间
        this.etCurrentTime = 0;
        // 添加一个属性来跟踪所有的定时器
        this.etTimeOut = [];
        // 添加一个属性来跟踪所有的播放时间
        this.etArrPlay = [];
    }


    /**
     * 展示图表
     * @param data
     * @returns {{date: *, effectiveStorageCapacity: number, waterRetentionCapacity: number, yhTotal: number}}
     */
    show(data) {
        return this.processing(data);
    }

    initOption(lineStyle) {
        let _this = this
        this.option = {
            grid: {
                bottom: 60, top: 35, right: 30
            }, xAxis: {
                boundaryGap: 0, axisTick: {
                    show: false
                }, type: 'category', // X轴均为category，Y轴均为value   //设置为类目轴
                axisLine: {
                    lineStyle: {
                        type: 'dashed', color: '#A0A5B3'
                    }, show: true
                }, splitLine: {
                    show: true, lineStyle: {
                        color: '#A0A5B3', type: 'dashed'
                    }, interval: (index, value) => {
                        if (value === `${_this.lineXAxis}cm`) {
                            return false;
                        }
                        return true;
                    }
                }, axisLabel: {
                    formatter: (value) => {
                        if (value !== '地表') {
                            return value;
                        }
                        return '地表'
                    }, show: true, color: '#606A84', rotate: 90
                }
                // boundaryGap: false,  //数值轴两端的空白策略  //类目在分割线上
            }, yAxis: {
                type: 'value', axisTick: {
                    show: false
                }, splitLine: {
                    show: false
                }, axisLine: {
                    lineStyle: {
                        type: 'dashed', color: '#A0A5B3'
                    }, show: false
                }, boundaryGap: 0, axisLabel: {
                    show: false
                }, min: 0, max: 50
            },

            series: [{
                type: 'line', symbol: 'circle', symbolSize: 1, label: {
                    show: true, color: 'rgba(0, 7, 30, 0.65)', position: 'top', rotate: 90, // 设置label展示，使用后端数据展示
                    formatter: (val) => {
                        for (let i = 0; i <= this.formatter.length; i++) {
                            if (val.dataIndex === this.formatter.length) {
                                return '';
                            }
                            if (val.dataIndex === i) {
                                if (this.formatter[i].val !== null){
                                    return this.formatter[i].val + ' ' + '(' + this.formatter[i].percent + '%)';
                                }else {
                                    return '';
                                }
                            }
                        }
                    }
                }, itemStyle: {
                    color: lineStyle.color || 'rgba(244, 138, 92, 0.77)'
                }, stack: '总量', smooth: true, data: [], markLine: {
                    zLevel: 1, symbol: 'none', precision: 50, lineStyle: {
                        type: 'dashed'
                    }, silent: true, // 是否不响应和触发鼠标事件
                    data: []
                }
            }, {
                type: 'line', symbol: 'none', itemStyle: {
                    color: lineStyle.color || 'rgba(244, 138, 92, 0.77)'
                }, smooth: true, data: []
            }, {
                type: 'line', symbol: 'none', smooth: true, stack: '总量', areaStyle: {
                    color: lineStyle.areaColor || 'rgba(244, 138, 92, 0.5)'
                }, lineStyle: {
                    type: 'dashed', color: 'rgba(0,0,0,0)'
                }, data: []
            }]
        };
        return this.option;
    }

    /**
     * 检查播放是否完成
     */
    checkPlaybackCompletion() {
        if (this.etArrPlay.length >= this.etTotal) {
            // 触发自定义事件，通知页面播放已完成
            const playbackCompleteEvent = new CustomEvent('etPlaybackComplete', {
                detail: {
                    etTotal: this.etTotal, etCurrentTime: this.etCurrentTime, etArrPlay: this.etArrPlay
                }
            });
            document.dispatchEvent(playbackCompleteEvent);

            // 重置播放状态
            this.isPlaying = false;
            this.etCurrentTime = 0;
            this.etArrPlay = [];
        }
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

    loading() {
        this.chart.showLoading('default', {
            text: '', maskColor: 'rgba(255, 255, 255, 0.6)', color: '#4C84FF', spinnerRadius: 10, lineWidth: 2
        });
        return this;
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

    processing(data) {
        const etDate = data.timeseries.slice(-1)[0];
        this.etTotal = data.timeseries.length;

        const width = 25;
        const point = data.amendSeries[data.amendSeries.length - 1];// 取数组最后一项 为当前值
        // 计算第一条曲线三个点的位置
        const line1 = point.map((item) => width - (item / 2));
        const line2 = [];
        // 计算第二条曲线的位置
        for (let i = 0; i < line1.length; i++) {
            line2.push((width - line1[i]) * 2 + line1[i]);
        }
        const differ = [];
        // 做差(用第二条曲线减去第一条曲线)
        for (let i = 0; i < line1.length; i++) {
            differ.push(line2[i] - line1[i]);
        }
        // 根系深度
        this.lineXAxis = data.depthseries.slice(-1)[0].slice(-1)[0];
        // 更新 markLine 数据，确保使用最新的 this.lineXAxis 值
        this.option.series[0].markLine.data = [[{
            xAxis: `${this.lineXAxis}cm`, yAxis: 0, itemStyle: {
                color: '#5B79FB'
            }
        }, {
            xAxis: `${this.lineXAxis}cm`, yAxis: 50
        }]];
        // 图中展示的数据及百分比
        this.formatter = [];
        //为了解决图表展示时formatter向下偏移的问题，添加一个空的formatter
        this.formatter && this.formatter.unshift({
            val: null,
            percent: null
        })
        for (let i = 0; i < data.series.slice(-1)[0].length; i++) {
            this.formatter.push({
                val: data.dataseries.slice(-1)[0][i], percent: data.series.slice(-1)[0][i]
            });
        }

        this.series(line1, line2, differ, data.nodes).build();
        return {
            etDate
        }
    }

    playingProcessing(data, interval) {

        interval = interval || 1000; // 默认间隔为1秒
        // 记录数组的index（etCurrentTime 当前index）然后获取新的数组
        const width = 25; // 画板一半的长度固定25
        const newTimeseries = data.timeseries.slice(this.etCurrentTime);
        const newDataseries = data.dataseries.slice(this.etCurrentTime);
        const newSeries = data.series.slice(this.etCurrentTime);
        const newAmendSeries = data.amendSeries.slice(this.etCurrentTime);
        const newDepthseries = data.depthseries.slice(this.etCurrentTime);
        const time = data.timeseries.length;
        for (let index = 0; index < newDataseries.length; index++) {
            this.etTimeOut.push(window.setTimeout(() => {
                if (this.isPlaying) {
                    const etDate = newTimeseries[index];
                    const point = newAmendSeries[index];
                    // 计算第一条曲线三个点的位置
                    const line1 = point.map((item) => width - (item / 2));
                    const line2 = [];
                    // 计算第二条曲线的位置
                    for (let i = 0; i < line1.length; i++) {
                        line2.push((width - line1[i]) * 2 + line1[i]);
                    }
                    const differ = [];
                    // 做差(用第二条曲线减去第一条曲线)
                    for (let i = 0; i < line1.length; i++) {
                        differ.push(line2[i] - line1[i]);
                    }
                    // 根系深度
                    this.lineXAxis = newDepthseries[index].slice(-1)[0];
                    // 图中展示的数据及百分比
                    const dataPoints = [];
                    dataPoints.push({
                        val: newDataseries[index], percent: newSeries[index]
                    });
                    this.formatter = [];
                    //为了解决图表展示时formatter向下偏移的问题，添加一个空的formatter
                    this.formatter && this.formatter.unshift({
                        val: null,
                        percent: null
                    })
                    for (let i = 0; i < dataPoints[0].percent.length; i++) {
                        this.formatter.push({
                            val: dataPoints[0].val[i],
                            percent: dataPoints[0].percent[i]
                        });
                    }
                    this.series(line1, line2, differ, data.nodes);

                    this.etCurrentTime = index;
                    this.etArrPlay.push(index);

                    // 检查播放是否完成
                    this.checkPlaybackCompletion();

                    // 自定义事件
                    const event = new CustomEvent('etDataUpdated', {
                        detail: {
                            etDate
                        }
                    });
                    document.dispatchEvent(event);
                }
            }, ((interval * time) / (newTimeseries.length)) * index));
        }
    }

    /**
     * 暂停播放
     */
    pause() {
        this.isPlaying = false; // 更新播放状态
        this.clearTimeouts(); // 清除所有定时器
    }

    /**
     * 清除所有定时器
     */
    clearTimeouts() {
        this.etTimeOut.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        this.etCurrentTime = this.etArrPlay.length;
        this.etTimeOut = []; // 清空数组
    }

    /**
     * 添加数据
     * @param {Array} data 数据数组
     */
    series(line1, line2, differ, nodes) {
        // 设置X轴的数据，确保nodes中的每个元素都有'cm'后缀，除了'地表'
        this.option.xAxis.data = nodes.map((node, index) => {
            return index === 0 || node.includes('cm') ? node : `${node}cm`;
        });

        const seriesData = [line1, line2, differ].map((data, index) => {
            return data.map(item => item === 0 ? 'null' : (item.value || item)); // 使用item.value如果item是对象，否则使用item
        });

        // 更新series数据
        this.option.series = this.option.series.map((serie, index) => {
            return {
                ...serie, data: seriesData[index]
            };
        });

        // 应用配置更新
        this.chart.setOption(this.option);

        return this;
    }

    build() {
        this.chart.setOption(this.option);
        this.chart.hideLoading();
    }
}
