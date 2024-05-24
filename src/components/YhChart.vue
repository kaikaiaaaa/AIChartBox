<template>
	<div class="desktop">
		<section class="moisture">
			<div class="yh">
				<div class="date">
					<div class="title">
						<div class="label">YH图</div>
					</div>
					<span v-if="!showYHEmpty">
                        {{
							yhLegend.date ? dayjs(yhLegend.date)
								.format('YYYY/MM/DD HH:mm') : '--'
						}}
                    </span>
					<img
						v-if="!showYHEmpty"
						:src="getPlayIcon()"
						@click="handleYhPlay(true)"
					>
				</div>
				<div
					v-if="!showYHEmpty"
					id="yh-chart"
				></div>
				<EmptyPage
					img="/icon-empty-device.png" message="暂无数据" v-if="showYHEmpty"
					style="background: #ffffff;height: 410px"
				></EmptyPage>
				<div class="legend-part1" v-if="!showYHEmpty">
					<section>
						<span></span>
						<label>有效储水量{{
								isNaN(yhLegend.effectiveStorageCapacity) ? '--' : yhLegend.effectiveStorageCapacity
							}}mm</label>
					</section>
					<section>
						<span></span>
						<label>蓄水潜力{{ isNaN(yhLegend.waterRetentionCapacity) ? '--' : yhLegend.waterRetentionCapacity }}mm</label>
					</section>
				</div>
				<div class="legend-part2" v-if="!showYHEmpty">
					<section>
						<span style="background-color: rgba(250, 96, 126, 1)"></span>
						<label>历史最低含水量</label>
					</section>
					<section>
						<span style="background-color: rgba(89, 89, 255, 1)"></span>
						<label>历史最高含水量</label>
					</section>
					<section>
						<span style="background-color: rgba(89, 255, 165, 1)"></span>
						<label>当前含水量</label>
					</section>
					<section>
						<img
							src="/icon-root.svg"
							class="icon-root-depth"
						>
						<label>根系深度</label>
					</section>
				</div>
			</div>
		</section>
	</div>
</template>

<script>
import dayjs from 'dayjs';
import YhChart from './charts/yh-chart.js';
import EmptyPage from './EmptyPage.vue';
import chart from "@insentek/chart";

export default {
	name: 'YhChart',
	components: {
		EmptyPage
	},
	props: {
		chartInfo: {
			type: Object,
			required: true,
		},
		chartStyle: {
			type: Object,
		}
	},
	data() {
		return {
			chart,
			dayjs,
			//其他设备数据
			details: {
				soilMoisture: {
					title: '',
					date: '',
					nodes: []
				}
			},
			yhLegend: {
				date: null,
				effectiveStorageCapacity: 0, // YH图有效储水量
				waterRetentionCapacity: 0// YH图蓄水潜力
			},
			yhData: [],
			yhChart: undefined,
			showYHEmpty: false,
			yhPlay: false,
			play: false,
			playOnly: false,
		};
	},
	computed: {},
	watch: {},
	beforeUnmount() {
		// 移除窗口resize监听器
		window.removeEventListener('resize', this.resizeChart);
		// 在组件销毁之前，如果chart实例存在，释放实例
		if (this.yhChart !== null) {
			this.yhChart.chart.dispose();
		}
	},
	async mounted() {
		this.initYhChart();
		// 添加窗口resize监听器
		window.addEventListener('resize', this.resizeChart);
	},

	methods: {
		handlePlaybackComplete() {
			console.log('播放完成');
			this.yhPlay = false;
			this.play = false;
			this.playOnly = false;
		},
		//获取YH图播放图标
		getPlayIcon() {
			return this.yhPlay ? '/icon-pause.svg' : '/icon-play-normal.svg';
		},
		// 窗口resize监听图表
		resizeChart() {
			if (this.yhChart) {
				this.yhChart.chart.resize();
			}
		},

		// YH图初始化
		async initYhChart() {
			/**
			 * vm - 实例
			 * container - 容器id
			 * options - 图表配置
			 * lineStyle - 线样式
			 */
			this.yhChart = new chart.YHChart(this, 'yh-chart', {
					//可修改活覆盖echarts中任意配置项
					grid: {
						top: 10,
					},
					//修改x轴样式
					xAxis: {
						axisLine: {
							lineStyle: {
								color: '#000'
							}
						},
					},
				}, {
					/**
					 * 线样式
					 * @param {Object} min - 历史最低含水量
					 * @param {Object} max - 历史最高含水量
					 * @param {Object} current - 当前含水量
					 * @param {Object} effectiveStorageCapacity - 有效储水量
					 * @param {Object} waterRetentionCapacity - 蓄水潜力
					 */
					min: 'red',
					max: 'blue',
					current: 'green',
					effectiveStorageCapacity: 'lightgreen',
					waterRetentionCapacity: 'lightblue',
				}
			).loading();

			// 获取数据
			this.yhData = this.chartInfo;

			const data = this.yhData.data;

			//空数据处理
			if (data.timeseries.length <= 0) {
				this.showYHEmpty = true;
				this.yhChart = new YhChart(this, 'yh-chart', {}, {});
				return;
			}
			//展示图表
			const {date, effectiveStorageCapacity, waterRetentionCapacity} = this.yhChart.show(data)
			//获取页面展示的数据
			//时间
			this.yhLegend.date = date;
			//有效储水量
			this.yhLegend.effectiveStorageCapacity = effectiveStorageCapacity;
			//蓄水潜力
			this.yhLegend.waterRetentionCapacity = waterRetentionCapacity;
		},
		// YH曲线播放
		async handleYhPlay(playOnly) {
			this.playOnly = playOnly;
			//获取数据
			const data = this.yhData.data;
			this.yhPlay = !this.yhPlay;

			/**
			 * 监听播放完成事件
			 */
			document.addEventListener('yhPlaybackComplete', this.handlePlaybackComplete);

			//播放
			if (this.yhPlay) {
				try {
					//播放YH图
					/**
					 * @param {Array} data - 数据
					 * @param {Number} interval - 播放间隔
					 */
					await this.yhChart.play(data, 500);
					let _this = this
					//监听播放事件
					document.addEventListener('yhDataUpdated', function (e) {
						// 修改页面展示变量值
						// 时间
						_this.yhLegend.date = e.detail.date;
						// 有效储水量
						_this.yhLegend.effectiveStorageCapacity = e.detail.effectiveStorageCapacity;
						// 蓄水潜力
						_this.yhLegend.waterRetentionCapacity = e.detail.waterRetentionCapacity;
					});

				} catch (error) {
					console.error('Error processing YH chart data:', error);
					// Handle the error appropriately
				}
			}
			// 暂停
			if (!this.yhPlay) {
				this.yhChart.pause();
			}
		}
	}
};
</script>
<style scoped lang="less">

.desktop {
	margin-top: 32px;

	& .moisture {
		display: flex;
		width: 50%;
		height: 500px;
		position: relative;
		background: #ffffff;

		& .play-all {
			position: absolute;
			width: 48px;
			height: auto;
			left: 0;
			right: 0;
			bottom: 0;
			top: 0;
			margin: auto;
			cursor: pointer;
		}

		& .yh {
			width: 100%;
			height: inherit;
			position: relative;

			& #yh-chart {
				height: 440px;
				width: 370px;
				transform: rotate(90deg);
				transform-origin: center;
				position: absolute;
				top: -40px;
				left: 0;
				bottom: 0;
				margin: auto;
				right: 0;
			}

			& .legend-part1 {
				width: 100%;
				display: flex;
				align-items: center;
				position: absolute;
				bottom: 24px;
				padding: 0 24px;

				& section {
					display: flex;
					align-items: center;
				}

				& span {
					display: flex;
					width: 24px;
					height: 8px;
					box-sizing: border-box;
					border-radius: 1px;
					border: 1px solid #59FFA5;
					margin-right: 8px;
					opacity: 0.89;
					background: linear-gradient(0deg, rgba(89, 255, 165, 0.0001) 0%, rgba(89, 255, 165, 0.7) 100%);
				}

				& label {
					font-size: 12px;
					font-family: HarmonyOS;
					line-height: 12px;
					letter-spacing: 0.0881542px;
					color: #8C909A;
				}

				& section:nth-of-type(2) {
					margin-left: 25px;

					& span {
						opacity: 0.5;
						border: 1px solid #5959FF;
						background: linear-gradient(0deg, rgba(89, 89, 255, 0.0001) 6.25%, #5959FF 72.36%);
					}
				}
			}

			& .legend-part2 {
				width: 100%;
				display: flex;
				align-items: center;
				padding: 0 24px 0;
				position: absolute;
				bottom: 52px;

				& .icon-root-depth {
					height: 4px;
					width: 24px;
				}

				& section {
					display: flex;
					align-items: center;
					margin-right: 24px;

					& span {
						display: flex;
						width: 24px;
						height: 4px;
						border-radius: 1px;
					}

					& label {
						color: #8C909A;
						font-size: 12px;
						font-family: HarmonyOS;
						margin-left: 8px;
						line-height: 12px;
					}
				}

			}

		}

		& .date {
			padding: 0 24px 0;
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 46px;
			font-size: 14px;
			font-family: HarmonyOS;
			line-height: 14px;
			box-sizing: border-box;
			position: relative;

			& span {
				color: #00071ea6;
				text-align: center;
				font-family: HarmonyOS;
				font-size: 12px;
				font-style: normal;
				font-weight: 400;
				line-height: 12px; /* 100% */
				letter-spacing: 0.167px;
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
			}

			& .title {
				display: flex;

				& .label {
					color: #00071ea6;
					font-family: HarmonyOS;
					font-size: 14px;
					font-style: normal;
					font-weight: 400;
					line-height: 14px; /* 100% */
				}

				& img {
					width: 12px;
					height: 12px;
					cursor: pointer;
					margin-left: 8px;
					cursor: pointer;
				}
			}

			& img {
				cursor: pointer;
			}
		}
	}
}

</style>
